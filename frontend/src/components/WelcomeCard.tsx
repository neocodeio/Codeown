
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack, faRocket, faAdd, faHeart, } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

export default function WelcomeCard() {
    const { width } = useWindowSize();
    const isMobile = width < 768;

    return (
        <div
            className="fade-in slide-up"
            style={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: isMobile ? "24px" : "32px",
                padding: isMobile ? "24px" : "32px",
                marginBottom: "40px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(54, 65, 130, 0.08)",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            }}
        >
            {/* Decorative gradient blob */}
            <div style={{
                position: "absolute",
                top: "-50px",
                right: "-50px",
                width: "150px",
                height: "150px",
                background: "radial-gradient(circle, rgba(132, 155, 255, 0.15) 0%, transparent 70%)",
                borderRadius: "50%",
                zIndex: 0
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px"
                }}>
                    <div style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "14px",
                        backgroundColor: "#364182",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "18px",
                        boxShadow: "0 8px 16px rgba(54, 65, 130, 0.2)"
                    }}>
                        <FontAwesomeIcon icon={faThumbtack} />
                    </div>
                    <div>
                        <h2 style={{
                            fontSize: isMobile ? "20px" : "24px",
                            fontWeight: 900,
                            color: "#1e293b",
                            margin: 0,
                            letterSpacing: "-0.02em"
                        }}>
                            Welcome to Codeown! 🚀
                        </h2>
                        <div style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: "#364182",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginTop: "2px"
                        }}>
                            Pinned Announcement
                        </div>
                    </div>
                </div>

                <p style={{
                    fontSize: "16px",
                    lineHeight: "1.7",
                    color: "#475569",
                    marginBottom: "24px",
                    fontWeight: 500
                }}>
                    A social network built exclusively for developers. Showcase your side-projects, share coding insights, and connect with other builders. We're glad to have you here!
                </p>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "12px"
                }}>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("openPostModal"))}
                        style={{
                            padding: "14px 20px",
                            borderRadius: "14px",
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            color: "#1e293b",
                            fontWeight: 700,
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.borderColor = "#364182";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                    >
                        <FontAwesomeIcon icon={faAdd} style={{ fontSize: "14px", opacity: 0.7 }} />
                        Post First Thought
                    </button>

                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("openProjectModal"))}
                        style={{
                            padding: "14px 20px",
                            borderRadius: "14px",
                            backgroundColor: "#364182",
                            border: "none",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            transition: "all 0.2s ease",
                            boxShadow: "0 10px 20px rgba(54, 65, 130, 0.2)"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#2d3568";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 12px 24px rgba(54, 65, 130, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#364182";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(54, 65, 130, 0.2)";
                        }}
                    >
                        <FontAwesomeIcon icon={faRocket} style={{ fontSize: "14px" }} />
                        Launch First Project
                    </button>
                </div>

                <div style={{
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: 600
                }}>
                    Built with <FontAwesomeIcon icon={faHeart} style={{ color: "#ef4444" }} /> for the developer community
                </div>
            </div>
        </div>
    );
}
