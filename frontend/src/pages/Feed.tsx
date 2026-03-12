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
        <main style={{ padding: 0, backgroundColor: "#ffffff" }}>
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
                backgroundColor: "transparent",
            }}>
                {/* Main Feed Column */}
                <div style={{
                    flexShrink: 0,
                    width: isMobile ? "100%" : `${MAIN_COLUMN_MAX_WIDTH}px`,
                    borderLeft: !isMobile ? "1px solid #e5e7eb" : "none",
                    borderRight: !isMobile ? "1px solid #e5e7eb" : "none",
                    borderTop: !isMobile ? "1px solid #e5e7eb" : "none",
                    borderBottom: !isMobile ? "1px solid #e5e7eb" : "none",
                    backgroundColor: "#ffffff",
                    position: "relative",
                    zIndex: 1,
                }}>
                    {/* Status banner */}
                    {/* <div
                        style={{
                            padding: isMobile ? "12px 16px" : "14px 20px",
                            backgroundColor: "#f0f9ff",
                            borderBottom: "1px solid #e0f2fe",
                        }}
                    > */}
                    <p
                        style={{
                            margin: 0,
                            fontSize: isMobile ? "13px" : "14px",
                            color: "#0369a1",
                            lineHeight: 1.5,
                            fontWeight: 500,
                        }}
                    >
                        {/* We're growing faster than our servers! We're currently optimizing our storage to accommodate all new users. Back shortly! */}
                    </p>
                    {/* </div> */}

                    {/* Header + feed filter */}
                    <div
                        style={{
                            borderBottom: "1px solid #eff3f4",
                            position: isMobile ? "static" : "sticky",
                            top: isMobile ? undefined : 0,
                            marginTop: 0,
                            backgroundColor: isMobile ? "#ffffff" : "rgba(255, 255, 255, 0.95)",
                            backdropFilter: isMobile ? undefined : "blur(8px)",
                            width: "100%",
                            zIndex: 10,
                        }}
                    >
                        <style>{`
                            .feed-tabs-row {
                                display: flex;
                                align-items: center;
                                gap: 18px;
                                padding: 0 16px;
                                overflow-x: auto;
                                scrollbar-width: none;
                                -ms-overflow-style: none;
                            }
                            .feed-tabs-row::-webkit-scrollbar { display: none; }
                            .feed-tab-btn {
                                position: relative;
                                appearance: none;
                                border: none;
                                background: transparent;
                                padding: 14px 2px 12px;
                                font-size: 14px;
                                font-weight: 700;
                                color: #94a3b8;
                                cursor: pointer;
                                white-space: nowrap;
                                transition: color 0.15s ease;
                            }
                            .feed-tab-btn:hover { color: #64748b; }
                            .feed-tab-btn.active { color: #0f172a; }
                            .feed-tab-underline {
                                position: absolute;
                                left: 50%;
                                bottom: 0;
                                transform: translateX(-50%);
                                width: 46px;
                                height: 2px;
                                background: #0f172a;
                                border-radius: 999px;
                            }
                        `}</style>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                className="feed-tabs-row"
                                style={{
                                    width: "100%",
                                    maxWidth: isMobile ? "100%" : `${MAIN_COLUMN_MAX_WIDTH}px`,
                                    justifyContent: isMobile ? "flex-start" : "center",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange("all")}
                                    className={`feed-tab-btn ${feedFilter === "all" ? "active" : ""}`}
                                >
                                    Discover
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange("following")}
                                    className={`feed-tab-btn ${feedFilter === "following" ? "active" : ""}`}
                                >
                                    Following
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateParams({ type: "posts" })}
                                    className={`feed-tab-btn ${feedType === "posts" ? "active" : ""}`}
                                >
                                    Posts
                                    {feedType === "posts" && <span className="feed-tab-underline" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateParams({ type: "projects" })}
                                    className={`feed-tab-btn ${feedType === "projects" ? "active" : ""}`}
                                >
                                    Projects
                                    {feedType === "projects" && <span className="feed-tab-underline" />}
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Popular Users - Mobile/Tablet Only - Hidden by request */}
                    {/* {width < 1024 && <PopularUsersHorizontal />} */}

                    {/* Tech Stack Tags - Only for Projects */}
                    {feedType === "projects" && (
                        <div style={{
                            display: "flex",
                            gap: "8px",
                            padding: "8px 16px 12px",
                            borderBottom: "1px solid #eff3f4",
                            backgroundColor: "#fff",
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none"
                        }} className="no-scrollbar">
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar { display: none; }
                            `}</style>
                            {["All", "React", "TypeScript", "Next.js", "Node.js", "Python", "Tailwind", "Flutter", "Rust", "Go", "Supabase", "AI"].map((tag) => {
                                const isSelected = (tag === "All" && !selectedTag) || (selectedTag === tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => updateParams({ tag: tag === "All" ? null : tag })}
                                        style={{
                                            padding: "5px 12px",
                                            borderRadius: "20px",
                                            border: isSelected ? "1px solid #212121" : "1px solid #eff3f4",
                                            backgroundColor: isSelected ? "#f8fafc" : "#fff",
                                            color: isSelected ? "#212121" : "#64748b",
                                            fontSize: "12px",
                                            fontWeight: isSelected ? 800 : 500,
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            transition: "all 0.2s ease"
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc";
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = "#fff";
                                        }}
                                    >
                                        {tag === "All" ? tag : `#${tag}`}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Maintenance Disclaimer */}
                    {/* <div style={{
                        padding: "24px",
                        backgroundColor: "#fff",
                        borderBottom: "1px solid #eff3f4",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            color: "#0f172a"
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                backgroundColor: "rgba(59, 130, 246, 0.05)",
                                borderRadius: "8px",
                                color: "#3b82f6"
                            }}>
                                <HugeiconsIcon icon={Configuration01Icon} style={{ width: "18px", height: "18px" }} />
                            </div>
                            <h2 style={{
                                fontSize: "16px",
                                fontWeight: 800,
                                margin: 0,
                                letterSpacing: "-0.02em",
                                textTransform: "none"
                            }}>
                                Temporary Service Interruption
                            </h2>
                        </div>
                        <p style={{
                            fontSize: "14px",
                            color: "#64748b",
                            lineHeight: 1.6,
                            margin: 0,
                            fontWeight: 500
                        }}>
                            Codeown is currently undergoing scheduled infrastructure migration. Consequently, some features may be temporarily unavailable as we transition to a more robust hosting environment.
                            Our team is working to restore full service as soon as possible. We apologize for the inconvenience.
                        </p>
                    </div> */}

                    {/* Spotlight */}


                    {/* Composer */}
                    {feedType === "posts" && (
                        <FeedPostComposer onCreated={handlePostCreated} />
                    )}

                    {
                        isInitialLoading ? (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} style={{ padding: "20px", borderBottom: "1px solid #eff3f4" }}>
                                        <PostCardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : currentItems.length === 0 && !loading ? (
                            <div className="fade-in" style={{ padding: "80px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                {feedFilter === "following" ? (
                                    <>
                                        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>
                                            Follow creators to see their activity
                                        </h2>
                                        <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 32px" }}>
                                            It looks like you haven't followed anyone yet. Discover amazing creators and start building your feed!
                                        </p>
                                        <button
                                            onClick={() => handleFilterChange("all")}
                                            style={{
                                                padding: "12px 24px",
                                                backgroundColor: "#212121",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "100px",
                                                fontWeight: 700,
                                                fontSize: "15px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Explore
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>
                                            Nothing here yet
                                        </h2>
                                        <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6 }}>
                                            Check back later for new {feedType}!
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="feed-stream" style={{ display: "flex", flexDirection: "column" }}>
                                {feedType === "posts" ? (
                                    // Items are Posts
                                    (currentItems as any[]).map((p) => (
                                        <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(undefined, false)} />
                                    ))
                                ) : (
                                    // Items are Projects
                                    (currentItems as any[]).map((p) => (
                                        <ProjectCard key={p.id} project={p} onUpdated={() => fetchProjects(undefined, false)} />
                                    ))
                                )}

                                {loading && (
                                    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                                        <div className="spinner" />
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div>

                {/* Sidebar Column */}
                {isDesktop && (
                    <div style={{
                        width: `${SIDEBAR_WIDTH}px`,
                        flexShrink: 0,
                        marginLeft: "24px",
                        alignSelf: "stretch"
                    }}>
                        <RecommendedUsersSidebar />
                    </div>
                )}
                {isMobile && <div style={{ height: "40px" }} />}
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
