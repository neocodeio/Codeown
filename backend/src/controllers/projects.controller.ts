import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

// Helper function to create notifications
async function createProjectNotification(
  userId: string,
  type: "like" | "comment" | "save",
  actorId: string,
  projectId: number
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: type,
      actor_id: actorId,
      project_id: projectId,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating project notification:", error);
  }
}
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getProjects(req: Request, res: Response) {
  try {
    const { page = "1", limit = "20", filter = "all", tag } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Simplified query to ensure reliability in production
    let projectsQuery = supabase
      .from("projects")
      .select(`
        *,
        user:user_id(id, name, avatar_url, username, is_hirable),
        ratings:project_ratings(rating)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (tag) {
      projectsQuery = projectsQuery.contains("technologies_used", [tag]);
    }

    if (String(filter).toLowerCase() === "following") {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Sign in to view the Following feed." });
      }
      const { data: followingRows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      const followingIds = (followingRows || []).map((r: any) => r.following_id);

      if (followingIds.length === 0) {
        return res.json({ projects: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
      }
      projectsQuery = projectsQuery.in("user_id", followingIds);
    }

    const { data: projects, error: projectsError, count } = await projectsQuery.range(offset, offset + limitNum - 1);

    if (projectsError) {
      console.error("Supabase error in getProjects:", projectsError);
      return res.status(500).json({
        error: "Failed to fetch projects",
        details: projectsError.message,
        code: projectsError.code,
        hint: projectsError.hint,
        query: { filter, page, limit, tag }
      });
    }

    if (!projects || projects.length === 0) {
      return res.json({ projects: [], total: count || 0, page: pageNum, limit: limitNum, totalPages: Math.ceil((count || 0) / limitNum) });
    }

    // Process projects and attach stats
    const projectsWithDetails = projects.map((project: any) => {
      // Creator fallback
      const creator = Array.isArray(project.user) ? project.user[0] : project.user;

      // Calculate average rating
      const ratings = project.ratings || [];
      const ratingCount = ratings.length;
      const averageRating = ratingCount > 0
        ? ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratingCount
        : 0;

      // Format contributors (not fetched in main feed for speed/reliability)
      const contributors: any[] = [];

      return {
        ...project,
        user: creator || { id: project.user_id, name: "Unknown User", avatar_url: null, username: null, is_hirable: false },
        rating: averageRating,
        rating_count: ratingCount,
        contributors: contributors
      };
    });

    // FETCH LIKE AND SAVE STATUS FOR CURRENT USER IN PARALLEL
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    let finalProjects = projectsWithDetails;

    if (currentUserId && projectsWithDetails.length > 0) {
      const projectIds = projectsWithDetails.map(p => p.id);
      const [likesRes, savesRes] = await Promise.all([
        supabase.from("project_likes").select("project_id").eq("user_id", currentUserId).in("project_id", projectIds),
        supabase.from("project_saves").select("project_id").eq("user_id", currentUserId).in("project_id", projectIds)
      ]);

      const likedProjectIds = new Set((likesRes.data || []).map(l => l.project_id));
      const savedProjectIds = new Set((savesRes.data || []).map(s => s.project_id));

      finalProjects = projectsWithDetails.map(p => ({
        ...p,
        isLiked: likedProjectIds.has(p.id),
        isSaved: savedProjectIds.has(p.id)
      }));
    }

    return res.json({
      projects: finalProjects,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum)
    });

  } catch (error: any) {
    console.error("Unexpected error in getProjects:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}

export async function getProject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    const resolvedId = isNaN(numericId) ? id : numericId;

    console.log(`[getProject] Fetching project details for ID: ${resolvedId}`);

    // 1. FETCH MAIN PROJECT DATA
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        user:user_id(id, name, avatar_url, username, is_hirable)
      `)
      .eq("id", resolvedId)
      .maybeSingle();

    if (projectError) {
      console.error("[getProject] Supabase main query error:", projectError);
      return res.status(500).json({
        error: "Database error fetching project",
        details: projectError.message,
        code: projectError.code
      });
    }

    if (!project) {
      console.log(`[getProject] Project ${resolvedId} not found`);
      return res.status(404).json({ error: "Project not found" });
    }

    // 2. FETCH RELATED DATA INDEPENDENTLY (Extremely Defensive)
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    // We execute these in parallel. We remove .catch() because query builders are thenables, not full promises.
    //supabase-js returns objects that only implement .then()
    const [ratingsRes, contribsRes, likesRes, savesRes]: any[] = await Promise.all([
      supabase.from("project_ratings").select("rating, user_id").eq("project_id", project.id),
      supabase.from("project_contributors").select("user_id").eq("project_id", project.id),
      userId ? supabase.from("project_likes").select("id").eq("user_id", userId).eq("project_id", project.id).maybeSingle() : Promise.resolve({ data: null }),
      userId ? supabase.from("project_saves").select("id").eq("user_id", userId).eq("project_id", project.id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    // Handle Contributors details manually (Resolved PGRST200 join error)
    let contributors: any[] = [];
    if (contribsRes && contribsRes.data && contribsRes.data.length > 0) {
      try {
        const contributorIds = contribsRes.data.map((c: any) => c.user_id);
        const { data: userData } = await supabase
          .from("users")
          .select("id, name, avatar_url, username, is_hirable")
          .in("id", contributorIds);
        contributors = userData || [];
      } catch (cErr) {
        console.error("[getProject] Contributor details fetch failure:", cErr);
      }
    }

    // 3. ASYNC VIEW INCREMENT
    // Using simple .then() for compatibility
    supabase.rpc('increment_view_count', { row_id: project.id, table_name: 'projects' })
      .then(
        () => { },
        () => {
          supabase.from("projects").update({ view_count: (project.view_count || 0) + 1 }).eq("id", project.id).then(() => { });
        }
      );

    // 4. PROCESS RATINGS
    const ratings = (ratingsRes && ratingsRes.data) ? (ratingsRes.data as any[]) : [];
    const ratingCount = ratings.length;
    const averageRating = ratingCount > 0
      ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
      : 0;
    const userRating = userId ? ratings.find(r => r.user_id === userId)?.rating : undefined;

    // 5. RETURN COMBINED DATA
    return res.json({
      ...project,
      user: project.user || { id: project.user_id, name: "Unknown User", avatar_url: null, username: null, is_hirable: false },
      rating: averageRating,
      rating_count: ratingCount,
      user_rating: userRating,
      contributors: contributors,
      isLiked: !!likesRes?.data,
      isSaved: !!savesRes?.data
    });
  } catch (error: any) {
    console.error("[getProject] CRITICAL UNEXPECTED ERROR:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}

export async function getUserProjects(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { data: projects, error: projectsError, count } = await supabase
      .from("projects")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (projectsError) {
      console.error("Supabase error in getUserProjects:", projectsError);
      return res.status(500).json({ error: "Failed to fetch user projects", details: projectsError.message });
    }

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, avatar_url, username, is_hirable")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }

    // Attach user data to projects
    const projectsWithUsers = (projects || []).map((project: any) => ({
      ...project,
      user: user || { id: userId, name: "Unknown User", avatar_url: null, username: null, is_hirable: false }
    }));

    return res.json(projectsWithUsers || []);
  } catch (error) {
    console.error("Error in getUserProjects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    console.log("Creating project... body:", JSON.stringify(req.body, null, 2));
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      console.error("Create Project Error: No User ID in request");
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      title,
      description,
      technologies_used,
      status,
      github_repo,
      live_demo,
      cover_image,
      project_details,
      looking_for_contributors
    } = req.body;

    let { contributors } = req.body;

    // Validate required fields
    if (!title || !description || !technologies_used || !status || !project_details) {
      console.error("Create Project Error: Missing fields", {
        title: !!title,
        description: !!description,
        tech: !!technologies_used,
        status: !!status,
        details: !!project_details
      });
      return res.status(400).json({ error: "Missing required fields: title, description, technologies_used, status, and project_details are all required." });
    }

    // Validate status
    if (!['in_progress', 'completed', 'paused'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be in_progress, completed, or paused." });
    }

    // Ensure user exists
    try {
      await ensureUserExists(userId);
    } catch (e: any) {
      console.error("Warning: ensureUserExists failed, but attempting to continue project creation:", e.message);
    }

    // Create project
    const now = new Date().toISOString();
    console.log("Inserting project into Supabase projects table...");

    const projectData: any = {
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      technologies_used,
      status,
      github_repo: github_repo || null,
      live_demo: live_demo || null,
      cover_image: cover_image || null,
      project_details: project_details.trim(),
      // looking_for_contributors: !!looking_for_contributors, // Removed: column missing in DB
      // like_count: 0, // Usually has default in DB
      // comment_count: 0, // Usually has default in DB
      created_at: now,
      updated_at: now
    };

    const { data: insertedData, error: projectError } = await supabase
      .from("projects")
      .insert([projectData])
      .select();

    if (projectError) {
      console.error("Supabase projects.insert error:", projectError);
      return res.status(500).json({
        error: "Failed to create project in database",
        details: projectError.message,
        code: projectError.code,
        hint: projectError.hint || "Check if all required columns exist in the 'projects' table."
      });
    }

    if (!insertedData || insertedData.length === 0) {
      console.error("Supabase insert succeeded but returned no data.");
      return res.status(500).json({ error: "Failed to retrieve the created project." });
    }

    const project = insertedData[0];
    console.log("Project created successfully with ID:", project.id);

    // Fetch user data for response
    const { data: user } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .eq("id", userId)
      .single();

    // Handle Contributors
    if (contributors && Array.isArray(contributors) && contributors.length > 0) {
      console.log("Processing contributors:", contributors);
      try {
        // Resolve usernames to IDs
        const { data: foundUsers } = await supabase
          .from("users")
          .select("id, username")
          .in("username", contributors);

        if (foundUsers && foundUsers.length > 0) {
          const contributorsToInsert = foundUsers.map(u => ({
            project_id: project.id,
            user_id: u.id
          }));

          const { error: contribError } = await supabase
            .from("project_contributors")
            .insert(contributorsToInsert);

          if (contribError) {
            console.error("Non-fatal error inserting contributors:", contribError);
          }
        }
      } catch (err: any) {
        console.error("Non-fatal catch error handling contributors:", err.message);
      }
    }

    return res.status(201).json({
      ...project,
      user: user || { id: userId, name: "Unknown User", email: null, avatar_url: null, username: null }
    });
  } catch (error: any) {
    console.error("CRITICAL error in createProject controller:", error);
    return res.status(500).json({
      error: "An unexpected server error occurred while creating the project.",
      message: error.message
    });
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if project exists and user owns it
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingProject) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    const {
      title,
      description,
      technologies_used,
      status,
      github_repo,
      live_demo,
      cover_image,
      project_details,
      looking_for_contributors
    } = req.body;

    // Validate required fields
    if (!title || !description || !technologies_used || !status || !project_details) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate status
    if (!['in_progress', 'completed', 'paused'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .update({
        title,
        description,
        technologies_used,
        status,
        github_repo: github_repo || null,
        live_demo: live_demo || null,
        cover_image: cover_image || null,
        project_details,
        looking_for_contributors: looking_for_contributors || false,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (projectError) {
      console.error("Supabase error in updateProject:", projectError);
      return res.status(500).json({ error: "Failed to update project", details: projectError.message });
    }

    // Fetch user data for response
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user for project:", userError);
    }

    return res.json({
      ...project,
      user: user || { id: userId, name: "Unknown User", email: null, avatar_url: null, username: null }
    });
  } catch (error) {
    console.error("Error in updateProject:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if project exists and user owns it
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingProject) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    // Delete project (cascade will delete related records)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Supabase error in deleteProject:", deleteError);
      return res.status(500).json({ error: "Failed to delete project", details: deleteError.message });
    }

    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProject:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function toggleProjectLike(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user already liked the project
    const { data: existingLike, error: likeError } = await supabase
      .from("project_likes")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .single();

    let isLiked;

    if (existingLike) {
      // Remove like
      await supabase
        .from("project_likes")
        .delete()
        .eq("project_id", id)
        .eq("user_id", userId);
      isLiked = false;
    } else {
      await supabase
        .from("project_likes")
        .insert({
          project_id: parseInt(id),
          user_id: String(userId)
        });
      isLiked = true;

      // Create notification for project owner (if not the liker)
      if (project.user_id !== String(userId)) {
        await createProjectNotification(project.user_id, "like", String(userId), parseInt(id));
      }

    }

    // Update like count
    const { data: updatedProject } = await supabase
      .from("project_likes")
      .select("project_id")
      .eq("project_id", id);

    const likeCount = updatedProject?.length || 0;

    await supabase
      .from("projects")
      .update({ like_count: likeCount })
      .eq("id", id);

    return res.json({ isLiked, likeCount });
  } catch (error) {
    console.error("Error in toggleProjectLike:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProjectLikeStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.json({ isLiked: false, likeCount: 0 });
    }

    // Check if project exists and get like count
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("like_count")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user liked the project
    const { data: existingLike, error: likeError } = await supabase
      .from("project_likes")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .single();

    return res.json({
      isLiked: !!existingLike,
      likeCount: project.like_count || 0
    });
  } catch (error) {
    console.error("Error in getProjectLikeStatus:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function toggleProjectSave(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user already saved the project
    const { data: existingSave, error: saveError } = await supabase
      .from("project_saves")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .single();

    let isSaved;

    if (existingSave) {
      // Remove save
      await supabase
        .from("project_saves")
        .delete()
        .eq("project_id", id)
        .eq("user_id", userId);
      isSaved = false;
    } else {
      await supabase
        .from("project_saves")
        .insert({
          project_id: parseInt(id),
          user_id: String(userId)
        });
      isSaved = true;

      // Create notification for project owner (if not the saver)
      if (project.user_id !== String(userId)) {
        await createProjectNotification(project.user_id, "save", String(userId), parseInt(id));
      }

    }

    return res.json({ isSaved });
  } catch (error) {
    console.error("Error in toggleProjectSave:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProjectSaveStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.json({ isSaved: false });
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user saved the project
    const { data: existingSave, error: saveError } = await supabase
      .from("project_saves")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .single();

    return res.json({ isSaved: !!existingSave });
  } catch (error) {
    console.error("Error in getProjectSaveStatus:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function rateProject(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;
    const { rating } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Upsert rating
    const { error: upsertError } = await supabase
      .from("project_ratings")
      .upsert({
        project_id: parseInt(id),
        user_id: String(userId),
        rating: rating,
        created_at: new Date().toISOString()
      }, { onConflict: "project_id,user_id" });

    if (upsertError) {
      console.error("Error upserting rating:", upsertError);
      return res.status(500).json({ error: "Failed to save rating" });
    }

    // Recalculate average
    const { data: ratings, error: fetchError } = await supabase
      .from("project_ratings")
      .select("rating")
      .eq("project_id", id);

    let average = 0;
    let total = 0;
    if (ratings) {
      total = ratings.length;
      const sum = (ratings as any[]).reduce((acc: number, r: any) => acc + r.rating, 0);
      average = total > 0 ? sum / total : 0;
    }

    return res.json({ average, count: total, user_rating: rating });
  } catch (error) {
    console.error("Error in rateProject:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
