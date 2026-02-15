import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function recordProfileView(req: Request, res: Response) {
    try {
        const user = req.user;
        const actorId = user?.sub || user?.id; // Clerk verified tokens use 'sub' for userId
        const { userId: targetUserId } = req.params;

        if (!actorId) {
            console.warn("Profile View Attempt: No actorId found in request");
            return res.status(401).json({ error: "User ID not found" });
        }

        if (!targetUserId) {
            return res.status(400).json({ error: "Target user ID is required" });
        }

        // Don't notify if viewing own profile
        if (actorId === targetUserId) {
            return res.status(200).json({ message: "Self view recorded (no notification)" });
        }

        // Check if a notification for this pair was sent recently (e.g., last 24 hours)
        // This prevents spamming notifications if a user refreshes or revisits quickly
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: recentNotification, error: checkError } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("actor_id", actorId)
            .eq("type", "profile_view")
            .gt("created_at", twentyFourHoursAgo)
            .maybeSingle();

        if (checkError) {
            console.error("Error checking recent profile view notification:", checkError);
        }

        if (recentNotification) {
            return res.status(200).json({ message: "Notification already sent recently" });
        }

        // Create the notification
        const { error: insertError } = await supabase
            .from("notifications")
            .insert({
                user_id: targetUserId,
                actor_id: actorId,
                type: "profile_view",
                read: false,
            });

        if (insertError) {
            console.error("Error creating profile view notification:", insertError);
            return res.status(500).json({ error: "Failed to record profile view" });
        }

        return res.status(200).json({ message: "Profile view notification sent" });
    } catch (error: any) {
        console.error("Unexpected error in recordProfileView:", error);
        return res.status(500).json({ error: "Internal server error", details: error?.message });
    }
}
