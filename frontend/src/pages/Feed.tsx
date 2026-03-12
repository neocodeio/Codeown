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
        <main style={{ padding: 0, backgroundColor: "#fff", minHeight: "100vh" }}>
            <SEO title="Discover" description="Connect with builders worldwide." />

            <div style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: isDesktop ? "1300px" : "100%",
                margin: "0 auto",
                padding: isDesktop ? "0 32px" : "0",
            }}>
                {/* ── Main Feed Column ── */}
                <div style={{
                    width: "100%",
                    maxWidth: isDesktop ? "700px" : "100%",
                    flexShrink: 0,
                    border: isDesktop ? "2px solid #f1f5f9" : "none",
                    minHeight: "100vh",
                    position: "relative"
                }}>

                    {/* ── Minimal Apple-Style Header ── */}
                    <div style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(20px)",
                        borderBottom: "3px solid #f1f5f9",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: isMobile ? "56px" : "64px",
                            padding: isMobile ? "0 16px" : "0 24px",
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
                                            fontSize: isMobile ? "14px" : "15px",
                                            fontWeight: feedFilter === tab.id ? "700" : "500",
                                            color: feedFilter === tab.id ? "#0f172a" : "#94a3b8",
                                            transition: "all 0.2s ease", whiteSpace: "nowrap"
                                        }}
                                    >
                                        {tab.label}
                                        {feedFilter === tab.id && (
                                            <div style={{
                                                position: "absolute", bottom: "-1px", left: 0, right: 0,
                                                height: "2px", backgroundColor: "#0f172a",
                                            }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Feed Type Switcher */}
                            <div style={{ display: "flex", gap: "2px", flexShrink: 0, backgroundColor: "#f8fafc", padding: "2px", borderRadius: "100px", border: "1px solid #e2e8f0" }}>
                                <button
                                    onClick={() => updateParams({ type: "posts" })}
                                    style={{
                                        background: feedType === "posts" ? "#fff" : "none",
                                        border: feedType === "posts" ? "1px solid #e2e8f0" : "none",
                                        padding: isMobile ? "6px 12px" : "8px 16px",
                                        borderRadius: "100px",
                                        fontSize: isMobile ? "11px" : "13px",
                                        fontWeight: "700",
                                        color: feedType === "posts" ? "#0f172a" : "#94a3b8",
                                        cursor: "pointer",
                                        boxShadow: feedType === "posts" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Posts
                                </button>
                                <button
                                    onClick={() => updateParams({ type: "projects" })}
                                    style={{
                                        background: feedType === "projects" ? "#fff" : "none",
                                        border: feedType === "projects" ? "1px solid #e2e8f0" : "none",
                                        padding: isMobile ? "6px 12px" : "8px 16px",
                                        borderRadius: "100px",
                                        fontSize: isMobile ? "11px" : "13px",
                                        fontWeight: "700",
                                        color: feedType === "projects" ? "#0f172a" : "#94a3b8",
                                        cursor: "pointer",
                                        boxShadow: feedType === "projects" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Projects
                                </button>
                            </div>
                        </div>

                        {feedType === "projects" && (
                            <div style={{
                                display: "flex",
                                gap: "8px",
                                padding: "10px 16px",
                                overflowX: "auto",
                                borderTop: "1px solid #f8fafc"
                            }} className="no-scrollbar">
                                {["All", "React", "TypeScript", "Next.js", "Node.js", "Python", "Tailwind"].map(tag => {
                                    const isSelected = (tag === "All" && !selectedTag) || selectedTag === tag;
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => updateParams({ tag: tag === "All" ? null : tag })}
                                            style={{
                                                flexShrink: 0, padding: "6px 14px", borderRadius: "100px",
                                                border: "1px solid",
                                                borderColor: isSelected ? "#0f172a" : "#f1f5f9",
                                                backgroundColor: isSelected ? "#0f172a" : "#fff",
                                                color: isSelected ? "#fff" : "#64748b",
                                                fontSize: "12px", fontWeight: "600", cursor: "pointer",
                                                transition: "all 0.2s"
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
                            <div style={{ borderBottom: "1px solid #f1f5f9" }}>
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
                                <div style={{ marginBottom: "16px", fontSize: "48px" }}>🧊</div>
                                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "8px", letterSpacing: "-0.01em" }}>Quiet in here...</h3>
                                <p style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Be the first to share something amazing with the community.</p>
                            </div>
                        ) : (
                            <div>
                                {feedType === "posts"
                                    ? (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <PostCard post={p} onUpdated={() => fetchPosts(undefined, false)} />
                                        </div>
                                    ))
                                    : (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <ProjectCard project={p} onUpdated={() => fetchProjects(undefined, false)} />
                                        </div>
                                    ))
                                }
                                {loading && <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px", fontWeight: "600" }}>Loading more...</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Sidebar ── */}
                {isDesktop && (
                    <div style={{
                        width: "350px",
                        paddingLeft: "32px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        borderLeft: "1px solid #f1f5f9",
                        flexShrink: 0,
                        zIndex: 1
                    }}>
                        <RecommendedUsersSidebar />
                    </div>
                )}
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </main>
    );
}
