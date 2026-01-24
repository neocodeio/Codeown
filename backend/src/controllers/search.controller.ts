import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function searchUsers(req: Request, res: Response) {
  try {
    const { q } = req.query;
    const query = (q as string)?.trim() || "";

    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Search users by name, username, or email
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, username, avatar_url")
      .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ error: "Failed to search users" });
    }

    return res.json(users || []);
  } catch (error: any) {
    console.error("Unexpected error in searchUsers:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function searchPosts(req: Request, res: Response) {
  try {
    const { q, page = "1", limit = "20" } = req.query;
    const query = (q as string)?.trim() || "";
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    if (!query || query.length < 2) {
      return res.json({ posts: [], total: 0, page: pageNum, limit: limitNum });
    }

    // Search posts by title, content, or tags
    let postsQuery = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Also search in tags if query starts with #
    if (query.startsWith("#")) {
      const tag = query.substring(1).toLowerCase();
      postsQuery = supabase
        .from("posts")
        .select("*", { count: "exact" })
        .contains("tags", [tag])
        .order("created_at", { ascending: false })
        .range(offset, offset + limitNum - 1);
    }

    const { data: posts, error, count } = await postsQuery;

    if (error) {
      console.error("Error searching posts:", error);
      return res.status(500).json({ error: "Failed to search posts" });
    }

    if (!posts || posts.length === 0) {
      return res.json({ posts: [], total: 0, page: pageNum, limit: limitNum });
    }

    // Get user data for posts
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, avatar_url, username")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    const postsWithUsers = posts.map((post: any) => {
      const user = userMap.get(post.user_id);
      return {
        ...post,
        user: user ? {
          name: user.name || "User",
          avatar_url: user.avatar_url || null,
          username: user.username || null,
        } : {
          name: "User",
          avatar_url: null,
          username: null,
        },
      };
    });

    return res.json({
      posts: postsWithUsers,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in searchPosts:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function searchProjects(req: Request, res: Response) {
  try {
    const { q, page = "1", limit = "20" } = req.query;
    const query = (q as string)?.trim() || "";
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    if (!query || query.length < 2) {
      return res.json({ projects: [], total: 0, page: pageNum, limit: limitNum });
    }

    // Search projects by title, description, or technologies
    let projectsQuery = supabase
      .from("projects")
      .select("*", { count: "exact" })
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,technologies_used.cs.{${query}}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: projects, error, count } = await projectsQuery;

    if (error) {
      console.error("Error searching projects:", error);
      return res.status(500).json({ error: "Failed to search projects" });
    }

    if (!projects || projects.length === 0) {
      return res.json({ projects: [], total: 0, page: pageNum, limit: limitNum });
    }

    // Get user data for projects
    const userIds = [...new Set(projects.map((p: any) => p.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, avatar_url, username")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    const projectsWithUsers = projects.map((project: any) => {
      const user = userMap.get(project.user_id);
      return {
        ...project,
        user: user ? {
          name: user.name || "User",
          avatar_url: user.avatar_url || null,
          username: user.username || null,
        } : {
          name: "User",
          avatar_url: null,
          username: null,
        },
      };
    });

    return res.json({
      projects: projectsWithUsers,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in searchProjects:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function searchAll(req: Request, res: Response) {
  try {
    const { q } = req.query;
    const query = (q as string)?.trim() || "";

    if (!query || query.length < 2) {
      return res.json({ users: [], posts: [], projects: [] });
    }

    // Search users, posts, and projects
    const [usersResult, postsResult, projectsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, username, avatar_url")
        .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5),
      supabase
        .from("posts")
        .select("id, title, content, user_id, created_at, tags")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("projects")
        .select("id, title, description, user_id, created_at, technologies_used, status")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,technologies_used.cs.{${query}}`)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return res.json({
      users: usersResult.data || [],
      posts: postsResult.data || [],
      projects: projectsResult.data || [],
    });
  } catch (error: any) {
    console.error("Unexpected error in searchAll:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
