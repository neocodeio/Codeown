import { useEffect, useCallback, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import BackToTop from "../components/BackToTop";
import { CaretDown } from "phosphor-react";

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);


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
                            height: "64px",
                            width: "100%",
                            borderBottom: "1px solid var(--border-hairline)",
                            position: "relative"
                        }}>
                            {/* "For You" Tab with Dropdown */}
                            <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "center" }} ref={dropdownRef}>
                                <button
                                    onClick={() => {
                                        if (feedFilter === "all") {
                                            setIsDropdownOpen(!isDropdownOpen);
                                        } else {
                                            handleFilterChange("all");
                                        }
                                    }}
                                    aria-label="Switch to Discover feed"
                                    style={{
                                        background: "none", border: "none", padding: "0 16px",
                                        height: "100%", position: "relative", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "6px",
                                        fontSize: "12px",
                                        fontWeight: feedFilter === "all" ? "600" : "500",
                                        color: feedFilter === "all" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.15s ease",
                                        whiteSpace: "nowrap",
                                        fontFamily: "var(--font-mono)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em"
                                    }}
                                >
                                    For You
                                    {feedFilter === "all" && (
                                        <CaretDown size={14} weight="bold" style={{
                                            transition: "transform 0.2s ease",
                                            transform: isDropdownOpen ? "rotate(-180deg)" : "none",
                                            marginTop: "-1px"
                                        }} />
                                    )}
                                    {feedFilter === "all" && (
                                        <div style={{
                                            position: "absolute", bottom: "-1px", left: 0, right: 0,
                                            height: "1px", backgroundColor: "var(--text-primary)",
                                        }} />
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div style={{
                                        position: "absolute", top: "100%", left: "25%", transform: "translateX(-50%)",
                                        marginTop: "4px", backgroundColor: "var(--bg-page)",
                                        border: "0.5px solid var(--border-hairline)", borderRadius: "2px",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 100,
                                        width: "180px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px"
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateParams({ type: "posts" }); setIsDropdownOpen(false); }}
                                            style={{
                                                textAlign: "left", padding: "12px 16px", borderRadius: "1px",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: feedType === "posts" ? "var(--text-primary)" : "var(--text-secondary)",
                                                fontSize: "12px", fontWeight: feedType === "posts" ? "800" : "600",
                                                fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em",
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                transition: "all 0.15s ease"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateParams({ type: "projects" }); setIsDropdownOpen(false); }}
                                            style={{
                                                textAlign: "left", padding: "12px 16px", borderRadius: "1px",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: feedType === "projects" ? "var(--text-primary)" : "var(--text-secondary)",
                                                fontSize: "12px", fontWeight: feedType === "projects" ? "800" : "600",
                                                fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em",
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                transition: "all 0.15s ease"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        >
                                            Projects
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* "Following" Tab */}
                            <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "center" }}>
                                <button
                                    onClick={() => handleFilterChange("following")}
                                    aria-label="Switch to Following feed"
                                    style={{
                                        background: "none", border: "none", padding: "0 16px",
                                        height: "100%", position: "relative", cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: feedFilter === "following" ? "600" : "500",
                                        color: feedFilter === "following" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.15s ease",
                                        whiteSpace: "nowrap",
                                        fontFamily: "var(--font-mono)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em"
                                    }}
                                >
                                    Following
                                    {feedFilter === "following" && (
                                        <div style={{
                                            position: "absolute", bottom: "-1px", left: 0, right: 0,
                                            height: "1px", backgroundColor: "var(--text-primary)",
                                        }} />
                                    )}
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
                                            aria-label={`Filter by ${tag}`}
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
                            <>
                                {feedType === "posts"
                                    ? (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{
                                            borderBottom: "0.5px solid var(--border-hairline)",
                                            animation: "slideDownFadeIn 0.4s cubic-bezier(0.2, 0, 0, 1) forwards"
                                        }}>
                                            <PostCard post={p} onUpdated={() => fetchPosts(undefined, false)} />
                                        </div>
                                    ))
                                    : (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{
                                            borderBottom: "0.5px solid var(--border-hairline)",
                                            animation: "slideDownFadeIn 0.4s cubic-bezier(0.2, 0, 0, 1) forwards"
                                        }}>
                                            <ProjectCard project={p} onUpdated={() => fetchProjects(undefined, false)} />
                                        </div>
                                    ))
                                }
                                {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>LOADING...</div>}
                                <style>{`
                                @keyframes slideDownFadeIn {
                                    from { opacity: 0; transform: translateY(-10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>
                            </>
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
            <BackToTop />
        </main>
    );
}
