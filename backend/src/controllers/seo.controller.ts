import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { parse } from "node-html-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Serves the frontend index.html with dynamically injected SEO metadata
 * for social media crawlers.
 */
export async function serveDynamicSEO(req: Request, res: Response) {
    try {
        const urlPath = req.path;
        const baseUrl = process.env.FRONTEND_URL || "https://codeown.space";

        // 1. Path to frontend index.html
        // Assuming current file is in backend/src/controllers/
        const indexPath = path.resolve(__dirname, "../../../frontend/dist/index.html");

        if (!fs.existsSync(indexPath)) {
            // Fallback for development where dist might not exist
            return res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Codeown</title></head>
                <body>Backend is running. Build the frontend to see the site.</body>
                </html>
            `);
        }

        const html = fs.readFileSync(indexPath, "utf8");
        const root = parse(html);

        // Default metadata (fallback)
        let title = "Codeown - The Home of Passionate Developers";
        let description = "Codeown is a platform for developers to share projects, collaborate on code, and build their professional identity.";
        let image = `${baseUrl}/favicon.png?v=2`;
        let author = "Codeown Team";

        // Logic to fetch specifically relevant metadata based on the path
        try {
            if (urlPath.startsWith("/post/")) {
                const id = urlPath.split("/")[2];
                if (id) {
                    const { data: post } = await supabase
                        .from("posts")
                        .select("title, content, images")
                        .eq("id", id)
                        .single();

                    if (post) {
                        title = post.title || (post.content.length > 50 ? post.content.substring(0, 50) + "..." : post.content);
                        description = post.content.substring(0, 160);
                        if (post.images && post.images.length > 0) {
                            image = post.images[0];
                        }
                    }
                }
            } else if (urlPath.startsWith("/project/")) {
                const id = urlPath.split("/")[2];
                if (id) {
                    const { data: project } = await supabase
                        .from("projects")
                        .select("title, description, cover_image")
                        .eq("id", id)
                        .single();

                    if (project) {
                        title = project.title || title;
                        description = project.description?.substring(0, 160) || description;
                        if (project.cover_image) {
                            image = project.cover_image;
                        }
                    }
                }
            } else if (urlPath !== "/" && !urlPath.includes(".") && !urlPath.startsWith("/api/")) {
                // Determine if it's a profile route
                let username = "";
                if (urlPath.startsWith("/user/")) {
                    username = urlPath.split("/")[2] || "";
                } else if (!urlPath.split("/")[3]) {
                    // It's a root-level path like /amin.ceo or /@amin.ceo
                    username = urlPath.startsWith("/@") ? urlPath.substring(2) : urlPath.substring(1);
                }

                // Exclude static routes and common app pages
                const commonPages = ["search", "about", "privacy", "terms", "messages", "notifications", "leaderboard", "analytics", "profile", "billing", "feed", "explore", "sign-in", "sign-up", "forgot-password", "founder-story"];

                if (username && !commonPages.includes(username)) {
                    // Determine if we're searching by ID or username
                    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username) || username.startsWith("user_");
                    const field = isId ? "id" : "username";

                    const { data: user } = await supabase
                        .from("users")
                        .select("name, username, bio, avatar_url, job_title")
                        .eq(field, username)
                        .single();

                    if (user) {
                        title = `${user.name} (@${user.username || "user"})`;
                        description = user.bio
                            ? (user.bio.length > 160 ? user.bio.substring(0, 157) + "..." : user.bio)
                            : `${user.name} is a developer ${user.job_title ? ` specializing in ${user.job_title}` : ""}. Check out their professional portfolio on Codeown.`;

                        if (user.avatar_url) {
                            image = user.avatar_url;
                        }
                        author = user.name;
                    }
                }
            }
        } catch (fetchError) {
            console.error("Error fetching SEO metadata:", fetchError);
        }

        // Ensure image URL is absolute and truncate description properly
        if (image && !image.startsWith("http")) {
            image = new URL(image, baseUrl).toString();
        }

        if (description && description.length > 200) {
            description = description.substring(0, 197) + "...";
        }

        // Apply meta tag updates to the HTML
        const titleTag = root.querySelector("title");
        if (titleTag) titleTag.set_content(`${title} | Codeown`);

        // Update meta tags by name/property
        const updateMeta = (selector: string, content: string) => {
            const el = root.querySelector(selector);
            if (el) el.setAttribute("content", content);
        };

        // Standard Meta
        updateMeta('meta[name="description"]', description);

        // Open Graph
        updateMeta('meta[property="og:title"]', `${title} | Codeown`);
        updateMeta('meta[property="og:description"]', description);
        updateMeta('meta[property="og:image"]', image);
        updateMeta('meta[property="og:url"]', `${baseUrl}${urlPath}`);
        updateMeta('meta[property="og:site_name"]', "Codeown");
        updateMeta('meta[property="og:type"]', "website");

        // Twitter
        updateMeta('meta[name="twitter:card"]', "summary_large_image");
        updateMeta('meta[name="twitter:title"]', `${title} | Codeown`);
        updateMeta('meta[name="twitter:description"]', description);
        updateMeta('meta[name="twitter:image"]', image);

        // Author
        updateMeta('meta[name="author"]', author);

        return res.status(200).send(root.toString());

    } catch (error: any) {
        console.error("Error serving dynamic SEO:", error);
        return res.status(500).send("Internal server error serving site content");
    }
}
