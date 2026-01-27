import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

export default function AboutUs() {
    const navigate = useNavigate();

    return (
        <div className="fade-in" style={{ padding: "60px 20px", maxWidth: "800px", margin: "0 auto" }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginBottom: "32px",
                    padding: 0
                }}
            >
                <FontAwesomeIcon icon={faArrowLeft} />
                BACK
            </button>

            <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#0f172a", marginBottom: "32px", letterSpacing: "-0.04em" }}>
                About Us
            </h1>

            <div style={{ color: "#475569", lineHeight: "1.8", fontSize: "18px", display: "flex", flexDirection: "column", gap: "32px" }}>
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

                <div style={{ marginTop: "40px", padding: "32px", backgroundColor: "#f8fafc", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 800, color: "#94a3b8", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Connect With Us</h2>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <a
                            href="https://www.instagram.com/neocode.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0f172a", fontWeight: 700, textDecoration: "none", transition: "transform 0.2s" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                <FontAwesomeIcon icon={faInstagram} />
                            </div>
                            Instagram
                        </a>
                        <a
                            href="https://api.whatsapp.com/send?phone=966559281499"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0f172a", fontWeight: 700, textDecoration: "none", transition: "transform 0.2s" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                <FontAwesomeIcon icon={faWhatsapp} />
                            </div>
                            WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
