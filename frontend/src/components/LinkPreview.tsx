import { useEffect, useState } from "react";
import api from "../api/axios";

interface Metadata {
    title: string;
    description: string;
    image: string;
    favicon: string;
    url: string;
    hostname: string;
}

export default function LinkPreview({ url }: { url: string }) {
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
                marginTop: "12px",
                height: "100px",
                backgroundColor: "#f8fafc",
                borderRadius: "16px",
                border: "1px solid #eff3f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div className="spinner-small" style={{ width: "20px", height: "20px", border: "2px solid #e2e8f0", borderTopColor: "#0f172a", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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
                marginTop: "12px",
                display: "flex",
                borderRadius: "16px",
                border: "1px solid #eff3f4",
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                transition: "background-color 0.2s",
                backgroundColor: "#fff",
                maxWidth: "100%"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fcfcfc"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
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
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }}>
                    {metadata.title}
                </div>

                {metadata.description && (
                    <div style={{
                        fontSize: "14px",
                        color: "#64748b",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginBottom: "8px"
                    }}>
                        {metadata.description}
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {metadata.favicon && (
                        <img
                            src={metadata.favicon}
                            alt=""
                            style={{ width: "16px", height: "16px", borderRadius: "3px" }}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                    )}
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                        {metadata.hostname}
                    </span>
                </div>
            </div>

            {metadata.image && (
                <div style={{
                    width: window.innerWidth < 500 ? "80px" : "140px",
                    height: "auto",
                    minHeight: "100%",
                    flexShrink: 0,
                    backgroundColor: "#f8fafc",
                    borderLeft: "1px solid #eff3f4",
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
