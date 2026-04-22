import { useEffect, useCallback, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import BackToTop from "../components/BackToTop";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowDown01Icon,
    Rocket01Icon,
    LicenseIcon,
    ArrowUp01Icon,
    SpamIcon
    // Cancel01Icon,
    // AlertCircleIcon
} from "@hugeicons/core-free-icons";

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
    const [newPostActors, setNewPostActors] = useState<any[]>([]);
    const [scrolledDown, setScrolledDown] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    // const [showErrorBanner, setShowErrorBanner] = useState(true);

    // Track scroll position for the pill
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolledDown(currentScrollY > 600);
            if (currentScrollY < 100) {
                setNewPostActors([]);
            }

            // Mobile header visibility logic
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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

    // Helper to update search params
    const updateParams = (newParams: Record<string, string | null>) => {
        setSearchParams(prev => {
            if (newParams.type && newParams.type !== feedType) {
                prev.delete("tag");
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
    } = usePosts(20, feedFilter, getToken, selectedTag, feedType === "posts");

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
            rootMargin: "0px 0px 1000px 0px"
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchPosts, fetchProjects, feedType]);

    const currentItems = feedType === "posts" ? posts : projects;

    const handlePostCreated = useCallback((e?: any) => {
        // This is called either via global event (real-time/local dispatch)
        // or directly via onCreated callback.
        const newPost = e?.detail;

        // If we have the post data and user is scrolled down, show the pill
        if (window.scrollY > 400 && newPost) {
            setNewPostActors(prev => {
                const actor = newPost.user || newPost.actor;
                if (!actor) return prev;
                if (prev.some(a => a.id === actor.id || a.username === actor.username)) return prev;
                return [actor, ...prev].slice(0, 3);
            });
        }
        // Note: We don't call fetchPosts(undefined, false) here anymore
        // because App.tsx already updates the query cache in real-time.
    }, []);

    const handleProjectCreated = useCallback(() => fetchProjects(undefined, false), [fetchProjects]);

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setNewPostActors([]);
        // Optional: force a refetch if needed, but cache should be fresh
        fetchPosts(undefined, false);
    };

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
            <SEO title="Feed" description="Connect with builders worldwide." />

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: isDesktop ? "920px" : "100%",
                margin: "0 auto",
                padding: "0",
            }}>
                {/* ── Main Feed Column ── */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "600px",
                    margin: isDesktop ? "0" : "0 auto",
                    flexShrink: 0,
                    borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    minHeight: "100vh",
                    position: "relative",
                    backgroundColor: "var(--bg-page)",
                }}>
                    {/* ── New Posts Pill ── */}
                    {newPostActors.length > 0 && scrolledDown && (
                        <div style={{
                            position: "fixed",
                            top: isMobile ? "80px" : "80px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 1000,
                            animation: "pillFadeUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                        }}>
                            <button
                                onClick={handleScrollToTop}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    backgroundColor: "#1d9bf0", // Twitter-like blue from reference
                                    color: "#fff",
                                    padding: "10px 18px 10px 16px",
                                    borderRadius: "100px",
                                    border: "none",
                                    cursor: "pointer",
                                    boxShadow: "0 8px 30px rgba(29, 155, 240, 0.4)",
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    backdropFilter: "blur(10px)"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(29, 155, 240, 0.6)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(29, 155, 240, 0.4)";
                                }}
                            >
                                <HugeiconsIcon icon={ArrowUp01Icon} size={18} />
                                <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                                    <div style={{ display: "flex", alignItems: "center", marginRight: "12px" }}>
                                        {newPostActors.map((actor, i) => (
                                            <img
                                                key={actor.id || i}
                                                src={actor.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                                                alt=""
                                                style={{
                                                    width: "26px",
                                                    height: "26px",
                                                    borderRadius: "50%",
                                                    border: "2px solid #1d9bf0",
                                                    marginLeft: i === 0 ? 0 : "-12px",
                                                    objectFit: "cover",
                                                    zIndex: 3 - i,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ letterSpacing: "-0.01em" }}>posted</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ── Precision Glassmorphism Header ── */}
                    <div style={{
                        position: "sticky",
                        top: isMobile ? (isVisible ? "64px" : "0") : "0",
                        zIndex: 100,
                        backgroundColor: "var(--bg-header)",
                        backdropFilter: "blur(24px)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                        transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            height: isMobile ? "54px" : "58px",
                            width: "100%",
                            position: "relative",
                            justifyContent: "center",
                        }}>
                            <ActivityIndicator />

                            {/* "For You" Tab with Dropdown */}
                            <div style={{ position: "relative", height: "100%" }} ref={dropdownRef}>
                                <button
                                    onClick={() => {
                                        if (feedFilter === "all") setIsDropdownOpen(!isDropdownOpen);
                                        else handleFilterChange("all");
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "0 28px",
                                        height: "100%",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontSize: "14.5px",
                                        fontWeight: feedFilter === "all" ? 800 : 500,
                                        color: feedFilter === "all" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                        textTransform: "capitalize",
                                        letterSpacing: "-0.01em",
                                        position: "relative",
                                        opacity: feedFilter === "all" ? 1 : 0.6
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                    onMouseLeave={e => { if (feedFilter !== "all") e.currentTarget.style.opacity = "0.6"; }}
                                >
                                    {feedType === "posts" ? "Posts" : "Projects"}
                                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} style={{
                                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        transform: isDropdownOpen ? "rotate(-180deg)" : "none",
                                        opacity: 0.7
                                    }} />
                                    {feedFilter === "all" && (
                                        <div style={{
                                            position: "absolute", bottom: "-0.5px", left: "20%", right: "20%",
                                            height: "3px", backgroundColor: "var(--text-primary)",
                                            borderRadius: "100px 100px 0 0",
                                            boxShadow: "0 -2px 10px rgba(var(--text-primary-rgb), 0.2)"
                                        }} />
                                    )}
                                </button>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                                        marginTop: "12px",
                                        backgroundColor: "var(--bg-page)",
                                        border: "1px solid var(--border-hairline)",
                                        borderRadius: "20px",
                                        zIndex: 100,
                                        width: "160px",
                                        padding: "8px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        animation: "reactionFadeUp 0.15s ease-out"
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateParams({ type: "posts" }); setIsDropdownOpen(false); }}
                                            style={{
                                                textAlign: "left", padding: "12px 16px", borderRadius: "14px",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "var(--text-primary)",
                                                fontSize: "14px", fontWeight: feedType === "posts" ? 800 : 500,
                                                transition: "all 0.2s ease",
                                                display: "flex", alignItems: "center", gap: "10px"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        >
                                            <HugeiconsIcon icon={LicenseIcon} size={16} />
                                            Posts
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateParams({ type: "projects" }); setIsDropdownOpen(false); }}
                                            style={{
                                                textAlign: "left", padding: "12px 16px", borderRadius: "14px",
                                                background: "none", border: "none", cursor: "pointer",
                                                color: "var(--text-primary)",
                                                fontSize: "14px", fontWeight: feedType === "projects" ? 800 : 500,
                                                transition: "all 0.2s ease",
                                                display: "flex", alignItems: "center", gap: "10px"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                        >
                                            <HugeiconsIcon icon={Rocket01Icon} size={16} />
                                            Projects
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* "Following" Tab */}
                            <div style={{ position: "relative", height: "100%" }}>
                                <button
                                    onClick={() => handleFilterChange("following")}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "0 28px",
                                        height: "100%",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: "14.5px",
                                        fontWeight: feedFilter === "following" ? 800 : 500,
                                        color: feedFilter === "following" ? "var(--text-primary)" : "var(--text-tertiary)",
                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                        letterSpacing: "-0.01em",
                                        position: "relative",
                                        opacity: feedFilter === "following" ? 1 : 0.8
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                    onMouseLeave={e => { if (feedFilter !== "following") e.currentTarget.style.opacity = "0.8"; }}
                                >
                                    Following
                                    {feedFilter === "following" && (
                                        <div style={{
                                            position: "absolute", bottom: "-0.5px", left: "20%", right: "20%",
                                            height: "3px", backgroundColor: "var(--text-primary)",
                                            borderRadius: "100px 100px 0 0",
                                            boxShadow: "0 -2px 10px rgba(var(--text-primary-rgb), 0.2)"
                                        }} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {feedType === "projects" && (
                            <div style={{
                                display: "flex",
                                gap: "15px",
                                padding: "12px 16px",
                                alignItems: "center",
                                overflowX: "auto",
                                borderTop: "0.5px solid var(--border-hairline)",
                                backgroundColor: "transparent"
                            }} className="no-scrollbar">
                                {["All", "React", "TypeScript", "Next.js", "Node.js", "Python", "Tailwind"].map(tag => {
                                    const isSelected = (tag === "All" && !selectedTag) || selectedTag === tag;
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => updateParams({ tag: tag === "All" ? null : tag })}
                                            style={{
                                                flexShrink: 0, padding: "8px 12px", borderRadius: "100px",
                                                border: "0.5px solid var(--border-hairline)",
                                                backgroundColor: isSelected ? "var(--text-primary)" : "transparent",
                                                color: isSelected ? "var(--bg-page)" : "var(--text-secondary)",
                                                fontSize: "13px", fontWeight: "700", cursor: "pointer",
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

                    {/* ── Content Area ── */}
                    <div style={{ minHeight: "100vh" }}>
                        {feedType === "posts" && (
                            <div style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                <FeedPostComposer onCreated={handlePostCreated} />
                            </div>
                        )}

                        {isInitialLoading ? (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} style={{ padding: isMobile ? "16px 12px" : "20px 24px", borderBottom: "0.5px solid var(--border-hairline)" }}>
                                        <PostCardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : currentItems.length === 0 && !loading ? (
                            <div style={{ padding: "120px 24px", textAlign: "center" }}>
                                <div style={{ marginBottom: "10px", fontSize: "32px", opacity: 0.2 }}><HugeiconsIcon icon={SpamIcon} size={32} /></div>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Something went wrong</h3>
                                <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Try refreshing the page, or check your internet connection.</p>
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
                                <div ref={lastElementRef} style={{ height: "100px", width: "100%", visibility: "hidden" }} />

                                {loading && hasMore && (
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        {[...Array(2)].map((_, i) => (
                                            <PostCardSkeleton key={`loading-${i}`} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Right Sidebar ── */}
                {isDesktop && (
                    <aside style={{
                        width: "300px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        height: "100vh"
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>

            <style>{`
                .header-search-input::placeholder {
                    font-size: 12px;
                    opacity: 0.6;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes pillFadeUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes slideDownFadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    main { padding-bottom: 80px !important; }
                }
            `}</style>
            <BackToTop />
        </main>
    );
}
