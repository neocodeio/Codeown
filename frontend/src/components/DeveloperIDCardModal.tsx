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
                        width: "380px",
                        height: "560px",
                        background: "#020617", // Deeper solid base for better element contrast
                        borderRadius: "40px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                        color: "#fff",
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
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

                    {/* Content Container - Above All Background Layers */}
                    <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>
                        {/* Branding Top */}
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                            <div style={{ fontSize: "18px", fontWeight: 700, }}>Codeown</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, opacity: 0.6, textTransform: "uppercase" }}>Developer ID</div>
                        </div>

                        {/* Avatar */}
                        <div style={{ position: "relative", marginBottom: "20px" }}>
                            <img
                                src={avatarUrl}
                                alt={user.name}
                                style={{
                                    width: "110px",
                                    height: "110px",
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
                                    <VerifiedBadge username={user.username} isPro={true} size="24px" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 4px 0", letterSpacing: "-0.5px", textAlign: "center" }}>
                            {user.name}
                        </h2>
                        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", margin: "0 0 24px 0", fontWeight: 500 }}>
                            @{user.username || "developer"}
                        </p>

                        {/* Stats */}
                        <div style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-around",
                            background: "rgba(0,0,0,0.3)",
                            padding: "16px",
                            borderRadius: "16px",
                            marginBottom: "24px",
                            border: "1px solid rgba(255,255,255,0.05)"
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Joined</div>
                                <div style={{ fontSize: "14px", fontWeight: 700 }}>{joinDate}</div>
                            </div>
                            <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Projects</div>
                                <div style={{ fontSize: "16px", fontWeight: 800 }}>{projectsCount}</div>
                            </div>
                        </div>

                        {/* Tech Stacks Area & QR Code Side-by-Side */}
                        <div style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            marginTop: "auto"
                        }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase" }}>Tech Stack</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {techStacks.length > 0 ? techStacks.map((skill, idx) => (
                                        <span key={idx} style={{
                                            fontSize: "12px",
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
                                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Developer</span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                background: "#fff",
                                padding: "6px",
                                borderRadius: "15px",
                                boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
                            }}>
                                <img
                                    src={qrCodeUrl}
                                    alt="Profile QR Code"
                                    style={{ width: "70px", height: "70px", display: "block", borderRadius: "6px" }}
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
                        padding: "16px 32px",
                        backgroundColor: "#fff",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: "100px",
                        fontSize: "16px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
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
            </div>
        </div>
    );
}
