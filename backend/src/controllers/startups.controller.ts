import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";

export async function getStartups(req: Request, res: Response) {
  try {
    const { searchQuery, status } = req.query;
    console.log(`[getStartups] QUERY: search=${searchQuery}, status=${status}`);
    
    let query = supabase
      .from("startups")
      .select("*, user:owner_id(id, name, username, avatar_url)")
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
    
    console.log(`[getStartups] SUCCESS: Found ${data?.length || 0} startups`);
    res.json(data || []);
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
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Startup not found" });
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch startup", details: err.message });
  }
}

export async function createStartup(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Ensure user exists in Supabase before creating startup
    try {
        await ensureUserExists(userId, (req as any).user);
    } catch (userErr) {
        console.warn("[createStartup] ensureUserExists non-fatal error:", userErr);
    }

    const startupData = {
      ...req.body,
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones: req.body.milestones || [],
      tech_stack: req.body.tech_stack || [],
      member_count: 1
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
