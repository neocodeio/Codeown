import { useEffect, useState } from "react";
import api from "../api/axios";
import ArticleLinkPreview from "./ArticleLinkPreview";

interface Metadata {
    title: string;
    description: string;
    image: string;
    favicon: string;
    url: string;
    hostname: string;
}

export default function LinkPreview({ url }: { url: string }) {
    // Check if it's an internal article
    const articleIdMatch = url.match(/codeown\.space\/articles\/(\d+)/);
    if (articleIdMatch) {
      return <ArticleLinkPreview articleId={parseInt(articleIdMatch[1])} />;
    }

    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchMetadata = async () => {
            if (!url) return;
            try {
                setLoading(true);
                setError(false);
                const { data } = await api.get(`/metadata/unfurl?url=${encodeURIComponent(url)}`);
                if (isMounted) {
                    setMetadata(data);
                    setError(false);
                }
            } catch (err) {
                console.error("Link preview error:", err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchMetadata();
        }, 1000); // 1-second debounce to wait for user to finish typing

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [url]);

    if (loading) {
        return (
            <div style={{
                marginTop: "16px",
                height: "100px",
                backgroundColor: "var(--bg-hover)",
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid var(--border-hairline)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 1.5s ease-in-out infinite"
            }}>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>Unfurling...</div>
            </div>
        );
    }

    if (error || !metadata || (!metadata.title && !metadata.description)) return null;

    return (
        <a
            href={metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                marginTop: "16px",
                display: "flex",
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid var(--border-hairline)",
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                transition: "background-color 0.15s ease",
                backgroundColor: "var(--bg-page)",
                maxWidth: "100%"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{
                flex: 1,
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: 0
            }}>
                <div style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    letterSpacing: "-0.01em"
                }}>
                    {metadata.title}
                </div>
 
                {metadata.description && (
                    <div style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginBottom: "12px"
                    }}>
                        {metadata.description}
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {metadata.favicon && (
                        <img
                            src={metadata.favicon}
                            alt=""
                            style={{ width: "14px", height: "14px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                    )}
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                        {metadata.hostname}
                    </span>
                </div>
            </div>

            {metadata.image && (
                <div style={{
                    width: "160px",
                    height: "auto",
                    minHeight: "100%",
                    flexShrink: 0,
                    backgroundColor: "var(--bg-hover)",
                    borderLeft: "0.5px solid var(--border-hairline)",
                    display: "flex"
                }}>
                    <img
                        src={metadata.image}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                        }}
                        onError={(e) => (e.currentTarget.parentElement!.style.display = "none")}
                    />
                </div>
            )}
        </a>
    );
}
