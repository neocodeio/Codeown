
import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";

// Helper function to create project comment notifications
async function createProjectCommentNotification(
  userId: string,
  type: "comment" | "reply",
  actorId: string,
  projectId: number,
  commentId?: number
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: type,
      actor_id: actorId,
      project_id: projectId,
      comment_id: commentId,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating project comment notification:", error);
  }
}

export async function getProjectComments(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get top-level comments
    const { data: comments, error: commentsError } = await supabase
      .from("project_comments")
      .select("*")
      .eq("project_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (commentsError) throw commentsError;
    if (!comments || comments.length === 0) return res.json([]);

    // Get all nested replies
    const { data: allReplies } = await supabase
      .from("project_comments")
      .select("*")
      .eq("project_id", id)
      .not("parent_id", "is", null);

    const allComments = [...comments, ...(allReplies || [])];
    const userIds = [...new Set(allComments.map((c: any) => c.user_id))];
    
    // Get user data
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .in("id", userIds);
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Get likes
    const allIds = allComments.map((c: any) => c.id);
    const { data: likes } = await supabase
      .from("project_comment_likes")
      .select("comment_id")
      .in("comment_id", allIds);
    
    const likeMap = new Map<number, number>();
    likes?.forEach((l: any) => likeMap.set(l.comment_id, (likeMap.get(l.comment_id) || 0) + 1));

    // Structure data
    const commentsWithMeta = allComments.map(c => ({
      ...c,
      like_count: likeMap.get(c.id) || 0,
      user: userMap.get(c.user_id) || { id: c.user_id, name: "Unknown User" }
    }));

    const topLevel = commentsWithMeta.filter(c => c.parent_id === null);
    const result = topLevel.map(parent => ({
      ...parent,
      children: commentsWithMeta
        .filter(c => c.parent_id === parent.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }));

    return res.json(result);
  } catch (error) {
    console.error("Error in getProjectComments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createProjectComment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const { content, parent_id } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content required" });

    // Verify project
    const { data: project } = await supabase.from("projects").select("user_id").eq("id", id).single();
    if (!project) return res.status(404).json({ error: "Project not found" });

    await ensureUserExists(userId);

    const { data: comment, error } = await supabase
      .from("project_comments")
      .insert({
        project_id: parseInt(id as string),
        user_id: userId,
        content: content.trim(),
        parent_id: parent_id || null
      })
      .select()
      .single();

    if (error) throw error;

    // Update counts
    const { count } = await supabase.from("project_comments").select("*", { count: "exact", head: true }).eq("project_id", id);
    await supabase.from("projects").update({ comment_count: count || 0 }).eq("id", id);

    // Notification
    if (parent_id) {
      const { data: pc } = await supabase.from("project_comments").select("user_id").eq("id", parent_id).single();
      if (pc && pc.user_id !== userId) {
        await createProjectCommentNotification(pc.user_id, "reply", userId, parseInt(id as string), comment.id);
      }
    } else if (project.user_id !== userId) {
      await createProjectCommentNotification(project.user_id, "comment", userId, parseInt(id as string), comment.id);
    }

    // Create notifications for mentioned users (@username)
    try {
      const mentionRegex = /@(\w+(?:\.\w+)*)/g;
      const mentions = content.match(mentionRegex) || [];
      const mentionedUsernames = mentions.map((m: string) => m.substring(1).toLowerCase());

      if (mentionedUsernames.length > 0) {
        const { data: mentionedUsers } = await supabase
          .from("users")
          .select("id")
          .in("username", mentionedUsernames);

        if (mentionedUsers && mentionedUsers.length > 0) {
          const mentionNotifications = mentionedUsers
            .filter((u: any) => u.id !== userId && u.id !== project.user_id)
            .map((u: any) => ({
              user_id: u.id,
              type: "mention",
              actor_id: userId,
              project_id: parseInt(id as string),
              comment_id: comment.id,
              read: false,
            }));

          if (mentionNotifications.length > 0) {
            const { error: mentionNotifError } = await supabase.from("notifications").insert(mentionNotifications);
            if (mentionNotifError) {
              console.error("Error creating project comment mention notifications:", mentionNotifError);
            } else {
              console.log(`Created ${mentionNotifications.length} mention notifications for project comment`);
            }
          }
        }
      }
    } catch (mentionError) {
      console.error("Error processing project comment mentions:", mentionError);
    }

    // Refresh return
    const { data: user } = await supabase.from("users").select("id, name, avatar_url, username").eq("id", userId).single();
    const fullComment = { ...comment, user: user || { id: userId, name: "User" } };

    // Emit real-time update
    const { emitUpdate } = await import("../lib/socket.js");
    emitUpdate("project_commented", { projectId: parseInt(id as string), comment: fullComment, commentCount: count || 0 });

    return res.status(201).json(fullComment);
  } catch (error) {
    console.error("Error in createProjectComment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProjectComment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { commentId } = req.params;
    const { content } = req.body;

    const { data: comment, error } = await supabase
      .from("project_comments")
      .update({ content: content?.trim() })
      .eq("id", commentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return res.status(404).json({ error: "Not found or unauthorized" });
    const { data: user } = await supabase.from("users").select("id, name, avatar_url, username").eq("id", userId).single();
    return res.json({ ...comment, user: user || { id: userId, name: "User" } });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteProjectComment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { commentId } = req.params;

    const { data: comment } = await supabase.from("project_comments").select("project_id").eq("id", commentId).eq("user_id", userId).single();
    if (!comment) return res.status(404).json({ error: "Not found" });

    await supabase.from("project_comments").delete().eq("id", commentId);

    const { count } = await supabase.from("project_comments").select("*", { count: "exact", head: true }).eq("project_id", comment.project_id);
    await supabase.from("projects").update({ comment_count: count || 0 }).eq("id", comment.project_id);

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
