import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useNavigate } from "react-router-dom";
import { 
    Eye,
    MouseSimple,
    CaretLeft,
    ChartBar,
    User,
    Clock,
    Rocket,
    FileText
} from "phosphor-react";
import { formatRelativeDate } from "../utils/date";
import { SEO } from "../components/SEO";
import { HeatMap } from "../components/HeatMap";
import { ShareableAnalyticsCard } from "../components/ShareableAnalyticsCard";

export default function Analytics() {
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!isSignedIn) return;
            try {
                setLoading(true);
                const token = await getToken();
                const [statsRes, userRes] = await Promise.all([
                   api.get("/analytics/summary", { headers: { Authorization: `Bearer ${token}` } }),
                   api.get("/users/me", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setStats(statsRes.data);
                setUserData(userRes.data);
            } catch (err: any) {
                console.error("Error fetching analytics:", err);
                if (err.response?.status === 403) {
                    setError("This feature is exclusive to PRO members.");
                } else {
                    setError("Failed to load analytics data.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [isSignedIn, getToken]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
                <div style={{ width: "20px", height: "20px", border: "0.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "var(--radius-sm)", animation: "spin 0.6s linear infinite" }} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "80px 24px", textAlign: "center", maxWidth: "400px", margin: "0 auto", backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <ChartBar size={48} weight="thin" color="var(--border-hairline)" style={{ marginBottom: "24px" }} />
                <h1 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Analytics Access</h1>
                <p style={{ color: "var(--text-tertiary)", marginBottom: "32px", fontSize: "14px", lineHeight: 1.6 }}>{error}</p>
                <button
                    onClick={() => navigate("/profile")}
                    style={{
                        padding: "10px 24px",
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-page)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer"
                    }}
                >
                    Back to Profile
                </button>
            </div>
        );
    }

    return (
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", padding: "40px 24px" }}>
            <SEO title="Analytics | Codeown" description="Track your project views and opportunities." />

            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "none",
                        border: "none",
                        color: "var(--text-tertiary)",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        marginBottom: "32px",
                        padding: 0,
                        transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                    <CaretLeft size={16} weight="bold" />
                    Back
                </button>

                <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-end", 
                    marginBottom: "56px",
                    gap: "24px",
                    flexWrap: "wrap"
                }}>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.04em" }}>
                            Analytics
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "500px", lineHeight: 1.6 }}>
                            Track your performance and see who's interested in your work.
                        </p>
                    </div>

                    {stats && userData && (
                        <ShareableAnalyticsCard 
                            user={{
                                name: userData.name,
                                username: userData.username,
                                avatar_url: userData.avatar_url
                            }}
                            stats={[
                                { label: "Project Views", value: stats.summary.total_project_views },
                                { label: "Post Views", value: stats.summary.total_post_views },
                                { label: "Opp. Clicks", value: stats.summary.total_opportunity_clicks }
                            ]}
                            title="Analytics Recap"
                        />
                    )}
                </div>

                {/* Summary Cards */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "24px",
                    marginBottom: "48px"
                }}>
                    <div style={{
                        padding: "32px",
                        backgroundColor: "var(--bg-page)",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--border-hairline)",
                        transition: "all 0.2s ease"
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--bg-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                            color: "var(--text-primary)"
                        }}>
                            <Eye size={18} weight="thin" />
                        </div>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                            Project Views
                        </p>
                        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {stats?.summary?.total_project_views || 0}
                        </h2>
                    </div>

                    <div style={{
                        padding: "32px",
                        backgroundColor: "var(--bg-page)",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--border-hairline)",
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--bg-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                            color: "var(--text-primary)"
                        }}>
                            <FileText size={18} weight="thin" />
                        </div>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                            Post Views
                        </p>
                        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {stats?.summary?.total_post_views || 0}
                        </h2>
                    </div>

                    <div style={{
                        padding: "32px",
                        backgroundColor: "var(--bg-page)",
                        borderRadius: "var(--radius-sm)",
                        border: "0.5px solid var(--border-hairline)",
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--bg-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                            color: "var(--text-primary)"
                        }}>
                            <MouseSimple size={18} weight="thin" />
                        </div>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                            Opp. Clicks
                        </p>
                        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {stats?.summary?.total_opportunity_clicks || 0}
                        </h2>
                    </div>
                </div>

                <div style={{ marginBottom: "56px" }}>
                    <HeatMap userId={userData?.id} githubUrl={userData?.github_url} />
                </div>

                {/* Recent Activities */}
                <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <Clock size={18} weight="thin" />
                        Recent activity
                    </h3>

                    {stats?.recent_events?.length === 0 ? (
                        <div style={{
                            padding: "64px 24px",
                            textAlign: "center",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-sm)",
                            border: "0.5px dashed var(--border-hairline)"
                        }}>
                            <p style={{ color: "var(--text-tertiary)", fontWeight: 600, fontSize: "12px" }}>No recent activity to show.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {stats.recent_events.map((event: any, idx: number) => (
                                <div key={idx} style={{
                                    padding: "20px 24px",
                                    backgroundColor: "var(--bg-page)",
                                    borderRadius: "var(--radius-sm)",
                                    borderBottom: "0.5px solid var(--border-hairline)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "16px",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "var(--radius-sm)",
                                            backgroundColor: "var(--bg-hover)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            color: "var(--text-tertiary)"
                                        }}>
                                            {event.event_type === "project_view" ? (
                                                <Rocket size={16} weight="thin" />
                                            ) : (
                                                <User size={16} weight="thin" />
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>
                                                {event.event_type === "project_view" ? (
                                                    <>Viewed your project <span style={{ color: "var(--text-primary)", textDecoration: "underline" }}>{event.project?.title}</span></>
                                                ) : event.event_type === "post_view" ? (
                                                    <>Viewed your <span style={{ textDecoration: "underline" }}>post</span></>
                                                ) : event.event_type === "post_created" ? (
                                                    <>You shared a new <span style={{ textDecoration: "underline" }}>post</span></>
                                                ) : event.event_type === "project_created" ? (
                                                    <>You launched <span style={{ textDecoration: "underline" }}>{event.project?.title || "a new project"}</span></>
                                                ) : event.event_type === "opportunity_click" ? (
                                                    <>Clicked your <span style={{ fontWeight: 700 }}>"Open to opportunities"</span></>
                                                ) : (
                                                    <>Interacted with your profile</>
                                                )}
                                            </p>
                                            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                                                {formatRelativeDate(event.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {event.actor ? (
                                        <div
                                            onClick={() => navigate(`/${event.actor.username}`)}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-hover)", cursor: "pointer", transition: "all 0.15s ease", border: "0.5px solid var(--border-hairline)" }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "var(--bg-page)";
                                                e.currentTarget.style.borderColor = "var(--text-primary)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                                e.currentTarget.style.borderColor = "var(--border-hairline)";
                                            }}
                                        >
                                            <img
                                                src={event.actor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.actor.name)}&background=212121&color=ffffff&bold=true`}
                                                alt={event.actor.name}
                                                style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }}
                                            />
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>{event.actor.username}</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", opacity: 0.5 }}>
                                            <User size={14} weight="thin" />
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Anonymous</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
