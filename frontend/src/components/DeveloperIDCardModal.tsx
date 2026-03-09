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

    // Fallback joined date if missing
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently Join";

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/${user.username || ""}`)}`;

    const techStacks = (user.skills || []).slice(0, 3);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 3, // High resolution for the download
                style: { transform: 'scale(1)' } // Fix scaling issues
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
                        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        borderRadius: "40px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                        color: "#fff",
                        fontFamily: "'Inter', sans-serif" // Make sure font matches platform
                    }}
                >
                    {/* Background Noise/Gradient layer to make glass pop when downloaded */}
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "radial-gradient(circle at top right, rgba(59,130,246,0.3), transparent 70%), radial-gradient(circle at bottom left, rgba(139,92,246,0.2), transparent 70%), #0f172a",
                        zIndex: -2
                    }} />

                    {/* Inner texture */}
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
                        zIndex: -1
                    }} />

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
                            crossOrigin="anonymous" // IMPORTANT FOR HTML-TO-IMAGE
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
                        background: "rgba(0,0,0,0.2)",
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

                        {/* Dynamic QR Code */}
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
