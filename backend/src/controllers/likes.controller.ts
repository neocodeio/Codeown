
import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { notify } from "../services/notification.service.js";
import { GamificationService } from "../services/gamification.service.js";

export async function likePost(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const postIdNum = parseInt(postId, 10);
    if (isNaN(postIdNum)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", userId)
      .eq("post_id", postIdNum)
      .is("comment_id", null)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking like:", checkError);
      return res.status(500).json({ error: "Failed to check like status" });
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postIdNum)
        .is("comment_id", null);

      if (deleteError) {
        console.error("Error unliking:", deleteError);
        return res.status(500).json({ error: "Failed to remove like" });
      }

      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postIdNum);

      const updatedCount = count || 0;

      // Sync denormalized count
      await supabase.from("posts").update({ like_count: updatedCount }).eq("id", postIdNum);

      // Emit real-time update
      const { emitUpdate } = await import("../lib/socket.js");
      emitUpdate("post_liked", { id: postIdNum, likeCount: updatedCount });

      return res.json({ liked: false, likeCount: updatedCount });
    } else {
      const { error: insertError } = await supabase
        .from("likes")
        .insert({ user_id: userId, post_id: postIdNum });

      if (insertError) {
        console.error("Error inserting like:", insertError);
        return res.status(500).json({ error: "Failed to add like", details: insertError.message });
      }

      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postIdNum)
        .single();

      if (post && post.user_id !== userId) {
        try {
          await notify({
            userId: post.user_id,
            actorId: userId,
            type: "like",
            postId: postIdNum
          });
        } catch (notifErr) {
          console.error("Error creating like notification:", notifErr);
        }

        // Award XP to post author (non-blocking)
        GamificationService.awardXP(post.user_id, 'like', postId);
      }

      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postIdNum);

      const updatedCount = count || 0;

      // Sync denormalized count
      await supabase.from("posts").update({ like_count: updatedCount }).eq("id", postIdNum);

      // Emit real-time update
      const { emitUpdate } = await import("../lib/socket.js");
      emitUpdate("post_liked", { id: postIdNum, likeCount: updatedCount });

      return res.json({ liked: true, likeCount: updatedCount });
    }
  } catch (error: any) {
    console.error("Unexpected error in likePost:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getPostLikes(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const postIdNum = parseInt(postId, 10);
    if (isNaN(postIdNum)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postIdNum)
      .is("comment_id", null);

    let isLiked = false;
    if (userId) {
      const { data: userLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", userId)
        .eq("post_id", postIdNum)
        .is("comment_id", null)
        .maybeSingle();
      isLiked = !!userLike;
    }

    return res.json({ count: count || 0, isLiked });
  } catch (error: any) {
    console.error("Error in getPostLikes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function likeComment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { commentId: rawCommentId } = req.params;
    const { type } = req.query;

    if (!userId) return res.status(401).json({ error: "User ID not found" });
    if (!rawCommentId) return res.status(400).json({ error: "Comment ID is required" });

    const isNumeric = /^\d+$/.test(rawCommentId);
    if (!isNumeric) return res.status(400).json({ error: "Invalid comment ID" });
    const commentId = parseInt(rawCommentId, 10);

    // Determine context (Project or Post)
    let actualType: 'post' | 'project' = type === 'project' ? 'project' : type === 'post' ? 'post' : 'post';

    // Auto-resolve if type is not provided
    if (!type) {
      const { data: pc } = await supabase.from("comments").select("id").eq("id", commentId).maybeSingle();
      if (!pc) {
        const { data: prc } = await supabase.from("project_comments").select("id").eq("id", commentId).maybeSingle();
        if (prc) actualType = 'project';
      }
    }

    const likesTable = actualType === 'project' ? "project_comment_likes" : "likes";
    const commentsTable = actualType === 'project' ? "project_comments" : "comments";

    // Toggle logic
    const { data: existingLike } = await supabase
      .from(likesTable)
      .select("*")
      .eq("user_id", userId)
      .eq("comment_id", commentId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from(likesTable).delete().eq("user_id", userId).eq("comment_id", commentId);
      const { count } = await supabase.from(likesTable).select("*", { count: "exact", head: true }).eq("comment_id", commentId);
      const newCount = count || 0;
      await supabase.from(commentsTable).update({ like_count: newCount } as any).eq("id", commentId);

      // Emit real-time update
      const { emitUpdate } = await import("../lib/socket.js");
      emitUpdate("comment_liked", { id: commentId, likeCount: newCount, type: actualType });

      return res.json({ liked: false, likeCount: newCount });
    } else {
      await supabase.from(likesTable).insert({ user_id: userId, comment_id: commentId });

      // Notification & XP
      try {
        const { data: c } = await supabase.from(commentsTable).select("user_id, " + (actualType === 'project' ? 'project_id' : 'post_id')).eq("id", commentId).single();
        if (c && (c as any).user_id !== userId) {
          // 1. Notify
          await notify({
            userId: (c as any).user_id,
            actorId: userId,
            type: "like",
            commentId: commentId,
            projectId: actualType === 'project' ? (c as any).project_id : undefined,
            postId: actualType === 'post' ? (c as any).post_id : undefined
          });

          // 2. Award XP
          GamificationService.awardXP((c as any).user_id, 'like', String(commentId));
        }
      } catch (e) {
        console.error("Error in likeComment notification/xp logic:", e);
      }

      const { count } = await supabase.from(likesTable).select("*", { count: "exact", head: true }).eq("comment_id", commentId);
      const newCount = count || 0;
      await supabase.from(commentsTable).update({ like_count: newCount } as any).eq("id", commentId);

      // Emit real-time update
      const { emitUpdate } = await import("../lib/socket.js");
      emitUpdate("comment_liked", { id: commentId, likeCount: newCount, type: actualType });

      return res.json({ liked: true, likeCount: newCount });
    }
  } catch (error: any) {
    console.error("Error in likeComment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getCommentLikes(req: Request, res: Response) {
  try {
    const { commentId: rawCommentId } = req.params;
    const { type } = req.query;
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

    if (!rawCommentId) return res.status(400).json({ error: "Comment ID is required" });
    const commentId = parseInt(rawCommentId, 10);

    let isProject = type === 'project';
    if (!type) {
      const { data } = await supabase.from("project_comments").select("id").eq("id", commentId).maybeSingle();
      if (data) isProject = true;
    }

    const targetTable = isProject ? "project_comment_likes" : "likes";

    const { count } = await supabase
      .from(targetTable)
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    let isLiked = false;
    if (userId) {
      const { data: userLike } = await supabase
        .from(targetTable)
        .select("id")
        .eq("user_id", userId)
        .eq("comment_id", commentId)
        .maybeSingle();
      isLiked = !!userLike;
    }

    return res.json({ count: count || 0, isLiked });
  } catch (error: any) {
    console.error("Error in getCommentLikes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserLikes(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const { data: posts } = await supabase.from("posts").select("id").eq("user_id", userId);
    const postIds = (posts || []).map((p: any) => p.id);

    if (postIds.length === 0) return res.json({ totalLikes: 0 });

    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .in("post_id", postIds);

    return res.json({ totalLikes: count || 0 });
  } catch (error: any) {
    console.error("Error in getUserLikes:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
