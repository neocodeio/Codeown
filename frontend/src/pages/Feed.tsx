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
        let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
        
        const handleScroll = () => {
            if (throttleTimeout) return;
            
            throttleTimeout = setTimeout(() => {
                const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1200;
                if (scrolledToBottom && hasMore && !loading) {
                    if (feedType === "posts") fetchPosts(undefined, true);
                    else fetchProjects(undefined, true);
                }
                throttleTimeout = null;
            }, 200);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
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
                        backgroundColor: "color-mix(in srgb, var(--bg-page), transparent 15%)", // theme-aware glass
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            height: "56px",
                            width: "100%",
                            position: "relative",
                            justifyContent: "center",
                            gap: "8px"
                        }}>
                            {/* "For You" Tab with Dropdown */}
                            <div style={{ position: "relative" }} ref={dropdownRef}>
                                <button
                                    onClick={() => {
                                        if (feedFilter === "all") setIsDropdownOpen(!isDropdownOpen);
                                        else handleFilterChange("all");
                                    }}
                                    style={{
                                        background: "none", border: "none", padding: "0 24px",
                                        height: "40px", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "8px",
                                        fontSize: "12px",
                                        fontWeight: feedFilter === "all" ? "700" : "500",
                                        color: feedFilter === "all" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.15s ease",
                                        fontFamily: "var(--font-mono)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        borderRadius: "2px"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (feedFilter !== "all") e.currentTarget.style.color = "var(--text-secondary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (feedFilter !== "all") e.currentTarget.style.color = "var(--text-tertiary)";
                                    }}
                                >
                                    {feedType === "posts" ? "DISCOVER" : "PROJECTS"}
                                    <CaretDown size={12} weight="bold" style={{
                                        transition: "transform 0.2s ease",
                                        transform: isDropdownOpen ? "rotate(-180deg)" : "none",
                                        opacity: feedFilter === "all" ? 1 : 0.5
                                    }} />
                                    {feedFilter === "all" && (
                                        <div style={{
                                            position: "absolute", bottom: "0px", left: "20px", right: "20px",
                                            height: "2px", backgroundColor: "var(--text-primary)",
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
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => handleFilterChange("following")}
                                    style={{
                                        background: "none", border: "none", padding: "0 24px",
                                        height: "40px", cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: feedFilter === "following" ? "700" : "500",
                                        color: feedFilter === "following" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.15s ease",
                                        fontFamily: "var(--font-mono)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        borderRadius: "2px"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (feedFilter !== "following") e.currentTarget.style.color = "var(--text-secondary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (feedFilter !== "following") e.currentTarget.style.color = "var(--text-tertiary)";
                                    }}
                                >
                                    Following
                                    {feedFilter === "following" && (
                                        <div style={{
                                            position: "absolute", bottom: "0px", left: "20px", right: "20px",
                                            height: "2px", backgroundColor: "var(--text-primary)",
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
                                                border: "none",
                                                backgroundColor: isSelected ? "var(--text-primary)" : "var(--bg-hover)",
                                                color: isSelected ? "var(--bg-page)" : "var(--text-secondary)",
                                                fontSize: "11px", fontWeight: "700", cursor: "pointer",
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
                                    <div key={i} style={{ padding: isMobile ? "24px 16px" : "40px", borderBottom: "0.5px solid var(--border-hairline)" }}>
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
                                            <PostCard post={p} onUpdated={handlePostCreated} />
                                        </div>
                                    ))
                                    : (currentItems as any[]).map(p => (
                                        <div key={p.id} style={{
                                            borderBottom: "0.5px solid var(--border-hairline)",
                                            animation: "slideDownFadeIn 0.4s cubic-bezier(0.2, 0, 0, 1) forwards"
                                        }}>
                                            <ProjectCard project={p} onUpdated={handleProjectCreated} />
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
