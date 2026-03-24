import { Fire, Users, Eye, Heart, Rocket, X, ShareNetwork } from "phosphor-react";

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    new_followers: number;
    project_views: number;
    post_views: number;
    new_likes: number;
    streak: number;
  };
}

export default function WeeklyRecapModal({ isOpen, onClose, stats }: WeeklyRecapModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }} onClick={onClose}>
            <div
                style={{
                    width: "100%",
                    maxWidth: "500px",
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "var(--radius-sm)",
                    border: "0.5px solid var(--border-hairline)",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "32px 32px 24px",
                    borderBottom: "0.5px solid var(--border-hairline)",
                    position: "relative"
                }}>
                    <h2 style={{
                        color: "var(--text-primary)",
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em"
                    }}>Weekly Recap</h2>
                    <p style={{
                        color: "var(--text-tertiary)",
                        margin: "8px 0 0 0",
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase"
                    }}>Performance Analysis • Week Overview</p>

                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: "24px",
                            right: "24px",
                            background: "transparent",
                            border: "none",
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-tertiary)",
                            cursor: "pointer",
                        }}
                    >
                        <X size={18} weight="thin" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: "32px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", backgroundColor: "var(--border-hairline)", border: "0.5px solid var(--border-hairline)", marginBottom: "32px" }}>
                        {/* Followers Card */}
                        <div style={{
                            padding: "24px",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            <div style={{ color: "var(--text-tertiary)" }}>
                                <Users size={18} weight="thin" />
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>+{stats.new_followers.toString().padStart(2, '0')}</div>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginTop: "4px" }}>New Followers</div>
                            </div>
                        </div>

                        {/* Views Card */}
                        <div style={{
                            padding: "24px",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            <div style={{ color: "var(--text-tertiary)" }}>
                                <Eye size={18} weight="thin" />
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{(stats.project_views + stats.post_views).toString().padStart(2, '0')}</div>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginTop: "4px" }}>Total Views</div>
                            </div>
                        </div>

                        {/* Likes Card */}
                        <div style={{
                            padding: "24px",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            <div style={{ color: "var(--text-tertiary)" }}>
                                <Heart size={18} weight="thin" />
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{stats.new_likes.toString().padStart(2, '0')}</div>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginTop: "4px" }}>Likes Received</div>
                            </div>
                        </div>

                        {/* Streak Card */}
                        <div style={{
                            padding: "24px",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            <div style={{ color: "var(--text-primary)" }}>
                                <Fire size={18} weight="bold" />
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{stats.streak.toString().padStart(2, '0')}D</div>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginTop: "4px" }}>Current Streak</div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: "20px",
                        backgroundColor: "var(--bg-input)",
                        border: "0.5px solid var(--border-hairline)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>Next Milestone</div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Launch a new project to accelerate these metrics.</div>
                        </div>
                        <Rocket size={24} weight="thin" style={{ color: "var(--text-tertiary)" }} />
                    </div>

                    <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: "14px",
                                backgroundColor: "transparent",
                                color: "var(--text-primary)",
                                border: "0.5px solid var(--border-hairline)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                fontWeight: 800,
                                cursor: "pointer",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                            className="btn-weekly-close"
                        >
                            Dismiss
                        </button>
                        <button
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "14px",
                                backgroundColor: "var(--text-primary)",
                                color: "var(--bg-page)",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                fontWeight: 800,
                                cursor: "pointer",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                            onClick={() => {
                                alert("Stats copied to clipboard! Share your progress.");
                            }}
                        >
                            <ShareNetwork size={18} weight="thin" />
                            Share
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
        .btn-weekly-close:hover {
          background-color: var(--bg-hover);
        }
      `}</style>
        </div>
    );
}
