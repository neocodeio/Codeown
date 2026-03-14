import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import VerifiedBadge from "./VerifiedBadge";
import { DownloadSimple, X } from "phosphor-react";

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
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "RECENT";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/${user.username || ""}`)}`;
    const techStacks = (user.skills || []).slice(0, 3);
    const firstLineBio = user.bio ? user.bio.split('\n')[0].trim() : "DEVELOPER SOURCE";

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 4,
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
            backgroundColor: "rgba(0, 0, 0, 0.6)",
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
                gap: "32px",
                width: "100%",
                maxWidth: "680px"
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "-48px",
                        right: "0",
                        background: "none",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.4)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        transition: "all 0.2s"
                    }}
                    className="btn-id-close"
                >
                    Close <X size={16} weight="thin" />
                </button>
                
                {/* ID Card */}
                <div
                    ref={cardRef}
                    style={{
                        width: "100%",
                        aspectRatio: "1.7 / 1",
                        background: "#000000",
                        borderRadius: "4px",
                        border: "0.5px solid rgba(255, 255, 255, 0.2)",
                        boxShadow: "0 40px 80px rgba(0, 0, 0, 0.4)",
                        padding: "32px",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                        color: "#fff",
                        fontFamily: "var(--font-mono)",
                        gap: "32px"
                    }}
                >
                    {/* Background Texture / Grain */}
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.05,
                        zIndex: 1,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* Premium Holographic Stripe */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: "15%",
                        width: "20%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
                        zIndex: 2,
                        transform: "skewX(-20deg)"
                    }} className="holographic-stripe" />

                    {/* Left Section: Visual Identity */}
                    <div style={{
                        position: "relative",
                        zIndex: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "35%",
                        borderRight: "0.5px solid rgba(255, 255, 255, 0.1)",
                        paddingRight: "32px"
                    }}>
                        <div style={{ position: "relative", marginBottom: "20px" }}>
                            <img
                                src={avatarUrl}
                                alt=""
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "2px",
                                    objectFit: "cover",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    filter: "grayscale(1) brightness(1.1)",
                                }}
                                crossOrigin="anonymous"
                            />
                            {user.is_pro && (
                                <div style={{
                                    position: "absolute",
                                    bottom: "-10px",
                                    right: "-10px",
                                    background: "#000",
                                    padding: "4px",
                                    border: "0.5px solid rgba(255,255,255,0.2)",
                                    borderRadius: "2px"
                                }}>
                                    <VerifiedBadge username={user.username} isPro={true} size="20px" />
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>{user.name}</div>
                            <div style={{ fontSize: "9px", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", marginBottom: "8px" }}>@{user.username}</div>
                            <div style={{ 
                                fontSize: "8px", 
                                fontWeight: 500, 
                                opacity: 0.3, 
                                textTransform: "uppercase",
                                maxWidth: "140px",
                                margin: "0 auto",
                                lineHeight: "1.4",
                                letterSpacing: "0.05em"
                            }}>{firstLineBio}</div>
                        </div>
                    </div>

                    {/* Right Section: Technical Data */}
                    <div style={{
                        position: "relative",
                        zIndex: 3,
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        height: "100%",
                        justifyContent: "space-between"
                    }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>CODEOWN</div>
                                <div style={{ fontSize: "9px", fontWeight: 600, opacity: 0.4, textTransform: "uppercase", marginTop: "2px" }}>Technical Authorization • ID-{Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#fff", padding: "4px 8px", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: "2px" }}>DEV-ID</div>
                        </div>

                        {/* Mid Stats */}
                        <div style={{ display: "flex", gap: "40px", padding: "24px 0", borderTop: "0.5px solid rgba(255,255,255,0.1)", borderBottom: "0.5px solid rgba(255,255,255,0.1)" }}>
                            <div>
                                <div style={{ fontSize: "8px", fontWeight: 600, opacity: 0.4, textTransform: "uppercase", marginBottom: "6px" }}>Deployment</div>
                                <div style={{ fontSize: "13px", fontWeight: 800 }}>{joinDate.toUpperCase()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "8px", fontWeight: 600, opacity: 0.4, textTransform: "uppercase", marginBottom: "6px" }}>Submissions</div>
                                <div style={{ fontSize: "13px", fontWeight: 800 }}>{projectsCount.toString().padStart(3, '0')} UNITS</div>
                            </div>
                        </div>

                        {/* Footer: Skills & QR */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "8px", fontWeight: 600, opacity: 0.4, textTransform: "uppercase", marginBottom: "8px" }}>Primary Tech Stack</div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {techStacks.length > 0 ? techStacks.map((skill, idx) => (
                                        <span key={idx} style={{
                                            fontSize: "9px",
                                            fontWeight: 800,
                                            padding: "3px 8px",
                                            border: "0.5px solid rgba(255,255,255,0.2)",
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                            textTransform: "uppercase"
                                        }}>{skill}</span>
                                    )) : <span style={{ fontSize: "9px", opacity: 0.5 }}>CORES PENDING...</span>}
                                </div>
                            </div>
                            <div style={{ backgroundColor: "#fff", padding: "6px", borderRadius: "2px" }}>
                                <img src={qrCodeUrl} alt="" style={{ width: "56px", height: "56px", display: "block" }} crossOrigin="anonymous" />
                            </div>
                        </div>
                    </div>

                    {/* Scanning Animation Element */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "1px",
                        background: "rgba(255,255,255,0.2)",
                        zIndex: 4,
                        boxShadow: "0 0 15px rgba(255,255,255,0.2)",
                        animation: "scan-line 4s linear infinite"
                    }} />
                </div>

                {/* Controls */}
                <div style={{ display: "flex", gap: "16px" }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "16px 32px",
                            backgroundColor: "transparent",
                            color: "#fff",
                            border: "0.5px solid rgba(255,255,255,0.2)",
                            borderRadius: "2px",
                            fontSize: "12px",
                            fontWeight: 800,
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        className="btn-id-cancel"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{
                            padding: "16px 40px",
                            backgroundColor: "#fff",
                            color: "#000",
                            border: "none",
                            borderRadius: "2px",
                            fontSize: "12px",
                            fontWeight: 900,
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            cursor: downloading ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            opacity: downloading ? 0.7 : 1
                        }}
                        onMouseEnter={e => { if (!downloading) e.currentTarget.style.transform = "translateY(-2px)" }}
                        onMouseLeave={e => { if (!downloading) e.currentTarget.style.transform = "translateY(0)" }}
                    >
                        <DownloadSimple size={18} weight="bold" />
                        {downloading ? "PROCESSING..." : "Download Blueprint"}
                    </button>
                </div>

                <style>{`
                    @keyframes scan-line {
                        0% { top: 0; }
                        50% { top: 100%; }
                        100% { top: 0; }
                    }
                    .holographic-stripe {
                        animation: shimmer 6s infinite;
                    }
                    @keyframes shimmer {
                        0% { left: -20%; }
                        100% { left: 120%; }
                    }
                    .btn-id-cancel:hover {
                        background-color: rgba(255,255,255,0.05);
                    }
                `}</style>
            </div>
        </div>
    );
}
