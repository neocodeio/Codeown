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

const NoiseOverlay = () => (
    <div style={{
        position: "fixed",
        top: 0, left: 0, width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 100,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }} />
);

export default function OurOGs() {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1240;
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
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
            <NoiseOverlay />
            <SEO title="Founders — Codeown" description="Celebrating the pioneers who built the foundation of Codeown." />
            
            <div style={{
                display: "flex",
                justifyContent: (isDesktop) ? "center" : "center",
                width: isDesktop ? "100%" : "100%",
                maxWidth: "1440px",
                margin: "0 auto",
                padding: "0",
            }}>
                <div style={{
                    display: "flex",
                    width: isDesktop ? "1200px" : "100%",
                    justifyContent: "flex-start",
                    position: "relative"
                }}>
                    {/* ── Main Column ── */}
                    <div style={{
                        width: isDesktop ? "var(--feed-width)" : "100%",
                        maxWidth: isDesktop ? "var(--feed-width)" : "700px",
                        margin: isDesktop ? "0" : "0 auto",
                        flexShrink: 0,
                        borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                        minHeight: "100vh",
                        padding: isMobile ? "40px 20px" : "80px 40px",
                        backgroundColor: "var(--bg-page)",
                        zIndex: 2,
                        position: "relative"
                    }}>
                        {/* ── Hero Section ── */}
                        <header style={{ textAlign: "left", marginBottom: "100px" }}>
                            <div style={{
                                letterSpacing: "0.2em",
                                fontSize: "10px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                color: "var(--text-tertiary)",
                                marginBottom: "16px",
                                opacity: 0.8
                            }}>
                                The Collective
                            </div>
                            <h1 style={{
                                fontSize: isMobile ? "42px" : "64px",
                                fontWeight: 900,
                                letterSpacing: "-0.05em",
                                lineHeight: "0.9",
                                color: "var(--text-primary)",
                                marginBottom: "24px"
                            }}>
                                Founding<br />
                                <span style={{ opacity: 0.15, WebkitTextStroke: "1px var(--text-primary)", WebkitTextFillColor: "transparent" }}>Pioneers</span>
                            </h1>
                            <p style={{
                                fontSize: isMobile ? "16px" : "18px",
                                color: "var(--text-secondary)",
                                maxWidth: "440px",
                                lineHeight: "1.4",
                                fontWeight: 400
                            }}>
                                The first 100 creators who joined Codeown to redefine the digital frontier.
                            </p>
                        </header>

                        {/* ── Custom Grid Section ── */}
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "left", padding: "100px 0" }}>
                                <div style={{
                                    width: "24px",
                                    height: "24px",
                                    border: "1.5px solid var(--border-hairline)",
                                    borderTopColor: "var(--text-primary)",
                                    borderRadius: "50%",
                                    animation: "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                                }} />
                            </div>
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                                gap: isMobile ? "24px" : "40px",
                            }}>
                                {users.map((user, index) => (
                                    <div 
                                        key={user.id}
                                        onClick={() => navigate(`/${user.username || user.id}`)}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: isMobile ? "center" : "flex-start",
                                            textAlign: isMobile ? "center" : "left",
                                            cursor: "pointer",
                                            transition: "all 0.4s var(--ease-smooth)",
                                            position: "relative",
                                        }}
                                        className="og-card"
                                    >
                                        <div style={{ 
                                            position: "relative", 
                                            marginBottom: "20px",
                                            transition: "transform 0.4s var(--ease-smooth)"
                                        }} className="avatar-wrap">
                                            <OGAvatarDecorator is_og={true} size={isMobile ? 80 : 110}>
                                                <img 
                                                    src={user.avatar_url || "/default-avatar.png"} 
                                                    alt={user.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        filter: "grayscale(1) contrast(1.1)",
                                                        transition: "filter 0.4s ease"
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.filter = "grayscale(0) contrast(1)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.filter = "grayscale(1) contrast(1.1)"}
                                                />
                                            </OGAvatarDecorator>
                                            
                                            <div style={{
                                                position: "absolute",
                                                top: "-10px",
                                                left: "-10px",
                                                fontSize: "12px",
                                                fontWeight: 900,
                                                color: "var(--text-primary)",
                                                opacity: 0.1,
                                                fontFamily: "var(--font-mono)"
                                            }}>
                                                {String(index + 1).padStart(2, '0')}
                                            </div>
                                        </div>

                                        <h3 style={{
                                            fontSize: "15px",
                                            fontWeight: 800,
                                            color: "var(--text-primary)",
                                            marginBottom: "4px",
                                            letterSpacing: "-0.01em"
                                        }}>
                                            {user.name}
                                        </h3>
                                        <p style={{
                                            fontSize: "13px",
                                            color: "var(--text-tertiary)",
                                            fontWeight: 500,
                                            opacity: 0.6
                                        }}>
                                            @{user.username || "user"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <footer style={{ marginTop: "120px", opacity: 0.3 }}>
                            <p style={{ color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                ©2026 Codeown Infrastructure
                            </p>
                        </footer>
                    </div>

                    {/* ── Right Sidebar ── */}
                    {isDesktop && (
                        <aside style={{
                            width: "340px",
                            paddingLeft: "40px",
                            paddingTop: "80px",
                            position: "sticky",
                            top: 0,
                            alignSelf: "flex-start",
                            flexShrink: 0,
                            zIndex: 1,
                        }}>
                            <div style={{ opacity: 0.9 }}>
                                <RecommendedUsersSidebar />
                            </div>
                        </aside>
                    )}
                </div>
            </div>
            
            <BackToTop />
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .og-card:hover .avatar-wrap {
                    transform: translateY(-8px) scale(1.02);
                }
                .og-card:hover h3 {
                    color: var(--text-primary);
                }
                @media (max-width: 768px) {
                    .og-card {
                        align-items: center;
                        text-align: center;
                    }
                }
            `}</style>
        </main>
    );
}
