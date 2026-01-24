import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getNotifications(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { page = "1", limit = "20", unreadOnly = "false" } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (unreadOnly === "true") {
      query = query.eq("read", false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    if (!notifications || notifications.length === 0) {
      return res.json({ notifications: [], total: 0, unreadCount: 0, page: pageNum, limit: limitNum });
    }

    // Get actor user data
    const actorIds = [...new Set(notifications.map((n: any) => n.actor_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, avatar_url")
      .in("id", actorIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Fetch missing users from Clerk
    const missingIds = actorIds.filter((id: string) => !userMap.has(id));
    if (missingIds.length > 0 && process.env.CLERK_SECRET_KEY) {
      for (const actorId of missingIds) {
        try {
          const clerkUser = await clerkClient.users.getUser(actorId);
          let userName: string | null = null;
          if (clerkUser.firstName && clerkUser.lastName) {
            userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
          } else if (clerkUser.firstName) {
            userName = clerkUser.firstName;
          } else if (clerkUser.username) {
            userName = clerkUser.username;
          }

          userMap.set(actorId, {
            id: actorId,
            name: userName || "User",
            username: clerkUser.username || null,
            avatar_url: clerkUser.imageUrl || null,
          });
        } catch (error) {
          console.error(`Error fetching user ${actorId} from Clerk:`, error);
        }
      }
    }

    const notificationsWithActors = notifications.map((notif: any) => {
      const actor = userMap.get(notif.actor_id);
      return {
        ...notif,
        actor: actor ? {
          id: actor.id,
          name: actor.name || "User",
          username: actor.username || null,
          avatar_url: actor.avatar_url || null,
        } : {
          id: notif.actor_id,
          name: "User",
          username: null,
          avatar_url: null,
        },
      };
    });

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    return res.json({
      notifications: notificationsWithActors,
      total: count || 0,
      unreadCount: unreadCount || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in getNotifications:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    if (notificationId === "all") {
      // Mark all as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({ error: "Failed to mark notifications as read" });
      }

      return res.json({ message: "All notifications marked as read" });
    } else {
      // Mark single notification as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", parseInt(notificationId, 10))
        .eq("user_id", userId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ error: "Failed to mark notification as read" });
      }

      return res.json({ message: "Notification marked as read" });
    }
  } catch (error: any) {
    console.error("Unexpected error in markNotificationRead:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      return res.json({ count: 0 });
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("DEBUG: Supabase Unread Count Error:", JSON.stringify(error, null, 2));
      console.error("Error getting unread count:", error);
      return res.status(500).json({ error: "Failed to get unread count" });
    }

    return res.json({ count: count || 0 });
  } catch (error: any) {
    console.error("Unexpected error in getUnreadCount:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
