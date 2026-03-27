import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";

export async function getStartups(req: Request, res: Response) {
  try {
    const { searchQuery, status } = req.query;
    console.log(`[getStartups] QUERY: search=${searchQuery}, status=${status}`);
    
    let query = supabase
      .from("startups")
      .select(`
        *, 
        user:owner_id(id, name, username, avatar_url),
        members:startup_members(count)
      `)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
       console.error("[getStartups] SUPABASE ERROR:", error);
       throw error;
    }
    
    const normalizedData = (data || []).map(s => ({
        ...s,
        member_count: s.members?.[0]?.count || s.member_count || 1
    }));
    
    console.log(`[getStartups] SUCCESS: Found ${normalizedData.length} startups`);
    res.json(normalizedData);
  } catch (err: any) {
    console.error("[getStartups] CATCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch startups", details: err.message });
  }
}

export async function getStartup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("startups")
      .select(`
        *,
        members:startup_members(count)
      `)
      .eq("id", id)
      .single();

    if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: "Startup not found" });
        throw error;
    }
    
    if (data) {
        data.member_count = data.members?.[0]?.count || data.member_count || 1;
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch startup", details: err.message });
  }
}

export async function createStartup(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check for 35-day cooldown between startup creations
    const { data: recentStartup } = await supabase
      .from("startups")
      .select("created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentStartup) {
      const lastCreated = new Date(recentStartup.created_at);
      const now = new Date();
      const diffMs = now.getTime() - lastCreated.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 35) {
        return res.status(403).json({ 
          error: `You can only launch one startup every 35 days. Please wait ${35 - diffDays} more days.` 
        });
      }
    }

    // Ensure user exists in Supabase before creating startup
    try {
        await ensureUserExists(userId, (req as any).user);
    } catch (userErr) {
        console.warn("[createStartup] ensureUserExists non-fatal error:", userErr);
    }

    const startupData = {
      name: req.body.name,
      tagline: req.body.tagline,
      description: req.body.description,
      logo_url: req.body.logo_url,
      website_url: req.body.website_url,
      founded_date: req.body.founded_date || new Date().toISOString().split('T')[0],
      status: req.body.status || 'Active',
      is_hiring: !!req.body.is_hiring,
      looking_for_cofounder: !!req.body.looking_for_cofounder,
      tech_stack: req.body.tech_stack || [],
      owner_id: userId,
      member_count: 1,
      milestones: []
    };

    const { data, error } = await supabase
      .from("startups")
      .insert([startupData])
      .select()
      .single();

    if (error) {
        console.error("[createStartup] INSERT ERROR:", error);
        throw error;
    }

    // Add owner as the first member
    await supabase.from("startup_members").insert({
      startup_id: data.id,
      user_id: userId,
      role: "Owner"
    });

    res.status(201).json(data);
  } catch (err: any) {
    console.error("[createStartup] CATCH ERROR:", err);
    res.status(500).json({ error: "Failed to create startup", details: err.message });
  }
}

export async function updateStartup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    
    // Check ownership
    const { data: startup, error: findError } = await supabase
        .from("startups")
        .select("owner_id")
        .eq("id", id)
        .maybeSingle();

    if (findError) throw findError;
    if (!startup) return res.status(404).json({ error: "Startup not found" });
    
    if (startup.owner_id !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this startup" });
    }

    const { data, error } = await supabase
      .from("startups")
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update startup", details: err.message });
  }
}

export async function deleteStartup(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub || (req as any).user?.id;

    const { data: startup } = await supabase.from("startups").select("owner_id").eq("id", id).single();
    if (!startup || startup.owner_id !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this startup" });
    }

    const { error } = await supabase.from("startups").delete().eq("id", id);
    if (error) throw error;
    
    res.json({ message: "Startup deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete startup", details: err.message });
  }
}

// Members
export async function getStartupMembers(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("startup_members")
      .select(`
        role,
        user:user_id(id, name, username, avatar_url)
      `)
      .eq("startup_id", id);

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch members", details: err.message });
  }
}

export async function addStartupMember(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, role = 'Member' } = req.body;
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    const { data: startup } = await supabase.from("startups").select("owner_id").eq("id", id).single();
    if (!startup || startup.owner_id !== currentUserId) {
      return res.status(403).json({ error: "Only owner can invite members" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username.trim())
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { data: existing } = await supabase
      .from("startup_members")
      .select("id")
      .eq("startup_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "User is already a member" });
    }

    const { error: insertError } = await supabase
      .from("startup_members")
      .insert({ startup_id: id, user_id: user.id, role });

    if (insertError) throw insertError;

    // Increment count
    try {
        await supabase.rpc('increment_startup_member_count', { startup_row_id: id });
    } catch (rpcErr) {
        console.warn("RPC increment failed, skipping count update");
    }

    res.json({ message: "Member added successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add member", details: err.message });
  }
}

