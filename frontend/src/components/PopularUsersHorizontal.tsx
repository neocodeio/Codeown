import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import VerifiedBadge from "./VerifiedBadge";

interface RecommendedUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    isFollowing: boolean;
}

export default function PopularUsersHorizontal() {
    const [users, setUsers] = useState<RecommendedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = await getToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await api.get("/users/recommended?limit=10", { headers });
                setUsers(response.data);
            } catch (error) {
                console.error("Failed to fetch recommended users", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [getToken, isSignedIn]);

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

    if (loading) {
        return (
            <div style={{
                padding: "16px",
                borderBottom: "1px solid #eff3f4",
                backgroundColor: "#fff"
            }}>
                <h3 style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 12px 0",
                    letterSpacing: "-0.02em"
                }}>
                    Popular users
                </h3>
                <div style={{
                    display: "flex",
                    gap: "12px",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch"
                }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{
                            minWidth: "140px",
                            padding: "12px",
                            borderRadius: "12px",
                            backgroundColor: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#e2e8f0" }} />
                            <div style={{ width: "80px", height: "12px", borderRadius: "4px", backgroundColor: "#e2e8f0" }} />
                            <div style={{ width: "60px", height: "10px", borderRadius: "4px", backgroundColor: "#e2e8f0" }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            padding: "20px 0",
            backgroundColor: "#fff",
            borderBottom: "1px solid #eff3f4",
            overflow: "hidden"
        }}>
            <div style={{
                padding: "0 20px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <h3 style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    letterSpacing: "-0.02em"
                }}>
                    Popular Creators
                </h3>
            </div>

            <div
                className="hide-scrollbar"
                style={{
                    display: "flex",
                    gap: "14px",
                    overflowX: "auto",
                    padding: "0 20px 4px 20px",
                    WebkitOverflowScrolling: "touch"
                }}
            >
                {users.map(user => (
                    <div key={user.id} style={{
                        minWidth: "160px",
                        maxWidth: "160px",
                        padding: "16px",
                        borderRadius: "20px",
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}>
                        <Link to={`/user/${user.id}`} style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            textDecoration: "none",
                            width: "100%"
                        }}>
                            <div style={{ position: "relative" }}>
                                <img
                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=212121&color=fff`}
                                    alt={user.name}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "2px solid #fff",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                                    }}
                                />
                                {user.streak_count > 0 && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        right: "-2px",
                                        backgroundColor: "#fff",
                                        borderRadius: "50%",
                                        width: "22px",
                                        height: "22px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                        fontSize: "12px"
                                    }}>
                                        🔥
                                    </div>
                                )}
                            </div>
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "2px",
                                width: "100%",
                                textAlign: "center"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center", width: "100%" }}>
                                    <span style={{
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100px"
                                    }}>
                                        {user.name}
                                    </span>
                                    <VerifiedBadge username={user.username} size="14px" />
                                </div>
                                <span style={{
                                    fontSize: "12px",
                                    color: "#64748b",
                                    fontWeight: 500
                                }}>
                                    @{user.username}
                                </span>
                            </div>
                        </Link>

                        <button
                            onClick={() => handleFollow(user.id, user.isFollowing)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "100px",
                                border: user.isFollowing ? "1.5px solid #cbd5e1" : "none",
                                backgroundColor: user.isFollowing ? "#fff" : "#0f172a",
                                color: user.isFollowing ? "#475569" : "#fff",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                height: "34px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {user.isFollowing ? "Following" : "Follow"}
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
