import { useMemo } from "react";
import api from "../api/axios";
import {
    Crown,
    Medal,
    Info
} from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import StreakBadge from "../components/StreakBadge";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import XPInfo from "../components/XPInfo";
import InviteModal from "../components/InviteModal";
import { useClerkUser } from "../hooks/useClerkUser";
import { useState } from "react";
import { Gift } from "phosphor-react";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    streak_count: number;
    xp: number;
    level: number;
    is_pro: boolean;
    is_og?: boolean;
}

export default function Leaderboard() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const { user } = useClerkUser();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const { data: rawData = [], isLoading: loading } = useQuery({
        queryKey: ["leaderboardXP"],
        queryFn: async () => {
            const res = await api.get("/leaderboard/xp");
            return (res.data.leaderboard || []) as LeaderboardUser[];
        },
        staleTime: 5 * 60 * 1000,
    });

    const top3 = useMemo(() => rawData.slice(0, 3), [rawData]);
    const theRest = useMemo(() => rawData.slice(3), [rawData]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <div style={{
                    width: "24px",
                    height: "24px",
                    border: "2px solid var(--border-hairline)",
                    borderTopColor: "var(--text-primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: isMobile ? "40px 16px" : "80px 40px",
            minHeight: "100vh",
            backgroundColor: "var(--bg-page)",
        }}>
            <style>{`
                .leaderboard-container { animation: tabContentEnter 0.4s ease-out; }
                .top-podium-card { background: var(--bg-card); border: 1px solid var(--border-hairline); border-radius: 28px; position: relative; transition: all 0.3s var(--ease-smooth); }
                .top-podium-card:hover { border-color: var(--text-primary); transform: translateY(-4px); box-shadow: var(--shadow-xl); }
                .list-item { border-bottom: 0.5px solid var(--border-hairline); transition: all 0.2s ease; cursor: pointer; }
                .list-item:hover { background-color: var(--bg-hover); }
                .rank-badge { width: 24px; height: 24px; border-radius: 6px; display: flex; alignItems: center; justifyContent: center; font-size: 11px; fontWeight: 900; }
                ::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="leaderboard-container">
                {/* Header Section */}
                <header style={{ textAlign: "center", marginBottom: "64px" }}>
                    <h1 style={{ fontSize: isMobile ? "40px" : "64px", fontWeight: 950, letterSpacing: "-0.05em", color: "var(--text-primary)", margin: "0 0 16px 0", lineHeight: 0.9 }}>
                        Global Leaderboard
                    </h1>
                    <p style={{ color: "var(--text-tertiary)", fontSize: "16px", fontWeight: 500, maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
                        The most active builders on the platform. Ranked by total Experience Points (XP).
                    </p>
                    <div style={{ marginTop: "24px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "center", alignItems: "center", gap: "16px" }}>
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "10px 24px", borderRadius: "100px",
                                backgroundColor: "var(--text-primary)", color: "var(--bg-page)",
                                border: "none", fontSize: "14px", fontWeight: 700,
                                cursor: "pointer", transition: "all 0.2s ease"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                            <Gift size={18} weight="bold" />
                            Invite Friends
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
                            <Info size={16} weight="regular" />
                            How to earn XP?
                        </div>
                        <XPInfo />
                    </div>
                </header>

                {/* Top 3 Podium */}
                {top3.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                        gap: "24px",
                        marginBottom: "64px",
                        alignItems: "end"
                    }}>
                        {/* 2nd Place */}
                        {!isMobile && top3[1] && <PodiumCard user={top3[1]} rank={2} color="#94A3B8" icon={Medal} />}

                        {/* 1st Place */}
                        {top3[0] && <PodiumCard user={top3[0]} rank={1} color="#FFD700" icon={Crown} isBig />}

                        {/* 3rd Place */}
                        {!isMobile && top3[2] && <PodiumCard user={top3[2]} rank={3} color="#B45309" icon={Medal} />}

                        {/* Mobile view for 2nd and 3rd */}
                        {isMobile && top3[1] && <PodiumCard user={top3[1]} rank={2} color="#94A3B8" icon={Medal} />}
                        {isMobile && top3[2] && <PodiumCard user={top3[2]} rank={3} color="#B45309" icon={Medal} />}
                    </div>
                )}

                {/* The Rest of the Herd */}
                <div style={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "28px",
                    border: "1px solid var(--border-hairline)",
                    overflow: "hidden"
                }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1fr 120px 120px",
                        padding: "20px 24px",
                        backgroundColor: "var(--bg-hover)",
                        borderBottom: "1.5px solid var(--border-hairline)"
                    }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Rank</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Member</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "right" }}>Level</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "right" }}>XP</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {theRest.map((user, idx) => (
                            <Link
                                to={`/user/${user.id}`}
                                key={user.id}
                                style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 120px", padding: "20px 24px", alignItems: "center", textDecoration: "none" }}
                                className="list-item"
                            >
                                <span style={{ fontSize: "14px", fontWeight: 950, color: "var(--text-tertiary)" }}>{idx + 4}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--border-hairline)" }} alt="" />
                                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</span>
                                            <VerifiedBadge username={user.username} size="14px" />
                                        </div>
                                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>@{user.username}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>Lvl {user.level || 1}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "15px", fontWeight: 950, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{user.xp.toLocaleString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                username={user?.username || null}
            />
        </div>
    );
}

function PodiumCard({ user, rank, color, icon: Icon, isBig }: { user: LeaderboardUser, rank: number, color: string, icon: any, isBig?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className="top-podium-card"
            style={{
                padding: isBig ? "48px 24px" : "32px 24px",
                textAlign: "center"
            }}
        >
            <div style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                backgroundColor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
                boxShadow: `0 8px 16px ${color}40`,
                zIndex: 2
            }}>
                <Icon size={18} weight="bold" />
            </div>

            <Link to={`/user/${user.id}`} style={{ textDecoration: "none" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: "20px" }}>
                    <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        style={{
                            width: isBig ? "100px" : "70px",
                            height: isBig ? "100px" : "70px",
                            borderRadius: "24px",
                            border: `3px solid ${color}`,
                            padding: "4px",
                            backgroundColor: "var(--bg-page)"
                        }}
                        alt=""
                    />
                    <div style={{
                        position: "absolute",
                        bottom: "-8px",
                        right: "-8px",
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-page)",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 900,
                        border: "2px solid var(--bg-page)"
                    }}>
                        #{rank}
                    </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: isBig ? "20px" : "16px", fontWeight: 800, color: "var(--text-primary)" }}>{user.name}</span>
                        <VerifiedBadge username={user.username} size="16px" />
                    </div>
                    <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 500 }}>@{user.username}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "28px", fontWeight: 950, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                        {user.xp.toLocaleString()} <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-tertiary)" }}>XP</span>
                    </div>
                    <div style={{ display: "inline-flex", margin: "0 auto", alignItems: "center", gap: "8px", padding: "4px 12px", backgroundColor: "var(--bg-hover)", borderRadius: "100px", border: "1px solid var(--border-hairline)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)" }}>LEVEL {user.level || 1}</span>
                    </div>
                </div>
            </Link>

            <div style={{ marginTop: "20px" }}>
                <StreakBadge count={user.streak_count} />
            </div>
        </motion.div>
    );
}
