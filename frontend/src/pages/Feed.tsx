import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import WeeklyRecapModal from "../components/WeeklyRecapModal";
import api from "../api/axios";
import { useState } from "react";

import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";


export default function Feed() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1280;
    const MAIN_COLUMN_MAX_WIDTH = 620;
    const SIDEBAR_WIDTH = 350;
    const [searchParams, setSearchParams] = useSearchParams();

    // Sync state with URL params
    const feedType = (searchParams.get("type") as "posts" | "projects") || "posts";
    const feedFilter = (searchParams.get("filter") as FeedFilter) || "all";
    const selectedTag = searchParams.get("tag") || "";
    const selectedLang = (searchParams.get("lang") as "en" | "ar" | "") || "";

    // Helper to update search params
    const updateParams = (newParams: Record<string, string | null>) => {
        setSearchParams(prev => {
            // If switching type, clear potential incompatible filters
            if (newParams.type && newParams.type !== feedType) {
                prev.delete("tag");
                prev.delete("lang");
            }

            Object.entries(newParams).forEach(([key, value]) => {
                if (value === null || value === "") prev.delete(key);
                else prev.set(key, value);
            });
            return prev;
        }, { replace: true });
    };

    const setFeedFilter = (filter: FeedFilter) => updateParams({ filter });

    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    // Both hooks always enabled: data is cached, tab switch is instant (no refetch)
    const {
        posts,
        loading: postsLoading,
        fetchPosts,
        hasMore: postsHasMore
    } = usePosts(10, feedFilter, getToken, selectedTag, selectedLang || undefined, true);

    const {
        projects,
        loading: projectsLoading,
        fetchProjects,
        hasMore: projectsHasMore
    } = useProjects(10, feedFilter, getToken, selectedTag, true);

    const [recapStats, setRecapStats] = useState<any>(null);
    const [showRecap, setShowRecap] = useState(false);

    useEffect(() => {
        const checkRecap = async () => {
            if (!isSignedIn) return;

            const userId = localStorage.getItem("clerk-user-id"); // Optionally tie to user
            const storageKey = `last_recap_seen_${userId || 'guest'}`;
            const lastSeen = localStorage.getItem(storageKey);
            const now = new Date();
            const oneWeek = 7 * 24 * 60 * 60 * 1000;

            if (!lastSeen || (now.getTime() - new Date(lastSeen).getTime() > oneWeek)) {
                // Show if Sunday or Monday, or just whenever it's been a week
                try {
                    const token = await getToken();
                    const res = await api.get("/analytics/recap", {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data && res.data.stats) {
                        const s = res.data.stats;
                        // Avoid showing empty recap (must have at least one interaction)
                        if (s.new_followers > 0 || s.project_views > 0 || s.post_views > 0 || s.new_likes > 0) {
                            setRecapStats(res.data.stats);
                            setShowRecap(true);
                        }
                        // Mark as seen anyway to avoid refetching every load
                        localStorage.setItem(storageKey, now.toISOString());
                    }
                } catch (err) {
                    console.error("Failed to fetch weekly recap:", err);
                    // Mark as seen on error too to prevent infinite retries
                    localStorage.setItem(storageKey, now.toISOString());
                }
            }
        };

        const timer = setTimeout(() => {
            checkRecap();
        }, 1500); // Small delay to let other things load

        return () => clearTimeout(timer);
    }, [isSignedIn, getToken]);

    const loading = feedType === "posts" ? postsLoading : projectsLoading;
    const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

    useEffect(() => {
        if (!isSignedIn && feedFilter === "following") setFeedFilter("all");
    }, [isSignedIn, feedFilter]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
                if (hasMore && !loading) {
                    if (feedType === "posts") {
                        fetchPosts(undefined, true);
                    } else {
                        fetchProjects(undefined, true);
                    }
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMore, loading, fetchPosts, fetchProjects, feedType]);

    const handleFilterChange = (f: FeedFilter) => {
        setFeedFilter(f);
    };

    const currentItems = feedType === "posts" ? posts : projects;

    const handlePostCreated = useCallback(() => {
        fetchPosts(undefined, false);
    }, [fetchPosts]);

    const handleProjectCreated = useCallback(() => {
        fetchProjects(undefined, false);
    }, [fetchProjects]);

    useEffect(() => {
        window.addEventListener("postCreated", handlePostCreated);
        window.addEventListener("projectCreated", handleProjectCreated);
        return () => {
            window.removeEventListener("postCreated", handlePostCreated);
            window.removeEventListener("projectCreated", handleProjectCreated);
        };
    }, [handlePostCreated, handleProjectCreated]);

    const isInitialLoading = (feedType === "posts" && postsLoading && posts.length === 0) ||
        (feedType === "projects" && projectsLoading && projects.length === 0);



    return (
        <main style={{ padding: 0, backgroundColor: "#f8fafc" }}>
            <SEO
                title="Discover"
                description="The place where developers share projects, discover amazing code, and connect with other builders worldwide."
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Codeown",
                    "url": window.location.origin,
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${window.location.origin}/search?q={search_term_string}`,
                        "query-input": "required name=search_term_string"
                    }
                }}
            />

            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
                boxSizing: "border-box",
            }}>
                {/* ── Main Feed Column ── */}
                <div style={{
                    flexShrink: 0,
                    width: isMobile ? "100%" : `${MAIN_COLUMN_MAX_WIDTH}px`,
                    backgroundColor: "#ffffff",
                    borderLeft: !isMobile ? "1px solid #e2e8f0" : "none",
                    borderRight: !isMobile ? "1px solid #e2e8f0" : "none",
                    minHeight: "100vh",
                }}>

                    {/* ── Sticky header: filters + type tabs ── */}
                    <div style={{
                        position: isMobile ? "static" : "sticky",
                        top: 0,
                        zIndex: 20,
                        backgroundColor: "rgba(255,255,255,0.97)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "1px solid #e2e8f0",
                    }}>
                        <style>{`
                            .fp-pill {
                                appearance: none; border: none; background: transparent;
                                padding: 9px 16px; font-size: 13px; font-weight: 600;
                                color: #94a3b8; cursor: pointer; border-radius: 999px;
                                transition: all 0.15s ease; white-space: nowrap;
                            }
                            .fp-pill:hover { color: #475569; background: #f1f5f9; }
                            .fp-pill.active { color: #0f172a; background: #f1f5f9; font-weight: 700; }
                            .fp-type-pill {
                                appearance: none; border: 1px solid #e2e8f0; background: transparent;
                                padding: 6px 14px; font-size: 13px; font-weight: 600;
                                color: #94a3b8; cursor: pointer; border-radius: 999px;
                                transition: all 0.15s ease; white-space: nowrap;
                            }
                            .fp-type-pill:hover { color: #475569; border-color: #cbd5e1; }
                            .fp-type-pill.active { color: #0f172a; border-color: #0f172a; background: rgba(15,23,42,0.04); font-weight: 700; }
                        `}</style>

                        <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 16px", gap: "8px", overflowX: "auto",
                        }}>
                            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                                <button className={`fp-pill ${feedFilter === "all" ? "active" : ""}`} onClick={() => handleFilterChange("all")}>Discover</button>
                                <button className={`fp-pill ${feedFilter === "following" ? "active" : ""}`} onClick={() => handleFilterChange("following")}>Following</button>
                            </div>
                            <div style={{ width: "1px", height: "22px", backgroundColor: "#e2e8f0", flexShrink: 0 }} />
                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                <button className={`fp-type-pill ${feedType === "posts" ? "active" : ""}`} onClick={() => updateParams({ type: "posts" })}>Posts</button>
                                <button className={`fp-type-pill ${feedType === "projects" ? "active" : ""}`} onClick={() => updateParams({ type: "projects" })}>Projects</button>
                            </div>
                        </div>

                        {feedType === "projects" && (
                            <div style={{
                                display: "flex", gap: "6px",
                                padding: "0 16px 10px",
                                overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none",
                            }}>
                                <style>{`.fp-tags::-webkit-scrollbar{display:none}`}</style>
                                {["All","React","TypeScript","Next.js","Node.js","Python","Tailwind","Flutter","Rust","Go","Supabase","AI"].map(tag => {
                                    const isSelected = (tag === "All" && !selectedTag) || selectedTag === tag;
                                    return (
                                        <button key={tag} onClick={() => updateParams({ tag: tag === "All" ? null : tag })} style={{
                                            padding: "4px 12px", borderRadius: "999px", flexShrink: 0,
                                            border: `1px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                                            backgroundColor: isSelected ? "#0f172a" : "#fff",
                                            color: isSelected ? "#fff" : "#64748b",
                                            fontSize: "12px", fontWeight: isSelected ? 700 : 500,
                                            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
                                        }}>
                                            {tag === "All" ? tag : `#${tag}`}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Composer ── */}
                    {feedType === "posts" && <FeedPostComposer onCreated={handlePostCreated} />}

                    {/* ── Feed stream ── */}
                    {isInitialLoading ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} style={{ padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
                                    <PostCardSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : currentItems.length === 0 && !loading ? (
                        <div style={{ padding: "80px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "42px" }}>{feedFilter === "following" ? "🔭" : "🌱"}</span>
                            {feedFilter === "following" ? (
                                <>
                                    <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.03em" }}>Your following feed is quiet</h2>
                                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, maxWidth: "300px", margin: 0 }}>Follow creators to see their posts here.</p>
                                    <button onClick={() => handleFilterChange("all")} style={{ marginTop: "8px", padding: "10px 24px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "999px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                                        Explore Discover
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.03em" }}>Nothing here yet</h2>
                                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>Be the first to share something!</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {feedType === "posts"
                                ? (currentItems as any[]).map(p => <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(undefined, false)} />)
                                : (currentItems as any[]).map(p => <ProjectCard key={p.id} project={p} onUpdated={() => fetchProjects(undefined, false)} />)
                            }
                            {loading && (
                                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                                    <div className="spinner" />
                                </div>
                            )}
                        </div>
                    )}

                    {isMobile && <div style={{ height: "80px" }} />}
                </div>

                {/* ── Right Sidebar (fixed, stays on scroll) ── */}
                {isDesktop && (
                    <div style={{
                        width: `${SIDEBAR_WIDTH}px`,
                        flexShrink: 0,
                    }}>
                        {/* Inner div is fixed — always stays visible during scroll */}
                        {/* Formula: left = (100vw + navbarWidth + feedWidth - sidebarWidth) / 2 */}
                        {/* = (100vw + 300px + 620px - 350px) / 2 = 50vw + 285px */}
                        <div style={{
                            position: "fixed",
                            left: `calc(50vw + 285px)`,
                            top: 0,
                            width: `${SIDEBAR_WIDTH}px`,
                            height: "100vh",
                            overflowY: "auto",
                            borderLeft: "1px solid #e2e8f0",
                            backgroundColor: "#fff",
                            zIndex: 40,
                        }}>
                            <RecommendedUsersSidebar />
                        </div>
                    </div>
                )}
            </div>

            {recapStats && (
                <WeeklyRecapModal
                    isOpen={showRecap}
                    onClose={() => setShowRecap(false)}
                    stats={recapStats}
                />
            )}
        </main>
    );
}
