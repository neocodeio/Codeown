import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    FireIcon,
    ChartBarLineIcon,
    Tick01Icon,
    Rocket01Icon,
    DashboardSpeed01Icon
} from "@hugeicons/core-free-icons";
import { useWindowSize } from "../hooks/useWindowSize";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    is_pro: boolean;
    last_active_at: string;
    pulse_score: number;
    tier: string;
    engagement: {
        likes: number;
        views: number;
        comments: number;
    };
    latest_project: any;
}

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<LeaderboardUser[]>([]);
    const { width } = useWindowSize();
    const isMobile = width < 768;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get("/leaderboard/pulse");
                setData(res.data.leaderboard);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", color: "#64748b" }}>
                <div style={{ width: "48px", height: "48px", border: "2px solid #f1f5f9", borderTopColor: "#000", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const top3 = data.slice(0, 3);
    const theRest = data.slice(3);

    return (
        <div style={{
            padding: isMobile ? "20px 16px" : "40px 24px",
            maxWidth: "1100px",
            margin: "0 auto",
            backgroundColor: "#fff",
            color: "#000",
            minHeight: "100vh",
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header */}
            <div style={{ marginBottom: "48px", textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "8px 16px", borderRadius: "100px", color: "#000", fontSize: "14px", fontWeight: 700, marginBottom: "16px", border: "1px solid #f1f5f9" }}>
                    <HugeiconsIcon icon={Rocket01Icon} size={16} /> Global Status
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#000", opacity: 0.6, animation: "pulse-indicator 2s infinite" }} />
                </div>
                <h1 style={{ fontSize: isMobile ? "32px" : "44px", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.04em" }}>Leaderboard</h1>
                <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
                    Community rankings based on activity, consistency, and engagement.
                </p>
            </div>

            {/* Bento Grid Top 3 */}
            <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
                gap: "16px",
                marginBottom: "48px"
            }}>
                {/* Rank #1 - Clean Dark Component */}
                {top3[0] && (
                    <div style={{
                        gridRow: isMobile ? "auto" : "span 2",
                        background: "#111",
                        borderRadius: "24px",
                        padding: isMobile ? "24px" : "40px",
                        position: "relative",
                        overflow: "hidden",
                        color: "#fff",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.08)"
                    }}>
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                                <div style={{ background: "rgba(255,255,255,0.05)", width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <HugeiconsIcon icon={Rocket01Icon} size={28} color="#facc15" />
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Pulse Score</div>
                                    <div style={{ fontSize: "36px", fontWeight: 800, color: "#fff" }}>{top3[0].pulse_score.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
                                <img src={top3[0].avatar_url || `https://ui-avatars.com/api/?name=${top3[0].name}&background=random`} style={{ width: "72px", height: "72px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.1)" }} alt="" />
                                <div>
                                    <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                        {top3[0].name}
                                        {top3[0].is_pro && <span title="PRO" style={{ color: "#fff" }}><HugeiconsIcon icon={Tick01Icon} size={18} /></span>}
                                    </h2>
                                    <Link to={`/${top3[0].username}`} style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "16px" }}>@{top3[0].username}</Link>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "32px" }}>
                                <StatItem icon={<HugeiconsIcon icon={FireIcon} size={16} />} label="Streak" value={`${top3[0].streak_count}d`} isDark={true} />
                                <StatItem icon={<HugeiconsIcon icon={ChartBarLineIcon} size={16} />} label="Rank" value="#1" isDark={true} />
                                <StatItem icon={<HugeiconsIcon icon={DashboardSpeed01Icon} size={16} />} label="Tier" value={top3[0].tier} isDark={true} />
                            </div>

                            {top3[0].latest_project && (
                                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "12px", textTransform: "uppercase" }}>Masterpiece Preview</div>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <img src={top3[0].latest_project.cover_image || "/placeholder.png"} style={{ width: "70px", height: "45px", objectFit: "cover", borderRadius: "6px" }} alt="" />
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 600 }}>{top3[0].latest_project.title}</div>
                                            <Link to={`/project/${top3[0].latest_project.id}`} style={{ fontSize: "12px", color: "#fff", textDecoration: "underline", opacity: 0.8 }}>View project →</Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Rank #2 & #3 */}
                <div style={{ display: "grid", gap: "16px" }}>
                    {top3.slice(1).map((user, idx) => (
                        <div key={user.id} style={{
                            background: "#f8fafc",
                            borderRadius: "20px",
                            padding: isMobile ? "20px" : "24px",
                            border: "1px solid #f1f5f9",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            position: "relative"
                        }}>
                            <div style={{ position: "absolute", top: "16px", right: "20px", background: "rgba(0,0,0,0.05)", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, color: "#64748b" }}>
                                #{idx + 2}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: isMobile ? "44px" : "52px", height: isMobile ? "44px" : "52px", borderRadius: "14px" }} alt="" />
                                <div>
                                    <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 700, margin: 0 }}>{user.name}</h3>
                                    <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>{user.pulse_score.toLocaleString()} points</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "12px", fontWeight: 500 }}>
                                    <HugeiconsIcon icon={FireIcon} size={13} /> {user.streak_count}d
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "12px", fontWeight: 500 }}>
                                    <HugeiconsIcon icon={ChartBarLineIcon} size={13} /> {user.tier}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Simple Info Block */}
                    <div style={{ background: "#000", borderRadius: "20px", padding: "24px", color: "#fff", display: "flex", alignItems: "center", gap: "16px" }}>
                        <HugeiconsIcon icon={FireIcon} size={28} color="#facc15" />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "14px" }}>Active Daily</div>
                            <div style={{ fontSize: "12px", opacity: 0.6 }}>Consistent activity yields the highest Pulse multipliers.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The List */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>World Ranking</h2>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{theRest.length} developers active</span>
            </div>

            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", marginBottom: "40px" }}>
                {theRest.length === 0 ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                        The rankings are heating up.
                    </div>
                ) : (
                    <div>
                        {theRest.map((user, idx) => (
                            <LeaderboardRow key={user.id} user={user} rank={idx + 4} isMobile={isMobile} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes pulse-indicator {
          0% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(0.9); }
        }
        @keyframes tooltip-pop {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.95); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .leaderboard-row:hover {
          background: #f8fafc;
        }
      `}</style>
        </div>
    );
}

function StatItem({ icon, label, value, isDark = false }: { icon: any, label: string, value: string, isDark?: boolean }) {
    return (
        <div style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
            padding: "12px",
            borderRadius: "12px",
            border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f1f5f9"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: isDark ? "#fff" : "#000" }}>{value}</div>
        </div>
    );
}

function LeaderboardRow({ user, rank, isMobile }: { user: LeaderboardUser, rank: number, isMobile: boolean }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="leaderboard-row"
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                padding: isMobile ? "12px 16px" : "16px 24px",
                borderBottom: "1px solid #f1f5f9",
                transition: "all 0.15s ease",
                position: "relative",
                cursor: "pointer"
            }}
        >
            <div style={{ width: "40px", fontSize: "13px", fontWeight: 800, color: "#94a3b8" }}>{rank}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: "40px", height: "40px", borderRadius: "10px" }} alt="" />
                <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#000", display: "flex", alignItems: "center", gap: "6px" }}>
                        {user.name}
                        {user.is_pro && <HugeiconsIcon icon={Tick01Icon} size={14} color="#000" />}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{user.tier}</div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b" }}>
                    <HugeiconsIcon icon={FireIcon} size={16} />
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>{user.streak_count}d</span>
                </div>
                <div style={{ width: "80px", textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#000" }}>{user.pulse_score.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Pulse</div>
                </div>
            </div>

            {/* Simplified Hover Tooltip */}
            {isHovered && user.latest_project && !isMobile && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 12px)", // Fixed: Attached precisely above the row
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 100,
                    background: "#111",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    whiteSpace: "nowrap",
                    animation: "tooltip-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}>
                    <img src={user.latest_project.cover_image || "/placeholder.png"} style={{ width: "40px", height: "30px", objectFit: "cover", borderRadius: "4px" }} alt="" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Masterpiece</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{user.latest_project.title}</div>
                    </div>
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "6px solid #111",
                        position: "absolute",
                        bottom: "-6px",
                        left: "50%",
                        transform: "translateX(-50%)"
                    }} />
                </div>
            )}
        </div>
    );
}
