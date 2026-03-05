import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";
// import { HugeiconsIcon } from '@hugeicons/react';
// import { Configuration01Icon } from '@hugeicons/core-free-icons';

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
                title="Home"
                description="Share your projects, discover amazing code, and connect with developers worldwide on Codeown."
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
                        <div
                            style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "flex-start" : "center",
                                justifyContent: "flex-start",
                                padding: "16px 20px 12px",
                                gap: isMobile ? "10px" : "12px",
                                flexWrap: "wrap",
                            }}
                        >
                            <h1
                                style={{
                                    margin: 0,
                                    fontSize: isMobile ? "20px" : "22px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    color: "#0f172a",
                                }}
                            >
                                {/* FEED */}
                            </h1>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: isMobile ? "column" : "row",
                                    alignItems: "center",
                                    justifyContent: isMobile ? "stretch" : "flex-end",
                                    gap: isMobile ? 6 : 8,
                                    width: isMobile ? "100%" : "auto",
                                }}
                            >
                                {/* Discover / Following */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "4px",
                                        borderRadius: "999px",
                                        backgroundColor: "#f3f4f6",
                                        border: "1px solid #e5e7eb",
                                        gap: "4px",
                                        width: isMobile ? "100%" : "auto",
                                        maxWidth: isMobile ? 360 : undefined,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange("all")}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            cursor: "pointer",
                                            padding: "5px 8px",
                                            borderRadius: "999px",
                                            fontSize: isMobile ? "13px" : "12px",
                                            fontWeight: 600,
                                            flex: isMobile ? 1 : undefined,
                                            textAlign: "center",
                                            backgroundColor:
                                                feedFilter === "all" ? "#ffffff" : "transparent",
                                            color: feedFilter === "all" ? "#111827" : "#6b7280",
                                            boxShadow:
                                                feedFilter === "all"
                                                    ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                                                    : "none",
                                            transition:
                                                "background-color 0.15s ease, color 0.15s ease",
                                        }}
                                    >
                                        Discover
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange("following")}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            cursor: "pointer",
                                            padding: "5px 10px",
                                            borderRadius: "999px",
                                            fontSize: isMobile ? "13px" : "12px",
                                            fontWeight: 600,
                                            flex: isMobile ? 1 : undefined,
                                            textAlign: "center",
                                            backgroundColor:
                                                feedFilter === "following"
                                                    ? "#ffffff"
                                                    : "transparent",
                                            color: feedFilter === "following" ? "#111827" : "#6b7280",
                                            boxShadow:
                                                feedFilter === "following"
                                                    ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                                                    : "none",
                                            transition:
                                                "background-color 0.15s ease, color 0.15s ease",
                                        }}
                                    >
                                        Following
                                    </button>
                                </div>

                                {/* Posts / Projects */}
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "4px",
                                        borderRadius: "999px",
                                        backgroundColor: "#f3f4f6",
                                        border: "1px solid #e5e7eb",
                                        gap: "4px",
                                        width: isMobile ? "100%" : "auto",
                                        maxWidth: isMobile ? 360 : undefined,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => updateParams({ type: "posts" })}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            cursor: "pointer",
                                            padding: "5px 10px",
                                            borderRadius: "999px",
                                            fontSize: isMobile ? "13px" : "12px",
                                            fontWeight: 600,
                                            flex: isMobile ? 1 : undefined,
                                            textAlign: "center",
                                            backgroundColor:
                                                feedType === "posts" ? "#ffffff" : "transparent",
                                            color: feedType === "posts" ? "#111827" : "#6b7280",
                                            boxShadow:
                                                feedType === "posts"
                                                    ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                                                    : "none",
                                            transition:
                                                "background-color 0.15s ease, color 0.15s ease",
                                        }}
                                    >
                                        Posts
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateParams({ type: "projects" })}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            cursor: "pointer",
                                            padding: "5px 10px",
                                            borderRadius: "999px",
                                            fontSize: isMobile ? "13px" : "12px",
                                            fontWeight: 600,
                                            flex: isMobile ? 1 : undefined,
                                            textAlign: "center",
                                            backgroundColor:
                                                feedType === "projects" ? "#ffffff" : "transparent",
                                            color: feedType === "projects" ? "#111827" : "#6b7280",
                                            boxShadow:
                                                feedType === "projects"
                                                    ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                                                    : "none",
                                            transition:
                                                "background-color 0.15s ease, color 0.15s ease",
                                        }}
                                    >
                                        Projects
                                    </button>
                                </div>
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
                        minHeight: "100vh",
                        paddingLeft: "24px",
                    }}>
                        <div style={{ position: "sticky", top: "0px", padding: "24px 24px 0" }}>
                            <RecommendedUsersSidebar />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
