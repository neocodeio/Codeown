import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { formatRelativeDate } from "../utils/date";
import { Scroll, Plus, Rocket, Clock, CaretLeft } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

interface ChangelogEntry {
    id: number;
    version: string;
    content: string;
    created_at: string;
}

export default function Changelog() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1200;
    const navigate = useNavigate();
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
            fetchChangelogs();
        } catch (err) {
            console.error("Failed to post changelog", err);
            alert("Failed to post changelog.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <main style={{
            display: "flex",
            justifyContent: isDesktop ? "center" : "flex-start",
            backgroundColor: "var(--bg-page)",
            minHeight: "100vh",
            width: "100%",
        }}>
            <SEO
                title="Changelog"
                description="Tracking the evolution of Codeown."
            />

            <div style={{
                display: "flex",
                width: isDesktop ? "1020px" : "100%",
                maxWidth: "1020px",
                position: "relative",
            }}>
                {/* Main Content Column */}
                <div style={{
                    flex: 1,
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "700px",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    margin: isDesktop ? "0" : "0 auto",
                    position: "relative",
                }}>
                    {/* Header */}
                    <header style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-header)",
                        backdropFilter: "blur(20px)",
                        zIndex: 100,
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        borderBottom: "0.5px solid var(--border-hairline)"
                    }}>
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "var(--radius-sm)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <CaretLeft size={20} weight="thin" color="var(--text-primary)" />
                        </button>

                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: 0
                            }}>
                                Changelog
                            </h1>
                        </div>
                    </header>

                    <div style={{ padding: isMobile ? "24px 20px" : "32px 32px" }}>
                        <div style={{ marginBottom: "48px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <Scroll size={32} weight="thin" color="var(--text-primary)" />
                                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                                    Evolution
                                </h1>
                            </div>
                            <p style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
                                Tracking the progress and updates of Codeown.<br />
                                All changes are made by <a href="/amin.ceo" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>@amin.ceo</a>
                            </p>
                        </div>

                        {isLoaded && isAminCeo && (
                            <div style={{
                                marginBottom: "60px",
                                padding: "24px",
                                backgroundColor: "var(--bg-hover)",
                                border: "0.5px solid var(--border-hairline)",
                                borderRadius: "var(--radius-sm)"
                            }}>
                                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
                                    Post new update
                                </h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <input
                                        type="text"
                                        placeholder="Version (e.g. v1.2.0)"
                                        value={newVersion}
                                        onChange={(e) => setNewVersion(e.target.value)}
                                        style={{
                                            padding: "10px 14px",
                                            backgroundColor: "var(--bg-page)",
                                            border: "0.5px solid var(--border-hairline)",
                                            borderRadius: "var(--radius-xs)",
                                            color: "var(--text-primary)",
                                            fontSize: "13px",
                                            outline: "none"
                                        }}
                                    />
                                    <textarea
                                        placeholder="What's changed?"
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        style={{
                                            padding: "14px",
                                            backgroundColor: "var(--bg-page)",
                                            border: "0.5px solid var(--border-hairline)",
                                            borderRadius: "var(--radius-xs)",
                                            color: "var(--text-primary)",
                                            fontFamily: "inherit",
                                            fontSize: "13px",
                                            minHeight: "120px",
                                            outline: "none",
                                            resize: "vertical"
                                        }}
                                    />
                                    <button
                                        onClick={handlePost}
                                        disabled={!newContent.trim() || isPosting}
                                        style={{
                                            padding: "10px",
                                            backgroundColor: newContent.trim() ? "var(--text-primary)" : "transparent",
                                            color: newContent.trim() ? "var(--bg-page)" : "var(--text-tertiary)",
                                            border: "1px solid var(--border-hairline)",
                                            borderRadius: "var(--radius-sm)",
                                            fontWeight: 600,
                                            fontSize: "12px",
                                            cursor: newContent.trim() ? "pointer" : "not-allowed",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        {isPosting ? "Publishing..." : <><Plus size={14} weight="bold" /> Publish update</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
                            {isLoading ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500 }}>
                                    Syncing logs...
                                </div>
                            ) : changelogs.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500 }}>
                                    No entries.
                                </div>
                            ) : (
                                changelogs.map((log) => (
                                    <article key={log.id} style={{ position: "relative" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                            <div style={{
                                                padding: "4px 10px",
                                                backgroundColor: "var(--text-primary)",
                                                color: "var(--bg-page)",
                                                fontSize: "11px",
                                                fontWeight: 800,
                                                borderRadius: "var(--radius-xs)",
                                            }}>
                                                {log.version}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}>
                                                <Clock size={14} weight="thin" />
                                                {formatRelativeDate(log.created_at)}
                                            </div>
                                        </div>
                                        <div style={{
                                            color: "var(--text-primary)",
                                            fontSize: "15px",
                                            lineHeight: "1.7",
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
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                                Established 2026/02/05
                            </div>
                        </footer>
                    </div>
                </div>

                {/* Right Sidebar - Desktop Only */}
                {isDesktop && !isMobile && (
                    <aside style={{
                        width: "340px",
                        padding: "24px 0 24px 32px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </main>
    );
}
