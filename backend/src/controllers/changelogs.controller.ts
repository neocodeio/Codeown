import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function getChangelogs(req: Request, res: Response) {
    try {
        const { data, error } = await supabase
            .from("changelogs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching changelogs:", error);
            return res.status(500).json({ error: "Failed to fetch changelogs" });
        }

        return res.json(data || []);
    } catch (error) {
        console.error("Unexpected error in getChangelogs:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function createChangelog(req: Request, res: Response) {
    try {
        const user = req.user;
        const userId = user?.sub || user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Check if user is amin.ceo or matches CEO_CLERK_ID
        const ceoId = process.env.CEO_CLERK_ID;
        const isCeoById = ceoId && userId === ceoId;

        const { data: userData } = await supabase
            .from("users")
            .select("username")
            .eq("id", userId)
            .single();

        const isCeoByUsername = userData?.username?.toLowerCase() === "amin.ceo";

        if (!isCeoById && !isCeoByUsername) {
            return res.status(403).json({ error: "Only amin.ceo can post changelogs" });
        }

        const { version, content } = req.body;

        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        const { data, error } = await supabase
            .from("changelogs")
            .insert([
                {
                    version: version || "v1.0.0",
                    content,
                    user_id: userId
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating changelog:", error);
            return res.status(500).json({ error: "Failed to create changelog" });
        }

        return res.status(201).json(data);
    } catch (error) {
        console.error("Unexpected error in createChangelog:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
