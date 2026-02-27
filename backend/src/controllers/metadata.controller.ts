import type { Request, Response } from "express";

export async function unfurlUrl(req: Request, res: Response) {
    try {
        const { url } = req.query;

        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "URL is required" });
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: "Invalid URL" });
        }

        console.log(`Unfurling URL: ${url}`);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
            // Return 200 with an error flag instead of 404/500 to prevent Axios console errors
            return res.status(200).json({
                error: true,
                message: `Failed to fetch URL: ${response.statusText}`,
                title: "", description: "", image: "", favicon: "", url, hostname: new URL(url).hostname
            });
        }

        const html = await response.text();

        // Extract basic metadata using regex
        // This is safer than a full HTML parser for simple needs, though less robust
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

        const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        const ogDescriptionMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);

        const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

        // Extract favicon
        const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
            html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);

        let title = (ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : "")).trim();
        let description = (ogDescriptionMatch ? ogDescriptionMatch[1] : (descriptionMatch ? descriptionMatch[1] : "")).trim();
        let image = ogImageMatch ? ogImageMatch[1] : "";
        let favicon = iconMatch ? iconMatch[1] : "";

        // Resolve relative URLs for image and favicon
        const urlObj = new URL(url);
        if (image && !image.startsWith("http")) {
            image = new URL(image, urlObj.origin).toString();
        }
        if (favicon && !favicon.startsWith("http")) {
            favicon = new URL(favicon, urlObj.origin).toString();
        } else if (!favicon) {
            favicon = `${urlObj.origin}/favicon.ico`;
        }

        return res.json({
            title: decodeHtmlEntities(title),
            description: decodeHtmlEntities(description),
            image,
            favicon,
            url,
            hostname: urlObj.hostname
        });
    } catch (error: any) {
        console.error("Error unfurling URL:", error);
        return res.status(200).json({
            error: true,
            message: "Internal server error fetching metadata",
            title: "", description: "", image: "", favicon: "", url: req.query.url, hostname: ""
        });
    }
}

function decodeHtmlEntities(str: string) {
    return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'");
}
