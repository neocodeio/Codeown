import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function trackEvent(req: Request, res: Response) {
    try {
        const { event_type, target_user_id, project_id, post_id } = req.body;
        const actor_id = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

        if (!event_type) {
            return res.status(400).json({ error: "Event type is required" });
        }

        const { error } = await supabase.from("analytics_events").insert({
            event_type,
            actor_id: actor_id || null,
            target_user_id: target_user_id || null,
            project_id: project_id || null,
            post_id: post_id || null,
        });

        if (error) {
            console.error("Error tracking event:", error);
            // Non-blocking error for tracking
        }

        // Project view notification logic
        if (event_type === 'project_view' && actor_id && target_user_id && actor_id !== target_user_id) {
            // Check to avoid spamming view notifications within a 24h window
            const { data: existingNotif } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", target_user_id)
                .eq("actor_id", actor_id)
                .eq("type", "project_view")
                .eq("project_id", project_id)
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .maybeSingle();

            if (!existingNotif) {
                await supabase.from("notifications").insert({
                    user_id: target_user_id,
                    type: "project_view",
                    actor_id: actor_id,
                    project_id: project_id,
                    read: false,
                    created_at: new Date().toISOString(),
                });
            }
        }

        return res.status(204).send();
    } catch (error) {
        console.error("Unexpected error in trackEvent:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getAnalytics(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Check if user is pro
        const { data: user } = await supabase.from("users").select("is_pro").eq("id", userId).single();
        if (!user?.is_pro) {
            return res.status(403).json({ error: "Analytics is a Pro feature" });
        }

        // Fetch analytics summary
        const [viewsRes, postViewsRes, clicksRes, recentRes] = await Promise.all([
            // Project views count
            supabase.from("analytics_events").select("id", { count: "exact" }).eq("target_user_id", userId).eq("event_type", "project_view"),
            // Post views count
            supabase.from("analytics_events").select("id", { count: "exact" }).eq("target_user_id", userId).eq("event_type", "post_view"),
            // Opportunity clicks count
            supabase.from("analytics_events").select("id", { count: "exact" }).eq("target_user_id", userId).eq("event_type", "opportunity_click"),
            // Recent visitors (last 30 days)
            supabase.from("analytics_events")
                .select("created_at, event_type, project:projects(title), actor:users!actor_id(name, username, avatar_url)")
                .eq("target_user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20)
        ]);

        return res.json({
            summary: {
                total_project_views: viewsRes.count || 0,
                total_post_views: postViewsRes.count || 0,
                total_opportunity_clicks: clicksRes.count || 0,
            },
            recent_events: recentRes.data || []
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
