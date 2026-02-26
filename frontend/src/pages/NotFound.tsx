import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Home01Icon,
    ArrowLeft02Icon,
    Search01Icon
} from "@hugeicons/core-free-icons";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "90vh",
            padding: "20px",
            textAlign: "center",
            background: "radial-gradient(circle at top right, rgba(15, 23, 42, 0.03), transparent), radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.03), transparent)",
        }}>
            <div className="tab-content-enter" style={{
                maxWidth: "600px",
                width: "100%",
                padding: "80px 40px",
                borderRadius: "48px",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(15, 23, 42, 0.05)",
                boxShadow: "0 40px 100px rgba(0, 0, 0, 0.03)",
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
                    marginBottom: "10px"
                }}>
                    <div style={{
                        position: "absolute",
                        width: "140px",
                        height: "140px",
                        backgroundColor: "rgba(15, 23, 42, 0.03)",
                        borderRadius: "50%",
                        animation: "pulse 4s infinite ease-in-out"
                    }} />
                    <HugeiconsIcon
                        icon={Search01Icon}
                        size={64}
                        style={{
                            color: "#0f172a",
                            opacity: 0.1,
                            position: "relative"
                        }}
                    />
                    <div style={{
                        position: "absolute",
                        fontSize: "120px",
                        fontWeight: 950,
                        color: "#0f172a",
                        opacity: 0.04,
                        letterSpacing: "-0.05em",
                        userSelect: "none"
                    }}>
                        404
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h1 style={{
                        fontSize: "36px",
                        fontWeight: 850,
                        color: "#0f172a",
                        margin: 0,
                        letterSpacing: "-0.03em"
                    }}>
                        Lost in space?
                    </h1>
                    <p style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#64748b",
                        margin: 0,
                        lineHeight: 1.6,
                        maxWidth: "400px"
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
                    marginTop: "8px"
                }} className="responsive-button-group">
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "16px 28px",
                            borderRadius: "100px",
                            fontSize: "15px",
                            fontWeight: 800,
                            backgroundColor: "white",
                            color: "#0f172a",
                            border: "1.5px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                            e.currentTarget.style.borderColor = "#0f172a";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                    >
                        <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "16px 32px",
                            borderRadius: "100px",
                            fontSize: "15px",
                            fontWeight: 800,
                            backgroundColor: "#0f172a",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 12px 24px rgba(15, 23, 42, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <HugeiconsIcon icon={Home01Icon} size={20} />
                        Back Home
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                }
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
