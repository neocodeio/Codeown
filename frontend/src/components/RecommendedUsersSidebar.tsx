import { useNavigate, Link } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Rocket01Icon,
    UserGroupIcon,
    ArrowUp02Icon,
    ArrowRight02Icon
} from "@hugeicons/core-free-icons";

import UserHoverCard from "./UserHoverCard";
import VerifiedBadge from "./VerifiedBadge";
import { formatRelativeDate } from "../utils/date";
import { useProjectLikes } from "../hooks/useProjectLikes";

import AvailabilityBadge from "./AvailabilityBadge";
import SidebarHeader from "./SidebarHeader";
import FollowButton from "./FollowButton";

const getInitials = (title: string) => {
    if (!title) return "??";
    const parts = title.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
};

function RecentLaunchItem({ project }: { project: any }) {
    const { isLiked, likeCount, toggleLike } = useProjectLikes(project.id, project.isLiked, project.likes_count || project.like_count || 0);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }} className="sidebar-item">
            <Link
                to={`/project/${project.id}`}
                style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flex: 1, minWidth: 0 }}
            >
                <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "0.5px solid var(--border-hairline)",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em"
                }}>
                    {project.cover_image ? (
                        <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
                    ) : (
                        getInitials(project.title)
                    )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "1px" }}>
                    <span style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}>
                        {project.title}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 400 }}>
                            By {(project.user?.name || "User").split(" ")[0]} · {formatRelativeDate(project.created_at)}
                        </span>
                    </div>
                </div>
            </Link>

            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(); }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "42px",
                    height: "48px",
                    borderRadius: "14px",
                    border: isLiked ? "none" : "0.5px solid var(--border-hairline)",
                    backgroundColor: isLiked ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0
                }}
                onMouseEnter={(e) => { if (!isLiked) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isLiked) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
                <HugeiconsIcon icon={ArrowUp02Icon} size={14} style={{ color: isLiked ? "#3b82f6" : "var(--text-tertiary)", marginBottom: "-2px" }} />
                <span style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: isLiked ? "#1a1a1a" : "var(--text-secondary)"
                }}>
                    {likeCount}
                </span>
            </button>
        </div>
    );
}

function ProjectVoteButton({ project }: { project: any }) {
    const { isLiked, likeCount, toggleLike } = useProjectLikes(project.id, project.isLiked, project.likes_count || project.like_count || 0);

    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(); }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "76px",
                borderRadius: "22px",
                border: isLiked ? "none" : "1.5px solid #edf2f7",
                backgroundColor: isLiked ? "rgba(59, 130, 246, 0.1)" : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                flexShrink: 0,
                position: "relative",
                zIndex: 10,
                boxShadow: isLiked ? "none" : "0 4px 12px rgba(0,0,0,0.03)"
            }}
            onMouseEnter={(e) => { if (!isLiked) { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { if (!isLiked) { e.currentTarget.style.borderColor = "#edf2f7"; e.currentTarget.style.transform = "translateY(0)"; } }}
        >
            <HugeiconsIcon icon={ArrowUp02Icon} size={20} style={{ color: isLiked ? "#1a1a1a" : "#1a1a1a", marginBottom: "4px" }} />
            <span style={{
                fontSize: "16px",
                fontWeight: 800,
                color: isLiked ? "#1a1a1a" : "#1a1a1a"
            }}>
                {likeCount}
            </span>
        </button>
    );
}

