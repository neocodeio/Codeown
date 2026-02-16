import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "./VerifiedBadge";

interface RecommendedUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    isFollowing: boolean;
}

export default function RecommendedUsersSidebar() {
    const { width } = useWindowSize();
    const isDesktop = width >= 1024;
    const [users, setUsers] = useState<RecommendedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = await getToken();
                // Even if not signed in, we can fetch, but passing token allows "isFollowing" check
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await api.get("/users/recommended?limit=5", { headers });
                setUsers(response.data);
            } catch (error) {
                console.error("Failed to fetch recommended users", error);
            } finally {
                setLoading(false);
            }
        };

        if (isDesktop) {
            fetchUsers();
        }
    }, [isDesktop, getToken, isSignedIn]);

    const handleFollow = async (targetId: string, currentStatus: boolean) => {
        if (!isSignedIn) {
            navigate("/sign-in");
            return;
        }

        // Optimistic update
        setUsers(prev => prev.map(u =>
            u.id === targetId ? { ...u, isFollowing: !currentStatus } : u
        ));

        try {
            const token = await getToken();
            await api.post(`/follows/${targetId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to follow user", error);
            // Revert on error
            setUsers(prev => prev.map(u =>
                u.id === targetId ? { ...u, isFollowing: currentStatus } : u
            ));
        }
    };

    // Desktop: Show as sidebar (1024px+)
    // Mobile/Tablet: Show below streak badge as horizontal scroll
    const isMobile = width < 1024;

    if (!isMobile) {
        // Desktop sidebar view
        return (
            <div style={{
                width: "350px",
                minWidth: "350px",
                padding: width >= 1400 ? 0 : "0 14px 0 0",
                marginRight: width >= 1280 ? "20px" : "0",
                position: "sticky",
                top: "100px",
                height: "fit-content",
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                scrollbarWidth: "none"
            }}>
                <div style={{
                    backgroundColor: "#fff",
                    borderRadius: "32px",
                    border: "1px solid #e2e8f0",
                    padding: "32px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "28px"
                    }}>
                        <h3 style={{
                            fontSize: "24px",
                            fontWeight: 900,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1
                        }}>
                            Popular users
                        </h3>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {users.map(user => (
                                <div key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                    <Link to={`/user/${user.id}`} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        textDecoration: "none",
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <div style={{ position: "relative" }}>
                                            <img
                                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=fff`}
                                                alt={user.name}
                                                style={{
                                                    width: "42px",
                                                    height: "42px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    border: "1px solid #f1f5f9"
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <span style={{
                                                    fontSize: "15px",
                                                    fontWeight: 700,
                                                    color: "#0f172a",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                }}>
                                                    {user.name}
                                                </span>
                                                <VerifiedBadge username={user.username} size="15px" />
                                            </div>
                                            {user.streak_count > 0 ? (
                                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                                                    🔥 {user.streak_count} day streak
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                                                    Codeown Creator
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    <button
                                        onClick={() => handleFollow(user.id, user.isFollowing)}
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: "100px",
                                            border: user.isFollowing ? "1px solid #cbd5e1" : "none",
                                            backgroundColor: user.isFollowing ? "#fff" : "#0f172a",
                                            color: user.isFollowing ? "#475569" : "#fff",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            whiteSpace: "nowrap",
                                            minWidth: "80px",
                                            height: "32px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!user.isFollowing) e.currentTarget.style.backgroundColor = "#1e293b";
                                            else e.currentTarget.style.backgroundColor = "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!user.isFollowing) e.currentTarget.style.backgroundColor = "#0f172a";
                                            else e.currentTarget.style.backgroundColor = "#fff";
                                        }}
                                    >
                                        {user.isFollowing ? "Following" : "Follow"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        );
    }

    // Mobile/Tablet horizontal scroll view - rendered in Feed component
    return null;
}
