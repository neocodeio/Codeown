import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { formatRelativeDate } from "../utils/date";
import { CaretLeft, Lightning } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { toast, ToastContainer } from "react-toastify";

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
            toast.success("Logs updated.");
            fetchChangelogs();
        } catch (err) {
            console.error("Failed to post changelog", err);
            toast.error("Process failed.");
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
            <SEO title="Development Logs" description="Iterative progress of the Codeown platform." />
            <ToastContainer position="bottom-right" theme="dark" hideProgressBar />

            <div style={{ display: "flex", width: isDesktop ? "1020px" : "100%", maxWidth: "1020px", position: "relative" }}>
                <div style={{
                    flex: 1,
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "700px",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: (isMobile || !isDesktop) ? "none" : "0.5px solid var(--border-hairline)",
                    borderRight: (isDesktop && !isMobile) ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    margin: isDesktop ? "0" : "0 auto",
                }}>
                    {/* Header: Grounded & Minimal */}
                    <header style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-header)",
                        backdropFilter: "blur(12px)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                        zIndex: 100,
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}>
                        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
                            <CaretLeft size={20} weight="bold" color="var(--text-primary)" />
                        </button>
                        <h1 style={{ fontSize: "14px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em", textTransform: "uppercase" }}>Logs</h1>
                    </header>

                    <div style={{ padding: isMobile ? "40px 20px" : "64px 48px" }}>
                        {/* Intro: Stripped back */}
                        <div style={{ marginBottom: "64px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>Development Stream</h2>
                            <p style={{ fontSize: "14px", color: "var(--text-tertiary)", lineHeight: 1.6, maxWidth: "460px", margin: 0 }}>
                                Official repository of platform iterations and technical debt resolution.
                                Authored by <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>amin.ceo</span>
                            </p>
                        </div>

                        {/* Composer: Clean & Functional (No card style) */}
                        {isLoaded && isAminCeo && (
                            <div style={{ marginBottom: "80px", paddingBottom: "40px", borderBottom: "1px dashed var(--border-hairline)" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                placeholder="Build ID (e.g. v2.1.0)"
                                                value={newVersion}
                                                onChange={(e) => setNewVersion(e.target.value)}
                                                style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, outline: "none" }}
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        placeholder="Committing changes..."
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        style={{ width: "100%", padding: "12px 0", border: "none", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: "14px", minHeight: "80px", outline: "none", resize: "none" }}
                                    />
                                    <button
                                        onClick={handlePost}
                                        disabled={!newContent.trim() || isPosting}
                                        style={{ alignSelf: "flex-start", padding: "10px 20px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "2px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: newContent.trim() ? 1 : 0.4 }}
                                    >
                                        {isPosting ? "Processing..." : <><Lightning size={14} weight="fill" /> Push Update</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Timeline Feed: No Cards, just pure content */}
                        <div style={{ position: "relative" }}>
                            {isLoading ? (
                                <div style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500 }}>Decrypting logs...</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
                                    {changelogs.map((log) => (
                                        <article key={log.id} style={{ display: "flex", gap: "32px", position: "relative" }}>
                                            {/* Date Anchor */}
                                            {!isMobile && (
                                                <div style={{ width: "100px", flexShrink: 0 }}>
                                                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                        {formatRelativeDate(log.created_at)}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                                    <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)", backgroundColor: "var(--bg-hover)", padding: "2px 8px", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }}>
                                                        {log.version}
                                                    </div>
                                                    {isMobile && <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>{formatRelativeDate(log.created_at)}</div>}
                                                </div>
                                                <div style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: "1.7", whiteSpace: "pre-wrap", letterSpacing: "-0.01em" }}>
                                                    {log.content}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isDesktop && !isMobile && (
                    <aside style={{ width: "340px", padding: "0 0 24px 12px", position: "sticky", top: 0, alignSelf: "flex-start", flexShrink: 0 }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
            <style>{`
                ::placeholder { color: var(--text-tertiary); opacity: 0.5; }
            `}</style>
        </main>
    );
}