export default function RecommendedUsersSidebar() {
    const { width } = useWindowSize();
    const isDesktop = width >= 1100;
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 1. Recommended Users fetch
    const { data: users = [], isLoading: followersLoading } = useQuery({
        queryKey: ["recommendedUsers"],
        queryFn: async () => {
            const token = await getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await api.get("/users/recommended?limit=5", { headers });
            return response.data;
        },
        enabled: isDesktop,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });


    // 3. Recent Launches fetch
    const { data: projects = [], isLoading: projectsLoading } = useQuery({
        queryKey: ["recentProjects", "sidebar"],
        queryFn: async () => {
            const token = await getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await api.get("/projects?limit=5", { headers });
            const projectsData = response.data.projects || (Array.isArray(response.data) ? response.data : (response.data.data || []));
            return projectsData.slice(0, 5);
        },
        enabled: isDesktop,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // 4. Trending Tags fetch
    const { data: trendingTags = [], isLoading: trendingLoading } = useQuery({
        queryKey: ["trendingTags"],
        queryFn: async () => {
            const response = await api.get("/posts/trending/tags");
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: isDesktop,
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const handleFollow = async (targetId: string, currentStatus: boolean) => {
        if (!isSignedIn) { navigate("/sign-in"); return; }
        queryClient.setQueryData(["recommendedUsers"], (old: any[] = []) =>
            old.map(u => u.id === targetId ? { ...u, isFollowing: !currentStatus } : u)
        );
        try {
            const token = await getToken();
            await api.post(`/follows/${targetId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
            console.error("Failed to follow user", error);
            queryClient.setQueryData(["recommendedUsers"], (old: any[] = []) =>
                old.map(u => u.id === targetId ? { ...u, isFollowing: currentStatus } : u)
            );
        }
    };

    const isMobile = width < 1100;
    if (isMobile) return null;

    return (
        <div
            className="sidebar-container no-scrollbar"
            style={{
                width: "100%",
                height: "100vh",
                backgroundColor: "var(--bg-page)",
                overflowY: "auto",
                position: "relative",
            }}
        >
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .sidebar-section { padding: 24px 20px; border-bottom: 0.5px solid var(--border-hairline); }
                .sidebar-section:last-child { border-bottom: none; }
                .sidebar-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .sidebar-title { font-size: 13px; font-weight: 800; color: var(--text-tertiary); margin: 0; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                .sidebar-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 12px; }
                .skeleton-pulse { height: 40px; background-color: var(--bg-hover); border-radius: 12px; animation: skeleton-pulse 2s infinite ease-in-out; }
                .header-search-input::placeholder { font-size: 12px; opacity: 0.6; }
                @keyframes skeleton-pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                @keyframes pulse-green {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 186, 124, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 186, 124, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 186, 124, 0); }
                }
            `}</style>

            <SidebarHeader />


            {/* Section 1: Who to follow */}
            <div className="sidebar-section">
                <div className="sidebar-title-row">
                    <h3 className="sidebar-title">
                        <HugeiconsIcon icon={UserGroupIcon} size={16} />
                        Who to Follow
                    </h3>
                    <Link
                        to="/directory"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                            color: "var(--text-tertiary)",
                            fontSize: "12px",
                            fontWeight: 700,
                            opacity: 0.7,
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                    >
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                    </Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {followersLoading ? (
                        <div className="skeleton-pulse" />
                    ) : (
                        users.map(user => (
                            <div
                                key={user.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "10px"
                                }}
                                className="sidebar-item"
                            >
                                <UserHoverCard userId={user.id}>
                                    <Link
                                        to={user.username ? `/${user.username}` : `/user/${user.id}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            textDecoration: "none",
                                            flex: 1,
                                            minWidth: 0
                                        }}
                                    >
                                        <AvailabilityBadge
                                            avatarUrl={user.avatar_url}
                                            name={user.name || "User"}
                                            size={42}
                                            isOpenToOpportunities={user.is_pro && user.is_hirable}
                                            isOG={user.is_og}
                                            username={user.username}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "1px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                                <span style={{
                                                    fontSize: "14px",
                                                    fontWeight: 800,
                                                    color: "var(--text-primary)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {(user.name || "User").split(" ")[0]}
                                                </span>
                                                <VerifiedBadge
                                                    username={user.username}
                                                    isPro={user.is_pro || user.is_premium}
                                                    size="14px"
                                                />
                                            </div>
                                            <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600, opacity: 0.7 }}>
                                                @{user.username}
                                            </span>
                                            {user.bio && (
                                                <span style={{
                                                    fontSize: "12px",
                                                    color: "var(--text-tertiary)",
                                                    fontWeight: 400,
                                                    marginTop: "2px",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    lineHeight: "1.2",
                                                    opacity: 0.8
                                                }}>
                                                    {user.bio.split('\n')[0]}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </UserHoverCard>
                                <FollowButton 
                                    isFollowing={user.isFollowing} 
                                    size="sm"
                                    onClick={() => handleFollow(user.id, user.isFollowing)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Project of the Week Spotlight */}
            {!projectsLoading && projects.length > 0 && (
                <div className="sidebar-section" style={{ borderBottom: "0.5px solid var(--border-hairline)", paddingBottom: "24px" }}>
                    <h3 style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: "24px",
                        fontStyle: "italic",
                        color: "var(--text-primary)",
                        marginBottom: "16px",
                        fontWeight: 400,
                        letterSpacing: "-0.01em"
                    }}>
                        Project of the Week 🚀
                    </h3>
                    <div style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "25px",
                        border: "1.5px solid #edf2f7",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        background: "linear-gradient(135deg, #ffffff 0%, #fffef0 100%)",
                        position: "relative",
                        overflow: "hidden",
                        // boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
                    }}>
                        <Link to={`/project/${projects[0].id}`} style={{ position: "absolute", inset: 0, zIndex: 1 }} />

                        <div style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "24px",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            overflow: "hidden",
                            background: "linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)",
                            border: "1px solid rgba(0,0,0,0.05)",
                            position: "relative",
                            zIndex: 2,
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                        }}>
                            {projects[0].cover_image ? (
                                <img src={projects[0].cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                            ) : (
                                <span style={{ fontSize: "24px", fontWeight: 800, color: "#0369a1" }}>{getInitials(projects[0].title)}</span>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
                            <h4 style={{
                                fontSize: "19px",
                                fontWeight: 800,
                                color: "#1a1a1a",
                                marginBottom: "4px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                letterSpacing: "-0.02em"
                            }}>
                                {projects[0].title}
                            </h4>
                            <p style={{
                                fontSize: "11px",
                                color: "#4b5563",
                                lineHeight: "1.4",
                                fontWeight: 500,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                            }}>
                                {projects[0].description || "Explore this amazing project built on Codeown."}
                            </p>
                        </div>

                        <ProjectVoteButton project={projects[0]} />
                    </div>
                </div>
            )}

            {/* Section 4: Trending */}
            {!trendingLoading && Array.isArray(trendingTags) && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: "#00BA7C",
                                animation: "pulse-green 2s infinite"
                            }} />
                            <h3 className="sidebar-title" style={{ gap: "8px" }}>
                                Trending Now
                            </h3>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {trendingTags.slice(0, 5).map((tag: any, idx: number) => (
                            <Link
                                key={tag.name}
                                to={`/?tag=${tag.name}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    textDecoration: "none",
                                    padding: "10px 14px", // Increased padding slightly
                                    margin: "0 -14px",
                                    borderRadius: "12px",
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                }}
                                className="sidebar-item"
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                    <span style={{
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: "var(--text-tertiary)",
                                        width: "18px",
                                        textAlign: "center"
                                    }}>
                                        {idx + 1}
                                    </span>
                                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "1px" }}>
                                        <span style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: "var(--text-primary)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            letterSpacing: "-0.01em"
                                        }}>
                                            #{tag.name}
                                        </span>
                                        <span style={{
                                            fontSize: "11px",
                                            color: "var(--text-tertiary)",
                                            fontWeight: 500,
                                            opacity: 0.7
                                        }}>
                                            Last post {formatRelativeDate(tag.last_posted_at)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 700 }}>
                                        {tag.count}
                                    </span>
                                    <span style={{ fontSize: "9px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.02em", opacity: 0.5 }}>
                                        posts
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}


            {/* Section 3: Recent Launches */}
            {!projectsLoading && projects.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <HugeiconsIcon icon={Rocket01Icon} size={16} />
                            Recent Launches
                        </h3>
                        <Link
                            to="/?type=projects"
                            style={{
                                fontSize: "12px",
                                color: "var(--text-tertiary)",
                                textDecoration: "none",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                opacity: 0.7
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                        >
                            View all <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                        </Link>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {projects.map(project => (
                            <RecentLaunchItem key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
