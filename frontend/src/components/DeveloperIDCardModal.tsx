import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import VerifiedBadge from "./VerifiedBadge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";

interface DeveloperIDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name: string;
        username: string | null;
        avatar_url: string | null;
        created_at: string | null;
        skills: string[] | null;
        is_pro: boolean;
        bio: string | null;
    };
    projectsCount: number;
}

export default function DeveloperIDCardModal({ isOpen, onClose, user, projectsCount }: DeveloperIDCardModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=212121&color=ffffff&bold=true`;

    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently Join";

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/${user.username || ""}`)}`;

    const techStacks = (user.skills || []).slice(0, 3);
    const firstLineBio = user.bio ? user.bio.split('\n')[0].trim() : "";

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 3,
                style: { transform: 'scale(1)' }
            });
            const link = document.createElement("a");
            link.download = `${user.username || "developer"}-id-card.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to download ID card:", error);
            alert("Failed to download the image. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }} onClick={onClose}>
            <div style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px"
            }} onClick={(e) => e.stopPropagation()}>

                {/* Glassmorphism ID Card (THE DOWNLOADABLE PART) */}
                <div
                    ref={cardRef}
                    style={{
                        width: "min(640px, 95vw)",     // Wider for horizontal
                        height: "min(360px, 60vh)",    // Shorter height
                        background: "#020617",
                        borderRadius: "24px",          // Slightly smaller radius to fit horizontal layout better
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                        padding: "min(24px, 4vw)",     // Adjust padding
                        display: "flex",
                        flexDirection: "row",          // Horizontal Layout
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                        color: "#fff",
                        fontFamily: "'Inter', sans-serif",
                        gap: "min(24px, 4vw)"          // Gap between left and right sections
                    }}
                >
                    {/* Holographic Shimmer Effect */}
                    <div style={{
                        position: "absolute",
                        top: "-50%",
                        left: "-50%",
                        width: "200%",
                        height: "200%",
                        background: `
                            linear-gradient(
                                105deg,
                                transparent 30%,
                                rgba(255, 255, 255, 0.15) 50%,
                                rgba(255, 255, 255, 0.25) 55%,
                                rgba(255, 255, 255, 0.15) 60%,
                                transparent 70%
                            )
                        `,
                        zIndex: 3,
                        pointerEvents: "none",
                        animation: "holographic-shimmer 3s ease-in-out infinite"
                    }} />

                    {/* Holographic Glow Effect */}
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: `
                            radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.2) 0%, transparent 70%)
                        `,
                        zIndex: 2,
                        pointerEvents: "none",
                        animation: "holographic-glow 3s ease-in-out infinite"
                    }} />

                    {/* The Grain/Noise Overlay - Background Layer 1 */}
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0.2,
                        zIndex: 1,
                        pointerEvents: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundSize: "200px"
                    }} />

                    {/* Premium Noise Gradient Layers - Background Layer 2 */}
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: `
                            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 60%),
                            radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 60%),
                            radial-gradient(circle at 50% 100%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)
                        `,
                        zIndex: 2
                    }} />

                    {/* LEFT COLUMN: Avatar & Profile Info */}
                    <div style={{ 
                        position: "relative", 
                        zIndex: 3, 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        width: "40%", 
                        height: "100%",
                        justifyContent: "center",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: "min(24px, 4vw)"
                    }}>
                        {/* Avatar */}
                        <div style={{ position: "relative", marginBottom: "min(12px, 2vw)" }}>
                            <img
                                src={avatarUrl}
                                alt={user.name}
                                style={{
                                    width: "min(110px, 25vw)",
                                    height: "min(110px, 25vw)",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "4px solid rgba(255,255,255,0.2)",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                                    backgroundColor: "#212121"
                                }}
                                crossOrigin="anonymous"
                            />
                            {user.is_pro && (
                                <div style={{
                                    position: "absolute",
                                    bottom: "0px",
                                    right: "-5px",
                                    background: "#0f172a",
                                    padding: "2px",
                                    borderRadius: "50%",
                                    border: "2px solid rgba(255,255,255,0.2)"
                                }}>
                                    <VerifiedBadge username={user.username} isPro={true} size="min(24px, 6vw)" />
                                </div>
                            )}
                        </div>

                        <h2 style={{ fontSize: "min(20px, 4.5vw)", fontWeight: 800, margin: "0 0 2px 0", letterSpacing: "-0.5px", textAlign: "center" }}>
                            {user.name}
                        </h2>
                        <p style={{ fontSize: "min(13px, 3.5vw)", color: "rgba(255,255,255,0.6)", margin: "0 0 8px 0", fontWeight: 500 }}>
                            @{user.username || "developer"}
                        </p>
                        {firstLineBio && (
                            <p style={{ 
                                fontSize: "min(11px, 2.5vw)", 
                                color: "rgba(255,255,255,0.45)", 
                                margin: "0", 
                                fontWeight: 400,
                                textAlign: "center",
                                maxWidth: "100%",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical"
                            }}>
                                {firstLineBio}
                            </p>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Details */}
                    <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", width: "60%", height: "100%", justifyContent: "space-between" }}>
                        {/* Branding Header inside right column */}
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ fontSize: "18px", fontWeight: 700, }}>Codeown</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Developer ID</div>
                        </div>

                        {/* Stats Array */}
                        <div style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-around",
                            background: "rgba(0,0,0,0.3)",
                            padding: "min(12px, 2.5vw)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.05)",
                            marginBottom: "16px"
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "min(10px, 2.5vw)", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Joined</div>
                                <div style={{ fontSize: "min(13px, 3.5vw)", fontWeight: 700 }}>{joinDate}</div>
                            </div>
                            <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "min(10px, 2.5vw)", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Projects</div>
                                <div style={{ fontSize: "min(14px, 4vw)", fontWeight: 800 }}>{projectsCount}</div>
                            </div>
                        </div>

                        {/* Tech Stack & QR */}
                        <div style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            gap: "12px"
                        }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ fontSize: "min(10px, 2.5vw)", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase" }}>Tech Stack</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {techStacks.length > 0 ? techStacks.map((skill, idx) => (
                                        <span key={idx} style={{
                                            fontSize: "min(11px, 2.8vw)",
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            backgroundColor: "rgba(255,255,255,0.1)",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            borderRadius: "100px",
                                            color: "rgba(255,255,255,0.9)"
                                        }}>
                                            {skill}
                                        </span>
                                    )) : (
                                        <span style={{ fontSize: "min(12px, 3vw)", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Developer</span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                background: "#fff",
                                padding: "6px",
                                borderRadius: "10px",
                                boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
                            }}>
                                <img
                                    src={qrCodeUrl}
                                    alt="Profile QR Code"
                                    style={{ 
                                        width: "min(60px, 12vw)", 
                                        height: "min(60px, 12vw)", 
                                        display: "block", 
                                        borderRadius: "4px" 
                                    }}
                                    crossOrigin="anonymous"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Button Component */}
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        padding: "min(16px, 4vw) min(32px, 8vw)",
                        backgroundColor: "#fff",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: "100px",
                        fontSize: "min(16px, 4.5vw)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "min(10px, 2.5vw)",
                        cursor: downloading ? "not-allowed" : "pointer",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                        transition: "all 0.2s",
                        opacity: downloading ? 0.7 : 1
                    }}
                    onMouseEnter={e => { if (!downloading) e.currentTarget.style.transform = "translateY(-2px)" }}
                    onMouseLeave={e => { if (!downloading) e.currentTarget.style.transform = "translateY(0)" }}
                >
                    <HugeiconsIcon icon={Download01Icon} size={20} />
                    {downloading ? "Generating..." : "Download ID Card"}
                </button>

                {/* Holographic Animations */}
                <style>{`
                    @keyframes holographic-shimmer {
                        0% {
                            transform: translateX(-100%) translateY(-100%) rotate(45deg);
                            opacity: 0;
                        }
                        25% {
                            opacity: 1;
                        }
                        50% {
                            transform: translateX(100%) translateY(100%) rotate(45deg);
                            opacity: 1;
                        }
                        75% {
                            opacity: 1;
                        }
                        100% {
                            transform: translateX(-100%) translateY(-100%) rotate(45deg);
                            opacity: 0;
                        }
                    }

                    @keyframes holographic-glow {
                        0%, 100% {
                            opacity: 0.3;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 0.8;
                            transform: scale(1.05);
                        }
                    }

                    @media (max-width: 768px) {
                        @keyframes holographic-shimmer {
                            0% {
                                transform: translateX(-150%) translateY(-150%) rotate(45deg);
                                opacity: 0;
                            }
                            25% {
                                opacity: 1;
                            }
                            50% {
                                transform: translateX(150%) translateY(150%) rotate(45deg);
                                opacity: 1;
                            }
                            75% {
                                opacity: 1;
                            }
                            100% {
                                transform: translateX(-150%) translateY(-150%) rotate(45deg);
                                opacity: 0;
                            }
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
