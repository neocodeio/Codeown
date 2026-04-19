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

    // Get post/project details for previews
    const postIds = [...new Set(notifications.filter((n: any) => n.post_id).map((n: any) => n.post_id))];
    const projectIds = [...new Set(notifications.filter((n: any) => n.project_id).map((n: any) => n.project_id))];

    const { data: posts } = postIds.length > 0 ? await supabase
      .from("posts")
      .select("id, title, content, images")
      .in("id", postIds) : { data: [] };

    const { data: projects } = projectIds.length > 0 ? await supabase
      .from("projects")
      .select("id, name, description, cover_url")
      .in("id", projectIds) : { data: [] };

    const postMap = new Map((posts || []).map((p: any) => [p.id, p]));
    const projectMap = new Map((projects || []).map((p: any) => [p.id, p]));

    const notificationsWithActors = notifications.map((notif: any) => {
      const actor = userMap.get(notif.actor_id);
      const post = notif.post_id ? postMap.get(notif.post_id) : null;
      const project = notif.project_id ? projectMap.get(notif.project_id) : null;

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
        post: post ? {
          title: post.title,
          content: post.content,
          image: post.images?.[0] || null
        } : null,
        project: project ? {
          name: project.name,
          image: project.cover_url || null
        } : null
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
        .eq("read", false)
        .neq("type", "message");

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
        .eq("id", parseInt(notificationId as string, 10))
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
export async function deleteNotification(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", parseInt(notificationId as string, 10))
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({ error: "Failed to delete notification" });
    }

    return res.json({ message: "Notification deleted" });
  } catch (error: any) {
    console.error("Unexpected error in deleteNotification:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
