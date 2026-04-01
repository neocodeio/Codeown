import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import BackToTop from "../components/BackToTop";

interface OGUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    bio: string;
    created_at: string;
    is_pro: boolean;
    is_og: boolean;
    streak_count: number;
}

export default function OurOGs() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const navigate = useNavigate();
    
    const [users, setUsers] = useState<OGUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOGs = async () => {
            try {
                const res = await api.get("/users/ogs");
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch OGs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOGs();
    }, []);

    return (
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", padding: isMobile ? "20px 16px" : "60px 40px" }}>
            <SEO title="Founding OGs" description="Meet the first 100 pioneers who joined Codeown." />
            
            <div style={{ maxWidth: "1020px", margin: "0 auto" }}>
                {/* ── Hero Section ── */}
                <header style={{ textAlign: "center", marginBottom: "80px", marginTop: isMobile ? "20px" : "40px" }}>
                    <div style={{
                        display: "inline-block",
                        padding: "8px 16px",
                        borderRadius: "100px",
                        backgroundColor: "var(--bg-hover)",
                        border: "0.5px solid var(--border-hairline)",
                        fontSize: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        color: "var(--text-tertiary)",
                        marginBottom: "24px"
                    }}>
                        Wall of Fame
                    </div>
                    <h1 style={{
                        fontSize: isMobile ? "32px" : "56px",
                        fontWeight: "800",
                        letterSpacing: "-0.04em",
                        lineHeight: "1.05",
                        color: "var(--text-primary)",
                        marginBottom: "20px"
                    }}>
                        Meet the <span style={{ 
                            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontWeight: "900"
                        }}>Founding OGs</span>
                    </h1>
                    <p style={{
                        fontSize: isMobile ? "16px" : "20px",
                        color: "var(--text-secondary)",
                        maxWidth: "600px",
                        margin: "0 auto",
                        lineHeight: "1.5"
                    }}>
                        The first 100 pioneers who joined Codeown to build the future of the web.
                    </p>
                </header>

                {/* ── Grid Section ── */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
                        <div style={{
                            width: "30px",
                            height: "30px",
                            border: "2px solid var(--border-hairline)",
                            borderTopColor: "var(--text-primary)",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite"
                        }} />
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: isMobile ? "12px" : "24px",
                        marginTop: "40px"
                    }}>
                        {users.map((user, index) => (
                            <div 
                                key={user.id}
                                onClick={() => navigate(`/${user.username || user.id}`)}
                                style={{
                                    backgroundColor: "var(--bg-card)",
                                    border: "0.5px solid var(--border-hairline)",
                                    borderRadius: "var(--radius-lg)",
                                    padding: "24px 16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-8px)";
                                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.06)";
                                    e.currentTarget.style.borderColor = "var(--text-tertiary)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                                }}
                            >
                                {/* Rank Badge */}
                                <div style={{
                                    position: "absolute",
                                    top: "12px",
                                    right: "12px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: "var(--text-tertiary)",
                                    opacity: 0.5
                                }}>
                                    #{index + 1}
                                </div>

                                <div style={{ position: "relative", marginBottom: "16px" }}>
                                    <img 
                                        src={user.avatar_url || "/default-avatar.png"} 
                                        alt={user.name}
                                        style={{
                                            width: isMobile ? "70px" : "90px",
                                            height: isMobile ? "70px" : "90px",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            border: "3px solid var(--bg-page)",
                                            boxShadow: "0 0 0 2px var(--border-hairline)"
                                        }}
                                    />
                                    <div style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        right: "-2px",
                                        backgroundColor: "#facd1e",
                                        color: "#000",
                                        fontSize: "10px",
                                        fontWeight: "900",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                        textTransform: "uppercase"
                                    }}>
                                        OG
                                    </div>
                                </div>

                                <h3 style={{
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "var(--text-primary)",
                                    marginBottom: "4px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    width: "100%"
                                }}>
                                    {user.name}
                                </h3>
                                <p style={{
                                    fontSize: "13px",
                                    color: "var(--text-tertiary)",
                                    marginBottom: "12px",
                                    fontWeight: "500"
                                }}>
                                    @{user.username || "user"}
                                </p>
                                
                                <div style={{
                                    fontSize: "11px",
                                    color: "var(--text-secondary)",
                                    opacity: 0.8,
                                    lineHeight: "1.4",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    height: "30px"
                                }}>
                                    {user.bio || "The pioneer of a new generation building on Codeown."}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <footer style={{ marginTop: "100px", textAlign: "center", padding: "40px" }}>
                <p style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
                    © 2026 Codeown. All Founding OGs have been verified.
                </p>
            </footer>

            <BackToTop />
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
