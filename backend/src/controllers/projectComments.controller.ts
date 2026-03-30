
import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { notify } from "../services/notification.service.js";

// createProjectCommentNotification is now handled by NotificationService.notify

export async function getProjectComments(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Simplified: fetch all comments for this project in one go
    const { data: allComments, error: commentsError } = await supabase
      .from("project_comments")
      .select("*")
      .eq("project_id", parseInt(id as string));

    if (commentsError) throw commentsError;
    if (!allComments || allComments.length === 0) return res.json([]);

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

    return res.json(commentsWithMeta);
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
        parent_id: parent_id ? parseInt(String(parent_id)) : null
      })
      .select()
      .single();

    if (error) throw error;

    // Update counts
    const { count } = await supabase.from("project_comments").select("*", { count: "exact", head: true }).eq("project_id", id);
    await supabase.from("projects").update({ comment_count: count || 0 }).eq("id", id);

    // Notification Logic with Deduplication
    let parentCommentOwnerId: string | null = null;
    if (parent_id) {
      const { data: pc } = await supabase.from("project_comments").select("user_id").eq("id", parent_id).single();
      parentCommentOwnerId = pc?.user_id || null;
    }

    // 1. Notify parent owner (if it's a reply and not their own comment)
    if (parentCommentOwnerId && parentCommentOwnerId !== userId) {
      try {
        await notify({
          userId: parentCommentOwnerId,
          actorId: userId,
          type: "reply",
          projectId: parseInt(id as string),
          commentId: comment.id
        });
      } catch (err) {
        console.error("Error creating project reply notification:", err);
      }
    }

    // 2. Notify project owner (if not their own project AND they aren't the parent owner who already got a 'reply' notification)
    if (project.user_id !== userId && project.user_id !== parentCommentOwnerId) {
      try {
        await notify({
          userId: String(project.user_id),
          actorId: userId,
          type: "comment",
          projectId: parseInt(id as string),
          commentId: comment.id
        });
      } catch (err) {
        console.error("Error creating project comment notification:", err);
      }
    }

    // 3. Notify mentioned users (if they aren't the actor, project owner, or parent owner)
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
          for (const u of mentionedUsers) {
            if (u.id !== userId && u.id !== project.user_id && u.id !== parentCommentOwnerId) {
              try {
                await notify({
                  userId: u.id,
                  actorId: userId,
                  type: "mention",
                  projectId: parseInt(id as string),
                  commentId: comment.id
                });
              } catch (err) {
                console.error("Error creating project mention notification:", err);
              }
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
