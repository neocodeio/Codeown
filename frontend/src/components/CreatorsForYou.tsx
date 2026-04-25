import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import VerifiedBadge from "./VerifiedBadge";
import FollowButton from "./FollowButton";

interface User {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    bio: string;
    is_pro: boolean;
    isFollowing: boolean;
}

export default function CreatorsForYou() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useClerkAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = await getToken();
                const res = await api.get("/users/recommended?limit=3&shuffle=true", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setUsers(res.data);
            } catch (error) {
                console.error("Error fetching creators for you:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [getToken]);

    const handleFollow = async (userId: string, currentStatus: boolean) => {
        // Optimistic update
        setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isFollowing: !currentStatus } : u
        ));

        try {
            const token = await getToken();
            if (!token) {
                navigate("/sign-in");
                return;
            }
            
            const res = await api.post(`/follows/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data && typeof res.data.following === 'boolean') {
                setUsers(prev => prev.map(u => 
                    u.id === userId ? { ...u, isFollowing: res.data.following } : u
                ));
            }
        } catch (error) {
            console.error("Error following user:", error);
            // Rollback on error
            setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, isFollowing: currentStatus } : u
            ));
        }
    };

    if (loading || users.length === 0) return null;

    return (
        <div style={{
            padding: "16px 20px",
            borderBottom: "0.5px solid var(--border-hairline)",
            backgroundColor: "var(--bg-page)",
            animation: "fadeIn 0.5s ease-out"
        }}>
            <h2 style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "var(--text-primary)",
                margin: "0 0 16px 0",
                letterSpacing: "-0.02em"
            }}>
                Creators for you
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {users.map((user) => (
                    <div key={user.id} style={{ display: "flex", gap: "12px", position: "relative" }}>
                        <Link to={`/${user.username}`} style={{ flexShrink: 0 }}>
                            <img
                                src={user.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                                alt={user.name}
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "1px solid var(--border-hairline)"
                                }}
                            />
                        </Link>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                                <div style={{ minWidth: 0 }}>
                                    <div 
                                        style={{ 
                                            display: "flex", 
                                            alignItems: "center", 
                                            gap: "4px", 
                                        }}
                                    >
                                        <Link 
                                            to={`/${user.username}`}
                                            style={{ 
                                                color: "var(--text-primary)", 
                                                textDecoration: "none",
                                                fontWeight: 700,
                                                fontSize: "15px",
                                                overflow: "hidden", 
                                                textOverflow: "ellipsis", 
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            {user.name}
                                        </Link>
                                        <VerifiedBadge username={user.username} isPro={user.is_pro} size="14px" />
                                    </div>
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
                                        @{user.username}
                                    </div>
                                </div>
                                
                                <FollowButton 
                                    isFollowing={user.isFollowing} 
                                    onClick={() => handleFollow(user.id, !!user.isFollowing)}
                                />
                            </div>
                            
                            {user.bio && (
                                <p style={{
                                    fontSize: "15px",
                                    color: "var(--text-primary)",
                                    margin: "4px 0 0 0",
                                    lineHeight: "1.4",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                }}>
                                    {user.bio}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
