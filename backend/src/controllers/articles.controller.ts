import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { emitUpdate } from "../lib/socket.js";

export async function getArticles(req: Request, res: Response) {
  try {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!articles || articles.length === 0) return res.json([]);

    // Manual join: Fetch users for these articles
    const userIds = [...new Set(articles.map(a => a.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, avatar_url, is_pro, is_og")
      .in("id", userIds);

    const userMap = new Map(users?.map(u => [u.id, u]) || []);
    
    const articlesWithUsers = articles.map(article => ({
      ...article,
      users: userMap.get(article.user_id) || { name: "User", avatar_url: null, username: "user" }
    }));

    return res.json(articlesWithUsers);
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getArticle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: article, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!article) return res.status(404).json({ error: "Article not found" });

    // Manual join: Fetch user
    const { data: user } = await supabase
      .from("users")
      .select("id, name, username, avatar_url, is_pro, is_og")
      .eq("id", article.user_id)
      .single();

    // Get counts
    const [likesCount, savesCount, commentsCount] = await Promise.all([
      supabase.from("article_likes").select("*", { count: "exact", head: true }).eq("article_id", id),
      supabase.from("article_saves").select("*", { count: "exact", head: true }).eq("article_id", id),
      supabase.from("article_comments").select("*", { count: "exact", head: true }).eq("article_id", id)
    ]);

    return res.json({
      ...article,
      users: user || { name: "User", avatar_url: null, username: "user" },
      likes_count: likesCount.count || 0,
      saves_count: savesCount.count || 0,
      comments_count: commentsCount.count || 0
    });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function createArticle(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, subtitle, content, cover_image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: "Content must be less than 5000 characters" });
    }

    await ensureUserExists(userId);

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        user_id: userId,
        title,
        subtitle,
        content,
        cover_image
      })
      .select()
      .single();

    if (error) throw error;

    emitUpdate("article_created", article);
    return res.status(201).json(article);
  } catch (error: any) {
    console.error("Error creating article:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function toggleArticleLike(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: existing } = await supabase
      .from("article_likes")
      .select("*")
      .eq("user_id", userId)
      .eq("article_id", id)
      .single();

    if (existing) {
      await supabase
        .from("article_likes")
        .delete()
        .eq("user_id", userId)
        .eq("article_id", id);
      return res.json({ liked: false });
    } else {
      await supabase
        .from("article_likes")
        .insert({ user_id: userId, article_id: id });
    }

    // Get fresh count
    const { count } = await supabase
      .from("article_likes")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);
    
    const liked = !existing;
    emitUpdate("article_like", { id, likes_count: count || 0, liked, userId });

    return res.json({ liked, likes_count: count || 0 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function toggleArticleSave(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: existing } = await supabase
      .from("article_saves")
      .select("*")
      .eq("user_id", userId)
      .eq("article_id", id)
      .single();

    if (existing) {
      await supabase
        .from("article_saves")
        .delete()
        .eq("user_id", userId)
        .eq("article_id", id);
      return res.json({ saved: false });
    } else {
      await supabase
        .from("article_saves")
        .insert({ user_id: userId, article_id: id });
      return res.json({ saved: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getArticleComments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: comments, error } = await supabase
      .from("article_comments")
      .select("*")
      .eq("article_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!comments || comments.length === 0) return res.json([]);

    // Manual join for comments
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, avatar_url, is_pro, is_og")
      .in("id", userIds);

    const userMap = new Map(users?.map(u => [u.id, u]) || []);
    
    const commentsWithUsers = comments.map(comment => ({
      ...comment,
      users: userMap.get(comment.user_id) || { name: "User", avatar_url: null, username: "user" }
    }));

    return res.json(commentsWithUsers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createArticleComment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!userId || !content) return res.status(400).json({ error: "Missing required fields" });

    await ensureUserExists(userId);

    const { data: comment, error } = await supabase
      .from("article_comments")
      .insert({
        user_id: userId,
        article_id: id,
        content,
        parent_id
      })
      .select()
      .single();

    if (error) throw error;

    // Manual join for the new comment
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, username, avatar_url, is_pro, is_og")
      .eq("id", userId)
      .single();

    const response = {
      ...comment,
      users: userData || { name: "User", avatar_url: null, username: "user" }
    };

    emitUpdate("article_comment", { article_id: id, comment: response });

    return res.status(201).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteArticle(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Verify ownership
    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!article) return res.status(404).json({ error: "Article not found" });

    if (article.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this article" });
    }

    // Delete related items first (optional if cascade is on, but safe)
    await Promise.all([
      supabase.from("article_likes").delete().eq("article_id", id),
      supabase.from("article_saves").delete().eq("article_id", id),
      supabase.from("article_comments").delete().eq("article_id", id)
    ]);

    const { error: deleteError } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    emitUpdate("article_deleted", { id });

    return res.json({ message: "Article deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting article:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteArticleComment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { id, commentId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: comment, error: fetchError } = await supabase
      .from("article_comments")
      .select("user_id")
      .eq("id", commentId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this comment" });
    }

    const { error: deleteError } = await supabase
      .from("article_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) throw deleteError;

    emitUpdate("article_comment_deleted", { article_id: id, commentId });

    return res.json({ message: "Comment deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function toggleArticleCommentLike(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    const { commentId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: existing } = await supabase
      .from("article_comment_likes")
      .select("*")
      .eq("user_id", userId)
      .eq("comment_id", commentId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("article_comment_likes")
        .delete()
        .eq("id", existing.id);
    } else {
      await supabase
        .from("article_comment_likes")
        .insert({ user_id: userId, comment_id: commentId });
    }

    const { count } = await supabase
      .from("article_comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    emitUpdate("article_comment_like", { commentId, likes_count: count || 0 });

    return res.json({ liked: !existing, likes_count: count || 0 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
