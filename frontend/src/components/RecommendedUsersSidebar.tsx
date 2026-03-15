import { useNavigate, Link } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import { Rocket, Users, Star } from "phosphor-react";
import StreakBadge from "./StreakBadge";
import UserHoverCard from "./UserHoverCard";
import AvailabilityBadge from "./AvailabilityBadge";
import { formatRelativeDate } from "../utils/date";

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
                .sidebar-section { padding: 40px 24px; border-bottom: 0.5px solid var(--border-hairline); }
                .sidebar-section:last-child { border-bottom: none; }
                .sidebar-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
                .sidebar-title { font-size: 11px; font-family: var(--font-mono); font-weight: 800; color: var(--text-tertiary); margin: 0; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
                .sidebar-item { transition: opacity 0.15s ease; }
                .skeleton-pulse { height: 40px; background-color: var(--bg-hover); border-radius: 2px; animation: skeleton-pulse 2s infinite ease-in-out; }
                @keyframes skeleton-pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            `}</style>

            {/* Section 1: WHO TO FOLLOW */}
            <div className="sidebar-section">
                <div className="sidebar-title-row">
                    <h3 className="sidebar-title">
                        <Users size={14} weight="thin" />
                        WHO TO FOLLOW
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
                                    alignItems: "flex-start",
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
                                            alignItems: "flex-start",
                                            gap: "10px",
                                            textDecoration: "none",
                                            flex: 1,
                                            minWidth: 0
                                        }}
                                    >
                                        <AvailabilityBadge
                                            avatarUrl={user.avatar_url || null}
                                            name={user.name || "User"}
                                            size={48}
                                            isEarlyAdopter={user.is_early_adopter}
                                            isOpenToOpportunities={user.is_pro === true && user.is_hirable === true}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "1px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                                <span style={{ 
                                                    fontSize: "14px", 
                                                    fontWeight: 700, 
                                                    color: "var(--text-primary)", 
                                                    letterSpacing: "-0.01em",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {(user.name || "User").split(" ")[0]}
                                                </span>
                                                {user.streak_count > 0 && (
                                                    <div style={{ flexShrink: 0 }}>
                                                        <StreakBadge count={user.streak_count} mini />
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase" }}>
                                                @{user.username}
                                            </span>
                                        </div>
                                    </Link>
                                </UserHoverCard>
                                <button
                                    onClick={() => handleFollow(user.id, user.isFollowing)}
                                    style={{
                                        padding: "0 12px",
                                        height: "28px",
                                        borderRadius: "2px",
                                        backgroundColor: user.isFollowing ? "transparent" : "var(--text-primary)",
                                        color: user.isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                                        border: "0.5px solid var(--border-hairline)",
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        fontFamily: "var(--font-mono)",
                                        flexShrink: 0
                                    }}
                                >
                                    {user.isFollowing ? "Unfollow" : "Follow"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Section 2: COMMUNITY SPOTLIGHT */}
            {!spotlightLoading && spotlight.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <Star size={14} weight="thin" />
                            LEADERBOARD
                        </h3>
                        <Link
                            to="/leaderboard"
                            style={{
                                fontSize: "10px",
                                color: "var(--text-tertiary)",
                                textDecoration: "none",
                                fontWeight: 800,
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                        >
                            THIS WEEK
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
                            // Render order: #2 (left), #1 (center), #3 (right)
                            const ordered = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
                            return ordered.map((user: any, idx: number) => {
                                const rank = top3.length >= 3 ? (idx === 0 ? 2 : idx === 1 ? 1 : 3) : idx + 1;

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
                                            }}
                                        >
                                            <AvailabilityBadge
                                                avatarUrl={user.avatar_url || null}
                                                name={user.name || "User"}
                                                size={48}
                                                isEarlyAdopter={user.is_early_adopter}
                                                isOpenToOpportunities={user.is_pro === true && user.is_hirable === true}
                                            />

                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "-4px",
                                                    left: "-4px",
                                                    padding: "2px 6px",
                                                    backgroundColor: "var(--text-primary)",
                                                    color: "var(--bg-page)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "10px",
                                                    fontFamily: "var(--font-mono)",
                                                    fontWeight: 800,
                                                    letterSpacing: "0.05em",
                                                    borderRadius: "1px"
                                                }}
                                            >
                                                {rank}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                color: "var(--text-primary)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                letterSpacing: "-0.01em"
                                            }}
                                            title={user.name}
                                        >
                                            {(user.name || "User").split(" ")[0]}
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
                                                    fontSize: "11px",
                                                    fontWeight: 800,
                                                    color: "var(--text-secondary)",
                                                    fontFamily: "var(--font-mono)",
                                                }}
                                            >
                                                {user.pulse_score}P
                                            </div>
                                            {user.streak_count > 0 && (
                                                <div style={{ flexShrink: 0 }}>
                                                    <StreakBadge count={user.streak_count} mini />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Section 3: RECENT LAUNCHES */}
            {!projectsLoading && projects.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <Rocket size={14} weight="thin" />
                            RECENT LAUNCHES
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {projects.map(project => (
                            <Link key={project.id} to={`/project/${project.id}`} style={{ display: "flex", gap: "16px", textDecoration: "none" }} className="sidebar-item">
                                <div style={{ width: "44px", height: "44px", borderRadius: "2px", overflow: "hidden", backgroundColor: "var(--bg-hover)", flexShrink: 0, border: "0.5px solid var(--border-hairline)" }}>
                                    {project.cover_image ? (
                                        <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "var(--text-tertiary)" }}>•</div>
                                    )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "center", gap: "4px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>{project.title}</span>
                                    <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{formatRelativeDate(project.created_at).toUpperCase()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
