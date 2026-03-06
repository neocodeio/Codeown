import { useState, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    ViewIcon,
    CursorPointer01Icon,
    ArrowLeft01Icon,
    ChartBarLineIcon,
    UserIcon,
    Time02Icon,
    Rocket01Icon
} from '@hugeicons/core-free-icons';
import { formatRelativeDate } from "../utils/date";
import { SEO } from "../components/SEO";

export default function Analytics() {
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!isSignedIn) return;
            try {
                setLoading(true);
                const token = await getToken();
                const res = await api.get("/analytics/summary", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "80px 20px", textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
                <HugeiconsIcon icon={ChartBarLineIcon} size={64} style={{ color: "#e2e8f0", marginBottom: "24px" }} />
                <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>Analytics</h1>
                <p style={{ color: "#64748b", marginBottom: "32px", lineHeight: 1.6 }}>{error}</p>
                <button
                    onClick={() => navigate("/profile")}
                    style={{
                        padding: "12px 24px",
                        backgroundColor: "#000",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                    }}
                >
                    Back to Profile
                </button>
            </div>
        );
    }

    return (
        <main style={{ backgroundColor: "#ffffff", minHeight: "100vh", padding: "40px 20px" }}>
            <SEO title="Analytics | Codeown" description="Track your project views and opportunities." />

            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: "32px",
                        padding: 0
                    }}
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                    BACK
                </button>

                <div style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a", marginBottom: "8px", letterSpacing: "-0.04em" }}>
                        Analytics
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "16px" }}>
                        Track your performance and see who's interested in your work.
                    </p>
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
                        backgroundColor: "#fff",
                        borderRadius: "24px",
                        border: "1px solid #f1f5f9",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)"
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            backgroundColor: "#f8fafc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                            color: "#0f172a"
                        }}>
                            <HugeiconsIcon icon={ViewIcon} size={24} />
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                            Project Views
                        </p>
                        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>
                            {stats?.summary?.total_project_views || 0}
                        </h2>
                    </div>

                    <div style={{
                        padding: "32px",
                        backgroundColor: "#fff",
                        borderRadius: "24px",
                        border: "1px solid #f1f5f9",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)"
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            backgroundColor: "#f8fafc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                            color: "#0f172a"
                        }}>
                            <HugeiconsIcon icon={CursorPointer01Icon} size={24} />
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                            Opportunity Clicks
                        </p>
                        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>
                            {stats?.summary?.total_opportunity_clicks || 0}
                        </h2>
                    </div>
                </div>

                {/* Recent Activities */}
                <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <HugeiconsIcon icon={Time02Icon} size={20} />
                        Recent Activity
                    </h3>

                    {stats?.recent_events?.length === 0 ? (
                        <div style={{
                            padding: "60px 20px",
                            textAlign: "center",
                            backgroundColor: "#f8fafc",
                            borderRadius: "24px",
                            border: "1px dashed #e2e8f0"
                        }}>
                            <p style={{ color: "#64748b", fontWeight: 600 }}>No recent activity to show.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {stats.recent_events.map((event: any, idx: number) => (
                                <div key={idx} style={{
                                    padding: "20px",
                                    backgroundColor: "#fff",
                                    borderRadius: "20px",
                                    border: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "16px"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "12px",
                                            backgroundColor: "#f1f5f9",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0
                                        }}>
                                            {event.event_type === "project_view" ? (
                                                <HugeiconsIcon icon={Rocket01Icon} size={18} style={{ color: "#64748b" }} />
                                            ) : (
                                                <HugeiconsIcon icon={UserIcon} size={18} style={{ color: "#64748b" }} />
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: 600 }}>
                                                {event.event_type === "project_view" ? (
                                                    <>Viewed your project <span style={{ color: "#2563eb" }}>{event.project?.title}</span></>
                                                ) : (
                                                    <>Clicked your <span style={{ fontWeight: 800 }}>"Open to Opportunities"</span></>
                                                )}
                                            </p>
                                            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                                {formatRelativeDate(event.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {event.actor && (
                                        <div
                                            onClick={() => navigate(`/${event.actor.username}`)}
                                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", cursor: "pointer", transition: "all 0.2s" }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                        >
                                            <img
                                                src={event.actor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.actor.name)}&background=212121&color=ffffff&bold=true`}
                                                alt={event.actor.name}
                                                style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                                            />
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>{event.actor.name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #000;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
