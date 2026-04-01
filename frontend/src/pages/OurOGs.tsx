import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import BackToTop from "../components/BackToTop";
import OGAvatarDecorator from "../components/OGAvatarDecorator";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

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
    const isDesktop = width >= 1200;
    const navigate = useNavigate();
    
    const [users, setUsers] = useState<OGUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOGs = async () => {
            try {
                const res = await api.get("/users/ogs");
                const excludedUsernames = ["aminceo", "jj.99dev", "max1999.d"];
                const filtered = res.data.filter((u: OGUser) => !excludedUsernames.includes(u.username));
                setUsers(filtered);
            } catch (err) {
                console.error("Failed to fetch OGs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOGs();
    }, []);

    return (
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", padding: 0 }}>
            <SEO title="Founders" description="Meet the first 100 pioneers who joined Codeown." />
            
            <div style={{
                display: "flex",
                justifyContent: (isDesktop && !isMobile) ? "flex-start" : "center",
                width: isDesktop ? "1020px" : "100%",
                maxWidth: "1020px",
                margin: (isDesktop && !isMobile) ? "0" : "0 auto",
                padding: "0",
            }}>
                {/* ── Main Column ── */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "700px",
                    margin: isDesktop ? "0" : "0 auto",
                    flexShrink: 0,
                    borderRight: (isDesktop && !isMobile) ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    padding: isMobile ? "20px 16px" : "40px 24px",
                    backgroundColor: "var(--bg-page)"
                }}>
                    {/* ── Hero Section ── */}
                    <header style={{ textAlign: "center", marginBottom: "60px", marginTop: isMobile ? "20px" : "20px" }}>
                        <div style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "100px",
                            backgroundColor: "var(--bg-hover)",
                            border: "0.5px solid var(--border-hairline)",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "var(--text-tertiary)",
                            marginBottom: "16px"
                        }}>
                            Wall of Fame
                        </div>
                        <h1 style={{
                            fontSize: isMobile ? "28px" : "40px",
                            fontWeight: "800",
                            letterSpacing: "-0.03em",
                            lineHeight: "1.1",
                            color: "var(--text-primary)",
                            marginBottom: "16px"
                        }}>
                            Meet the <span style={{ 
                                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                fontWeight: "900"
                            }}>Founding OGs</span>
                        </h1>
                        <p style={{
                            fontSize: isMobile ? "14px" : "16px",
                            color: "var(--text-secondary)",
                            maxWidth: "500px",
                            margin: "0 auto",
                            lineHeight: "1.5"
                        }}>
                            The first 100 pioneers who joined Codeown to build the future.
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
                            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: isMobile ? "10px" : "16px",
                        }}>
                            {users.map((user, index) => (
                                <div 
                                    key={user.id}
                                    onClick={() => navigate(`/${user.username || user.id}`)}
                                    style={{
                                        backgroundColor: "var(--bg-card)",
                                        border: "0.5px solid var(--border-hairline)",
                                        borderRadius: "var(--radius-md)",
                                        padding: "20px 12px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        transition: "all 0.3s var(--ease-smooth)",
                                        position: "relative",
                                        overflow: "hidden"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.borderColor = "var(--text-tertiary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.borderColor = "var(--border-hairline)";
                                    }}
                                >
                                    {/* Rank Badge */}
                                    <div style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        fontSize: "10px",
                                        fontWeight: "800",
                                        color: "var(--text-tertiary)",
                                        opacity: 0.4
                                    }}>
                                        #{index + 1}
                                    </div>

                                    <div style={{ position: "relative", marginBottom: "12px" }}>
                                        <OGAvatarDecorator is_og={true} size={isMobile ? 60 : 70}>
                                            <img 
                                                src={user.avatar_url || "/default-avatar.png"} 
                                                alt={user.name}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderRadius: "50%",
                                                    objectFit: "cover"
                                                }}
                                            />
                                        </OGAvatarDecorator>
                                    </div>

                                    <h3 style={{
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "var(--text-primary)",
                                        marginBottom: "2px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        width: "100%"
                                    }}>
                                        {user.name}
                                    </h3>
                                    <p style={{
                                        fontSize: "12px",
                                        color: "var(--text-tertiary)",
                                        marginBottom: "0",
                                        fontWeight: "500"
                                    }}>
                                        @{user.username || "user"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    <footer style={{ marginTop: "60px", textAlign: "center", padding: "20px" }}>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                            © 2026 Codeown. All Founding OGs have been verified.
                        </p>
                    </footer>
                </div>

                {/* ── Right Sidebar ── */}
                {isDesktop && (
                    <aside style={{
                        width: "340px",
                        paddingLeft: "12px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        zIndex: 1,
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
            
            <BackToTop />
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
