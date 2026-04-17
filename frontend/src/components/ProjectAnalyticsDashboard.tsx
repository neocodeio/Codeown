import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import {
    Eye,
    Heart,
    BookmarkSimple,
    ChatCircle,
    TrendUp,
    Handshake,
    Star,
    ChartBar,
    ArrowUp,
    ArrowDown,
    User
} from "phosphor-react";
import { formatRelativeDate } from "../utils/date";


interface ProjectAnalyticsDashboardProps {
    projectId: number;
    projectTitle: string;
}

export default function ProjectAnalyticsDashboard({ projectId, projectTitle }: ProjectAnalyticsDashboardProps) {
    const { getToken } = useClerkAuth();
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["projectAnalytics", projectId],
        queryFn: async () => {
            const token = await getToken();
            const res = await api.get(`/projects/${projectId}/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Full Analytics Response Data:", res.data);
            return res.data;
        },
        staleTime: 5000,
        refetchInterval: 15000, // Refresh every 15 seconds for real-time feel
    });


    const maxViews = useMemo(() => {
        if (!data?.views_timeline) return 1;
        return Math.max(1, ...data.views_timeline.map((d: any) => d.views));
    }, [data?.views_timeline]);

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                <div style={{
                    width: "20px", height: "20px",
                    border: "0.5px solid var(--border-hairline)",
                    borderTopColor: "var(--text-primary)",
                    borderRadius: "999px",
                    animation: "spin 0.6s linear infinite"
                }} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <ChartBar size={40} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: "16px", opacity: 0.4 }} />
                <p style={{ color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 600 }}>Failed to load analytics</p>
            </div>
        );
    }

    if (!data || !data.overview) {
        return (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <ChartBar size={40} weight="thin" color="var(--text-tertiary)" style={{ marginBottom: "16px", opacity: 0.4 }} />
                <p style={{ color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 600 }}>
                    No analytics data available yet.
                </p>
                <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: "8px" }}>
                    Start sharing your project to see performance metrics.
                </p>
            </div>
        );
    }

    const { overview, views_timeline, recent_activity } = data;

    const tractionColor =
        (overview.traction_score || 0) >= 70 ? "#22c55e" :
            (overview.traction_score || 0) >= 40 ? "#f59e0b" : "var(--text-tertiary)";


    const GrowthBadge = ({ value }: { value: number }) => (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "2px",
            fontSize: "10px", fontWeight: 800,
            color: value > 0 ? "#22c55e" : value < 0 ? "#ef4444" : "var(--text-tertiary)",
            padding: "2px 6px",
            borderRadius: "6px",
            backgroundColor: value > 0 ? "rgba(34,197,94,0.08)" : value < 0 ? "rgba(239,68,68,0.08)" : "transparent"
        }}>
            {value > 0 ? <ArrowUp size={10} weight="bold" /> : value < 0 ? <ArrowDown size={10} weight="bold" /> : null}
            {value > 0 ? "+" : ""}{value}%
        </span>
    );

    // Stat card component
    const StatCard = ({ icon, label, value, subValue, growth }: {
        icon: React.ReactNode;
        label: string;
        value: number | string;
        subValue?: string;
        growth?: number;
    }) => (
        <div style={{
            padding: isMobile ? "20px" : "24px",
            backgroundColor: "var(--bg-page)",
            borderRadius: "16px",
            border: "0.5px solid var(--border-hairline)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            transition: "all 0.15s ease",
        }}>
            <div style={{
                width: "32px", height: "32px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-hover)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-tertiary)"
            }}>
                {icon}
            </div>
            <div>
                <p style={{
                    fontSize: "10px", fontWeight: 800,
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 6px"
                }}>
                    {label}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <h3 style={{
                        fontSize: "26px", fontWeight: 800,
                        color: "var(--text-primary)",
                        margin: 0,
                        letterSpacing: "-0.02em"
                    }}>
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </h3>
                    {growth !== undefined && <GrowthBadge value={growth} />}
                </div>
                {subValue && (
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600, margin: "4px 0 0" }}>
                        {subValue}
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Dashboard Header */}
            <div style={{ marginBottom: "-8px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                    Project Performance
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                    Detailed analytics for {projectTitle}
                </p>
            </div>

            {/* Traction Score Hero */}
            <div style={{
                padding: "32px",
                borderRadius: "20px",
                border: "0.5px solid var(--border-hairline)",
                backgroundColor: "var(--bg-page)",
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                flexDirection: isMobile ? "column" : "row",
                gap: "24px"
            }}>
                <div>
                    <div style={{
                        fontSize: "10px", fontWeight: 800,
                        color: "var(--text-tertiary)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "8px"
                    }}>
                        Traction Score
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{
                            fontSize: "48px",
                            fontWeight: 900,
                            color: tractionColor,
                            letterSpacing: "-0.04em",
                            lineHeight: 1
                        }}>
                            {overview.traction_score}
                        </span>
                        <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-tertiary)" }}>/100</span>
                    </div>
                    <p style={{
                        fontSize: "12px",
                        color: "var(--text-tertiary)",
                        fontWeight: 500,
                        margin: "8px 0 0",
                        maxWidth: "300px",
                        lineHeight: 1.5
                    }}>
                        Composite score based on views, engagement, saves, likes, rating, and recency.
                    </p>
                </div>

                {/* Traction bar visualization */}
                <div style={{ width: isMobile ? "100%" : "200px", flexShrink: 0 }}>
                    <div style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "var(--bg-hover)",
                        borderRadius: "100px",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            width: `${overview.traction_score}%`,
                            height: "100%",
                            backgroundColor: tractionColor,
                            borderRadius: "100px",
                            transition: "width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                        }} />
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "var(--text-tertiary)"
                    }}>
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                    </div>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
                gap: "12px"
            }}>
                <StatCard
                    icon={<Eye size={16} weight="regular" />}
                    label="Total Views"
                    value={overview.total_views}
                    subValue={`${overview.views_last_30} in last 30 days`}
                    growth={overview.views_growth}
                />
                <StatCard
                    icon={<Heart size={16} weight="regular" />}
                    label="Likes"
                    value={overview.total_likes}
                    subValue={`${overview.likes_last_30} this month`}
                />
                <StatCard
                    icon={<ChatCircle size={16} weight="regular" />}
                    label="Comments"
                    value={overview.total_comments}
                    subValue={`${overview.comments_last_30} this month`}
                />
                <StatCard
                    icon={<BookmarkSimple size={16} weight="regular" />}
                    label="Saves"
                    value={overview.total_saves}
                    subValue={`${overview.save_rate}% save rate`}
                />
                <StatCard
                    icon={<TrendUp size={16} weight="regular" />}
                    label="Engagement"
                    value={`${overview.engagement_rate}%`}
                    subValue="likes + comments + saves / views"
                />
                <StatCard
                    icon={<Handshake size={16} weight="regular" />}
                    label="Co-founder Requests"
                    value={overview.contributor_interest}
                    subValue="builders interested"
                />
            </div>

            {/* Views Chart */}
            <div style={{
                padding: isMobile ? "20px" : "28px",
                borderRadius: "20px",
                border: "0.5px solid var(--border-hairline)",
                backgroundColor: "var(--bg-page)",
            }}>
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "24px"
                }}>
                    <div>
                        <h3 style={{
                            fontSize: "14px", fontWeight: 800,
                            color: "var(--text-primary)", margin: 0
                        }}>
                            Views — Last 30 Days
                        </h3>
                        <p style={{
                            fontSize: "11px", color: "var(--text-tertiary)",
                            fontWeight: 600, margin: "4px 0 0"
                        }}>
                            {overview.views_last_30.toLocaleString()} total views
                        </p>
                    </div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        backgroundColor: overview.views_growth >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                        color: overview.views_growth >= 0 ? "#22c55e" : "#ef4444",
                        fontSize: "12px", fontWeight: 800
                    }}>
                        {overview.views_growth >= 0 ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
                        {overview.views_growth > 0 ? "+" : ""}{overview.views_growth}% vs prev 30d
                    </div>
                </div>

                {/* Bar chart */}
                <div style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "2px",
                    height: isMobile ? "120px" : "160px",
                    position: "relative",
                }}>
                    {views_timeline.map((d: any, i: number) => {
                        const barHeight = maxViews > 0 ? Math.max(2, (d.views / maxViews) * 100) : 2;
                        const isHovered = hoveredBar === i;
                        const date = new Date(d.date);
                        const dayLabel = date.toLocaleDateString("en", { month: "short", day: "numeric" });

                        return (
                            <div
                                key={d.date}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    position: "relative",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() => setHoveredBar(i)}
                                onMouseLeave={() => setHoveredBar(null)}
                            >
                                {/* Tooltip */}
                                {isHovered && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: `calc(${barHeight}% + 8px)`,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        padding: "6px 10px",
                                        backgroundColor: "var(--text-primary)",
                                        color: "var(--bg-page)",
                                        borderRadius: "8px",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        zIndex: 10,
                                        pointerEvents: "none",
                                    }}>
                                        {dayLabel}: {d.views} view{d.views !== 1 ? "s" : ""}
                                    </div>
                                )}
                                <div style={{
                                    width: "100%",
                                    height: `${barHeight}%`,
                                    backgroundColor: isHovered ? "var(--text-primary)" : d.views > 0 ? "var(--text-tertiary)" : "var(--bg-hover)",
                                    borderRadius: "3px 3px 0 0",
                                    transition: "all 0.15s ease",
                                    opacity: isHovered ? 1 : d.views > 0 ? 0.5 : 0.3,
                                    minHeight: "2px",
                                }} />
                            </div>
                        );
                    })}
                </div>

                {/* X-axis labels */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "var(--text-tertiary)"
                }}>
                    {views_timeline.length > 0 && (
                        <>
                            <span>{new Date(views_timeline[0].date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                            <span>{new Date(views_timeline[Math.floor(views_timeline.length / 2)].date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                            <span>{new Date(views_timeline[views_timeline.length - 1].date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Rating + Save Rate row */}
            <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "12px"
            }}>
                <div style={{
                    padding: "24px",
                    borderRadius: "16px",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-page)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <Star size={16} weight="regular" color="var(--text-tertiary)" />
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Average Rating
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                            {overview.avg_rating.toFixed(1)}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-tertiary)" }}>/5</span>
                    </div>
                    <div style={{ display: "flex", gap: "3px", marginTop: "8px" }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star
                                key={s}
                                size={14}
                                weight={overview.avg_rating >= s ? "fill" : "regular"}
                                color={overview.avg_rating >= s ? "var(--text-primary)" : "var(--border-hairline)"}
                            />
                        ))}
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600, marginLeft: "6px" }}>
                            {overview.rating_count} votes
                        </span>
                    </div>
                </div>

                <div style={{
                    padding: "24px",
                    borderRadius: "16px",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-page)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <BookmarkSimple size={16} weight="regular" color="var(--text-tertiary)" />
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Save Rate
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                            {overview.save_rate}
                        </span>
                        <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-tertiary)" }}>%</span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600, margin: "8px 0 0" }}>
                        {overview.total_saves} saves out of {overview.total_views} views
                    </p>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={{
                borderRadius: "20px",
                border: "0.5px solid var(--border-hairline)",
                backgroundColor: "var(--bg-page)",
                overflow: "hidden"
            }}>
                <div style={{ padding: "24px 24px 16px" }}>
                    <h3 style={{
                        fontSize: "14px", fontWeight: 800,
                        color: "var(--text-primary)", margin: 0
                    }}>
                        Recent Visitors
                    </h3>
                    <p style={{
                        fontSize: "11px", color: "var(--text-tertiary)",
                        fontWeight: 600, margin: "4px 0 0"
                    }}>
                        People who viewed this project
                    </p>
                </div>

                {recent_activity.length === 0 ? (
                    <div style={{
                        padding: "48px 24px",
                        textAlign: "center",
                        borderTop: "0.5px solid var(--border-hairline)"
                    }}>
                        <Eye size={32} weight="thin" color="var(--text-tertiary)" style={{ opacity: 0.3, marginBottom: "12px" }} />
                        <p style={{ color: "var(--text-tertiary)", fontWeight: 600, fontSize: "12px", margin: 0 }}>
                            No recent visitors yet
                        </p>
                    </div>
                ) : (
                    <div>
                        {recent_activity.map((event: any, idx: number) => (
                            <div
                                key={idx}
                                style={{
                                    padding: "14px 24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    borderTop: "0.5px solid var(--border-hairline)",
                                    transition: "background 0.1s ease",
                                    cursor: event.actor?.username ? "pointer" : "default",
                                }}
                                onClick={() => event.actor?.username && navigate(`/${event.actor.username}`)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {event.actor?.avatar_url ? (
                                        <img
                                            src={event.actor.avatar_url}
                                            alt=""
                                            style={{
                                                width: "28px", height: "28px",
                                                borderRadius: "8px",
                                                border: "0.5px solid var(--border-hairline)"
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: "28px", height: "28px",
                                            borderRadius: "8px",
                                            backgroundColor: "var(--bg-hover)",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <User size={14} weight="regular" color="var(--text-tertiary)" />
                                        </div>
                                    )}
                                    <div>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                                            {event.actor?.name || "Anonymous"}
                                        </span>
                                        {event.actor?.username && (
                                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginLeft: "6px", fontWeight: 500 }}>
                                                @{event.actor.username}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600, flexShrink: 0 }}>
                                    {formatRelativeDate(event.created_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