export async function removeStartupMember(req: Request, res: Response) {
  try {
    const { id, userId: targetUserId } = req.params;
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    const { data: startup } = await supabase.from("startups").select("owner_id").eq("id", id).single();
    if (!startup || startup.owner_id !== currentUserId) {
      return res.status(403).json({ error: "Only owner can remove members" });
    }

    if (targetUserId === currentUserId) return res.status(400).json({ error: "Owner cannot be removed" });

    const { error: deleteError } = await supabase
      .from("startup_members")
      .delete()
      .eq("startup_id", id)
      .eq("user_id", targetUserId);

    if (deleteError) throw deleteError;
    
    try {
        await supabase.rpc('decrement_startup_member_count', { startup_row_id: id });
    } catch (rpcErr) {
        console.warn("RPC decrement failed, skipping count update");
    }

    res.json({ message: "Member removed successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to remove member", details: err.message });
  }
}

// Jobs
export async function getStartupJobs(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("startup_job_postings")
      .select("*")
      .eq("startup_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
}

export async function createStartupJob(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // 1. Verify ownership
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (startupError || !startup) {
        console.error("[createJob] Startup fetch error:", startupError);
        return res.status(404).json({ error: "Startup not found or database error", details: startupError?.message });
    }

    if (startup.owner_id !== userId) {
        return res.status(403).json({ error: "Only the owner can post jobs" });
    }

    // 2. Prepare payload
    const jobData = {
      startup_id: id,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type || 'Full-time',
      location: req.body.location || 'Remote',
      salary_range: req.body.salary_range || null,
      custom_questions: [],
      created_at: new Date().toISOString()
    };

    console.log("[createJob] Attempting insert into 'startup_job_postings'...");

    // 3. Insert into the database
    const { data, error } = await supabase
      .from("startup_job_postings")
      .insert([jobData])
      .select()
      .single();

    if (error) {
        console.error("[createJob] SUPABASE INSERT ERROR:", error);
        return res.status(500).json({ 
            error: "Database failed to save job", 
            code: error.code,
            details: error.message 
        });
    }

    console.log("[createJob] SUCCESS:", data.id);
    res.status(201).json(data);
  } catch (err: any) {
    console.error("[createJob] UNEXPECTED CRASH:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
}

export async function deleteStartupJob(req: Request, res: Response) {
  try {
    const { id, jobId } = req.params;
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    // Verify ownership
    const { data: startup } = await supabase.from("startups").select("owner_id").eq("id", id).single();
    if (!startup || startup.owner_id !== userId) {
      return res.status(403).json({ error: "Only owner can delete jobs" });
    }

    const { error } = await supabase
      .from("startup_job_postings")
      .delete()
      .eq("id", jobId)
      .eq("startup_id", id);

    if (error) throw error;
    res.json({ message: "Job deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete job", details: err.message });
  }
}

// Feed
export async function getStartupFeed(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("startup_updates")
      .select(`
        *,
        user:user_id(id, name, username, avatar_url)
      `)
      .eq("startup_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch updates", details: err.message });
  }
}

export async function postStartupUpdate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub || (req as any).user?.id;
    const { content, is_broadcast } = req.body;

    const { data, error } = await supabase
      .from("startup_updates")
      .insert({
        startup_id: id,
        user_id: userId,
        content,
        is_broadcast,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:user_id(id, name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to post update", details: err.message });
  }
}

export async function getCooldownStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Last created startup
    const { data: recentStartup } = await supabase
      .from("startups")
      .select("created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentStartup) {
      return res.json({ isInCooldown: false, daysLeft: 0, nextLaunchDate: null });
    }

    const lastCreated = new Date(recentStartup.created_at);
    const now = new Date();
    const COOLDOWN_DAYS = 35;
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const nextLaunchDate = new Date(lastCreated.getTime() + cooldownMs);
    
    // Exact diff for countdown
    const diffMs = nextLaunchDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs > 0) {
      return res.json({ 
        isInCooldown: true, 
        daysLeft, 
        nextLaunchDate: nextLaunchDate.toISOString(),
        lastLaunchDate: lastCreated.toISOString(),
        diffMs // Send ms for raw countdown timer
      });
    }

    res.json({ 
      isInCooldown: false, 
      daysLeft: 0, 
      nextLaunchDate: nextLaunchDate.toISOString() 
    });
  } catch (err: any) {
    console.error("[getCooldownStatus] ERROR:", err);
    res.status(500).json({ error: "Failed to fetch cooldown status" });
  }
}
