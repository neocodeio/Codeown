import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkUser } from "../hooks/useClerkUser";
import AvailabilityBadge from "../components/AvailabilityBadge";
import VerifiedBadge from "../components/VerifiedBadge";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import BioRenderer from "../components/BioRenderer";
import { useFollow } from "../hooks/useFollow";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";

interface DirectoryUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    bio: string;
    is_pro: boolean;
    is_og: boolean;
    isFollowing?: boolean;
}

function UserItem({ user }: { user: DirectoryUser }) {
    const navigate = useNavigate();
    const { isFollowing, loading, toggleFollow } = useFollow(user.id);
    const { user: currentUser } = useClerkUser();

    // The name should be first name only
    const firstName = (user.name || "User").split(" ")[0];

    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollow();
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                borderBottom: "1px solid var(--border-hairline)",
                backgroundColor: "var(--bg-page)",
                transition: "background-color 0.15s ease",
                cursor: "pointer",
                gap: "12px"
            }}
            onClick={() => navigate(`/${user.username}`)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                <AvailabilityBadge
                    avatarUrl={user.avatar_url}
                    name={user.name}
                    size={48}
                    isOG={user.is_og}
                    username={user.username}
                />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-primary)" }}>{firstName}</span>
                        <VerifiedBadge username={user.username} isPro={user.is_pro} size="14px" />
                    </div>
                    <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: "500" }}>@{user.username}</span>
                    <div style={{
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginTop: "2px"
                    }}>
                        {user.bio ? <BioRenderer bio={user.bio.split('\n')[0]} /> : "Building something cool."}
                    </div>
                </div>
            </div>

            {currentUser?.id !== user.id && (
                <button
                    onClick={handleFollowClick}
                    disabled={loading}
                    style={{
                        padding: "0 24px",
                        height: "36px",
                        borderRadius: "100px",
                        backgroundColor: isFollowing ? "transparent" : "var(--text-primary)",
                        color: isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                        border: isFollowing ? "1px solid var(--border-hairline)" : "none",
                        fontSize: "13px",
                        fontWeight: "900",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                    }}
                >
                    {isFollowing ? "Following" : "Subscribe"}
                </button>
            )}
        </div>
    );
}

export default function UserDirectory() {
    const { width } = useWindowSize();
    const isDesktop = width >= 1200;
    const navigate = useNavigate();
    const [users, setUsers] = useState<DirectoryUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users?limit=100");
                setUsers(res.data.users || []);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
            <SEO title="Creators" description="Explore all creators on the platform." />

            <div style={{
                display: "flex",
                width: isDesktop ? "var(--main-container-width)" : "100%",
                maxWidth: "100%",
                margin: "0 auto",
            }}>
                <div style={{
                    flex: 1,
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "100%",
                    borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    position: "relative"
                }}>
                    <div style={{
                        padding: "16px",
                        borderBottom: "0.5px solid var(--border-hairline)",
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-page)",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: "24px"
                    }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background-color 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <HugeiconsIcon icon={ArrowLeft02Icon} size={20} color="var(--text-primary)" />
                        </button>
                        <h1 style={{ fontSize: "19px", fontWeight: "900", margin: 0, color: "var(--text-primary)" }}>Creators</h1>
                    </div>

                    {loading ? (
                        <div style={{ padding: "100px 40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                            <div className="spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "50%", margin: "0 auto 16px" }} />
                            <span style={{ fontSize: "14px", fontWeight: "600" }}>Retrieving platform members...</span>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {users.map(user => (
                                <UserItem key={user.id} user={user} />
                            ))}
                            {users.length === 0 && (
                                <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                                    No creators found yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isDesktop && (
                    <aside style={{
                        width: "var(--sidebar-width)",
                        position: "sticky",
                        top: 0,
                        height: "100vh",
                        flexShrink: 0,
                        padding: "0"
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 0.8s linear infinite; }
            `}</style>
        </main>
    );
}
