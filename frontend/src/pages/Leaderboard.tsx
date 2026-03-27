import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { 
  ChartBar, 
  Rocket, 
  Trophy, 
  TrendUp,
  Flame,
  CaretRight
} from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    pulse_score: number;
    tier: string;
    is_pro: boolean;
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <div style={{ 
                  width: "32px", 
                  height: "32px", 
                  border: "0.5px solid var(--border-hairline)", 
                  borderTopColor: "var(--text-primary)", 
                  borderRadius: "50%", 
                  animation: "spin 0.8s linear infinite" 
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const top3 = data.slice(0, 3);
    const theRest = data.slice(3);

    return (
        <div style={{
            padding: isMobile ? "24px 16px" : "48px 24px",
            maxWidth: "1000px",
            margin: "0 auto",
            backgroundColor: "var(--bg-page)",
            color: "var(--text-primary)",
            minHeight: "100vh"
        }}>
            {/* Header */}
            <div style={{ marginBottom: "80px", textAlign: isMobile ? "center" : "left" }}>
                <div style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  background: "transparent", 
                  padding: "6px 14px", 
                  borderRadius: "var(--radius-sm)", 
                  color: "var(--text-tertiary)", 
                  fontSize: "12px", 
                  fontWeight: 600, 
                  marginBottom: "20px", 
                  border: "0.5px solid var(--border-hairline)",
                }}>
                    <Rocket size={16} weight="regular" /> Global Pulse
                </div>
                <h1 style={{ fontSize: isMobile ? "32px" : "48px", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Leaderboard</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "600px", lineHeight: "1.6" }}>
                    Global developer community rankings based on consistency and meaningful contributions.
                </p>
            </div>

            {/* Bento Grid Top 3 */}
            <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
                gap: "16px",
                marginBottom: "48px"
            }}>
                {/* Rank #1 - Pure Black Minimalist */}
                {top3[0] && (
                    <div style={{
                        gridRow: isMobile ? "auto" : "span 2",
                        background: "var(--text-primary)",
                        borderRadius: "var(--radius-sm)",
                        padding: isMobile ? "32px" : "48px",
                        position: "relative",
                        overflow: "hidden",
                        color: "var(--bg-page)",
                        border: "0.5px solid var(--text-primary)"
                    }}>
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                                <div style={{ border: "0.5px solid rgba(255,255,255,0.2)", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Trophy size={28} weight="regular" color="currentColor" />
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Pulse score</div>
                                    <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--bg-page)", marginTop: "4px" }}>{top3[0].pulse_score.toLocaleString()}p</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
                                <img src={top3[0].avatar_url || `https://ui-avatars.com/api/?name=${top3[0].name}&background=random`} style={{ width: "72px", height: "72px", borderRadius: "12px", border: "0.5px solid rgba(255,255,255,0.2)" }} alt="" />
                                <div style={{ minWidth: 0 }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                        {top3[0].name}
                                        <VerifiedBadge username={top3[0].username} size="20px" />
                                    </h2>
                                    <Link to={`/${top3[0].username}`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", marginTop: "4px", display: "block" }}>@{top3[0].username}</Link>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "40px" }}>
                                <StatItem icon={<Flame size={14} weight="regular" />} label="Streak" value={`${top3[0].streak_count}d`} isDark={true} />
                                <StatItem icon={<Trophy size={14} weight="regular" />} label="Rank" value="#1" isDark={true} />
                                <StatItem icon={<TrendUp size={14} weight="regular" />} label="Tier" value={top3[0].tier} isDark={true} />
                            </div>

                            {top3[0].latest_project && (
                                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", padding: "20px", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: "12px" }}>Latest launch</div>
                                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        <div style={{ width: "72px", height: "44px", borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                            <img src={top3[0].latest_project.cover_image || "/placeholder.png"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: "14.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{top3[0].latest_project.title}</div>
                                            <Link to={`/project/${top3[0].latest_project.id}`} style={{ fontSize: "12px", color: "currentColor", opacity: 0.6, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", fontWeight: 500, textDecoration: "none" }}>View launch <CaretRight size={10} /></Link>
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
                            background: "var(--bg-page)",
                            borderRadius: "var(--radius-sm)",
                            padding: "24px",
                            border: "0.5px solid var(--border-hairline)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            position: "relative"
                        }}>
                            <div style={{ position: "absolute", top: "16px", right: "16px", border: "0.5px solid var(--border-hairline)", padding: "4px 10px", borderRadius: "var(--radius-sm)", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>
                                Rank #{idx + 2}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: "52px", height: "52px", borderRadius: "10px", border: "0.5px solid var(--border-hairline)" }} alt="" />
                                <div>
                                    <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{user.name}</h3>
                                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500, marginTop: "2px" }}>{user.pulse_score}p</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}>
                                    <Flame size={14} weight="regular" /> {user.streak_count}d streak
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}>
                                    <TrendUp size={14} weight="regular" /> {user.tier}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Simple Info Block */}
                    <div style={{ background: "var(--bg-hover)", borderRadius: "var(--radius-sm)", padding: "24px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "16px", border: "0.5px solid var(--border-hairline)" }}>
                        <Flame size={32} weight="regular" />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "13px" }}>Persistence pays</div>
                            <div style={{ fontSize: "13px", color: "var(--text-tertiary)", marginTop: "4px", lineHeight: "1.5" }}>Consistent daily activity unlocks advanced pulse multipliers and exclusive badges.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The List */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)" }}>World ranking</h2>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>{theRest.length} builders active this week</span>
            </div>

            <div style={{ background: "var(--bg-page)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", marginBottom: "48px" }}>
                {theRest.length === 0 ? (
                    <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                        <ChartBar size={48} weight="regular" style={{ opacity: 0.1, marginBottom: "24px", display: "block", margin: "0 auto" }} />
                        <p style={{ fontSize: "14px", fontWeight: 600 }}>The rankings are heating up.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
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
          background: var(--bg-hover);
        }
      `}</style>
        </div>
    );
}

function StatItem({ icon, label, value, isDark = false }: { icon: any, label: string, value: string, isDark?: boolean }) {
    return (
        <div style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "var(--bg-hover)",
            padding: "14px",
            borderRadius: "var(--radius-sm)",
            border: isDark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid var(--border-hairline)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isDark ? "rgba(255,255,255,0.4)" : "var(--text-tertiary)", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: isDark ? "var(--bg-page)" : "var(--text-primary)" }}>{value}</div>
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
                padding: isMobile ? "16px" : "20px 32px",
                borderBottom: "0.5px solid var(--border-hairline)",
                transition: "all 0.15s ease",
                position: "relative",
                cursor: "pointer"
            }}
        >
            <div style={{ width: "40px", fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)" }}>#{rank}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "0.5px solid var(--border-hairline)" }} alt="" />
                <div>
                    <div style={{ fontWeight: 600, fontSize: "14.5px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        {user.name}
                        <VerifiedBadge username={user.username} size="14px" />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500, marginTop: "2px" }}>{user.tier}</div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                <div style={{ display: isMobile ? "none" : "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)" }}>
                    <Flame size={16} weight="regular" />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{user.streak_count}d</span>
                </div>
                <div style={{ width: "100px", textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{user.pulse_score}p</div>
                    {!isMobile && <div style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 500, marginTop: "2px" }}>Pulse score</div>}
                </div>
            </div>

            {/* Simplified Hover Tooltip */}
            {isHovered && user.latest_project && !isMobile && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 12px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 100,
                    background: "var(--text-primary)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 14px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    border: "0.5px solid var(--text-primary)",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    whiteSpace: "nowrap",
                    animation: "tooltip-pop 0.2s ease-out"
                }}>
                    <img src={user.latest_project.cover_image || "/placeholder.png"} style={{ width: "48px", height: "30px", objectFit: "cover", borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.1)" }} alt="" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Latest project</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--bg-page)" }}>{user.latest_project.title}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
