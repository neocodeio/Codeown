

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack, faRocket, faAdd, faHeart, } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

export default function WelcomeCard() {
    const { width } = useWindowSize();
    const isMobile = width < 768;

    return (
        <div
            className="fade-in slide-up welcome-card-minimal"
            style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "2px",
                padding: isMobile ? "28px" : "40px",
                marginBottom: "48px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "none",
                border: "0.5px solid var(--border-hairline)",
            }}
        >
            {/* Decorative subtle gradient blob */}
            <div style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "200px",
                height: "200px",
                background: "radial-gradient(circle, var(--text-tertiary) 0%, transparent 70%)",
                borderRadius: "50%",
                zIndex: 0,
                opacity: 0.05
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            padding: "6px 14px",
                            backgroundColor: "var(--bg-hover)",
                            color: "var(--text-tertiary)",
                            borderRadius: "2px",
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "0.5px solid var(--border-hairline)",
                            fontFamily: "var(--font-mono)"
                        }}>
                            <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: "10px" }} />
                            <span>ANNOUNCEMENT</span>
                        </div>
                    </div>

                    <div>
                        <h2 style={{
                            fontSize: isMobile ? "28px" : "36px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: "1.2",
                            textTransform: "uppercase"
                        }}>
                            Welcome to Codeown <span style={{ color: "var(--text-primary)" }}>🚀</span>
                        </h2>
                        <p style={{
                            fontSize: "16px",
                            lineHeight: "1.7",
                            color: "var(--text-secondary)",
                            marginTop: "16px",
                            marginBottom: 0,
                            fontWeight: 500,
                            maxWidth: "600px"
                        }}>
                            The social home for developers. Showcase your projects, share coding insights, and connect with builders shaping the future.
                        </p>
                    </div>

                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        marginTop: "8px"
                    }}>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent("openProjectModal"))}
                            style={{
                                padding: "14px 28px",
                                borderRadius: "2px",
                                backgroundColor: "var(--text-primary)",
                                border: "none",
                                color: "var(--bg-page)",
                                fontWeight: 800,
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                transition: "all 0.15s ease",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "0.9";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                            }}
                        >
                            <FontAwesomeIcon icon={faRocket} style={{ fontSize: "14px" }} />
                            Launch a Project
                        </button>

                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent("openPostModal"))}
                            style={{
                                padding: "14px 28px",
                                borderRadius: "2px",
                                backgroundColor: "transparent",
                                border: "0.5px solid var(--border-hairline)",
                                color: "var(--text-primary)",
                                fontWeight: 800,
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                transition: "all 0.15s ease",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            <FontAwesomeIcon icon={faAdd} style={{ fontSize: "14px", opacity: 0.7 }} />
                            Share a Thought
                        </button>
                    </div>

                    <div style={{
                        marginTop: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--text-tertiary)",
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase"
                    }}>
                        <span>Made with</span>
                        <FontAwesomeIcon icon={faHeart} style={{ color: "#ef4444", fontSize: "12px" }} />
                        <span>for builders</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
