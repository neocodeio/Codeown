import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { 
  Rocket,
  CaretRight,
  Lightning,
  Sparkle,
  ArrowRight,
  Flame
} from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import flameGif from "../assets/flame.gif";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    pulse_score: number;
    tier: string;
    is_pro: boolean;
    latest_project?: any;
}

export default function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<LeaderboardUser[]>([]);
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isTablet = width < 1200;

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get("/leaderboard/pulse");
                setData(res.data.leaderboard || []);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const top3 = useMemo(() => data.slice(0, 3), [data]);
    const theRest = useMemo(() => data.slice(3), [data]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <div style={{ 
                  width: "20px", 
                  height: "20px", 
                  border: "1.5px solid var(--border-hairline)", 
                  borderTopColor: "var(--text-primary)", 
                  borderRadius: "50%", 
                  animation: "spin 0.6s cubic-bezier(0.4, 0, 0.2, 1) infinite" 
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: isMobile ? "20px 16px" : "60px 40px",
            minHeight: "100vh",
            backgroundColor: "var(--bg-page)",
        }}>
            <style>{`
                .glass-card { background: var(--bg-card); border: 1px solid var(--border-hairline); border-radius: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .glass-card:hover { border-color: var(--text-tertiary); }
                .rank-tile { background: var(--bg-card); border: 1px solid var(--border-hairline); border-radius: 16px; margin-bottom: 12px; transition: all 0.2s ease; cursor: pointer; }
                .rank-tile:hover { border-color: var(--text-primary); transform: translateX(8px); }
                .tier-dot { width: 6px; height: 6px; border-radius: 50%; }
                .pulse-glow { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; position: relative; }
                .pulse-glow::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: inherit; animation: pulse-ring 2s infinite; }
                @keyframes pulse-ring { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(3); opacity: 0; } }
                .counter-anim { font-variant-numeric: tabular-nums; }
            `}</style>

            <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "400px 1fr", gap: "60px", alignItems: "start" }}>
                
                {/* Left Sidebar: Hero & Podium */}
                <aside style={{ position: isTablet ? "relative" : "sticky", top: "40px" }}>
                    <div style={{ marginBottom: "48px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                           <div className="pulse-glow" />
                           <span style={{ fontSize: "11px", fontWeight: 850, letterSpacing: "0.1em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Pulse Protocol v2</span>
                        </div>
                        <h1 style={{ fontSize: "44px", fontWeight: 950, letterSpacing: "-0.05em", color: "var(--text-primary)", lineHeight: 1, margin: "0 0 16px 0" }}>Leaderboard</h1>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "15px", lineHeight: 1.6, fontWeight: 500, maxWidth: "340px" }}>
                            The global developer hierarchy. Persistence, contribution, and speed visualized.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {top3.map((user, idx) => (
                            <PodiumMini key={user.id} user={user} rank={idx + 1} />
                        ))}
                    </div>

                    <div style={{ marginTop: "48px", padding: "24px", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-hairline)" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <Sparkle size={18} weight="fill" color="#FFD700" /> Season 1 Live
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                            Build and ship consistently to claim your spot in the Hall of Fame. The top 3 win permanent badges.
                        </p>
                    </div>
                </aside>

                {/* Right Content: The Feed */}
                <main>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "0 8px" }}>
                        <h2 style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "0.05em" }}>GLOBAL FEED ({theRest.length})</h2>
                        <div style={{ display: "flex", gap: "24px", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)" }}>
                            <span>CONTRIBUTOR</span>
                            <span style={{ minWidth: "100px", textAlign: "right" }}>PULSE INDEX</span>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <AnimatePresence mode="popLayout">
                            {theRest.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    style={{ padding: "100px 0", textAlign: "center", border: "1.5px dashed var(--border-hairline)", borderRadius: "24px" }}
                                >
                                    <Rocket size={40} weight="thin" style={{ opacity: 0.1, marginBottom: "16px" }} />
                                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)" }}>Scanning for the next wave of builders...</p>
                                </motion.div>
                            ) : (
                                theRest.map((user, idx) => (
                                    <RankTile key={user.id} user={user} rank={idx + 4} isMobile={isMobile} />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}

function PodiumMini({ user, rank }: { user: LeaderboardUser, rank: number }) {
    const isFirst = rank === 1;
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rank * 0.1 }}
            className="glass-card"
            style={{ 
                padding: "20px", 
                display: "flex", 
                alignItems: "center", 
                gap: "16px",
                borderColor: isFirst ? "var(--text-primary)" : "var(--border-hairline)",
                background: isFirst ? "var(--bg-card)" : "transparent"
            }}
        >
            <div style={{ position: "relative" }}>
                <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                    style={{ width: "48px", height: "48px", borderRadius: "14px", border: "1px solid var(--border-hairline)" }} 
                    alt="" 
                />
                <div style={{ 
                    position: "absolute", 
                    top: "-8px", 
                    left: "-8px", 
                    width: "22px", 
                    height: "22px", 
                    background: isFirst ? "var(--text-primary)" : "var(--bg-hover)", 
                    color: isFirst ? "var(--bg-page)" : "var(--text-primary)", 
                    borderRadius: "6px", 
                    fontSize: "10px", 
                    fontWeight: 900, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: "1px solid var(--border-hairline)"
                }}>
                    #{rank}
                </div>
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</span>
                    <VerifiedBadge username={user.username} size="14px" />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>{user.pulse_score.toLocaleString()}p</div>
            </div>

            {isFirst && <Lightning size={18} weight="fill" color="var(--text-primary)" />}
            {!isFirst && (
                <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "2px" }}>
                    {user.streak_count}d 
                    {user.streak_count > 0 ? (
                        <img src={flameGif} style={{ width: "14px", height: "14px" }} alt="" />
                    ) : (
                        <Flame size={12} weight="fill" color="var(--border-strong)" style={{ opacity: 0.4 }} />
                    )}
                </div>
            )}
        </motion.div>
    );
}

