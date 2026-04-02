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

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "default",
            position: "relative",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--text-tertiary)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hairline)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
        }}
        >
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--bg-hover)"
            }}>
                <div style={{ 
                    fontSize: "11px", 
                    color: "var(--text-tertiary)", 
                    fontWeight: 700, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.15em" 
                }}>
                    {title}
                </div>
                <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    backgroundColor: `${color}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: color
                }}>
                    <Icon size={18} weight="bold" />
                </div>
            </div>

            <div style={{ marginTop: "12px" }}>
                <div style={{ 
                    fontSize: "32px", 
                    fontWeight: 300,
                    color: "var(--text-primary)", 
                    letterSpacing: "-1px",
                    fontFamily: "monospace",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px"
                }}>
                    {loading ? "..." : value?.toLocaleString()}
                </div>
                <div style={{
                    marginTop: "12px",
                    height: "2px",
                    width: "100%",
                    backgroundColor: "var(--bg-hover)",
                    borderRadius: "1px",
                    overflow: "hidden"
                }}>
                    <div style={{
                        height: "100%",
                        width: loading ? "0%" : "100%",
                        backgroundColor: color,
                        opacity: 0.4,
                        transition: "width 1.2s cubic-bezier(0.65, 0, 0.35, 1)"
                    }}></div>
                </div>
            </div>
        </div>
    );

    return (
        <main style={{ 
            width: "100%", 
            maxWidth: "100%",
            backgroundImage: `radial-gradient(var(--border-hairline) 0.5px, transparent 0.5px)`,
            backgroundSize: "32px 32px"
        }}>
            <div style={{ 
                display: "flex", 
                flexDirection: "row", 
                width: "100%",
                maxWidth: "100%",
                minHeight: "100vh"
            }}>
                {/* ── Main Column ── */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    padding: isMobile ? "32px 20px" : "60px 40px",
                    backgroundColor: "rgba(var(--bg-page-rgb), 0.85)",
                    backdropFilter: "blur(8px)"
                }}>
                    <header style={{ marginBottom: "56px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "12px" }}>
                            <div style={{ width: "24px", height: "1px", backgroundColor: "var(--text-tertiary)" }}></div>
                            Creator Hub
                        </div>
                        <h1 style={{ 
                            fontSize: isMobile ? "32px" : "40px", 
                            fontWeight: 800, 
                            color: "var(--text-primary)", 
                            margin: 0,
                            letterSpacing: "-1.5px"
                        }}>
                            Analytics Overview
                        </h1>
                    </header>

                    {/* Section 1: Core Metrics */}
                    <section style={{ marginBottom: "56px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Core Performance
                            </h3>
                            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, var(--border-hairline), transparent)" }}></div>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Community Engagement
                            </h3>
                            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, var(--border-hairline), transparent)" }}></div>
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
                            <StatCard title="Comments" value={stats?.total_comments} icon={ChatText} color="#10b981" />
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
                        backgroundColor: "rgba(var(--bg-page-rgb), 0.5)"
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </main>
    );
}
