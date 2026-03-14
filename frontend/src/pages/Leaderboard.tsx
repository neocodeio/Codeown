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
                  borderRadius: "2px", 
                  color: "var(--text-primary)", 
                  fontSize: "10px", 
                  fontWeight: 800, 
                  marginBottom: "24px", 
                  border: "0.5px solid var(--border-hairline)",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em"
                }}>
                    <Rocket size={14} weight="thin" /> GLOBAL PULSE
                </div>
                <h1 style={{ fontSize: isMobile ? "32px" : "56px", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.04em", textTransform: "uppercase" }}>LEADERBOARD</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "600px", lineHeight: "1.6" }}>
                    Global developer community rankings based on consistency, and meaningful contributions.
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
                        borderRadius: "2px",
                        padding: isMobile ? "32px" : "56px",
                        position: "relative",
                        overflow: "hidden",
                        color: "var(--bg-page)",
                        border: "0.5px solid var(--text-primary)"
                    }}>
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "48px" }}>
                                <div style={{ border: "0.5px solid rgba(255,255,255,0.2)", width: "48px", height: "48px", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Trophy size={28} weight="thin" color="currentColor" />
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>PULSE SCORE</div>
                                    <div style={{ fontSize: "40px", fontWeight: 800, color: "var(--bg-page)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>{top3[0].pulse_score.toLocaleString()}P</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "48px" }}>
                                <img src={top3[0].avatar_url || `https://ui-avatars.com/api/?name=${top3[0].name}&background=random`} style={{ width: "80px", height: "80px", borderRadius: "2px", border: "0.5px solid rgba(255,255,255,0.2)" }} alt="" />
                                <div style={{ minWidth: 0 }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                                        {top3[0].name}
                                        <VerifiedBadge username={top3[0].username} size="18px" />
                                    </h2>
                                    <Link to={`/${top3[0].username}`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontFamily: "var(--font-mono)", marginTop: "4px", display: "block" }}>@{top3[0].username}</Link>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "48px" }}>
                                <StatItem icon={<Flame size={14} weight="thin" />} label="Streak" value={`${top3[0].streak_count.toString().padStart(2, '0')}D`} isDark={true} />
                                <StatItem icon={<ChartBar size={14} weight="thin" />} label="Rank" value="#01" isDark={true} />
                                <StatItem icon={<TrendUp size={14} weight="thin" />} label="Tier" value={top3[0].tier.toUpperCase()} isDark={true} />
                            </div>

                            {top3[0].latest_project && (
                                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "2px", padding: "24px", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 700, marginBottom: "16px", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>Latest Project</div>
                                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                                        <div style={{ width: "80px", height: "50px", objectFit: "cover", borderRadius: "2px", border: "0.5px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                            <img src={top3[0].latest_project.cover_image || "/placeholder.png"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: "15px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{top3[0].latest_project.title}</div>
                                            <Link to={`/project/${top3[0].latest_project.id}`} style={{ fontSize: "11px", color: "currentColor", opacity: 0.6, display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)", textDecoration: "none" }}>View Project <CaretRight size={10} /></Link>
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
                            borderRadius: "2px",
                            padding: "32px 24px",
                            border: "0.5px solid var(--border-hairline)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            position: "relative"
                        }}>
                            <div style={{ position: "absolute", top: "16px", right: "20px", border: "0.5px solid var(--border-hairline)", padding: "4px 10px", borderRadius: "2px", fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                                RANK #{idx + 2}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: "56px", height: "56px", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }} alt="" />
                                <div>
                                    <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{user.name}</h3>
                                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: "2px" }}>{user.pulse_score.toString().padStart(4, '0')}P</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                                    <Flame size={14} weight="thin" /> {user.streak_count.toString().padStart(2, '0')}D STREAK
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                                    <TrendUp size={14} weight="thin" /> {user.tier.toUpperCase()} TIER
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Simple Info Block */}
                    <div style={{ background: "var(--bg-hover)", borderRadius: "2px", padding: "32px 24px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "20px", border: "0.5px solid var(--border-hairline)" }}>
                        <Flame size={32} weight="thin" />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Persistence Pays</div>
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px", lineHeight: "1.5" }}>Consistent daily activity unlocks advanced Pulse multipliers and exclusive badges.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The List */}
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "var(--font-mono)" }}>World Ranking</h2>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{theRest.length} ACTIVE DEVELOPERS</span>
            </div>

            <div style={{ background: "var(--bg-page)", borderRadius: "2px", border: "0.5px solid var(--border-hairline)", marginBottom: "48px" }}>
                {theRest.length === 0 ? (
                    <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                        <ChartBar size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "24px", display: "block", margin: "0 auto" }} />
                        <p style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>The rankings are heating up.</p>
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
            padding: "16px",
            borderRadius: "2px",
            border: isDark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid var(--border-hairline)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDark ? "rgba(255,255,255,0.4)" : "var(--text-tertiary)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: isDark ? "var(--bg-page)" : "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{value}</div>
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
                padding: isMobile ? "20px 16px" : "24px 32px",
                borderBottom: "0.5px solid var(--border-hairline)",
                transition: "all 0.15s ease",
                position: "relative",
                cursor: "pointer"
            }}
        >
            <div style={{ width: "40px", fontSize: "12px", fontWeight: 800, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{rank.toString().padStart(2, '0')}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: "40px", height: "40px", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }} alt="" />
                <div>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" }}>
                        {user.name}
                        <VerifiedBadge username={user.username} size="14px" />
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", marginTop: "2px" }}>{user.tier} TIER</div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    <Flame size={16} weight="thin" />
                    <span style={{ fontSize: "13px", fontWeight: 800 }}>{user.streak_count.toString().padStart(2, '0')}D</span>
                </div>
                <div style={{ width: "120px", textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{user.pulse_score.toString().padStart(4, '0')}P</div>
                    <div style={{ fontSize: "9px", color: "var(--text-tertiary)", fontWeight: 800, textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>PULSE SCORE</div>
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
                    borderRadius: "2px",
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
                    <img src={user.latest_project.cover_image || "/placeholder.png"} style={{ width: "48px", height: "30px", objectFit: "cover", borderRadius: "2px", border: "0.5px solid rgba(255,255,255,0.1)" }} alt="" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>MASTERPIECE</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--bg-page)" }}>{user.latest_project.title}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
