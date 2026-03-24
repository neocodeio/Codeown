import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import VerifiedBadge from "./VerifiedBadge";
import { DownloadSimple, Fingerprint, ShieldCheck, TwitterLogo } from "phosphor-react";

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

    const nameFallback = user.name || "Anonymous";
    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFallback)}&background=212121&color=ffffff&bold=true`;
    const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "EST. 2024";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/${user.username || ""}`)}&bgcolor=ffffff&color=000000`;
    const techStacks = (user.skills || []).slice(0, 4);
    const firstLineBio = user.bio ? (user.bio.split('\n')[0] || "").trim() : "DECENTRALIZED_BUILDER_IDENTITY";
    const serialNumber = `ID-${(user.username || "X").substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 4,
                backgroundColor: '#000000'
            });
            const link = document.createElement("a");
            link.download = `${user.username || "developer"}-id-card.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to download ID card:", error);
        } finally {
            setDownloading(false);
        }
    };

    const handleShareToX = () => {
        const shareUrl = `${window.location.origin}/${user.username || ""}`;
        const tweetText = `Just claimed my developer identity on @CodeownSpace. Building in public. 🚀\n\nClaim yours at ${shareUrl}`;
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(xUrl, "_blank");
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
            padding: "20px"
        }} onClick={onClose}>

            <div style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                width: "100%",
                maxWidth: "340px",
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* ID Card */}
                <div
                    ref={cardRef}
                    style={{
                        width: "100%",
                        aspectRatio: "1 / 1.58",
                        background: "#000000",
                        borderRadius: "var(--radius-lg)",
                        border: "0.5px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.8)",
                        padding: "24px 28px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        color: "#fff",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    {/* Texture & Glow */}
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.1,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='B'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23B)'/%3E%3C/svg%3E")`,
                    }} />

                    <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "6px" }}>
                                CODEOWN <ShieldCheck size={12} weight="fill" style={{ opacity: 0.4 }} />
                            </div>
                            <div style={{ fontSize: "7px", opacity: 0.3, marginTop: "2px" }}>CORE ARCHIVE • v4.0.0</div>
                        </div>
                        <div style={{ fontSize: "9px", fontWeight: 800, opacity: 0.4, border: "0.5px solid rgba(255,255,255,0.2)", padding: "7px 8px", borderRadius: "var(--radius-sm)", letterSpacing: "0.1em" }}>DEVELOPER ID</div>

                    </div>

                    <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ position: "relative" }}>
                            <div style={{
                                width: "110px",
                                height: "110px",
                                background: "rgba(255,255,255,0.03)",
                                border: "0.5px solid rgba(255,255,255,0.1)",
                                borderRadius: "var(--radius-sm)",
                                padding: "4px"
                            }}>
                                <img
                                    src={avatarUrl}
                                    alt=""
                                    style={{ width: "100%", height: "100%", borderRadius: "var(--radius-xs)", objectFit: "cover", filter: "grayscale(1) brightness(1.1)" }}
                                    crossOrigin="anonymous"
                                />
                            </div>
                            {user.is_pro && (
                                <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "#000", padding: "3px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)" }}>
                                    <VerifiedBadge username={user.username} isPro={true} size="16px" />
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: "center", marginTop: "12px" }}>
                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>{nameFallback}</div>
                            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>@{user.username || "ANON"}</div>
                        </div>
                    </div>

                    <div style={{ position: "relative", zIndex: 10, marginBottom: "16px" }}>
                        <div style={{ fontSize: "7px", fontWeight: 800, opacity: 0.3, textTransform: "uppercase", borderBottom: "0.5px solid rgba(255,255,255,0.1)", paddingBottom: "4px", marginBottom: "6px" }}>Bio.Data</div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", lineHeight: "1.3" }}>{firstLineBio}</div>
                    </div>

                    <div style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", border: "0.5px solid rgba(255,255,255,0.1)", padding: "8px", background: "rgba(255,255,255,0.02)", marginBottom: "12px" }}>
                        <div>
                            <div style={{ fontSize: "6px", opacity: 0.3, textTransform: "uppercase", marginBottom: "2px" }}>Deployment</div>
                            <div style={{ fontSize: "10px", fontWeight: 800 }}>{joinDate.toUpperCase()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "6px", opacity: 0.3, textTransform: "uppercase", marginBottom: "2px" }}>Units</div>
                            <div style={{ fontSize: "10px", fontWeight: 800 }}>{projectsCount.toString().padStart(3, '0')} PROJECTS</div>
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <div style={{ fontSize: "6px", opacity: 0.3, textTransform: "uppercase", marginBottom: "6px" }}>Tech.Stacks</div>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {techStacks.length > 0 ? techStacks.map((skill, idx) => (
                                    <span key={idx} style={{ fontSize: "8px", padding: "1px 4px", border: "0.5px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.05)" }}>{skill}</span>
                                )) : <div style={{ fontSize: "8px", opacity: 0.3 }}>N/A</div>}
                            </div>
                        </div>
                    </div>

                    <div style={{ position: "relative", zIndex: 10, marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "7px", opacity: 0.3, textTransform: "uppercase", marginBottom: "4px" }}>Identification</div>
                            <div style={{ fontSize: "9px", fontWeight: 900 }}>{serialNumber}</div>
                            <div style={{ display: "flex", gap: "1px", height: "12px", marginTop: "4px", opacity: 0.4 }}>
                                {[2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 2].map((w, i) => (
                                    <div key={i} style={{ width: `${w}px`, height: "100%", backgroundColor: "#fff" }} />
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: "3px", backgroundColor: "#fff", borderRadius: "var(--radius-xs)" }}>
                            <img src={qrCodeUrl} alt="" style={{ width: "42px", height: "42px", display: "block" }} crossOrigin="anonymous" />
                        </div>
                    </div>

                    <Fingerprint size={100} weight="thin" style={{ position: "absolute", bottom: "-10px", right: "-20px", opacity: 0.05, transform: "rotate(-15deg)" }} />
                </div>

                <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            style={{
                                width: "100%",
                                padding: "16px",
                                backgroundColor: "#fff",
                                color: "#000",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                fontWeight: 900,
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                cursor: "pointer",
                            }}
                        >
                            <DownloadSimple size={18} weight="bold" />
                            {downloading ? "PROCESSING..." : "Download Card"}
                        </button>
                        <button
                            onClick={handleShareToX}
                            style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                color: "#fff",
                                border: "0.5px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "11px",
                                fontWeight: 800,
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                cursor: "pointer",
                            }}
                        >
                            <TwitterLogo size={18} weight="fill" />
                            Share ON X
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
