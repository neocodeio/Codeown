import { useState } from "react";
import { createPortal } from "react-dom";
import { Fire, X, Trophy, CalendarCheck, Lightbulb } from "phosphor-react";
import flameGif from "../assets/flame.gif";

interface StreakBadgeProps {
    count: number;
    mini?: boolean;
}

export default function StreakBadge({ count, mini }: StreakBadgeProps) {
    const isActive = count > 0;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const closeModal = () => setIsModalOpen(false);

    const modalContent = isModalOpen && createPortal(
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
        }} onClick={closeModal}>
            <div
                style={{
                    width: "90%",
                    maxWidth: "400px",
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "var(--radius-lg)",
                    border: "0.5px solid var(--border-hairline)",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
                    padding: "32px",
                    position: "relative",
                    animation: "tabContentEnter 0.2s ease-out"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={closeModal}
                    style={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        background: "none",
                        border: "none",
                        color: "var(--text-tertiary)",
                        cursor: "pointer",
                        padding: "4px"
                    }}
                >
                    <X size={20} weight="thin" />
                </button>

                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{
                        width: "80px",
                        height: "80px",
                        margin: "0 auto 20px",
                        backgroundColor: isActive ? "rgba(255, 153, 0, 0.08)" : "var(--bg-hover)",
                        borderRadius: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor: isActive ? "rgba(255, 153, 0, 0.2)" : "var(--border-hairline)"
                    }}>
                        {isActive ? (
                            <img src={flameGif} style={{ width: "48px", height: "48px" }} alt="" />
                        ) : (
                            <Fire size={40} weight="thin" color="var(--text-tertiary)" />
                        )}
                    </div>
                    <h2 style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: "32px",
                        fontStyle: "italic",
                        fontWeight: 400,
                        color: "var(--text-primary)",
                        margin: "0 0 8px",
                        letterSpacing: "-0.01em"
                    }}>
                        {count} Day Streak
                    </h2>
                    <p style={{ fontSize: "14px", color: "var(--text-tertiary)", margin: 0, fontWeight: 500 }}>
                        {isActive ? "You're on fire! Keep it going." : "Post content to start your streak."}
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{ color: "#FF9900", paddingTop: "2px" }}><CalendarCheck size={20} weight="thin" /></div>
                        <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Daily Commitment</h4>
                            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>
                                Post a project update, advice, or WIP every 24 hours to maintain your streak.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{ color: "#FF9900", paddingTop: "2px" }}><Trophy size={20} weight="thin" /></div>
                        <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Earn XP</h4>
                            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>
                                Higher streaks multiply your Daily XP earnings, helping you climb the leaderboard faster.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{ color: "#FF9900", paddingTop: "2px" }}><Lightbulb size={20} weight="thin" /></div>
                        <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Showcase</h4>
                            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>
                                Your streak badge is visible on your profile and every post you make.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={closeModal}
                    style={{
                        width: "100%",
                        marginTop: "32px",
                        padding: "14px",
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-page)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                    }}
                >
                    Got it
                </button>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            <div
                className="streak-badge"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: mini ? "2px" : "4px",
                    padding: mini ? "1px 6px" : "2px 10px",
                    backgroundColor: isActive ? "rgba(255, 153, 0, 0.08)" : "var(--bg-hover)",
                    borderRadius: "100px",
                    border: "1px solid",
                    borderColor: isActive ? "rgba(255, 153, 0, 0.25)" : "var(--border-hairline)",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                    userSelect: "none",
                    minHeight: mini ? "18px" : "24px",
                    backdropFilter: isActive ? "blur(4px)" : "none"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? "rgba(255, 153, 0, 0.12)" : "var(--bg-hover)";
                    e.currentTarget.style.borderColor = isActive ? "rgba(255, 153, 0, 0.4)" : "var(--text-tertiary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? "rgba(255, 153, 0, 0.08)" : "var(--bg-hover)";
                    e.currentTarget.style.borderColor = isActive ? "rgba(255, 153, 0, 0.25)" : "var(--border-hairline)";
                }}
            >
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: mini ? "14px" : "18px",
                    height: mini ? "14px" : "18px",
                    position: "relative"
                }}>
                    {isActive ? (
                        <img
                            src={flameGif}
                            alt="Streak active"
                            style={{
                                width: mini ? "13px" : "16px",
                                height: mini ? "13px" : "16px",
                                transform: "translateY(-0.5px)"
                            }}
                        />
                    ) : (
                        <Fire
                            size={12}
                            weight="thin"
                            style={{
                                color: "var(--text-tertiary)"
                            }}
                        />
                    )}
                </div>
                <span style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: isActive ? "#FF9900" : "var(--text-tertiary)",
                    letterSpacing: "-0.01em"
                }}>
                    {count}
                </span>
            </div>
            {modalContent}
        </>
    );
}
