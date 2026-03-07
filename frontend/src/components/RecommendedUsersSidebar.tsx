import { useNavigate, Link } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "./VerifiedBadge";
import RecentProjectLaunches from "./RecentProjectLaunches";
import StreakBadge from "./StreakBadge";
import UserHoverCard from "./UserHoverCard";
import ProUpgradeCTA from "./ProUpgradeCTA";

export default function RecommendedUsersSidebar() {
    const { width } = useWindowSize();
    const isDesktop = width >= 1280;
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();



    // Use React Query for recommended users with proper caching
    const { data: users = [], isLoading: loading } = useQuery({
        queryKey: ["recommendedUsers"],
        queryFn: async () => {
            const token = await getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await api.get("/users/recommended?limit=5", { headers });
            return response.data;
        },
        enabled: isDesktop, // Only fetch on desktop
        staleTime: 10 * 60 * 1000, // 10 minutes cache
        refetchOnWindowFocus: false,
    });

    const handleFollow = async (targetId: string, currentStatus: boolean) => {
        if (!isSignedIn) {
            navigate("/sign-in");
            return;
        }

        // Optimistic update using query client
        queryClient.setQueryData(["recommendedUsers"], (old: any[] = []) =>
            old.map(u =>
                u.id === targetId ? { ...u, isFollowing: !currentStatus } : u
            )
        );

        try {
            const token = await getToken();
            await api.post(`/follows/${targetId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to follow user", error);
            // Revert on error
            queryClient.setQueryData(["recommendedUsers"], (old: any[] = []) =>
                old.map(u =>
                    u.id === targetId ? { ...u, isFollowing: currentStatus } : u
                )
            );
        }
    };

    // Streak count (used in sidebar header)
    const { data: streakData } = useQuery({
        queryKey: ["streakCount"],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return { streak_count: 0 };
            const res = await api.post(
                "/users/streak/update",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data || { streak_count: 0 };
        },
        enabled: isDesktop && isSignedIn,
        staleTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
    });
    const streakCount = streakData?.streak_count ?? 0;

    // Desktop: Show as sidebar (1024px+)
    // Mobile/Tablet: Show below streak badge as horizontal scroll
    const isMobile = width < 1280;

    if (!isMobile) {
        // Desktop sidebar view
        return (
            <div style={{
                width: "350px",
                minWidth: "350px",
                padding: width >= 1400 ? 0 : "0 14px 0 0",
                marginRight: "0", 
                position: "fixed",
                top: "100px",
                marginTop: "-6.5%",
                height: "100vh",
                // maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                scrollbarWidth: "none"
            }}>
                {/* Pro Upgrade CTA */}
                <ProUpgradeCTA compact style={{ marginBottom: "0px", borderBottom: "none" }} />

                <div style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    padding: "20px 24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                    width: "100%",
                    boxSizing: "border-box"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "28px",
                        paddingBottom: "13px",
                        borderBottom: "1px solid #eff3f4"
                    }}>
                        <h3 style={{
                            fontSize: "22px",
                            fontWeight: 900,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                            textTransform: "uppercase"
                        }}>
                            WHO TO FOLLOW
                        </h3>
                        {streakCount > 0 && (
                            <div style={{ flexShrink: 0 }}>
                                <StreakBadge count={streakCount} />
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#f1f5f9" }} />
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <div style={{ width: "60%", height: "14px", borderRadius: "4px", backgroundColor: "#f1f5f9" }} />
                                        <div style={{ width: "40%", height: "12px", borderRadius: "4px", backgroundColor: "#f1f5f9" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {users.map(user => (
                                <div key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%", minWidth: 0 }}>
                                    <UserHoverCard userId={user.id}>
                                        <Link to={`/user/${user.id}`} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            textDecoration: "none",
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: "hidden"
                                        }}>
                                            <div style={{ position: "relative", flexShrink: 0 }}>
                                                <img
                                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=fff`}
                                                    alt={user.name}
                                                    style={{
                                                        width: "44px",
                                                        height: "44px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        border: "1px solid #f1f5f9"
                                                    }}
                                                />
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                                                    <span style={{
                                                        fontSize: "15px",
                                                        fontWeight: 800,
                                                        color: "#0f172a",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        textTransform: "uppercase",
                                                        flexShrink: 1
                                                    }}>
                                                        {user.name.split(" ")[0]}
                                                    </span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                                        <VerifiedBadge username={user.username} isPro={user.is_pro} size="14px" />
                                                        {user.is_pro && (
                                                            <span style={{
                                                                fontSize: "9px",
                                                                fontWeight: "900",
                                                                padding: "2px 6px",
                                                                borderRadius: "6px",
                                                                backgroundColor: "#0f172a",
                                                                color: "#fff",
                                                                letterSpacing: "0.05em",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                height: "17px",
                                                                lineHeight: 1
                                                            }}>PRO</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {user.streak_count > 0 ? (
                                                    <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                                        🔥 {user.streak_count} day streak
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                                                        Codeown Creator
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </UserHoverCard>

                                    <button
                                        onClick={() => handleFollow(user.id, user.isFollowing)}
                                        style={{
                                            padding: "0 16px",
                                            borderRadius: "100px",
                                            border: user.isFollowing ? "1px solid #e2e8f0" : "none",
                                            backgroundColor: user.isFollowing ? "transparent" : "#0f172a",
                                            color: user.isFollowing ? "#1e293b" : "#fff",
                                            fontSize: "12px",
                                            fontWeight: 900,
                                            cursor: "pointer",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            whiteSpace: "nowrap",
                                            minWidth: "95px",
                                            height: "34px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.02em",
                                            flexShrink: 0,
                                            marginLeft: "auto"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!user.isFollowing) e.currentTarget.style.backgroundColor = "#1e293b";
                                            else e.currentTarget.style.backgroundColor = "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!user.isFollowing) e.currentTarget.style.backgroundColor = "#0f172a";
                                            else e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                    >
                                        {user.isFollowing ? "Following" : "Follow"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <RecentProjectLaunches />
            </div>
        );
    }

    // Mobile/Tablet horizontal scroll view - rendered in Feed component
    return null;
}
