import { useEffect, useCallback, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
    Notification01Icon,
    Search01Icon
} from "@hugeicons/core-free-icons";

import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";
import ActivityIndicator from "../components/ActivityIndicator";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import StreakBadge from "../components/StreakBadge";
import { useNotifications } from "../hooks/useNotifications";
import { Link } from "react-router-dom";


export default function Feed() {
    const navigate = useNavigate();
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
    const { isSignedIn } = useClerkUser();
    const { unreadCount } = useNotifications();

    // Streak count fetch
    const { data: streakData } = useQuery({
        queryKey: ["streakCount"],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return { streak_count: 0 };
            const res = await api.post("/users/streak/update", {}, { headers: { Authorization: `Bearer ${token}` } });
            return res.data || { streak_count: 0 };
        },
        enabled: isDesktop && isSignedIn,
        staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const streakCount = streakData?.streak_count ?? 0;


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

    const [showNotificationTooltip, setShowNotificationTooltip] = useState(false);
    const [showStreakTooltip, setShowStreakTooltip] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

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

                    {/* ── Precision Glassmorphism Header ── */}
                    <div style={{
                        position: "sticky",
                        top: isMobile ? "64px" : "0",
                        zIndex: 100,
                        backgroundColor: "var(--bg-page)",
                        borderBottom: "0.5px solid var(--border-hairline)",
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
                                <div style={{ marginBottom: "20px", fontSize: "32px", opacity: 0.2 }}>🧊</div>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Quiet in here</h3>
                                <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Be the first to share something amazing.</p>
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

                                {loading && (
                                    <div style={{ padding: "60px", textAlign: "center", display: "flex", justifyContent: "center" }}>
                                        <div style={{
                                            width: "20px", height: "20px",
                                            border: "2px solid var(--border-hairline)",
                                            borderTopColor: "var(--text-primary)",
                                            borderRadius: "50%",
                                            animation: "spin 0.8s linear infinite"
                                        }} />
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
                        <div style={{
                            height: "58px",
                            flexShrink: 0,
                            borderBottom: "0.5px solid var(--border-hairline)",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            padding: "0 20px",
                            gap: "10px",
                            zIndex: 10
                        }}>
                            {/* Search Input */}
                            <div style={{
                                position: "relative",
                                flex: 1,
                                maxWidth: "240px",
                                marginRight: "auto"
                            }}>
                                <span style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-tertiary)",
                                    display: "flex",
                                    alignItems: "center",
                                    pointerEvents: "none"
                                }}>
                                    <HugeiconsIcon icon={Search01Icon} size={16} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search Codeown"
                                    className="header-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearch}
                                    style={{
                                        width: "100%",
                                        height: "36px",
                                        backgroundColor: "var(--bg-page)",
                                        borderRadius: "14px",
                                        padding: "0 12px 0 36px",
                                        fontSize: "12px",
                                        color: "var(--text-primary)",
                                        outline: "none",
                                        transition: "all 0.2s ease"
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = "var(--text-tertiary)";
                                        // e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = "#e0e0e0";
                                        e.currentTarget.style.backgroundColor = "var(--bg-page)";
                                    }}
                                />
                            </div>

                            {isSignedIn && (
                                <div
                                    style={{ position: "relative" }}
                                    onMouseEnter={() => setShowNotificationTooltip(true)}
                                    onMouseLeave={() => setShowNotificationTooltip(false)}
                                >
                                    <Link
                                        to="/notifications"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            color: unreadCount > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                                            position: "relative",
                                            transition: "all 0.2s ease",
                                            textDecoration: "none"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = "var(--text-primary)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = unreadCount > 0 ? "var(--text-primary)" : "var(--text-tertiary)";
                                        }}
                                    >
                                        <HugeiconsIcon icon={Notification01Icon} size={20} />
                                        {unreadCount > 0 && (
                                            <span style={{
                                                position: "absolute",
                                                top: "-2px",
                                                right: "-2px",
                                                minWidth: "16px",
                                                height: "16px",
                                                backgroundColor: "#ef4444",
                                                color: "#fff",
                                                borderRadius: "50%",
                                                fontSize: "9px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 800,
                                                border: "2px solid var(--bg-page)"
                                            }}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Tooltip */}
                                    <div style={{
                                        position: "absolute",
                                        top: "calc(100% + 10px)",
                                        left: "50%",
                                        transform: showNotificationTooltip ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-5px)",
                                        opacity: showNotificationTooltip ? 1 : 0,
                                        visibility: showNotificationTooltip ? "visible" : "hidden",
                                        backgroundColor: "#000",
                                        color: "#fff",
                                        padding: "5px 12px",
                                        borderRadius: "50px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        zIndex: 1000,
                                        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                        pointerEvents: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                    }}>
                                        Notifications
                                        {/* Arrow */}
                                        <div style={{
                                            position: "absolute",
                                            top: "-4px",
                                            left: "50%",
                                            transform: "translateX(-50%) rotate(45deg)",
                                            width: "8px",
                                            height: "8px",
                                            backgroundColor: "#000",
                                            zIndex: -1
                                        }} />
                                    </div>
                                </div>
                            )}
                            {streakCount > 0 && (
                                <div
                                    style={{ position: "relative" }}
                                    onMouseEnter={() => setShowStreakTooltip(true)}
                                    onMouseLeave={() => setShowStreakTooltip(false)}
                                >
                                    <StreakBadge count={streakCount} />

                                    {/* Tooltip */}
                                    <div style={{
                                        position: "absolute",
                                        top: "calc(100% + 10px)",
                                        left: "50%",
                                        transform: showStreakTooltip ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-5px)",
                                        opacity: showStreakTooltip ? 1 : 0,
                                        visibility: showStreakTooltip ? "visible" : "hidden",
                                        backgroundColor: "#000",
                                        color: "#fff",
                                        padding: "5px 12px",
                                        borderRadius: "50px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        zIndex: 1000,
                                        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                        pointerEvents: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                    }}>
                                        Activity Streak
                                        {/* Arrow */}
                                        <div style={{
                                            position: "absolute",
                                            top: "-4px",
                                            left: "50%",
                                            transform: "translateX(-50%) rotate(45deg)",
                                            width: "8px",
                                            height: "8px",
                                            backgroundColor: "#000",
                                            zIndex: -1
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>
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
