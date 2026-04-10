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
      .select("id, name, username, avatar_url, is_hirable, is_pro")
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

    // Search posts by title, content, or tags - select only safe columns
    let postsQuery = supabase
      .from("posts")
      .select("id, title, content, user_id, created_at, images, tags, like_count, comment_count, view_count, language, code_snippet, user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro)", { count: "exact" })
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Also search in tags if query starts with #
    if (query.startsWith("#")) {
      const tag = query.substring(1).toLowerCase();
      postsQuery = supabase
        .from("posts")
        .select("id, title, content, user_id, created_at, images, tags, like_count, comment_count, view_count, language, code_snippet, user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro)", { count: "exact" })
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
      .select("id, name, avatar_url, username, is_hirable, is_pro")
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
          is_hirable: user.is_hirable || false,
          is_pro: user.is_pro ?? false,
        } : {
          name: "User",
          avatar_url: null,
          username: null,
          is_hirable: false,
          is_pro: false,
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
    const { q, page = "1", limit = "20", cofounder = "false" } = req.query;
    const query = (q as string)?.trim() || "";
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const isCofounderOnly = cofounder === "true";

    // Search projects by title, description, or technologies - select only safe columns
    let projectsQuery = supabase
      .from("projects")
      .select(`
        id, title, description, technologies_used, status, cover_image, like_count, comment_count, created_at, user_id, looking_for_contributors,
        user:user_id(id, name, avatar_url, username, is_hirable, is_pro)
      `, { count: "exact" });

    if (query && query.length >= 2) {
      projectsQuery = projectsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,technologies_used.cs.{${query}}`);
    } else if (!isCofounderOnly) {
      return res.json({ projects: [], total: 0, page: pageNum, limit: limitNum });
    }

    if (isCofounderOnly) {
      projectsQuery = projectsQuery.eq("looking_for_contributors", true);
    }

    projectsQuery = projectsQuery
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
      .select("id, name, avatar_url, username, is_hirable, is_pro")
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
          is_hirable: user.is_hirable || false,
          is_pro: user.is_pro ?? false,
        } : {
          name: "User",
          avatar_url: null,
          username: null,
          is_hirable: false,
          is_pro: false,
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

export async function searchStartups(req: Request, res: Response) {
  try {
    const { q, page = "1", limit = "20" } = req.query;
    const query = (q as string)?.trim() || "";
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    if (!query || query.length < 1) {
      return res.json({ startups: [], total: 0, page: pageNum, limit: limitNum });
    }

    const { data: startups, error, count } = await supabase
      .from("startups")
      .select(`
        *,
        user:owner_id(id, name, username, avatar_url),
        members:startup_members(count),
        upvotes:startup_upvotes(count)
      `, { count: "exact" })
      .or(`name.ilike."%${query}%",tagline.ilike."%${query}%",description.ilike."%${query}%"`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error("Error searching startups:", error);
      return res.status(500).json({ error: "Failed to search startups" });
    }

    const normalizedData = (startups || []).map((s: any) => ({
      ...s,
      member_count: s.members?.[0]?.count || 0,
      upvotes_count: s.upvotes?.[0]?.count || 0,
    }));

    return res.json({
      startups: normalizedData,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in searchStartups:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function searchAll(req: Request, res: Response) {
  try {
    const { q } = req.query;
    const query = (q as string)?.trim() || "";

    if (!query || query.length < 1) {
      return res.json({ users: [], posts: [], projects: [], startups: [] });
    }

    const [usersResult, postsResult, projectsResult, startupsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, username, avatar_url, is_hirable, is_pro")
        .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5),
      supabase
        .from("posts")
        .select("id, title, content, user_id, created_at, tags, code_snippet")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("projects")
        .select("id, title, description, user_id, created_at, technologies_used, status")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,technologies_used.cs.{${query}}`)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("startups")
        .select("id, name, tagline, logo_url, owner_id, created_at")
        .or(`name.ilike."%${query}%",tagline.ilike."%${query}%",description.ilike."%${query}%"`)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return res.json({
      users: usersResult.data || [],
      posts: postsResult.data || [],
      projects: projectsResult.data || [],
      startups: startupsResult.data || [],
    });
  } catch (error: any) {
    console.error("Unexpected error in searchAll:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function searchDevelopers(req: Request, res: Response) {
  try {
    const { q, skills, location, experience, page = "1", limit = "20" } = req.query;
    const query = (q as string)?.trim() || "";
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let devQuery = supabase
      .from("users")
      .select("id, name, username, avatar_url, bio, location, job_title, skills, experience_level, is_hirable, is_pro, created_at", { count: "exact" })
      .eq("is_hirable", true);

    if (query) {
      devQuery = devQuery.or(`name.ilike.%${query}%,username.ilike.%${query}%,job_title.ilike.%${query}%`);
    }

    if (skills) {
      const skillArray = (skills as string).split(",").map(s => s.trim());
      devQuery = devQuery.contains("skills", skillArray);
    }

    if (location) {
      devQuery = devQuery.ilike("location", `%${location}%`);
    }

    if (experience) {
      devQuery = devQuery.eq("experience_level", experience);
    }

    const { data: devs, error, count } = await devQuery
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error("Error searching developers:", error);
      return res.status(500).json({ error: "Failed to search developers" });
    }

    return res.json({
      developers: devs || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in searchDevelopers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
