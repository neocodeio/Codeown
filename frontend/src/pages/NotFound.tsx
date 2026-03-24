import { useNavigate } from "react-router-dom";
import { CaretLeft, House, Warning } from "phosphor-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center",
            backgroundColor: "var(--bg-page)",
        }}>
            <div style={{
                maxWidth: "600px",
                width: "100%",
                padding: "64px 24px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--bg-page)",
                border: "0.5px solid var(--border-hairline)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "32px"
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
                        fontSize: "96px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        opacity: 0.05,
                        letterSpacing: "0.1em",
                        fontFamily: "var(--font-mono)",
                        userSelect: "none"
                    }}>
                        404
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h1 style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: 0,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em"
                    }}>
                        LOST IN SPACE
                    </h1>
                    <p style={{
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                        margin: 0,
                        lineHeight: 1.6,
                        maxWidth: "320px"
                    }}>
                        The page you're looking for doesn't exist or has been moved to another dimension.
                    </p>
                </div>

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    width: "100%",
                    justifyContent: "center",
                    marginTop: "16px"
                }} className="responsive-button-group">
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "12px",
                            fontWeight: 700,
                            backgroundColor: "transparent",
                            color: "var(--text-primary)",
                            border: "0.5px solid var(--border-hairline)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
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
                            padding: "12px 24px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "12px",
                            fontWeight: 700,
                            backgroundColor: "var(--text-primary)",
                            color: "var(--bg-page)",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
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
    );
}
