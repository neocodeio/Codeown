import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { formatRelativeDate } from "../utils/date";
import { Scroll, Plus, Rocket, Clock } from "phosphor-react";

interface ChangelogEntry {
    id: number;
    version: string;
    content: string;
    created_at: string;
}

export default function Changelog() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const { user, isLoaded } = useClerkUser();
    const { getToken } = useClerkAuth();
    
    const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newVersion, setNewVersion] = useState("");
    const [newContent, setNewContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    const isAminCeo = user?.username?.toLowerCase() === "amin.ceo";

    const fetchChangelogs = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/changelogs");
            if (Array.isArray(res.data)) {
                setChangelogs(res.data);
            } else {
                console.warn("Changelog data is not an array:", res.data);
                setChangelogs([]);
            }
        } catch (err) {
            console.error("Failed to fetch changelogs", err);
            setChangelogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChangelogs();
    }, []);

    const handlePost = async () => {
        if (!newContent.trim() || isPosting) return;
        setIsPosting(true);
        try {
            const token = await getToken();
            await api.post("/changelogs", {
                version: newVersion.trim() || undefined,
                content: newContent.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewContent("");
            setNewVersion("");
            alert("Update published successfully.");
            fetchChangelogs();
        } catch (err) {
            console.error("Failed to post changelog", err);
            alert("Failed to post changelog. Ensure you have the permissions or try again.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: isMobile ? "20px" : "60px 40px",
            minHeight: "100vh",
            backgroundColor: "var(--bg-page)",
            borderLeft: "0.5px solid var(--border-hairline)",
            borderRight: "0.5px solid var(--border-hairline)"
        }}>
            <header style={{ marginBottom: "48px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <Scroll size={32} weight="thin" color="var(--text-primary)" />
                    <h1 style={{ 
                        fontSize: "32px", 
                        fontWeight: 800, 
                        color: "var(--text-primary)", 
                        margin: 0
                    }}>
                        Changelog
                    </h1>
                </div>
                <p style={{ 
                    fontSize: "14px", 
                    color: "var(--text-tertiary)", 
                    fontWeight: 500,
                    marginBottom: "8px"
                }}>
                    Tracking the evolution of Codeown.
                </p>
                <p style={{ 
                    fontSize: "14px", 
                    color: "var(--text-tertiary)", 
                    fontWeight: 500,
                }}>
                    All changes are made by <a href="amin.ceo" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>@amin.ceo</a>
                </p>
            </header>

            {isLoaded && isAminCeo && (
                <div style={{
                    marginBottom: "60px",
                    padding: "30px",
                    backgroundColor: "var(--bg-hover)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "var(--radius-sm)"
                }}>
                    <h2 style={{ 
                        fontSize: "15px", 
                        fontWeight: 700, 
                        color: "var(--text-primary)", 
                        marginBottom: "20px",
                    }}>
                        Post new update
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <input
                            type="text"
                            placeholder="Version (e.g. v1.2.0)"
                            value={newVersion}
                            onChange={(e) => setNewVersion(e.target.value)}
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "var(--bg-page)",
                                border: "0.5px solid var(--border-hairline)",
                                borderRadius: "var(--radius-xs)",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                outline: "none"
                            }}
                        />
                        <textarea
                            placeholder="What's changed?"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            style={{
                                padding: "16px",
                                backgroundColor: "var(--bg-page)",
                                border: "0.5px solid var(--border-hairline)",
                                borderRadius: "var(--radius-xs)",
                                color: "var(--text-primary)",
                                fontFamily: "inherit",
                                fontSize: "14px",
                                minHeight: "150px",
                                outline: "none",
                                resize: "vertical"
                            }}
                        />
                        <button
                            onClick={handlePost}
                            disabled={!newContent.trim() || isPosting}
                            style={{
                                padding: "12px",
                                backgroundColor: newContent.trim() ? "var(--text-primary)" : "transparent",
                                color: newContent.trim() ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "1.5px solid var(--border-hairline)",
                                borderRadius: "var(--radius-sm)",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: newContent.trim() ? "pointer" : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                transition: "all 0.15s"
                            }}
                        >
                            {isPosting ? "Publishing..." : <><Plus size={16} weight="bold" /> Publish update</>}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 500 }}>
                        Loading logs...
                    </div>
                ) : changelogs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 500 }}>
                        No entries yet.
                    </div>
                ) : (
                    changelogs.map((log) => (
                        <article key={log.id} style={{ 
                            paddingBottom: "40px", 
                            borderBottom: "0.5px solid var(--border-hairline)",
                            position: "relative"
                        }}>
                            <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "10px", 
                                marginBottom: "16px" 
                            }}>
                                <div style={{
                                    padding: "4px 10px",
                                    backgroundColor: "var(--text-primary)",
                                    color: "var(--bg-page)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    borderRadius: "var(--radius-xs)",
                                }}>
                                    {log.version}
                                </div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    color: "var(--text-tertiary)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                }}>
                                    <Clock size={14} weight="thin" />
                                    {formatRelativeDate(log.created_at)}
                                </div>
                            </div>
                            <div style={{
                                color: "var(--text-primary)",
                                fontSize: "15px",
                                lineHeight: "1.8",
                                whiteSpace: "pre-wrap",
                                letterSpacing: "-0.01em"
                            }}>
                                {log.content}
                            </div>
                        </article>
                    ))
                )}
            </div>
            
            <footer style={{ marginTop: "80px", textAlign: "center", paddingBottom: "40px" }}>
                <Rocket size={24} weight="thin" color="var(--border-hairline)" style={{ marginBottom: "16px" }} />
                <div style={{ 
                    fontSize: "12px", 
                    color: "var(--text-tertiary)", 
                    fontWeight: 500,
                }}>
                    Codeown Engine v1.0.0
                </div>
            </footer>
        </div>
    );
}
