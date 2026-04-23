import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { formatPostData } from "./posts.controller.js";
import { emitUpdate } from "../lib/socket.js";

export async function toggleRepost(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const userId = user?.sub || user?.id || user?.userId;
        const { postId } = req.body;

        if (!userId || !postId) {
            return res.status(400).json({ error: "User ID and Post ID are required" });
        }

        // Check if already reposted
        const { data: existing } = await supabase
            .from("reposts")
            .select("id")
            .eq("user_id", userId)
            .eq("post_id", postId)
            .maybeSingle();

        if (existing) {
            // Remove repost (toggle off)
            const { error: deleteError } = await supabase
                .from("reposts")
                .delete()
                .eq("id", existing.id);

            if (deleteError) throw deleteError;

            // Fetch the original post to emit an update after removal
            const { data: rawPost } = await supabase
                .from("posts")
                .select(`
                  *,
                  user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro, is_og)
                `)
                .eq("id", postId)
                .single();

            if (rawPost) {
                emitUpdate("post_reposted", {
                    ...formatPostData(rawPost),
                    reposter_id: userId,
                    removed: true
                });
            }

            return res.json({ message: "Repost removed", action: "removed" });
        } else {
            // Create repost
            const { error: insertError } = await supabase
                .from("reposts")
                .insert({ user_id: userId, post_id: postId })
                .select()
                .single();

            if (insertError) throw insertError;

            // Fetch the original post to emit an update
            const { data: rawPost } = await supabase
                .from("posts")
                .select(`
          *,
          user:users!posts_user_id_fkey(id, name, avatar_url, username, is_hirable, is_pro, is_og)
        `)
                .eq("id", postId)
                .single();

            if (rawPost) {
                emitUpdate("post_reposted", {
                    ...formatPostData(rawPost),
                    reposter_id: userId
                });
            }

            return res.json({ message: "Post reposted", action: "reposted" });
        }
    } catch (error: any) {
        console.error("Error in toggleRepost:", error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
}
