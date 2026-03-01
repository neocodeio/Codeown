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
        <main style={{ padding: 0, minHeight: "100vh", backgroundColor: "#fff" }}>
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
                flexDirection: isDesktop ? "row" : "column",
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
                maxWidth: isDesktop ? MAIN_COLUMN_MAX_WIDTH + SIDEBAR_WIDTH + 80 : 960,
                margin: "0 auto",
                padding: isDesktop ? "0 24px" : "0 12px",
                boxSizing: "border-box",
                backgroundColor: "#fff",
                gap: isDesktop ? 24 : 0,
            }}>
                {/* Main Feed Column */}
                <div style={{
                    flexShrink: 0,
                    width: isDesktop ? `${MAIN_COLUMN_MAX_WIDTH}px` : "100%",
                    borderLeft: width >= 1024 ? "1px solid #eff3f4" : "none",
                    borderRight: width >= 1024 ? "1px solid #eff3f4" : "none",
                    minHeight: "100vh",
                    position: "relative",
                    zIndex: 1,
                    margin: isDesktop ? "0" : "0 auto"
                }}>
                    {/* Top Tabs */}
                    <div style={{
                        display: "flex",
                        borderBottom: "1px solid #eff3f4",
                        position: "sticky",
                        top: isMobile ? "0px" : 0,
                        marginTop: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(8px)",
                        zIndex: 10,
                        width: "100%"
                    }}>
                        <div
                            onClick={() => handleFilterChange("all")}
                            style={{
                                flex: 1,
                                padding: "16px",
                                textAlign: "center",
                                cursor: "pointer",
                                fontSize: "15px",
                                fontWeight: feedFilter === "all" ? 700 : 500,
                                color: feedFilter === "all" ? "#0f172a" : "#64748b",
                                position: "relative",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            For You
                            {feedFilter === "all" && (
                                <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "56px", height: "4px", backgroundColor: "#212121", borderRadius: "0px" }} />
                            )}
                        </div>
                        <div
                            onClick={() => handleFilterChange("following")}
                            style={{
                                flex: 1,
                                padding: "16px",
                                textAlign: "center",
                                cursor: "pointer",
                                fontSize: "15px",
                                fontWeight: feedFilter === "following" ? 700 : 500,
                                color: feedFilter === "following" ? "#0f172a" : "#64748b",
                                position: "relative",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            Following
                            {feedFilter === "following" && (
                                <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "70px", height: "4px", backgroundColor: "#212121", borderRadius: "0px" }} />
                            )}
                        </div>
                    </div>

                    {/* Popular Users - Mobile/Tablet Only - Hidden by request */}
                    {/* {width < 1024 && <PopularUsersHorizontal />} */}

                    {/* Content Type Selector */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        borderBottom: "1px solid #eff3f4",
                        backgroundColor: "#fff",
                        // marginTop: "15%"
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isMobile ? "center" : "flex-start",
                            gap: "4px",
                            padding: "10px 16px 12px",
                            borderBottom: feedType === "projects" ? "1px solid #f8fafc" : "none",
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isMobile ? 0 : 4,
                                padding: "4px",
                                borderRadius: "999px",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#f9fafb",
                                width: isMobile ? "100%" : "auto",
                                maxWidth: 360,
                                justifyContent: "space-between",
                            }}>
                            <button
                                onClick={() => updateParams({ type: "posts" })}
                                style={{
                                        padding: "8px 14px",
                                        borderRadius: "999px",
                                        border: "none",
                                        backgroundColor: feedType === "posts" ? "#0f172a" : "transparent",
                                        color: feedType === "posts" ? "#ffffff" : "#64748b",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s ease, color 0.2s ease",
                                        whiteSpace: "nowrap",
                                        flex: isMobile ? 1 : undefined,
                                }}
                            >
                                Posts
                            </button>
                            <button
                                onClick={() => updateParams({ type: "projects" })}
                                style={{
                                        padding: "8px 14px",
                                        borderRadius: "999px",
                                        border: "none",
                                        backgroundColor: feedType === "projects" ? "#0f172a" : "transparent",
                                        color: feedType === "projects" ? "#ffffff" : "#64748b",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s ease, color 0.2s ease",
                                        whiteSpace: "nowrap",
                                        flex: isMobile ? 1 : undefined,
                                }}
                            >
                                Projects
                            </button>
                            </div>
                        </div>

                        {/* Tech Stack Tags - Only for Projects */}
                        {feedType === "projects" && (
                            <div style={{
                                display: "flex",
                                gap: "8px",
                                padding: "8px 16px 12px",
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
                    </div>

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
                        padding: "32px 0 32px 16px",
                        display: "flex",
                        justifyContent: "flex-start"
                    }}>
                        <div style={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
                            <RecommendedUsersSidebar />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
