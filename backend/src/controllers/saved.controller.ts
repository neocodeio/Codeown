import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function savePost(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Check if already saved
    const { data: existingSave, error: checkError } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking save:", checkError);
      return res.status(500).json({ error: "Failed to check save status" });
    }

    if (existingSave) {
      // Unsave
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (deleteError) {
        console.error("Error unsaving post:", deleteError);
        return res.status(500).json({ error: "Failed to unsave post" });
      }

      return res.json({ saved: false, message: "Post unsaved" });
    } else {
      // Save
      const { data, error } = await supabase
        .from("saved_posts")
        .insert({
          user_id: userId,
          post_id: parseInt(postId, 10),
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving post:", error);
        return res.status(500).json({ error: "Failed to save post", details: error.message });
      }

      return res.json({ saved: true, message: "Post saved", data });
    }
  } catch (error: any) {
    console.error("Unexpected error in savePost:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getSavedPosts(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Get saved posts
    const { data: savedPosts, error, count } = await supabase
      .from("saved_posts")
      .select("post_id, created_at, posts(*)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error("Error fetching saved posts:", error);
      return res.status(500).json({ error: "Failed to fetch saved posts" });
    }

    if (!savedPosts || savedPosts.length === 0) {
      return res.json({ posts: [], total: 0, page: pageNum, limit: limitNum });
    }

    // Extract posts and get user data
    const posts = savedPosts.map((sp: any) => sp.posts).filter(Boolean);
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    const postsWithUsers = posts.map((post: any) => {
      const user = userMap.get(post.user_id);
      return {
        ...post,
        user: user ? {
          name: user.name || "User",
          email: user.email || null,
          avatar_url: user.avatar_url || null,
          username: user.username || null,
        } : {
          name: "User",
          email: null,
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
    console.error("Unexpected error in getSavedPosts:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function checkSaved(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.json({ saved: false });
    }

    const { data } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    return res.json({ saved: !!data });
  } catch (error: any) {
    console.error("Unexpected error in checkSaved:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
