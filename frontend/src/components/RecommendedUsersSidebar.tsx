import { useNavigate, Link } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import {
    Rocket01Icon,
    ChartBarLineIcon,
    UserGroupIcon,
    StarIcon
} from "@hugeicons/core-free-icons";
import VerifiedBadge from "./VerifiedBadge";
import StreakBadge from "./StreakBadge";
import UserHoverCard from "./UserHoverCard";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatRelativeDate } from "../utils/date";

export default function RecommendedUsersSidebar() {
    const { width } = useWindowSize();
    const isDesktop = width >= 1280;
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
            const response = await api.get("/projects?limit=3");
            const projectsData = response.data.projects || (Array.isArray(response.data) ? response.data : (response.data.data || []));
            return projectsData.slice(0, 3);
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
    const isMobile = width < 1280;

    if (isMobile) return null;

    return (
        <div style={{
            width: "350px", // Fixed width for consistent design
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            overflow: "hidden",
            position: "fixed",
            // Center the sidebar relative to the main column: 50% + half main column + gap
            left: "calc(50% + 310px + 24px)",
            top: "0px", // Anchor from top of viewport
            maxHeight: "calc(100vh - 48px)", // Maximize visible area
            overflowY: "auto", // Handle internal scrolling for long lists
            scrollbarWidth: "none",
            zIndex: 40,
        }}>
            <style>{`
                .sidebar-section { padding: 22px 24px; border-bottom: 1px solid #f1f5f9; position: relative; }
                .sidebar-section:last-child { border-bottom: none; }
                .sidebar-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .sidebar-title { font-size: 13px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: 0.05em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
                .sidebar-item { transition: all 0.2s ease; cursor: pointer; }
                .sidebar-item:hover { transform: translateX(2px); }
            `}</style>

            {/* Section 1: WHO TO FOLLOW */}
            <div className="sidebar-section">
                <div className="sidebar-title-row">
                    <h3 className="sidebar-title">
                        <HugeiconsIcon icon={UserGroupIcon} size={15} />
                        Who to Follow
                    </h3>
                    {streakCount > 0 && <StreakBadge count={streakCount} />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {followersLoading ? (
                        <div style={{ height: "40px", backgroundColor: "#f8fafc", borderRadius: "8px", animation: "pulse 2s infinite" }} />
                    ) : (
                        users.map(user => (
                            <div key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }} className="sidebar-item">
                                <UserHoverCard userId={user.id}>
                                    <Link to={`/user/${user.id}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flex: 1, minWidth: 0 }}>
                                        <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=fff`} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #f1f5f9" }} alt="" />
                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{user.name.split(" ")[0]}</span>
                                                <VerifiedBadge username={user.username} isPro={user.is_pro} size="13px" />
                                            </div>
                                            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>@{user.username}</span>
                                        </div>
                                    </Link>
                                </UserHoverCard>
                                <button
                                    onClick={() => handleFollow(user.id, user.isFollowing)}
                                    style={{
                                        padding: "0 14px", height: "30px", borderRadius: "100px",
                                        backgroundColor: user.isFollowing ? "transparent" : "#0f172a",
                                        color: user.isFollowing ? "#1e293b" : "#fff",
                                        border: user.isFollowing ? "1px solid #e2e8f0" : "none",
                                        fontSize: "10px", fontWeight: 900, cursor: "pointer", textTransform: "uppercase"
                                    }}
                                >
                                    {user.isFollowing ? "Following" : "Follow"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Section 2: COMMUNITY SPOTLIGHT */}
            {!spotlightLoading && spotlight.length > 0 && (
                <div className="sidebar-section" style={{ backgroundColor: "#fff" }}>
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <HugeiconsIcon icon={StarIcon} size={15} />
                            Leaderboard
                        </h3>
                        <Link to="/leaderboard" style={{ fontSize: "10px", color: "#64748b", textDecoration: "none", fontWeight: 800 }}>PULSE TOP</Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                        {spotlight.slice(0, 3).map((user: any, idx: number) => (
                            <Link key={user.id} to={`/${user.username}`} style={{ textDecoration: "none", color: "inherit", textAlign: "center" }} className="sidebar-item">
                                <div style={{ position: "relative", marginBottom: "8px", display: "inline-block" }}>
                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=fff`} style={{ width: "52px", height: "52px", borderRadius: "14px", border: "1px solid #fff", boxShadow: idx === 0 ? "0 4px 12px rgba(250, 204, 21, 0.2)" : "none" }} alt="" />
                                    {idx === 0 && (
                                        <div style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "#facc15", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                                            <span style={{ fontSize: "10px", fontWeight: 900, color: "#000" }}>1</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name.split(' ')[0]}</div>
                                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                                    <HugeiconsIcon icon={ChartBarLineIcon} size={10} />
                                    {user.pulse_score}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 3: RECENT LAUNCHES */}
            {!projectsLoading && projects.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-title-row">
                        <h3 className="sidebar-title">
                            <HugeiconsIcon icon={Rocket01Icon} size={15} />
                            Recent Launches
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {projects.map(project => (
                            <Link key={project.id} to={`/project/${project.id}`} style={{ display: "flex", gap: "12px", textDecoration: "none" }} className="sidebar-item">
                                <div style={{ width: "46px", height: "46px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0, border: "1px solid #eff3f4" }}>
                                    {project.cover_image ? (
                                        <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🚀</div>
                                    )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "center" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.title}</span>
                                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{formatRelativeDate(project.created_at)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