function RankTile({ user, rank, isMobile }: { user: LeaderboardUser, rank: number, isMobile: boolean }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div 
            layout
            className="rank-tile"
            onClick={() => setExpanded(!expanded)}
            style={{ padding: isMobile ? "16px" : "16px 24px" }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ width: "32px", fontSize: "13px", fontWeight: 900, color: "var(--text-tertiary)", textAlign: "center" }}>{rank}</div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                    <img 
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--border-hairline)" }} 
                        alt="" 
                    />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
                            <VerifiedBadge username={user.username} size="14px" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)" }}>
                                <div className="tier-dot" style={{ background: user.pulse_score > 5000 ? "#A855F7" : user.pulse_score > 2000 ? "#3B82F6" : "#94A3B8" }} />
                                {user.tier}
                            </span>
                            <span style={{ color: "var(--border-strong)", opacity: 0.1 }}>•</span>
                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                            {user.streak_count}d STREAK 
                            {user.streak_count > 0 ? (
                                <img src={flameGif} style={{ width: "14px", height: "14px" }} alt="" />
                            ) : (
                                <Flame size={12} weight="fill" color="var(--border-strong)" style={{ opacity: 0.4 }} />
                            )}
                        </span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: "right", minWidth: isMobile ? "70px" : "100px" }}>
                    <div style={{ fontSize: "18px", fontWeight: 950, color: "var(--text-primary)", letterSpacing: "-0.02em" }} className="counter-anim">{user.pulse_score.toLocaleString()}</div>
                    <div style={{ fontSize: "9px", fontWeight: 850, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Index</div>
                </div>

                {!isMobile && (
                    <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
                        <CaretRight size={16} weight="bold" color="var(--border-strong)" />
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {expanded && user.latest_project && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                    >
                        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border-hairline)", display: "flex", gap: "20px", alignItems: "center" }}>
                            <img src={user.latest_project.cover_image || "/placeholder.png"} style={{ width: "120px", height: "70px", borderRadius: "12px", objectFit: "cover", border: "1px solid var(--border-hairline)" }} alt="" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "10px", fontWeight: 850, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "4px" }}>Active Masterpiece</div>
                                <h4 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 8px 0" }}>{user.latest_project.title}</h4>
                                <Link 
                                    to={`/project/${user.latest_project.id}`} 
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", textDecoration: "none" }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Explore project <ArrowRight size={14} weight="bold" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
