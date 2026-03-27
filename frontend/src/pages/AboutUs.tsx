import { useNavigate } from "react-router-dom";
import { CaretLeft, InstagramLogo, WhatsappLogo, TwitterLogo } from "phosphor-react";

export default function AboutUs() {
    const navigate = useNavigate();

    return (
        <div className="fade-in" style={{ padding: "64px 24px", maxWidth: "800px", margin: "0 auto", backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    marginBottom: "48px",
                    padding: 0,
                    transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
            >
                <CaretLeft size={16} weight="bold" />
                Back
            </button>

            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "48px", letterSpacing: "-0.04em" }}>
                About us
            </h1>

            <div style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "16px", display: "flex", flexDirection: "column", gap: "32px" }}>
                <p>
                    We are a platform created to help developers showcase their projects, share ideas, and connect with others in the tech community.
                </p>

                <p>
                    Our goal is to provide a clean, modern, and safe environment where creators can present their work, collaborate on new ideas, and grow their skills.
                </p>

                <p>
                    We believe that great projects start with simple ideas and strong collaboration. This platform was built with passion for technology and a vision to support developers at all levels.
                </p>

                <p>
                    Whether you are building your first project or sharing years of experience, this platform is here to help you grow and connect.
                </p>

                <div style={{ marginTop: "40px", padding: "40px", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }}>
                    <h2 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "32px" }}>Connect with us</h2>
                    <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                        <a
                            href="https://www.instagram.com/neocode.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)", fontWeight: 600, textDecoration: "none", transition: "all 0.15s ease", fontSize: "14px" }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                                <InstagramLogo size={18} weight="thin" />
                            </div>
                            Instagram
                        </a>
                        <a
                            href="https://api.whatsapp.com/send?phone=966559281499"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)", fontWeight: 600, textDecoration: "none", transition: "all 0.15s ease", fontSize: "14px" }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                                <WhatsappLogo size={18} weight="thin" />
                            </div>
                            WhatsApp
                        </a>
                        <a
                            href="https://twitter.com/neocode_io"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)", fontWeight: 600, textDecoration: "none", transition: "all 0.15s ease", fontSize: "14px" }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                                <TwitterLogo size={18} weight="thin" />
                            </div>
                            Twitter
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
