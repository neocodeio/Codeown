import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export const getPublicBuilderProfile = async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, bio, streak_count, total_xp, website_url, twitter_username, github_username")
            .eq("username", username)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: "Builder not found" });
        }

        // Fetch top projects for this builder
        const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select("id, title, description, cover_image, slug, rating, like_count")
            .eq("user_id", profile.id)
            .limit(3)
            .order("like_count", { ascending: false });

        // Construct public response
        const publicData = {
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            stats: {
                streak: profile.streak_count || 0,
                xp: profile.total_xp || 0,
            },
            socials: {
                website: profile.website_url,
                twitter: profile.twitter_username,
                github: profile.github_username
            },
            featured_projects: projects || [],
            identity_url: `https://codeown.space/${profile.username}`
        };

        return res.status(200).json(publicData);
    } catch (error) {
        console.error("Public API Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Generates a simple SVG badge for GitHub READMEs
 * URL: /v1/public/builders/:username/streak-badge
 */
export const getStreakBadge = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { theme = 'dark' } = req.query;

    try {
        const { data: profile } = await supabase
            .from("profiles")
            .select("streak_count")
            .eq("username", username)
            .single();

        const streak = profile?.streak_count || 0;

        // Aesthetic configuration
        const bgColor = theme === 'dark' ? '#0A0A0A' : '#FFFFFF';
        const textColor = theme === 'dark' ? '#FFFFFF' : '#0A0A0A';
        const accentColor = '#757DFF'; // Your new brand color

        const svg = `
      <svg width="180" height="32" viewBox="0 0 180 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="32" rx="16" fill="${bgColor}" stroke="${accentColor}" stroke-opacity="0.2"/>
        <path d="M12 16L15 13L18 16L15 19L12 16Z" fill="${accentColor}"/>
        <text x="28" y="20" fill="${textColor}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 800;">BUILD STREAK</text>
        <text x="135" y="20" fill="${accentColor}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 900;">${streak}</text>
      </svg>
    `.trim();

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache
        return res.status(200).send(svg);
    } catch (error) {
        return res.status(500).send("Error generating badge");
    }
};

/**
 * Generates a GitHub-style contribution heatmap as an SVG
 */
export const getHeatmapBadge = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { theme } = req.query;
    const currentTheme = (theme as string) || 'dark';

    try {
        // 1. Get user ID from username
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();

        if (!profile) return res.status(404).send("User not found");

        // 2. Fetch last 12 months of activity (posts as proxy for now)
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);

        const { data: activity } = await supabase
            .from("posts")
            .select("created_at")
            .eq("user_id", profile.id)
            .gte("created_at", yearAgo.toISOString());

        // 3. Process activity into daily counts
        const counts: Record<string, number> = {};
        activity?.forEach(item => {
            const date = (new Date(item.created_at).toISOString().split('T')[0]) as string;
            counts[date] = (counts[date] || 0) + 1;
        });

        // 4. Generate SVG Grid (52 weeks x 7 days)
        const cellColors = currentTheme === 'dark'
            ? ['#1A1A1A', '#343880', '#545BFF', '#757DFF', '#A3A9FF'] // Brand intensity scale
            : ['#EBEDF0', '#C6E48B', '#7BC96F', '#239A3B', '#196127'];

        let svgCells = "";
        const today = new Date();
        for (let i = 0; i < 364; i++) {
            const d = new Date();
            d.setDate(today.getDate() - (363 - i));
            const dateStr = d.toISOString().split('T')[0] as string;
            const count = counts[dateStr] || 0;
            const colorIndex = Math.min(count, cellColors.length - 1);
            const color = (cellColors as string[])[colorIndex];

            const x = Math.floor(i / 7) * 14;
            const y = (i % 7) * 14;
            svgCells += `<rect x="${x}" y="${y}" width="10" height="10" rx="2" fill="${color}" />`;
        }

        const svg = `
      <svg width="730" height="110" viewBox="0 0 730 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="730" height="110" rx="12" fill="${currentTheme === 'dark' ? '#0A0A0A' : '#FAFAFA'}" />
        <g transform="translate(15, 6)">
          ${svgCells}
        </g>
        <text x="15" y="104" fill="${currentTheme === 'dark' ? '#444' : '#999'}" style="font-family: sans-serif; font-size: 9px; font-weight: 600;">CODEOWN ACTIVITY LAYER — LAST 12 MONTHS</text>
      </svg>
    `.trim();

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.status(200).send(svg);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error generating heatmap");
    }
};
