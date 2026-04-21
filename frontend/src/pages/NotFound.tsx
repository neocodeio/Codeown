import { useNavigate } from "react-router-dom";
import { CaretLeft, House, Warning } from "phosphor-react";
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

export default function NotFound() {
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isDesktop = width >= 1200;
    const isMobile = width < 768;

    return (
        <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", width: isDesktop ? "920px" : "100%", maxWidth: "920px", position: "relative" }}>
                <div style={{
                    width: isDesktop ? "620px" : "100%",
                    maxWidth: isDesktop ? "620px" : "700px",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    minHeight: "100vh",
                    margin: isDesktop ? "0" : "0 auto",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center"
                }}>
                    <div style={{
                        maxWidth: "400px",
                        width: "100%",
                        padding: "48px 24px",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--bg-page)",
                        border: "1px solid var(--border-hairline)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "24px"
                    }}>
                        <div style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "8px"
                        }}>
                            <Warning
                                size={48}
                                weight="thin"
                                style={{
                                    color: "var(--text-primary)",
                                    opacity: 0.1,
                                    position: "relative",
                                    zIndex: 1
                                }}
                            />
                            <div style={{
                                position: "absolute",
                                fontSize: "80px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                opacity: 0.1,
                                userSelect: "none"
                            }}>
                                404
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <h1 style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: "0",
                            }}>
                                Page not found
                            </h1>
                            <p style={{
                                fontSize: "13px",
                                color: "var(--text-secondary)",
                                margin: 0,
                                lineHeight: 1.6,
                            }}>
                                The page you're looking for doesn't exist or has been moved.
                            </p>
                        </div>

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            width: "100%",
                            justifyContent: "center",
                            marginTop: "8px"
                        }} className="responsive-button-group">
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "10px 20px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    backgroundColor: "transparent",
                                    color: "var(--text-primary)",
                                    border: "0.5px solid var(--border-hairline)",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <CaretLeft size={16} weight="bold" />
                                Go Back
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "10px 20px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    backgroundColor: "var(--text-primary)",
                                    color: "var(--bg-page)",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.9";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                }}
                            >
                                <House size={16} weight="bold" />
                                Back Home
                            </button>
                        </div>
                    </div>
                    <style>{`
                        .responsive-button-group {
                            flex-direction: column;
                        }
                        @media (min-width: 640px) {
                            .responsive-button-group {
                                flex-direction: row !important;
                            }
                        }
                    `}</style>
                </div>

                {isDesktop && (
                    <aside style={{ width: "300px", position: "sticky", top: 0, alignSelf: "flex-start", flexShrink: 0 }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </div>
    );
}
