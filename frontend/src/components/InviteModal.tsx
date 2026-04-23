import { useState, useEffect } from "react";
import { X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import inviteIllustration from "../assets/invite-illustration.png";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string | null;
}

export default function InviteModal({ isOpen, onClose, username }: InviteModalProps) {
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({ count: 0 });
    const { getToken } = useClerkAuth();

    const inviteLink = `${window.location.origin}/signup?ref=${username || "user"}`;

    useEffect(() => {
        if (isOpen) {
            fetchStats();
        }
    }, [isOpen]);

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const res = await api.get("/users/referrals/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Error fetching invite stats:", error);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 10000, padding: "16px"
            }} 
            onClick={onClose}
        >
            <div 
                style={{
                    backgroundColor: "#FFFFFF",
                    width: "100%", maxWidth: "440px",
                    borderRadius: "24px",
                    position: "relative",
                    overflow: "hidden",
                    padding: "40px 32px",
                    textAlign: "center",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    animation: "modalSpring 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    style={{ 
                        position: "absolute", top: "24px", right: "24px",
                        padding: "8px", background: "none", border: "none", 
                        cursor: "pointer", color: "#64748b",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                >
                    <HugeiconsIcon icon={X} size={20} />
                </button>

                {/* Illustration */}
                <div style={{ marginBottom: "24px" }}>
                    <img 
                        src={inviteIllustration} 
                        alt="Join us" 
                        style={{ width: "260px", height: "auto", margin: "0 auto" }} 
                    />
                </div>

                {/* Content */}
                <h2 style={{ 
                    fontSize: "24px", 
                    fontWeight: 400, 
                    margin: "0 0 12px 0", 
                    color: "#0f172a",
                    fontFamily: "serif"
                }}>
                    Your personalized <i style={{ fontFamily: "serif" }}>invite link!</i>
                </h2>

                <p style={{ 
                    fontSize: "14px", 
                    lineHeight: "1.6", 
                    color: "#64748b", 
                    margin: "0 0 32px 0",
                    padding: "0 10px"
                }}>
                    Grab the invite link below and send it to your friends, coworkers, and anyone else you think should join Codeown!
                </p>

                {/* Action Button */}
                <button
                    onClick={copyLink}
                    style={{
                        backgroundColor: copied ? "#10b981" : "#0f172a",
                        color: "#FFFFFF",
                        border: "none", 
                        borderRadius: "12px", 
                        width: "100%",
                        padding: "16px 24px",
                        fontSize: "15px", 
                        fontWeight: 700, 
                        cursor: "pointer",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s ease",
                        marginBottom: "16px"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = copied ? "#059669" : "#1e293b"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = copied ? "#10b981" : "#0f172a"}
                >
                    {copied ? "Copied!" : "Copy Invite Link"}
                </button>

                {/* Link Display */}
                <p style={{ 
                    fontSize: "13px", 
                    color: "#64748b", 
                    textDecoration: "underline",
                    margin: "0 0 32px 0",
                    cursor: "pointer",
                    wordBreak: "break-all"
                }} onClick={copyLink}>
                    {inviteLink}
                </p>

                {/* Stats Footer */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
                    <p style={{ 
                        fontSize: "13px", 
                        color: "#94a3b8", 
                        margin: 0,
                        fontWeight: 500
                    }}>
                        {stats.count === 0 
                            ? "No one joined with your invite link yet!" 
                            : `${stats.count} builder${stats.count === 1 ? "" : "s"} joined via your link!`}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes modalSpring {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
