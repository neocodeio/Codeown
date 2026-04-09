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
import ActivityIndicator from "../components/ActivityIndicator";


export default function Feed() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1200;
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
    } = usePosts(20, feedFilter, getToken, selectedTag, selectedLang || undefined, feedType === "posts");

    const {
        projects,
        loading: projectsLoading,
        fetchProjects,
        hasMore: projectsHasMore
    } = useProjects(20, feedFilter, getToken, selectedTag, feedType === "projects");

    const loading = feedType === "posts" ? postsLoading : projectsLoading;
    const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                if (feedType === "posts") fetchPosts(undefined, true);
                else fetchProjects(undefined, true);
            }
        }, {
            // Trigger load when within 1000px of viewport bottom
            rootMargin: "0px 0px 1000px 0px"
        });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchPosts, fetchProjects, feedType]);

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
                justifyContent: isDesktop ? "flex-start" : "center",
                width: "100%",
                maxWidth: isDesktop ? "1020px" : "100%",
                margin: "0 auto",
                padding: "0",
            }}>
                {/* ── Main Feed Column ── */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "680px",
                    margin: isDesktop ? "0" : "0 auto",
                    flexShrink: 0,
                    border: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderTop: "none",
                    borderBottom: "none",
                    minHeight: "100vh",
                    position: "relative",
                    backgroundColor: "var(--bg-page)",
                }}>

                    {/* ── Minimalist Clean Header ── */}
                    <div style={{
                        position: "sticky",
                        top: isMobile ? "64px" : "0", 
                        zIndex: 100,
                        backgroundColor: "var(--bg-header)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            height: isMobile ? "54px" : "56px",
                            width: "100%",
                            position: "relative",
                            justifyContent: "center",
                            gap: isMobile ? "20px" : "40px",
                        }}>
                            {/* "For You" Tab with Dropdown */}
                            <div style={{ position: "relative" }} ref={dropdownRef}>
                                <button
                                    onClick={() => {
                                        if (feedFilter === "all") setIsDropdownOpen(!isDropdownOpen);
                                        else handleFilterChange("all");
                                    }}
                                    style={{
                                        background: "none", 
                                        border: "none", 
                                        padding: "0 20px",
                                        height: "56px", 
                                        cursor: "pointer",
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "6px",
                                        fontSize: "15px",
                                        fontWeight: feedFilter === "all" ? "700" : "500",
                                        color: feedFilter === "all" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.2s ease",
                                        position: "relative"
                                    }}
                                >
                                    {feedType === "posts" ? "Posts" : "Projects"}
                                    <CaretDown size={14} weight="bold" style={{
                                        transition: "transform 0.2s ease",
                                        transform: isDropdownOpen ? "rotate(-180deg)" : "none",
                                        opacity: 0.5
                                    }} />
                                    {feedFilter === "all" && (
                                        <div style={{
                                            position: "absolute", bottom: "0px", left: "0", right: "0",
                                            height: "3px", backgroundColor: "var(--text-primary)",
                                            borderRadius: "100px 100px 0 0"
                                        }} />
                                    )}
                                </button>

                                {/* Simple Minimal Dropdown */}
                                {isDropdownOpen && (
                                    <div style={{
                                        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                                        marginTop: "8px", backgroundColor: "var(--bg-card)",
                                        border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-md)",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)", zIndex: 100,
                                        width: "140px", padding: "6px", display: "flex", flexDirection: "column", gap: "2px"
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateParams({ type: "posts" }); setIsDropdownOpen(false); }}
                                            style={{
                                                textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "var(--text-primary)",
                                                fontSize: "14px", fontWeight: feedType === "posts" ? "600" : "400",
                                                transition: "background-color 0.2s ease"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        >
                                            Posts
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateParams({ type: "projects" }); setIsDropdownOpen(false); }}
                                            style={{
                                                textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "var(--text-primary)",
                                                fontSize: "14px", fontWeight: feedType === "projects" ? "600" : "400",
                                                transition: "background-color 0.2s ease"
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
                                        background: "none", 
                                        border: "none", 
                                        padding: "0 20px",
                                        height: "56px", 
                                        cursor: "pointer",
                                        fontSize: "15px",
                                        fontWeight: feedFilter === "following" ? "700" : "500",
                                        color: feedFilter === "following" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.2s ease",
                                        position: "relative"
                                    }}
                                >
                                    Following
                                    {feedFilter === "following" && (
                                        <div style={{
                                            position: "absolute", bottom: "0px", left: "0", right: "0",
                                            height: "3px", backgroundColor: "var(--text-primary)",
                                            borderRadius: "100px 100px 0 0"
                                        }} />
                                    )}
                                </button>
                            </div>

                            <ActivityIndicator />
                        </div>

                        {feedType === "projects" && (
                            <div style={{
                                display: "flex",
                                gap: "10px",
                                borderRadius: "0px",
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
                                                 flexShrink: 0, padding: "8px 16px", borderRadius: "100px",
                                                 border: isSelected ? "1px solid var(--text-primary)" : "0.5px solid var(--border-hairline)",
                                                 backgroundColor: isSelected ? "var(--text-primary)" : "transparent",
                                                 color: isSelected ? "var(--bg-page)" : "var(--text-secondary)",
                                                 fontSize: "13px", fontWeight: "500", cursor: "pointer",
                                                 transition: "all 0.15s ease",
                                             }}
                                             onMouseEnter={(e) => {
                                                 if (!isSelected) {
                                                     e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                                     e.currentTarget.style.color = "var(--text-primary)";
                                                 }
                                             }}
                                             onMouseLeave={(e) => {
                                                 if (!isSelected) {
                                                     e.currentTarget.style.backgroundColor = "transparent";
                                                     e.currentTarget.style.color = "var(--text-secondary)";
                                                 }
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
                                <div style={{ marginBottom: "20px", fontSize: "32px", opacity: 0.2 }}>🧊</div>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Quiet in here</h3>
                                <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Be the first to share something amazing with the community.</p>
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
                                {/* PRE-TRIGGER SENTINEL (Above Loader) */}
                                <div ref={lastElementRef} style={{ height: "100px", width: "100%", visibility: "hidden" }} />

                                {loading && (
                                    <div style={{ padding: "60px", textAlign: "center", display: "flex", justifyContent: "center" }}>
                                        <div style={{
                                            width: "20px",
                                            height: "20px",
                                            border: "2px solid var(--border-hairline)",
                                            borderTopColor: "var(--text-primary)",
                                            borderRadius: "50%",
                                            animation: "spin 0.8s linear infinite"
                                        }} />
                                    </div>
                                )}
                                
                                <style>{`
                                @keyframes slideDownFadeIn {
                                    from { opacity: 0; transform: translateY(-5px); }
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
                        paddingLeft: 0,
                        paddingTop: 0,
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
                @media (max-width: 768px) {
                    main { padding-bottom: 80px !important; }
                }
            `}</style>
            <BackToTop />
        </main>
    );
}
