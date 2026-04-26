import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getArticles(req: Request, res: Response) {
  try {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*, users!inner(name, username, avatar_url, is_pro, is_og)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json(articles || []);
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
      .select("*, users!inner(name, username, avatar_url, is_pro, is_og)")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Get counts
    const { count: likesCount } = await supabase
      .from("article_likes")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);

    const { count: savesCount } = await supabase
      .from("article_saves")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);

    const { count: commentsCount } = await supabase
      .from("article_comments")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);

    return res.json({
      ...article,
      likes_count: likesCount || 0,
      saves_count: savesCount || 0,
      comments_count: commentsCount || 0
    });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function createArticle(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
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
    return res.status(201).json(article);
  } catch (error: any) {
    console.error("Error creating article:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function toggleArticleLike(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
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
      return res.json({ liked: true });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function toggleArticleSave(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
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

// Comments for Articles
export async function getArticleComments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data: comments, error } = await supabase
      .from("article_comments")
      .select("*, users(name, username, avatar_url, is_pro, is_og)")
      .eq("article_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json(comments || []);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createArticleComment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
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
      .select("*, users(name, username, avatar_url, is_pro, is_og)")
      .single();

    if (error) throw error;
    return res.status(201).json(comment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
