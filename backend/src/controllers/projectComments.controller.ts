import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

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
    
    // Get top-level comments (no parent_id)
    const { data: comments, error: commentsError } = await supabase
      .from("project_comments")
      .select("*")
      .eq("project_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching project comments:", commentsError);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }

    if (!comments || comments.length === 0) {
      return res.json([]);
    }

    // Get user data for all comments
    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .in("id", userIds);

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        // Get replies for this comment
        const { data: replies, error: repliesError } = await supabase
          .from("project_comments")
          .select("*")
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true });

        if (repliesError) {
          console.error("Error fetching replies:", repliesError);
          return { ...comment, children: [] };
        }

        // Get user data for replies
        const replyUserIds = [...new Set((replies || []).map((r: any) => r.user_id))];
        const { data: replyUsers } = await supabase
          .from("users")
          .select("id, name, email, avatar_url, username")
          .in("id", replyUserIds);

        const replyUserMap = new Map((replyUsers || []).map((u: any) => [u.id, u]));

        const repliesWithUsers = (replies || []).map((reply: any) => ({
          ...reply,
          user: replyUserMap.get(reply.user_id) || { 
            id: reply.user_id, 
            name: "Unknown User", 
            email: null, 
            avatar_url: null, 
            username: null 
          }
        }));

        return {
          ...comment,
          user: userMap.get(comment.user_id) || { 
            id: comment.user_id, 
            name: "Unknown User", 
            email: null, 
            avatar_url: null, 
            username: null 
          },
          children: repliesWithUsers
        };
      })
    );

    return res.json(commentsWithReplies);
  } catch (error) {
    console.error("Error in getProjectComments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createProjectComment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // If parent_id is provided, check if parent comment exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from("project_comments")
        .select("*")
        .eq("id", parent_id)
        .eq("project_id", id)
        .single();

      if (parentError || !parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    // Ensure user exists
    await ensureUserExists(userId);

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("project_comments")
      .insert({
        project_id: parseInt(id as string),
        user_id: userId,
        content: content.trim(),
        parent_id: parent_id || null,
        like_count: 0
      })
      .select()
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return res.status(500).json({ error: "Failed to create comment" });
    }

    // Update project comment count
    const { data: allComments } = await supabase
      .from("project_comments")
      .select("id")
      .eq("project_id", id);

    const commentCount = allComments?.length || 0;

    await supabase
      .from("projects")
      .update({ comment_count: commentCount })
      .eq("id", id);

    // Create notifications
    if (parent_id) {
      // This is a reply - notify parent comment author
      const { data: parentComment } = await supabase
        .from("project_comments")
        .select("user_id")
        .eq("id", parent_id)
        .single();
      
      if (parentComment && parentComment.user_id !== userId) {
        await createProjectCommentNotification(parentComment.user_id, "reply", userId, parseInt(id as string), comment.id);
      }
    } else {
      // This is a new comment - notify project owner
      if (project.user_id !== userId) {
        await createProjectCommentNotification(project.user_id, "comment", userId, parseInt(id as string), comment.id);
      }
    }

    // Get user data for response
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .eq("id", userId)
      .single();

    return res.status(201).json({
      ...comment,
      user: user || { id: userId, name: "Unknown User", email: null, avatar_url: null, username: null }
    });
  } catch (error) {
    console.error("Error in createProjectComment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProjectComment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { commentId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Check if comment exists and user owns it
    const { data: existingComment, error: fetchError } = await supabase
      .from("project_comments")
      .select("*")
      .eq("id", commentId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingComment) {
      return res.status(404).json({ error: "Comment not found or access denied" });
    }

    // Update comment
    const { data: comment, error: updateError } = await supabase
      .from("project_comments")
      .update({
        content: content.trim()
      })
      .eq("id", commentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating comment:", updateError);
      return res.status(500).json({ error: "Failed to update comment" });
    }

    // Get user data for response
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, username")
      .eq("id", userId)
      .single();

    return res.json({
      ...comment,
      user: user || { id: userId, name: "Unknown User", email: null, avatar_url: null, username: null }
    });
  } catch (error) {
    console.error("Error in updateProjectComment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteProjectComment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    const { commentId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if comment exists and user owns it
    const { data: existingComment, error: fetchError } = await supabase
      .from("project_comments")
      .select("*")
      .eq("id", commentId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingComment) {
      return res.status(404).json({ error: "Comment not found or access denied" });
    }

    // Delete comment (cascade will delete replies)
    const { error: deleteError } = await supabase
      .from("project_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return res.status(500).json({ error: "Failed to delete comment" });
    }

    // Update project comment count
    const { data: allComments } = await supabase
      .from("project_comments")
      .select("id")
      .eq("project_id", existingComment.project_id);

    const commentCount = allComments?.length || 0;

    await supabase
      .from("projects")
      .update({ comment_count: commentCount })
      .eq("id", existingComment.project_id);

    return res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProjectComment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
