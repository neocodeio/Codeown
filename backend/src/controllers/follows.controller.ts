import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function followUser(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { userId: targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }

    if (userId === targetUserId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking follow:", checkError);
      return res.status(500).json({ error: "Failed to check follow status" });
    }

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", targetUserId);

      if (deleteError) {
        console.error("Error unfollowing user:", deleteError);
        return res.status(500).json({ error: "Failed to unfollow user" });
      }

      return res.json({ following: false, message: "User unfollowed" });
    } else {
      // Follow
      const { data, error } = await supabase
        .from("follows")
        .insert({
          follower_id: userId,
          following_id: targetUserId,
        })
        .select()
        .single();

      if (error) {
        console.error("Error following user:", error);
        return res.status(500).json({ error: "Failed to follow user", details: error.message });
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "follow",
        actor_id: userId,
      });

      return res.json({ following: true, message: "User followed", data });
    }
  } catch (error: any) {
    console.error("Unexpected error in followUser:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getFollowStatus(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { userId: targetUserId } = req.params;

    if (!userId) {
      return res.json({ following: false, followers: 0, following: 0 });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }

    // Check if following
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)
      .single();

    // Get follower and following counts
    const { data: userData } = await supabase
      .from("users")
      .select("follower_count, following_count")
      .eq("id", targetUserId)
      .single();

    return res.json({
      following: !!follow,
      followers: userData?.follower_count || 0,
      following: userData?.following_count || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error in getFollowStatus:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getFollowers(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data: follows, error } = await supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching followers:", error);
      return res.status(500).json({ error: "Failed to fetch followers" });
    }

    return res.json(follows || []);
  } catch (error: any) {
    console.error("Unexpected error in getFollowers:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getFollowing(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data: follows, error } = await supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching following:", error);
      return res.status(500).json({ error: "Failed to fetch following" });
    }

    return res.json(follows || []);
  } catch (error: any) {
    console.error("Unexpected error in getFollowing:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
