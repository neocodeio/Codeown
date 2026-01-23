import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getProjects(req: Request, res: Response) {
  try {
    const { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { data: projects, error: projectsError, count } = await supabase
      .from("projects")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (projectsError) {
      console.error("Supabase error in getProjects:", projectsError);
      return res.status(500).json({ error: "Failed to fetch projects", details: projectsError.message });
    }

    if (!projects || projects.length === 0) {
      return res.json({ projects: [], total: count || 0, page: pageNum, limit: limitNum, totalPages: Math.ceil((count || 0) / limitNum) });
    }

    // Get unique user IDs
    const userIds = [...new Set(projects.map((p: any) => p.user_id))];
    
    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .in("id", userIds);
    
    if (usersError) {
      console.error("Error fetching users for projects:", usersError);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }

    // Attach user data to projects
    const projectsWithUsers = projects.map((project: any) => {
      const user = users?.find((u: any) => u.id === project.user_id);
      return {
        ...project,
        user: user || { id: project.user_id, name: "Unknown User", email: null, avatar_url: null, username: null }
      };
    });

    return res.json({ 
      projects: projectsWithUsers, 
      total: count || 0, 
      page: pageNum, 
      limit: limitNum, 
      totalPages: Math.ceil((count || 0) / limitNum) 
    });
  } catch (error) {
    console.error("Error in getProjects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .eq("id", project.user_id)
      .single();

    if (userError) {
      console.error("Error fetching user for project:", userError);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }

    return res.json({
      ...project,
      user: user || { id: project.user_id, name: "Unknown User", email: null, avatar_url: null, username: null }
    });
  } catch (error) {
    console.error("Error in getProject:", error);
    return res.status(500).json({ error: "Internal server error" });
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
      .select("id, name, email, avatar_url, username")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }

    // Attach user data to projects
    const projectsWithUsers = (projects || []).map((project: any) => ({
      ...project,
      user: user || { id: userId, name: "Unknown User", email: null, avatar_url: null, username: null }
    }));

    return res.json(projectsWithUsers || []);
  } catch (error) {
    console.error("Error in getUserProjects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    
    if (!userId) {
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
      project_details
    } = req.body;

    // Validate required fields
    if (!title || !description || !technologies_used || !status || !project_details) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate status
    if (!['in_progress', 'completed', 'paused'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Ensure user exists
    await ensureUserExists(userId);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        title,
        description,
        technologies_used,
        status,
        github_repo: github_repo || null,
        live_demo: live_demo || null,
        cover_image: cover_image || null,
        project_details,
        like_count: 0,
        comment_count: 0
      })
      .select()
      .single();

    if (projectError) {
      console.error("Supabase error in createProject:", projectError);
      return res.status(500).json({ error: "Failed to create project", details: projectError.message });
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

    return res.status(201).json({
      ...project,
      user: user || { id: userId, name: "Unknown User", email: null, avatar_url: null, username: null }
    });
  } catch (error) {
    console.error("Error in createProject:", error);
    return res.status(500).json({ error: "Internal server error" });
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
      project_details
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
      // Add like
      await supabase
        .from("project_likes")
        .insert({
          project_id: parseInt(id),
          user_id: userId
        });
      isLiked = true;
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
      // Add save
      await supabase
        .from("project_saves")
        .insert({
          project_id: parseInt(id),
          user_id: userId
        });
      isSaved = true;
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
