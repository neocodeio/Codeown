import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

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

      // Get updated counts
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      return res.json({ following: false, message: "User unfollowed", followerCount: followerCount || 0 });
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

      // Create notification for the followed user
      try {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "follow",
          actor_id: userId,
          read: false,
        });
        console.log(`Created follow notification for user ${targetUserId} from ${userId}`);
      } catch (notifError) {
        console.error("Error creating follow notification:", notifError);
      }

      // Get updated counts
      const { count: followerCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      return res.json({ following: true, message: "User followed", data, followerCount: followerCount || 0 });
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

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }

    // Check if following (only if user is logged in)
    let isFollowing = false;
    if (userId && userId !== targetUserId) {
      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", userId)
        .eq("following_id", targetUserId)
        .maybeSingle();
      isFollowing = !!follow;
    }

    // Get follower and following counts directly from follows table for accuracy
    const [followerResult, followingResult] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId),
    ]);

    return res.json({
      isFollowing,
      followerCount: followerResult.count || 0,
      followingCount: followingResult.count || 0,
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

    // Get all follower IDs
    const { data: follows, error } = await supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching followers:", error);
      return res.status(500).json({ error: "Failed to fetch followers" });
    }

    if (!follows || follows.length === 0) {
      return res.json([]);
    }

    // Get user details for each follower
    const followerIds = follows.map((f: any) => f.follower_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, avatar_url, bio")
      .in("id", followerIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Fetch missing users from Clerk
    const missingIds = followerIds.filter((id: string) => !userMap.has(id));
    if (missingIds.length > 0 && process.env.CLERK_SECRET_KEY) {
      for (const followerId of missingIds) {
        try {
          const clerkUser = await clerkClient.users.getUser(followerId);
          let userName: string | null = null;
          if (clerkUser.firstName && clerkUser.lastName) {
            userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
          } else if (clerkUser.firstName) {
            userName = clerkUser.firstName;
          } else if (clerkUser.username) {
            userName = clerkUser.username;
          }

          userMap.set(followerId, {
            id: followerId,
            name: userName || "User",
            username: clerkUser.username || null,
            avatar_url: clerkUser.imageUrl || null,
            bio: null,
          });
        } catch (error) {
          console.error(`Error fetching user ${followerId} from Clerk:`, error);
          userMap.set(followerId, {
            id: followerId,
            name: "User",
            username: null,
            avatar_url: null,
            bio: null,
          });
        }
      }
    }

    // Combine follow data with user details
    const followersWithDetails = follows.map((f: any) => {
      const user = userMap.get(f.follower_id);
      return {
        id: f.follower_id,
        name: user?.name || "User",
        username: user?.username || null,
        avatar_url: user?.avatar_url || null,
        bio: user?.bio || null,
        followed_at: f.created_at,
      };
    });

    return res.json(followersWithDetails);
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

    // Get all following IDs
    const { data: follows, error } = await supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching following:", error);
      return res.status(500).json({ error: "Failed to fetch following" });
    }

    if (!follows || follows.length === 0) {
      return res.json([]);
    }

    // Get user details for each following
    const followingIds = follows.map((f: any) => f.following_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, avatar_url, bio")
      .in("id", followingIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Fetch missing users from Clerk
    const missingIds = followingIds.filter((id: string) => !userMap.has(id));
    if (missingIds.length > 0 && process.env.CLERK_SECRET_KEY) {
      for (const followingId of missingIds) {
        try {
          const clerkUser = await clerkClient.users.getUser(followingId);
          let userName: string | null = null;
          if (clerkUser.firstName && clerkUser.lastName) {
            userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
          } else if (clerkUser.firstName) {
            userName = clerkUser.firstName;
          } else if (clerkUser.username) {
            userName = clerkUser.username;
          }

          userMap.set(followingId, {
            id: followingId,
            name: userName || "User",
            username: clerkUser.username || null,
            avatar_url: clerkUser.imageUrl || null,
            bio: null,
          });
        } catch (error) {
          console.error(`Error fetching user ${followingId} from Clerk:`, error);
          userMap.set(followingId, {
            id: followingId,
            name: "User",
            username: null,
            avatar_url: null,
            bio: null,
          });
        }
      }
    }

    // Combine follow data with user details
    const followingWithDetails = follows.map((f: any) => {
      const user = userMap.get(f.following_id);
      return {
        id: f.following_id,
        name: user?.name || "User",
        username: user?.username || null,
        avatar_url: user?.avatar_url || null,
        bio: user?.bio || null,
        followed_at: f.created_at,
      };
    });

    return res.json(followingWithDetails);
  } catch (error: any) {
    console.error("Unexpected error in getFollowing:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
