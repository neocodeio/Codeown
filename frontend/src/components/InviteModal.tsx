import React, { useState, useEffect } from "react";
import { X, Copy, Check, TwitterLogo, WhatsappLogo, LinkedinLogo, Gift } from "phosphor-react";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string | null;
}

export default function InviteModal({ isOpen, onClose, username }: InviteModalProps) {
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({ count: 0, limit: 5 });
    const [loading, setLoading] = useState(false);
    const { getToken } = useClerkAuth();

    const inviteLink = `https://codeown.space/?ref=${username || "user"}`;

    useEffect(() => {
        if (isOpen) {
            fetchStats();
        }
    }, [isOpen]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const res = await api.get("/users/referrals/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Error fetching invite stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnX = () => {
        const text = `Join me on Codeown, the platform for modern builders! 🚀\n\nSign up here for 200XP bonus: ${inviteLink}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    };

    const shareOnWhatsApp = () => {
        const text = `Join me on Codeown, the platform for modern builders! 🚀 Sign up here for 200XP bonus: ${inviteLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`, "_blank");
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, padding: "20px"
        }} onClick={onClose}>
            <div style={{
                backgroundColor: "var(--bg-page)",
                width: "100%", maxWidth: "480px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-hairline)",
                position: "relative",
                overflow: "hidden",
                animation: "modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: "24px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid var(--border-hairline)" }}>
                            <Gift size={22} weight="duotone" style={{ color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Invite Builders</h2>
                            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "2px 0 0 0" }}>Grow the community and reward others.</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: "32px 24px" }}>
                    {/* Reward Highlight */}
                    <div style={{
                        backgroundColor: "var(--bg-hover)",
                        padding: "16px", borderRadius: "var(--radius-sm)",
                        border: "1px dashed var(--border-hairline)",
                        marginBottom: "24px", textAlign: "center"
                    }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                            Every builder you invite gets a 200 XP welcome bonus! ⚡
                        </span>
                    </div>

                    {/* Copy Link Section */}
                    <div style={{ marginBottom: "32px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "block" }}>
                            Your Invitation Link
                        </label>
                        <div style={{
                            display: "flex",
                            gap: "8px",
                            backgroundColor: "var(--bg-input)",
                            padding: "6px",
                            borderRadius: "var(--radius-sm)",
                            border: "1.5px solid var(--border-hairline)"
                        }}>
                            <input
                                readOnly
                                value={inviteLink}
                                style={{
                                    flex: 1, backgroundColor: "transparent", border: "none", outline: "none",
                                    color: "var(--text-primary)", fontSize: "14px", padding: "0 12px",
                                    fontFamily: "var(--font-mono)"
                                }}
                            />
                            <button
                                onClick={copyLink}
                                style={{
                                    backgroundColor: copied ? "var(--bg-hover)" : "var(--text-primary)",
                                    color: copied ? "var(--text-primary)" : "var(--bg-page)",
                                    border: "none", borderRadius: "8px", padding: "8px 16px",
                                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: "8px",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Social Share */}
                    <div style={{ marginBottom: "32px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", display: "block" }}>
                            Quick Share
                        </label>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={shareOnX} style={shareButtonStyle}>
                                <TwitterLogo size={20} weight="fill" />
                                <span>X / Twitter</span>
                            </button>
                            <button onClick={shareOnWhatsApp} style={shareButtonStyle}>
                                <WhatsappLogo size={20} weight="fill" />
                                <span>WhatsApp</span>
                            </button>
                            <button onClick={shareOnLinkedIn} style={shareButtonStyle}>
                                <LinkedinLogo size={20} weight="fill" />
                                <span>LinkedIn</span>
                            </button>
                        </div>
                    </div>

                    {/* Weekly Stats */}
                    <div style={{
                        borderTop: "0.5px solid var(--border-hairline)",
                        paddingTop: "24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                        <div>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Weekly Limit</span>
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Refreshes on Monday</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                                {loading ? "..." : `${stats?.count ?? 0}/${stats?.limit ?? 5}`}
                            </span>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Invited</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalEnter {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @media (max-width: 480px) {
                    .share-btn span { display: none; }
                    .share-btn { padding: 12px !important; }
                }
            `}</style>
        </div>
    );
}

const shareButtonStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px 8px",
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid var(--border-hairline)",
    backgroundColor: "var(--bg-page)",
    color: "var(--text-primary)",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
};
