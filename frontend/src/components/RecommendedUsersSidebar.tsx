import { useNavigate, Link } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import { Users, Trophy, CaretUp, CaretRight, TrendUp } from "phosphor-react";
import StreakBadge from "./StreakBadge";
import UserHoverCard from "./UserHoverCard";
import VerifiedBadge from "./VerifiedBadge";
import { formatRelativeDate } from "../utils/date";
import { useProjectLikes } from "../hooks/useProjectLikes";

import AvailabilityBadge from "./AvailabilityBadge";

const getInitials = (title: string) => {
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
                    backgroundColor: isLiked ? "var(--bg-hover)" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0
                }}
                onMouseEnter={(e) => { if (!isLiked) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isLiked) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
                <CaretUp size={14} weight={isLiked ? "bold" : "regular"} style={{ color: isLiked ? "var(--text-primary)" : "var(--text-tertiary)", marginBottom: "-2px" }} />
                <span style={{ 
                    fontSize: "12px", 
                    fontWeight: 800, 
                    color: isLiked ? "var(--text-primary)" : "var(--text-secondary)" 
                }}>
                    {likeCount}
                </span>
            </button>
        </div>
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

    // 2. Spotlight fetch
    const { data: spotlight = [], isLoading: spotlightLoading } = useQuery({
        queryKey: ["communitySpotlight"],
        queryFn: async () => {
            const response = await api.get("/leaderboard/pulse");
            return response.data.top_spotlight || [];
        },
        enabled: isDesktop,
        staleTime: 5 * 60 * 1000,
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

    // 5. Streak count fetch
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

    const streakCount = streakData?.streak_count ?? 0;
    const isMobile = width < 1100;
    if (isMobile) return null;

    return (
        <div
            className="sidebar-container no-scrollbar"
            style={{
                width: "100%",
                height: "100vh",
                backgroundColor: "var(--bg-page)",
                border: "0.5px solid var(--border-hairline)",
                borderLeft: "none",
                borderTop: "none",
                overflowY: "auto",
                position: "relative",
            }}
        >
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .sidebar-section { padding: 24px 20px; border-bottom: 0.5px solid var(--border-hairline); }
                .sidebar-section:last-child { border-bottom: none; }
                .sidebar-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
                .sidebar-title { font-size: 14px; font-weight: 600; color: var(--text-tertiary); margin: 0; display: flex; align-items: center; gap: 8px; }
                .sidebar-item { transition: opacity 0.15s ease; }
                .skeleton-pulse { height: 40px; background-color: var(--bg-hover); border-radius: var(--radius-sm); animation: skeleton-pulse 2s infinite ease-in-out; }
                @keyframes skeleton-pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            `}</style>

            {/* Section 1: Who to follow */}
            <div className="sidebar-section">
                <div className="sidebar-title-row">
                    <h3 className="sidebar-title">
                        <Users size={16} weight="regular" />
                        Who to Follow
                    </h3>
                    {streakCount > 0 && <StreakBadge count={streakCount} />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                                            size={44}
                                            isOpenToOpportunities={user.is_pro && user.is_hirable}
                                            isOG={user.is_og}
                                            username={user.username}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "1px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                                <span style={{ 
                                                    fontSize: "14.5px", 
                                                    fontWeight: 600, 
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
                                            <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 400 }}>
                                                @{user.username}
                                            </span>
                                        </div>
                                    </Link>
                                </UserHoverCard>
                                <button
                                    onClick={() => handleFollow(user.id, user.isFollowing)}
                                    style={{
                                        padding: "0 14px",
                                        height: "28px",
                                        borderRadius: "var(--radius-sm)",
                                        backgroundColor: user.isFollowing ? "transparent" : "var(--text-primary)",
                                        color: user.isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                                        border: user.isFollowing ? "0.5px solid var(--border-hairline)" : "none",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        transition: "all 0.15s ease"
                                    }}
                                >
                                    {user.isFollowing ? "Unfollow" : "Follow"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Section 4: Trending */}
            {!trendingLoading && Array.isArray(trendingTags) && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title" style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "14px" }}>
                            <TrendUp size={18} weight="bold" />
                            Trending
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        {trendingTags.map((tag: any, idx: number) => (
                            <Link 
                                key={tag.name} 
                                to={`/?tag=${tag.name}`}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}
                                className="sidebar-item"
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-tertiary)", width: "12px" }}>
                                        {idx + 1}
                                    </span>
                                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        #{tag.name}
                                    </span>
                                </div>
                                <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 400 }}>
                                    {tag.count} posts
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2: Leaderboard */}
            <div className="sidebar-section" style={{ paddingBottom: 0 }}>
                <div className="sidebar-title-row">
                    <h3 className="sidebar-title" style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
                        LEADERBOARD
                    </h3>
                    {!spotlightLoading && spotlight.length > 0 && (
                        <Link
                            to="/leaderboard"
                            style={{
                                fontSize: "11px",
                                color: "var(--text-tertiary)",
                                textDecoration: "none",
                                fontWeight: 500,
                            }}
                        >
                            This week
                        </Link>
                    )}
                </div>
                
                <div style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    paddingTop: "24px",
                    paddingBottom: 0,
                    gap: "6px"
                }}>
                    {spotlightLoading ? (
                        <div className="skeleton-pulse" style={{ flex: 1, height: "120px" }} />
                    ) : (() => {
                        const top3 = spotlight.slice(0, 3);
                        if (top3.length === 0) return <div style={{ fontSize: "12px", color: "var(--text-tertiary)", textAlign: "center", width: "100%", padding: "20px 0" }}>No data yet</div>;
                        const ordered = top3.length === 1 ? [top3[0]] : (top3.length === 2 ? [top3[1], top3[0]] : [top3[1], top3[0], top3[2]]);
                        
                        return ordered.map((user: any, idx: number) => {
                            const actualRankIndex = top3.length === 1 ? 0 : (top3.length === 2 ? (idx === 0 ? 1 : 0) : (idx === 0 ? 1 : idx === 1 ? 0 : 2));
                            const rank = actualRankIndex + 1;
                            const isFirst = rank === 1;
                            const height = isFirst ? "64px" : rank === 2 ? "44px" : "36px";
                            const avatarSize = isFirst ? 52 : 40;

                            const stepColor = isFirst ? "rgba(255, 176, 0, 0.3)" : rank === 2 ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.1)";
                            const stepGradient = isFirst 
                                ? `linear-gradient(to bottom, ${stepColor}, rgba(255, 176, 0, 0.02))` 
                                : `linear-gradient(to bottom, ${stepColor}, transparent)`;
                            const topBorder = isFirst 
                                ? "rgba(255, 176, 0, 0.4)" 
                                : rank === 2 ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.15)";


                            return (
                                <Link
                                    key={user.id}
                                    to={`/${user.username}`}
                                    style={{
                                        textDecoration: "none",
                                        color: "inherit",
                                        textAlign: "center",
                                        flex: 1,
                                        minWidth: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center"
                                    }}
                                    className="sidebar-item"
                                >
                                    <div style={{ position: "relative", marginBottom: "8px" }}>
                                        {isFirst && (
                                            <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", color: "#FFB000" }}>
                                                <Trophy size={16} weight="fill" />
                                            </div>
                                        )}
                                        
                                        <div style={{ position: "relative", padding: 0 }}>
                                            <AvailabilityBadge
                                                avatarUrl={user.avatar_url}
                                                name={user.name || "User"}
                                                size={avatarSize}
                                                isOpenToOpportunities={user.is_pro && user.is_hirable}
                                                isOG={user.is_og}
                                                username={user.username}
                                            />
                                        </div>

                                        <div style={{
                                            position: "absolute",
                                            bottom: "-6px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            width: "20px",
                                            height: "20px",
                                            backgroundColor: isFirst ? "#FFB000" : "var(--text-primary)",
                                            border: "2.5px solid var(--bg-page)",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "10px",
                                            fontWeight: "900",
                                            color: isFirst ? "#000" : "var(--bg-page)",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            zIndex: 10
                                        }}>
                                            {rank}
                                        </div>
                                    </div>

                                    <div style={{ width: "100%", textAlign: "center", marginBottom: "2px" }}>
                                        <div style={{ fontSize: isFirst ? "12px" : "11px", fontWeight: "700", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {(user.name || "User").split(" ")[0].toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: "10px", fontWeight: "500", color: "var(--text-tertiary)", marginTop: "1px" }}>
                                            {Number(user.pulse_score || 0).toLocaleString()}p
                                        </div>
                                    </div>

                                    {/* Podium Block */}
                                    <div style={{
                                        width: "100%",
                                        height: height,
                                        background: stepGradient,
                                        borderTop: `1.5px solid ${topBorder}`,
                                        borderRadius: "6px 6px 1px 1px",
                                        marginTop: "8px",
                                        transition: "all 0.2s ease"
                                    }} />
                                </Link>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Section 3: Recent Launches */}
            {!projectsLoading && projects.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title" style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", color: "var(--text-primary)" }}>
                            RECENT LAUNCHES
                        </h3>
                        <Link
                            to="/?type=projects"
                            style={{
                                fontSize: "11px",
                                color: "var(--text-tertiary)",
                                textDecoration: "none",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: "2px"
                            }}
                        >
                            All <CaretRight size={10} />
                        </Link>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {projects.map(project => (
                            <RecentLaunchItem key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}

            {/* Section 4 was here */}
        </div>
    );
}

