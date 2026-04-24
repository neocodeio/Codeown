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
import { ArrowLeft02Icon, UserGroupIcon, Search01Icon } from "@hugeicons/core-free-icons";

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
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-hairline)",
                backgroundColor: "var(--bg-page)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                gap: "16px"
            }}
            onClick={() => navigate(`/${user.username}`)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                <AvailabilityBadge
                    avatarUrl={user.avatar_url}
                    name={user.name}
                    size={52}
                    isOG={user.is_og}
                    username={user.username}
                />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{user.name}</span>
                        <VerifiedBadge username={user.username} isPro={user.is_pro} size="16px" />
                    </div>
                    <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: "600", opacity: 0.8 }}>@{user.username}</span>
                    <div style={{
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginTop: "2px",
                        fontWeight: 500,
                        opacity: 0.9
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
                        padding: "0 18px",
                        height: "38px",
                        borderRadius: "100px",
                        backgroundColor: isFollowing ? "transparent" : "var(--text-primary)",
                        color: isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                        border: isFollowing ? "1px solid var(--border-hairline)" : "none",
                        fontSize: "14px",
                        fontWeight: "800",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        if (isFollowing) e.currentTarget.style.borderColor = "var(--text-primary)";
                        else e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                        if (isFollowing) e.currentTarget.style.borderColor = "var(--border-hairline)";
                        else e.currentTarget.style.opacity = "1";
                    }}
                >
                    {isFollowing ? "Following" : "Follow"}
                </button>
            )}
        </div>
    );
}

export default function UserDirectory() {
    const { width } = useWindowSize();
    const isMobile = width < 1200;
    const navigate = useNavigate();
    const [users, setUsers] = useState<DirectoryUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredUsers = users.filter(u => 
        (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.username || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
            <SEO title="Directory — Hub of Builders" description="Connect with the most active builders and founders on Codeown." />

            <div style={{
                display: "flex",
                width: isMobile ? "100%" : "var(--main-container-width)",
                maxWidth: "100%",
                margin: isMobile ? "0" : "0 auto",
                justifyContent: "center"
            }}>
                {/* ── Main Content Column ── */}
                <div style={{
                    flex: 1,
                    width: isMobile ? "100%" : "var(--feed-width)",
                    maxWidth: isMobile ? "100%" : "var(--feed-width)",
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    minHeight: "100vh",
                    position: "relative",
                    backgroundColor: "var(--bg-page)"
                }}>
                    {/* ── Fixed Header ── */}
                    <div style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(20px)",
                        borderBottom: "0.5px solid var(--border-hairline)",
                        zIndex: 100,
                        padding: "16px 20px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
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
                                    transition: "background-color 0.15s ease",
                                    color: "var(--text-primary)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
                            </button>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <h1 style={{ fontSize: "20px", fontWeight: "900", margin: 0, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Creators</h1>
                                <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: "600" }}>{users.length} builders exploring the void</span>
                            </div>
                        </div>

                        {/* Search in Header */}
                        <div style={{ position: "relative" }}>
                            <HugeiconsIcon icon={Search01Icon} size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                            <input 
                                type="text"
                                placeholder="Search by name or @username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "42px",
                                    backgroundColor: "var(--bg-hover)",
                                    border: "1px solid transparent",
                                    borderRadius: "14px",
                                    padding: "0 14px 0 42px",
                                    fontSize: "14px",
                                    color: "var(--text-primary)",
                                    transition: "all 0.2s ease"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-page)";
                                    e.currentTarget.style.borderColor = "var(--text-primary)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                    e.currentTarget.style.borderColor = "transparent";
                                }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: "100px 40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                            <div className="spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "50%", margin: "0 auto 16px" }} />
                            <span style={{ fontSize: "14px", fontWeight: "600" }}>Retrieving platform creators...</span>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {filteredUsers.map(user => (
                                <UserItem key={user.id} user={user} />
                            ))}
                            {filteredUsers.length === 0 && (
                                <div style={{ padding: "120px 40px", textAlign: "center", color: "var(--text-tertiary)" }}>
                                    <div style={{ marginBottom: "16px", opacity: 0.15 }}><HugeiconsIcon icon={UserGroupIcon} size={64} /></div>
                                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "8px" }}>No builders found</h3>
                                    <p style={{ fontSize: "14px", maxWidth: "240px", margin: "0 auto" }}>We couldn't find anyone matching your search criteria.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Sidebar Column ── */}
                {!isMobile && (
                    <aside style={{
                        width: "var(--sidebar-width)",
                        position: "sticky",
                        top: 0,
                        height: "100vh",
                        flexShrink: 0,
                        backgroundColor: "var(--bg-page)"
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 0.8s linear infinite; }
                @media (max-width: 1200px) {
                    aside { display: none; }
                }
            `}</style>
        </main>
    );
}
