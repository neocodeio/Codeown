import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Search01Icon, Login01Icon } from "@hugeicons/core-free-icons";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useNotifications } from "../hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import StreakBadge from "./StreakBadge";
import Tooltip from "./Tooltip";

export default function SidebarHeader() {
    const navigate = useNavigate();
    const { getToken } = useClerkAuth();
    const { isSignedIn } = useClerkUser();
    const { unreadCount } = useNotifications();
    const [searchQuery, setSearchQuery] = useState("");

    // Streak count fetch
    const { data: streakData } = useQuery({
        queryKey: ["streakCount"],
        queryFn: async () => {
            const token = await getToken();
            if (!token) return { streak_count: 0 };
            try {
                const res = await api.post("/users/streak/update", {}, { headers: { Authorization: `Bearer ${token}` } });
                return res.data || { streak_count: 0 };
            } catch (err) {
                console.error("Streak sync failed", err);
                return { streak_count: 0 };
            }
        },
        enabled: !!isSignedIn,
        staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const streakCount = streakData?.streak_count ?? 0;

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div style={{
            height: "58px",
            flexShrink: 0,
            borderBottom: "0.5px solid var(--border-hairline)",
            backgroundColor: "var(--bg-header)",
            backdropFilter: "blur(24px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 20px",
            gap: "10px",
            zIndex: 100,
            width: "100%",
            boxSizing: "border-box",
            position: "sticky",
            top: 0
        }}>
            {/* Search Input */}
            <div style={{
                position: "relative",
                flex: 1,
                maxWidth: "240px",
                marginRight: "auto"
            }}>
                <span style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none"
                }}>
                    <HugeiconsIcon icon={Search01Icon} size={16} />
                </span>
                <input
                    type="text"
                    placeholder="Search Codeown"
                    className="header-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    style={{
                        width: "100%",
                        height: "36px",
                        backgroundColor: "var(--bg-hover)",
                        borderRadius: "9999px",
                        padding: "0 12px 0 40px",
                        fontSize: "13px",
                        color: "var(--text-primary)",
                        outline: "none",
                        transition: "all 0.1s ease",
                        border: "1px solid transparent"
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1d9bf0"; // Twitter Blue
                        e.currentTarget.style.backgroundColor = "var(--bg-page)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                />
            </div>

            {!isSignedIn && (
                <Tooltip text="Access your account">
                    <button
                        onClick={() => navigate("/sign-in")}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "100px",
                            border: "0.5px solid var(--border-hairline)",
                            backgroundColor: "var(--bg-page)",
                            color: "var(--text-primary)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.15s ease",
                            marginLeft: "12px",
                            whiteSpace: "nowrap"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-page)";
                        }}
                    >
                        <HugeiconsIcon icon={Login01Icon} size={18} />
                        Sign in
                    </button>
                </Tooltip>
            )}

            {isSignedIn && (
                <Tooltip text="Notifications" position="bottom">
                    <Link
                        to="/notifications"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            color: unreadCount > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                            position: "relative",
                            transition: "all 0.2s ease",
                            textDecoration: "none"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = unreadCount > 0 ? "var(--text-primary)" : "var(--text-tertiary)";
                        }}
                    >
                        <HugeiconsIcon icon={Notification01Icon} size={20} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: "absolute",
                                top: "-2px",
                                right: "-2px",
                                width: "18px",
                                height: "18px",
                                backgroundColor: "#ef4444",
                                color: "#fff",
                                borderRadius: "50%",
                                fontSize: "9px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                border: "2px solid var(--bg-page)",
                                lineHeight: 1
                            }}>
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </Link>
                </Tooltip>
            )}

            {streakCount > 0 && (
                <Tooltip text="Streak" position="bottom">
                    <StreakBadge count={streakCount} />
                </Tooltip>
            )}
        </div>
    );
}
