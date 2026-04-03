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
                .eq("type", "profile_view") // Using profile_view for compat; distinguish via project_id
                .eq("project_id", project_id)
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .maybeSingle();

            if (!existingNotif) {
                await supabase.from("notifications").insert({
                    user_id: target_user_id,
                    type: "profile_view", // Using profile_view for compat; distinguish via project_id
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

export async function getWeeklyRecap(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const statsEnd = new Date();
        const statsStart = new Date();
        statsStart.setDate(statsEnd.getDate() - 7);

        const startIso = statsStart.toISOString();

        // 1. Get new followers
        const { count: newFollowers } = await supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", userId)
            .gte("created_at", startIso);

        // 2. Get views this week
        const { count: projectViews } = await supabase
            .from("analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("target_user_id", userId)
            .eq("event_type", "project_view")
            .gte("created_at", startIso);

        const { count: postViews } = await supabase
            .from("analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("target_user_id", userId)
            .eq("event_type", "post_view")
            .gte("created_at", startIso);

        // 3. Get likes received this week
        const [{ data: userPosts }, { data: userProjects }] = await Promise.all([
            supabase.from("posts").select("id").eq("user_id", userId),
            supabase.from("projects").select("id").eq("user_id", userId)
        ]);

        const postIds = userPosts?.map(p => p.id) || [];
        const projectIds = userProjects?.map(p => p.id) || [];

        let newLikes = 0;
        if (postIds.length > 0) {
            const { count } = await supabase
                .from("likes")
                .select("id", { count: "exact", head: true })
                .in("post_id", postIds)
                .gte("created_at", startIso);
            newLikes += (count || 0);
        }
        if (projectIds.length > 0) {
            const { count } = await supabase
                .from("likes")
                .select("id", { count: "exact", head: true })
                .in("project_id", projectIds)
                .gte("created_at", startIso);
            newLikes += (count || 0);
        }

        // 4. Get current streak
        const { data: userData } = await supabase
            .from("users")
            .select("streak_count")
            .eq("id", userId)
            .single();

        return res.json({
            period: {
                start: startIso,
                end: statsEnd.toISOString()
            },
            stats: {
                new_followers: newFollowers || 0,
                project_views: projectViews || 0,
                post_views: postViews || 0,
                new_likes: newLikes,
                streak: userData?.streak_count || 0
            }
        });
    } catch (error) {
        console.error("Error in getWeeklyRecap:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getUserActivityHeatmap(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const startIso = oneYearAgo.toISOString();

        // Fetch multiple types of activity in parallel
        const [postsRes, projectsRes, eventsRes] = await Promise.all([
            supabase.from("posts").select("created_at").eq("user_id", userId).gte("created_at", startIso),
            supabase.from("projects").select("created_at").eq("user_id", userId).gte("created_at", startIso),
            supabase.from("analytics_events").select("created_at").eq("actor_id", userId).gte("created_at", startIso),
        ]);

        const activityMap: Record<string, number> = {};

        const addActivity = (dateStr: string) => {
            const date = new Date(dateStr).toISOString().split('T')[0];
            activityMap[date] = (activityMap[date] || 0) + 1;
        };

        postsRes.data?.forEach(p => addActivity(p.created_at));
        projectsRes.data?.forEach(p => addActivity(p.created_at));
        eventsRes.data?.forEach(e => addActivity(e.created_at));

        // Format for frontend: [{ date: '2023-01-01', count: 5 }, ...]
        const heatmapData = Object.entries(activityMap).map(([date, count]) => ({
            date,
            count
        }));

        return res.json(heatmapData);
    } catch (error) {
        console.error("Error in getUserActivityHeatmap:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
