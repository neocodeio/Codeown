import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    is_pro: boolean;
    last_active_at: string;
    pulse_score: number;
    tier: string;
    engagement: {
        likes: number;
        views: number;
        comments: number;
    };
    latest_project: any;
}

export async function getLeaderboard(req: Request, res: Response) {
    try {
        // Fetch all users with basic info
        const { data: users, error: usersError } = await supabase
            .from("users")
            .select("id, name, username, avatar_url, streak_count, is_pro, is_og, last_active_at")
            .limit(100);

        if (usersError) throw usersError;

        // Fetch aggregation for likes and views per user
        // Note: For large datasets, this should be a materialized view or cached table
        const [postsData, projectsData] = await Promise.all([
            supabase.from("posts").select("user_id, like_count, view_count, comment_count"),
            supabase.from("projects").select("user_id, like_count, view_count, comment_count, title, cover_image, id")
        ]);

        const statsMap: Record<string, { likes: number; views: number; comments: number; latestProject?: any }> = {};

        // Aggregate post stats
        postsData.data?.forEach(post => {
            const uid = post.user_id;
            if (!uid) return;
            if (!statsMap[uid]) statsMap[uid] = { likes: 0, views: 0, comments: 0 };
            const m = statsMap[uid]!;
            m.likes += (post.like_count || 0);
            m.views += (post.view_count || 0);
            m.comments += (post.comment_count || 0);
        });

        // Aggregate project stats
        projectsData.data?.forEach(proj => {
            const uid = proj.user_id;
            if (!uid) return;
            if (!statsMap[uid]) statsMap[uid] = { likes: 0, views: 0, comments: 0 };
            const m = statsMap[uid]!;
            m.likes += (proj.like_count || 0);
            m.views += (proj.view_count || 0);
            m.comments += (proj.comment_count || 0);

            // Track latest project for preview (super simple logic: last one in array)
            m.latestProject = {
                id: proj.id,
                title: proj.title,
                cover_image: proj.cover_image
            };
        });

        const leaderboard: LeaderboardUser[] = users.map(user => {
            const stats = statsMap[user.id] || { likes: 0, views: 0, comments: 0 };

            // PULSE SCORE CALCULATION
            // Consistency: 50 points per day of streak
            // Engagement: 10 per like, 2 per view, 5 per comment
            // Recency: 100 bonus if active in last 24h
            const streakPoints = (user.streak_count || 0) * 50;
            const engagementPoints = (stats.likes * 10) + (stats.views * 2) + (stats.comments * 5);

            const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
            const recencyBonus = (lastActive && (Date.now() - lastActive.getTime()) < 86400000) ? 100 : 0;

            let pulse_score = (streakPoints + engagementPoints + recencyBonus);
            if (user.is_pro) pulse_score *= 1.2; // 1.2x Boost for PRO

            pulse_score = Math.floor(pulse_score);

            // Tier logic
            let tier = "Beginner";
            if (pulse_score > 2000) tier = "Legend";
            else if (pulse_score > 1000) tier = "Expert";
            else if (pulse_score > 500) tier = "Builder";
            else if (pulse_score > 100) tier = "Rising Star";

            return {
                ...user,
                pulse_score,
                tier,
                engagement: stats,
                latest_project: stats.latestProject || null
            };
        });

        // Sort by Pulse Score descending
        leaderboard.sort((a, b) => b.pulse_score - a.pulse_score);

        return res.json({
            leaderboard,
            top_spotlight: leaderboard.slice(0, 3)
        });
    } catch (error: any) {
        console.error("Leaderboard Error:", error);
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
}
