import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function likePost(req: Request, res: Response) {
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

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking like:", checkError);
      return res.status(500).json({ error: "Failed to check like status" });
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (deleteError) {
        console.error("Error unliking post:", deleteError);
        return res.status(500).json({ error: "Failed to unlike post" });
      }

      return res.json({ liked: false, message: "Post unliked" });
    } else {
      // Like
      const { data, error } = await supabase
        .from("likes")
        .insert({
          user_id: userId,
          post_id: parseInt(postId, 10),
        })
        .select()
        .single();

      if (error) {
        console.error("Error liking post:", error);
        return res.status(500).json({ error: "Failed to like post", details: error.message });
      }

      // Create notification for post owner
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (post && post.user_id !== userId) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          type: "like",
          actor_id: userId,
          post_id: parseInt(postId, 10),
        });
      }

      return res.json({ liked: true, message: "Post liked", data });
    }
  } catch (error: any) {
    console.error("Unexpected error in likePost:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getPostLikes(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Get like count
    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError) {
      console.error("Error getting like count:", countError);
      return res.status(500).json({ error: "Failed to get like count" });
    }

    // Check if current user liked it
    let isLiked = false;
    if (userId) {
      const { data: userLike, error: likeCheckError } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", userId)
        .eq("post_id", postId)
        .maybeSingle();

      // If error is PGRST116, it means no row found (not liked) - this is expected
      if (likeCheckError && likeCheckError.code !== "PGRST116") {
        console.error("Error checking user like:", likeCheckError);
      } else {
        isLiked = !!userLike;
      }
    }

    return res.json({ count: count || 0, isLiked });
  } catch (error: any) {
    console.error("Unexpected error in getPostLikes:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getUserLikes(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get total likes from user's posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    if (postsError) {
      console.error("Error fetching user posts:", postsError);
      return res.status(500).json({ error: "Failed to fetch user posts" });
    }

    const postIds = posts?.map((p: any) => p.id) || [];

    if (postIds.length === 0) {
      return res.json({ totalLikes: 0 });
    }

    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .in("post_id", postIds);

    if (countError) {
      console.error("Error getting total likes:", countError);
      return res.status(500).json({ error: "Failed to get total likes" });
    }

    return res.json({ totalLikes: count || 0 });
  } catch (error: any) {
    console.error("Unexpected error in getUserLikes:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
