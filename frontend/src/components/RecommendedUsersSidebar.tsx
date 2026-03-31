import { useNavigate, Link } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import { Rocket, Users, Star } from "phosphor-react";
import StreakBadge from "./StreakBadge";
import UserHoverCard from "./UserHoverCard";
import VerifiedBadge from "./VerifiedBadge";
import { formatRelativeDate } from "../utils/date";

import AvailabilityBadge from "./AvailabilityBadge";

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
            const response = await api.get("/projects?limit=6");
            const projectsData = response.data.projects || (Array.isArray(response.data) ? response.data : (response.data.data || []));
            return projectsData.slice(0, 6);
        },
        enabled: isDesktop,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // 4. Streak count fetch
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
                .sidebar-section { padding: 32px 24px; border-bottom: 0.5px solid var(--border-hairline); }
                .sidebar-section:last-child { border-bottom: none; }
                .sidebar-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
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

            {/* Section 2: Leaderboard */}
            {!spotlightLoading && spotlight.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <Star size={16} weight="regular" />
                            Leaderboard
                        </h3>
                        <Link
                            to="/leaderboard"
                            style={{
                                fontSize: "12px",
                                color: "var(--text-tertiary)",
                                textDecoration: "none",
                                fontWeight: 500,
                            }}
                        >
                            This week
                        </Link>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "14px",
                        }}
                    >
                        {(() => {
                            const top3 = spotlight.slice(0, 3);
                            const ordered = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
                            return ordered.map((user: any, idx: number) => {
                                const rank = top3.length >= 3 ? (idx === 0 ? 2 : idx === 1 ? 1 : 3) : idx + 1;
                                const firstName = (user?.name || "User").split(" ")[0];

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
                                        }}
                                        className="sidebar-item"
                                    >
                                        <div
                                            style={{
                                                position: "relative",
                                                width: "48px",
                                                height: "48px",
                                                margin: "0 auto 8px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <AvailabilityBadge
                                                avatarUrl={user.avatar_url}
                                                name={user.name || "User"}
                                                size={48}
                                                isOpenToOpportunities={user.is_pro && user.is_hirable}
                                                isOG={user.is_og}
                                                username={user.username}
                                            />

                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "-4px",
                                                    left: "-4px",
                                                    padding: "1px 6px",
                                                    backgroundColor: "var(--text-primary)",
                                                    color: "var(--bg-page)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "10px",
                                                    fontWeight: 700,
                                                    borderRadius: "var(--radius-xs)",
                                                    zIndex: 10,
                                                }}
                                            >
                                                {rank}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                color: "var(--text-primary)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "4px"
                                            }}
                                            title={user.name}
                                        >
                                            {firstName}
                                            <VerifiedBadge 
                                                username={user.username} 
                                                isPro={user.is_pro || user.is_premium} 
                                                size="12px"
                                            />
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "4px",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: 500,
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                {user.pulse_score}p
                                            </div>
                                        </div>
                                    </Link>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Section 3: Recent Launches */}
            {!projectsLoading && projects.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <Rocket size={16} weight="regular" />
                            Recent Launches
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {projects.map(project => (
                            <Link key={project.id} to={`/project/${project.id}`} style={{ display: "flex", gap: "16px", textDecoration: "none" }} className="sidebar-item">
                                <div style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", backgroundColor: "var(--bg-hover)", flexShrink: 0, border: "0.5px solid var(--border-hairline)" }}>
                                    {project.cover_image ? (
                                        <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "var(--text-tertiary)" }}>•</div>
                                    )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "center", gap: "1px" }}>
                                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.title}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 400 }}>By {(project.user?.name || "User").split(" ")[0]}</span>
                                        <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="12px" />
                                    </div>
                                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "1px" }}>{formatRelativeDate(project.created_at)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
