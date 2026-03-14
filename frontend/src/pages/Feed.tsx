import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";


export default function Feed() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1100;
    const [searchParams, setSearchParams] = useSearchParams();

    // Sync state with URL params
    const feedType = (searchParams.get("type") as "posts" | "projects") || "posts";
    const feedFilter = (searchParams.get("filter") as FeedFilter) || "all";
    const selectedTag = searchParams.get("tag") || "";
    const selectedLang = (searchParams.get("lang") as "en" | "ar" | "") || "";

    // Helper to update search params
    const updateParams = (newParams: Record<string, string | null>) => {
        setSearchParams(prev => {
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

    const handleFilterChange = (filter: FeedFilter) => updateParams({ filter });

    const { getToken } = useClerkAuth();

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
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
                if (hasMore && !loading) {
                    if (feedType === "posts") fetchPosts(undefined, true);
                    else fetchProjects(undefined, true);
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMore, loading, fetchPosts, fetchProjects, feedType]);

    const currentItems = feedType === "posts" ? posts : projects;

    const handlePostCreated = useCallback(() => fetchPosts(undefined, false), [fetchPosts]);
    const handleProjectCreated = useCallback(() => fetchProjects(undefined, false), [fetchProjects]);

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
        <main style={{ padding: 0, backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
            <SEO title="Discover" description="Connect with builders worldwide." />

            <div style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1100px",
                margin: "0 auto",
                padding: isDesktop ? "0 20px" : "0",
            }}>
                {/* ── Main Feed Column ── */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    flexShrink: 0,
                    border: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    position: "relative",
                    backgroundColor: "var(--bg-page)"
                }}>

                    {/* ── Minimal Apple-Style Header ── */}
                    <div style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        backgroundColor: "var(--bg-page)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: "64px",
                            padding: "0 24px",
                            gap: "8px"
                        }}>
                            {/* Tabs Column */}
                            <div style={{
                                display: "flex",
                                gap: isMobile ? "16px" : "28px",
                                height: "100%",
                                overflowX: "auto",
                                scrollbarWidth: "none"
                            }} className="no-scrollbar">
                                {[
                                    { id: "all", label: "Discover" },
                                    { id: "following", label: "Following" }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleFilterChange(tab.id as any)}
                                        style={{
                                            background: "none", border: "none", padding: "0",
                                            height: "100%", position: "relative", cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: feedFilter === tab.id ? "600" : "500",
                                            color: feedFilter === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
                                            transition: "all 0.15s ease",
                                            whiteSpace: "nowrap",
                                            fontFamily: "var(--font-mono)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em"
                                        }}
                                    >
                                        {tab.label}
                                        {feedFilter === tab.id && (
                                            <div style={{
                                                position: "absolute", bottom: "-0.5px", left: 0, right: 0,
                                                height: "1px", backgroundColor: "var(--text-primary)",
                                            }} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Feed Type Switcher */}
                            <div style={{ display: "flex", gap: "2px", flexShrink: 0, backgroundColor: "var(--bg-input)", padding: "3px", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }}>
                                <button
                                    onClick={() => updateParams({ type: "posts" })}
                                    style={{
                                        background: feedType === "posts" ? "var(--text-primary)" : "none",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "1px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        fontFamily: "var(--font-mono)",
                                        color: feedType === "posts" ? "var(--bg-page)" : "var(--text-tertiary)",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}
                                >
                                    Posts
                                </button>
                                <button
                                    onClick={() => updateParams({ type: "projects" })}
                                    style={{
                                        background: feedType === "projects" ? "var(--text-primary)" : "none",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "1px",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        fontFamily: "var(--font-mono)",
                                        color: feedType === "projects" ? "var(--bg-page)" : "var(--text-tertiary)",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}
                                >
                                    Projects
                                </button>
                            </div>
                        </div>

                        {feedType === "projects" && (
                            <div style={{
                                display: "flex",
                                gap: "10px",
                                padding: "12px 24px",
                                overflowX: "auto",
                                borderTop: "0.5px solid var(--border-hairline)",
                                backgroundColor: "var(--bg-page)"
                            }} className="no-scrollbar">
                                {["All", "React", "TypeScript", "Next.js", "Node.js", "Python", "Tailwind"].map(tag => {
                                    const isSelected = (tag === "All" && !selectedTag) || selectedTag === tag;
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => updateParams({ tag: tag === "All" ? null : tag })}
                                            style={{
                                                flexShrink: 0, padding: "8px 16px", borderRadius: "2px",
                                                border: "0.5px solid",
                                                borderColor: isSelected ? "var(--text-primary)" : "var(--border-hairline)",
                                                backgroundColor: isSelected ? "var(--text-primary)" : "transparent",
                                                color: isSelected ? "var(--bg-page)" : "var(--text-secondary)",
                                                fontSize: "12px", fontWeight: "700", cursor: "pointer",
                                                transition: "all 0.15s ease",
                                                fontFamily: "var(--font-mono)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em"
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Content ── */}
                    <div style={{ minHeight: "100vh" }}>
                        {feedType === "posts" && (
                            <div style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                <FeedPostComposer onCreated={handlePostCreated} />
                            </div>
                        )}

                        {isInitialLoading ? (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} style={{ padding: isMobile ? "24px 16px" : "32px", borderBottom: "1px solid #f1f5f9" }}>
                                        <PostCardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : currentItems.length === 0 && !loading ? (
                            <div style={{ padding: "120px 24px", textAlign: "center" }}>
                                <div style={{ marginBottom: "20px", fontSize: "32px", opacity: 0.1 }}>🧊</div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "0.05em", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Quiet in here</h3>
                                <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>Be the first to share something amazing with the community.</p>
                            </div>
                        ) : (
                            <div>
                                {feedType === "posts"
                                    ? (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                            <PostCard post={p} onUpdated={() => fetchPosts(undefined, false)} />
                                        </div>
                                    ))
                                    : (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                            <ProjectCard project={p} onUpdated={() => fetchProjects(undefined, false)} />
                                        </div>
                                    ))
                                }
                                {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>LOADING...</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Sidebar ── */}
                {isDesktop && (
                    <aside style={{
                        width: "340px",
                        paddingLeft: "12px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        zIndex: 1,
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </main>
    );
}
