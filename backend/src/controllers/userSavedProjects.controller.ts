import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function getUserSavedProjects(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Get saved project relationships
    const { data: savedProjects, error: savedError } = await supabase
      .from("project_saves")
      .select("project_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (savedError) {
      console.error("Error fetching saved projects:", savedError);
      return res.status(500).json({ error: "Failed to fetch saved projects" });
    }

    if (!savedProjects || savedProjects.length === 0) {
      return res.json([]);
    }

    // Get actual project data
    const projectIds = savedProjects.map((sp: any) => sp.project_id);
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .in("id", projectIds)
      .order("created_at", { ascending: false });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      return res.status(500).json({ error: "Failed to fetch projects" });
    }

    // Get user data for all projects
    const userIds = [...new Set((projects || []).map((p: any) => p.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Attach user data to projects and maintain save order
    const projectsWithUsers = (projects || []).map((project: any) => ({
      ...project,
      user: userMap.get(project.user_id) || { 
        id: project.user_id, 
        name: "Unknown User", 
        email: null, 
        avatar_url: null, 
        username: null 
      }
    }));

    return res.json(projectsWithUsers || []);
  } catch (error) {
    console.error("Error in getUserSavedProjects:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
