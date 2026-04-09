import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import BackToTop from "../components/BackToTop";
import OGAvatarDecorator from "../components/OGAvatarDecorator";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import BioRenderer from "../components/BioRenderer";
import StreakBadge from "../components/StreakBadge";

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
                const allUsers = res.data;
                
                // Reorder: Move amin.ceo to the front
                const aminIndex = allUsers.findIndex((u: OGUser) => u.username === "amin.ceo");
                if (aminIndex !== -1) {
                    const amin = allUsers.splice(aminIndex, 1)[0];
                    allUsers.unshift(amin);
                }
                
                setUsers(allUsers);
            } catch (err) {
                console.error("Failed to fetch OGs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOGs();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <main style={{ 
            backgroundColor: "var(--bg-page)", 
            minHeight: "100vh", 
            padding: 0,
            position: "relative",
        }}>
            <SEO title="The Founding OGs | Codeown" description="Celebrating the first 100 pioneers who laid the foundation of Codeown." />
            
            {/* ── High-End Noise/Grain Overlay (Subtle) ── */}
            <div style={{
                position: "fixed",
                top: 0, left: 0, width: "100%", height: "100%",
                pointerEvents: "none",
                opacity: 0.015,
                zIndex: 9999,
                background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }} />

            <div style={{
                display: "flex",
                justifyContent: (isDesktop && !isMobile) ? "flex-start" : "center",
                width: isDesktop ? "1020px" : "100%",
                maxWidth: "1020px",
                margin: (isDesktop && !isMobile) ? "0" : "0 auto",
                padding: "0",
                position: "relative"
            }}>
                {/* ── Main content Area ── */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "720px",
                    margin: isDesktop ? "0" : "0 auto",
                    flexShrink: 0,
                    borderRight: (isDesktop && !isMobile) ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    padding: isMobile ? "24px 16px 80px" : "60px 32px 100px",
                    backgroundColor: "var(--bg-page)",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    {/* ── Bespoke Hero Section ── */}
                    <header style={{ 
                        textAlign: "left", 
                        marginBottom: isMobile ? "40px" : "80px", 
                        animation: "pageEnter 0.6s var(--ease-smooth) forwards" 
                    }}>
                        <h1 style={{
                            fontSize: isMobile ? "32px" : "52px",
                            fontWeight: "900",
                            letterSpacing: "-0.04em",
                            lineHeight: "0.95",
                            color: "var(--text-primary)",
                            marginBottom: "20px"
                        }}>
                            The Founding<br/>
                            <span style={{ 
                                color: "var(--text-secondary)",
                                background: "linear-gradient(90deg, var(--text-primary) 0%, var(--text-tertiary) 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}>Codeown OGs</span>
                        </h1>
                        <p style={{
                            fontSize: isMobile ? "16px" : "18px",
                            color: "var(--text-secondary)",
                            maxWidth: "520px",
                            lineHeight: "1.6",
                            fontWeight: "400",
                            letterSpacing: "-0.01em"
                        }}>
                            A living record of the first 100 builders who joined our mission to redefine personal digital ownership.
                        </p>
                    </header>

                    {/* ── The Gallery ── */}
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "40px 0", color: "var(--text-tertiary)" }}>
                            <div className="spin" style={{ width: "16px", height: "16px", border: "1.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "50%" }} />
                            <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.02em" }}>Retrieving pioneer records...</span>
                        </div>
                    ) : (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "40px"
                        }}>
                            {/* TOP 3 FEATURED SECTION */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                                gap: "16px",
                                marginBottom: "20px"
                            }}>
                                {users.slice(0, 3).map((user, i) => (
                                    <div 
                                        key={user.id}
                                        onClick={() => navigate(`/${user.username}`)}
                                        style={{
                                            backgroundColor: "var(--bg-card)",
                                            border: "0.5px solid var(--border-hairline)",
                                            borderRadius: "var(--radius-md)",
                                            padding: "32px 24px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            transition: "all 0.4s var(--ease-smooth)",
                                            position: "relative",
                                            animation: `pageEnter 0.8s var(--ease-smooth) ${i * 0.1}s forwards`,
                                            opacity: 0,
                                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-6px)";
                                            e.currentTarget.style.borderColor = "var(--text-primary)";
                                            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.borderColor = "var(--border-hairline)";
                                            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.01)";
                                        }}
                                    >
                                        <div style={{
                                            position: "absolute",
                                            top: "16px", left: "16px",
                                            fontSize: "9px",
                                            fontWeight: "900",
                                            color: "var(--text-tertiary)",
                                            letterSpacing: "0.05em"
                                        }}>
                                            ENTRY {i + 1}
                                        </div>
                                        <div style={{ marginBottom: "20px" }}>
                                            <OGAvatarDecorator is_og={true} size={88}>
                                                <img src={user.avatar_url || "/default-avatar.png"} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                            </OGAvatarDecorator>
                                        </div>
                                        <div style={{ width: "100%" }}>
                                            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "2px" }}>{user.name}</h3>
                                            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: "500", marginBottom: "12px" }}>@{user.username}</p>
                                            <div style={{ display: "flex", justifyContent: "center", scale: "0.8" }}>
                                                <StreakBadge count={user.streak_count} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* THE REST OF THE GRID */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(2, 1fr)",
                                gap: "12px"
                            }}>
                                {users.slice(3).map((user, i) => (
                                    <div 
                                        key={user.id}
                                        onClick={() => navigate(`/${user.username}`)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            padding: "16px",
                                            borderRadius: "var(--radius-md)",
                                            border: "0.5px solid var(--border-hairline)",
                                            backgroundColor: "var(--bg-card)",
                                            cursor: "pointer",
                                            transition: "all 0.3s var(--ease-smooth)",
                                            animation: `pageEnter 0.8s var(--ease-smooth) ${0.3 + (i * 0.02)}s forwards`,
                                            opacity: 0,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                            e.currentTarget.style.borderColor = "var(--text-tertiary)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--bg-card)";
                                            e.currentTarget.style.borderColor = "var(--border-hairline)";
                                        }}
                                    >
                                        <OGAvatarDecorator is_og={true} size={50}>
                                            <img src={user.avatar_url || "/default-avatar.png"} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                        </OGAvatarDecorator>
                                        
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                                                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {user.name}
                                                </h4>
                                                <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-tertiary)", opacity: 0.6 }}>#{i + 4}</span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: "500", marginBottom: "4px" }}>
                                                @{user.username} • {formatDate(user.created_at)}
                                            </div>
                                            <div style={{ 
                                                fontSize: "12px", 
                                                color: "var(--text-secondary)", 
                                                lineHeight: "1.4",
                                                display: "-webkit-box",
                                                WebkitBoxOrient: "vertical",
                                                WebkitLineClamp: 1,
                                                overflow: "hidden"
                                            }}>
                                                {user.bio ? <BioRenderer bio={user.bio} /> : "Vanguard builder."}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <footer style={{ marginTop: "120px", borderTop: "0.5px solid var(--border-hairline)", paddingTop: "40px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                CODEOWN FOUNDING MEMBERS
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                                © 2026 Codeown. All rights reserved.
                            </div>
                        </div>
                    </footer>
                </div>

                {/* ── Premium Sticky Sidebar ── */}
                {isDesktop && (
                    <aside style={{
                        width: "340px",
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
                .spin { animation: spin 1s linear infinite; }
                .sidebar-section:first-child { padding-top: 0 !important; }
                @keyframes pageEnter {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
}
