import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

/**
 * GET /projects/:id/analytics
 * Returns a full analytics dashboard for a project (owner-only).
 */
export async function getProjectAnalytics(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!id) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const projectIdInt = parseInt(id);

        // 1. Verify project exists and current user is the owner
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, user_id, title, like_count, comment_count, view_count, created_at, looking_for_contributors")
            .eq("id", id)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (project.user_id !== userId) {
            return res.status(403).json({ error: "Only the project owner can view analytics" });
        }

        // 2. Date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const prevThirtyDaysStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

        // 3. Fetch all analytics data in parallel
        const responses = await Promise.all([
            // Views last 30 days [0]
            supabase
                .from("analytics_events")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectIdInt)
                .eq("event_type", "project_view")
                .gte("created_at", thirtyDaysAgo),

            // Views previous 30 days [1]
            supabase
                .from("analytics_events")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectIdInt)
                .eq("event_type", "project_view")
                .gte("created_at", prevThirtyDaysStart)
                .lt("created_at", thirtyDaysAgo),

            // Views timeline [2]
            supabase
                .from("analytics_events")
                .select("created_at")
                .eq("project_id", projectIdInt)
                .eq("event_type", "project_view")
                .gte("created_at", thirtyDaysAgo)
                .order("created_at", { ascending: true }),

            // Likes last 30 days [3]
            supabase
                .from("project_likes")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectIdInt)
                .gte("created_at", thirtyDaysAgo),

            // Comments last 30 days [4]
            supabase
                .from("project_comments")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectIdInt)
                .gte("created_at", thirtyDaysAgo),

            // Total saves [5]
            supabase
                .from("project_saves")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectIdInt),

            // Saves last 30 days [6]
            supabase
                .from("project_saves")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectIdInt)
                .gte("created_at", thirtyDaysAgo),

            // Co-founder requests [7]
            supabase
                .from("cofounder_requests")
                .select("id, created_at", { count: "exact" })
                .eq("project_id", projectIdInt),

            // Ratings [8]
            supabase
                .from("project_ratings")
                .select("rating")
                .eq("project_id", projectIdInt),
        ]);

        const [
            viewsLast30Res,
            viewsPrev30Res,
            viewsTimelineRes,
            likesLast30Res,
            commentsLast30Res,
            savesCountRes,
            savesLast30Res,
            cofounderRequestsRes,
            ratingRes,
        ] = responses as any[];

        // Log any errors for debugging
        responses.forEach((res, i) => {
            if (res.error) console.warn(`Analytics sub-query ${i} failed:`, res.error.message);
        });

        // 4. Process views timeline
        const viewsByDay: any = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split("T")[0];
            viewsByDay[key] = 0;
        }
        (viewsTimelineRes.data || []).forEach((ev: any) => {
            if (ev.created_at) {
                const day = new Date(ev.created_at).toISOString().split("T")[0];
                if (viewsByDay[day] !== undefined) {
                    viewsByDay[day]++;
                }
            }
        });

        const viewsTimeline = Object.entries(viewsByDay).map(([date, count]) => ({
            date,
            views: count,
        }));

        // 5. Calculate metrics
        const totalViews = (project as any).view_count || 0;
        const viewsLast30 = (viewsLast30Res as any).count || 0;
        const viewsPrev30 = (viewsPrev30Res as any).count || 0;
        const viewsGrowth = viewsPrev30 > 0 ? Math.round(((viewsLast30 - viewsPrev30) / viewsPrev30) * 100) : (viewsLast30 > 0 ? 100 : 0);

        const likesLast30 = (likesLast30Res as any).count || 0;
        const commentsLast30 = (commentsLast30Res as any).count || 0;
        const totalSaves = (savesCountRes as any).count || 0;
        const savesLast30 = (savesLast30Res as any).count || 0;


        const engagementRate = viewsLast30 > 0
            ? Math.round(((likesLast30 + commentsLast30 + savesLast30) / viewsLast30) * 100 * 10) / 10
            : 0;

        const saveRate = totalViews > 0
            ? Math.round((totalSaves / totalViews) * 100 * 10) / 10
            : 0;

        const contributorInterest = cofounderRequestsRes.count || 0;
        const ratingsData = ratingRes.data || [];
        const avgRating = ratingsData.length > 0
            ? Math.round((ratingsData.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ratingsData.length) * 10) / 10
            : 0;

        // 6. Traction Score
        const viewsScore = Math.min(100, (totalViews / 1000) * 100);
        const engScore = Math.min(100, (engagementRate / 50) * 100);
        const likesScore = Math.min(100, ((project.like_count || 0) / 100) * 100);
        const savesScore = Math.min(100, (totalSaves / 50) * 100);

        const projectCreatedAt = project.created_at ? new Date(project.created_at) : new Date();
        const daysSinceCreation = Math.max(1, (now.getTime() - projectCreatedAt.getTime()) / (24 * 60 * 60 * 1000));
        const recencyScore = Math.min(100, (viewsLast30 / Math.max(1, daysSinceCreation)) * 30);
        const ratingScore = (avgRating / 5) * 100;

        const tractionScore = Math.round(
            (viewsScore || 0) * 0.30 +
            (engScore || 0) * 0.20 +
            (likesScore || 0) * 0.15 +
            (savesScore || 0) * 0.15 +
            (recencyScore || 0) * 0.10 +
            (ratingScore || 0) * 0.10
        ) || 0;

        // 7. Recent activity
        const { data: recentActivity } = await supabase
            .from("analytics_events")
            .select("created_at, event_type, actor:users!actor_id(name, username, avatar_url)")
            .eq("project_id", projectIdInt)
            .order("created_at", { ascending: false })
            .limit(15);

        return res.json({
            project: { id: project.id, title: project.title, created_at: project.created_at },
            overview: {
                total_views: totalViews,
                views_last_30: viewsLast30,
                views_growth: viewsGrowth,
                total_likes: project.like_count || 0,
                likes_last_30: likesLast30,
                total_comments: project.comment_count || 0,
                comments_last_30: commentsLast30,
                total_saves: totalSaves,
                saves_last_30: savesLast30,
                save_rate: saveRate,
                engagement_rate: engagementRate,
                contributor_interest: contributorInterest,
                avg_rating: avgRating,
                rating_count: ratingsData.length,
                traction_score: Math.min(100, tractionScore),
            },
            views_timeline: viewsTimeline,
            recent_activity: (recentActivity || []).map((ev: any) => ({
                ...ev,
                actor: Array.isArray(ev.actor) ? ev.actor[0] : ev.actor,
            })),
        });
    } catch (error: any) {
        console.error("CRITICAL ERROR in getProjectAnalytics:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error?.message
        });
    }
}
