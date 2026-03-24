import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Rocket01Icon,
    ChartBarLineIcon
} from "@hugeicons/core-free-icons";

export default function LeaderboardSpotlight() {
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSpotlight = async () => {
            try {
                const res = await api.get("/leaderboard/pulse");
                setTopUsers(res.data.top_spotlight || []);
            } catch (err) {
                console.error("Failed to fetch spotlight", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSpotlight();
    }, []);

    if (loading || topUsers.length === 0) return null;

    return (
        <div style={{
            background: "#111", // Solid dark for simplicity
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", width: "28px", height: "28px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <HugeiconsIcon icon={Rocket01Icon} size={16} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Community Spotlight</h3>
                </div>
                <Link to="/leaderboard" style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "none", fontWeight: 600 }}>Global Rankings →</Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {topUsers.map((user, idx) => (
                    <Link key={user.id} to={`/${user.username}`} style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
                        <div style={{ position: "relative", marginBottom: "sm", display: "inline-block" }}>
                            <img
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                style={{ width: "48px", height: "48px", borderRadius: "12px", border: idx === 0 ? "sm solid #fff" : "1px solid rgba(255,255,255,0.1)" }}
                                alt=""
                            />
                            {idx === 0 && (
                                <div style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "#facc15", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "sm solid #111" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#111" }}>1</span>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(user.name || "User").split(' ')[0]}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginTop: "2px" }}>
                            <HugeiconsIcon icon={ChartBarLineIcon} size={10} style={{ verticalAlign: "middle", marginRight: "2px" }} />
                            <span style={{ color: "#fff" }}>{user.pulse_score}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
