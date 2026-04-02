import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { 
    NotePencil, 
    Heart, 
    RocketLaunch, 
    ArrowCircleUp, 
    ChatText, 
    Users, 
    Eye, 
    Lightning
} from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

interface DashboardStats {
    posts_count: number;
    projects_count: number;
    total_post_likes: number;
    total_project_upvotes: number;
    total_comments: number;
    follower_count: number;
    profile_views: number;
    streak_count: number;
}

export default function Dashboard() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1100;
    const { getToken } = useClerkAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await getToken();
                const res = await api.get("/users/dashboard/stats", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [getToken]);

    const StatCard = ({ title, value, icon: Icon, color }: any) => {
        return (
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                transition: "border-color 0.15s ease",
                cursor: "default",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--text-tertiary)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-hairline)"}
            >
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: color
                    }}>
                        <Icon size={20} weight="regular" />
                    </div>
                </div>

                <div>
                    <div style={{ 
                        fontSize: "13px", 
                        color: "var(--text-tertiary)", 
                        fontWeight: 500,
                        marginBottom: "4px"
                    }}>
                        {title}
                    </div>
                    <div style={{ 
                        fontSize: "32px", 
                        fontWeight: 600, 
                        color: "var(--text-primary)", 
                        letterSpacing: "-0.8px"
                    }}>
                        {loading ? "..." : value?.toLocaleString()}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main style={{ 
            width: "100%", 
            maxWidth: "100%",
            backgroundColor: "var(--bg-page)"
        }}>
            <div style={{ 
                display: "flex", 
                flexDirection: "row", 
                width: "100%",
                maxWidth: "100%",
                minHeight: "100vh",
            }}>
                {/* ── Main Column ── */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    borderRight: isMobile ? "none" : "1px solid var(--border-hairline)",
                    padding: isMobile ? "24px 16px" : "48px 40px",
                }}>
                    <header style={{ marginBottom: "56px" }}>
                        <h1 style={{ 
                            fontSize: isMobile ? "32px" : "36px", 
                            fontWeight: 700, 
                            color: "var(--text-primary)", 
                            margin: 0,
                            letterSpacing: "-1px",
                        }}>
                            Analytics Overview
                        </h1>
                        <p style={{ marginTop: "12px", fontSize: "16px", color: "var(--text-tertiary)", fontWeight: 400, maxWidth: "600px", lineHeight: "1.5" }}>
                            Get a clear picture of your contribution metrics and community reach through your personal dashboard.
                        </p>
                    </header>

                    {/* Section 1: Core Activity */}
                    <section style={{ marginBottom: "64px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Core Activity
                            </h3>
                            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-hairline)" }}></div>
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: "24px"
                        }}>
                            <StatCard title="Total Posts" value={stats?.posts_count} icon={NotePencil} color="#6366f1" />
                            <StatCard title="Projects Launched" value={stats?.projects_count} icon={RocketLaunch} color="#8b5cf6" />
                            <StatCard title="Consistency Streak" value={stats?.streak_count} icon={Lightning} color="#ef4444" />
                        </div>
                    </section>

                    {/* Section 2: Outreach & Engagement */}
                    <section>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Community Engagement
                            </h3>
                            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-hairline)" }}></div>
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: "24px"
                        }}>
                            <StatCard title="Total Likes" value={stats?.total_post_likes} icon={Heart} color="#ec4899" />
                            <StatCard title="Project Upvotes" value={stats?.total_project_upvotes} icon={ArrowCircleUp} color="#f59e0b" />
                            <StatCard title="Followers" value={stats?.follower_count} icon={Users} color="#3b82f6" />
                            <StatCard title="Profile Visitors" value={stats?.profile_views} icon={Eye} color="#06b6d4" />
                            <StatCard title="Total Comments" value={stats?.total_comments} icon={ChatText} color="#10b981" />
                        </div>
                    </section>
                </div>

                {/* ── Right Sidebar ── */}
                {isDesktop && (
                    <aside style={{
                        width: "340px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        zIndex: 1,
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </main>
    );
}
