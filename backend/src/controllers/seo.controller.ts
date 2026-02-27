import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

// Helper function to format dates exactly as Google likes them (YYYY-MM-DD)
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

export async function generateSitemap(req: Request, res: Response) {
    try {
        const baseUrl = process.env.FRONTEND_URL || "https://codeown.space";

        // 1. Define all your static routes
        const staticRoutes = [
            { url: "/", priority: 1.0, changefreq: "daily" },
            { url: "/search", priority: 0.8, changefreq: "weekly" },
            { url: "/about", priority: 0.6, changefreq: "monthly" },
            { url: "/privacy", priority: 0.4, changefreq: "monthly" },
            { url: "/terms", priority: 0.4, changefreq: "monthly" },
            { url: "/sign-in", priority: 0.5, changefreq: "monthly" },
            { url: "/sign-up", priority: 0.5, changefreq: "monthly" },
        ];

        // 2. Fetch Dynamic Content from Supabase in Parallel
        const [postsRes, projectsRes, usersRes] = await Promise.all([
            // Limit to top 1000 most recent items to avoid massive XML files
            supabase.from("posts").select("id, created_at").order("created_at", { ascending: false }).limit(1000),
            supabase.from("projects").select("id, created_at").order("created_at", { ascending: false }).limit(1000),
            // For users, it's their username, not ID, that forms the URL
            supabase.from("users").select("username, created_at").not("username", "is", null).order("created_at", { ascending: false }).limit(1000)
        ]);

        const posts = postsRes.data || [];
        const projects = projectsRes.data || [];
        const users = usersRes.data || [];

        // 3. Construct the XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Append Static Pages
        const today = new Date().toISOString().split('T')[0];
        staticRoutes.forEach(route => {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}${route.url}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
            xml += `    <priority>${route.priority}</priority>\n`;
            xml += `  </url>\n`;
        });

        // Append Posts (/post/:id)
        posts.forEach((post: any) => {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/post/${post.id}</loc>\n`;
            xml += `    <lastmod>${formatDate(post.created_at)}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        });

        // Append Projects (/project/:id)
        projects.forEach((project: any) => {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/project/${project.id}</loc>\n`;
            xml += `    <lastmod>${formatDate(project.created_at)}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        });

        // Append User Profiles (/@:username)
        users.forEach((user: any) => {
            if (!user.username) return;
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/@${user.username}</loc>\n`;
            xml += `    <lastmod>${formatDate(user.created_at)}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.6</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += '</urlset>';

        // Ensure we send back an actual XML content type to the browser/Googlebot
        res.header('Content-Type', 'application/xml');
        return res.status(200).send(xml);

    } catch (error: any) {
        console.error("Error generating sitemap:", error);
        return res.status(500).json({ error: "Internal server error generating sitemap" });
    }
}
