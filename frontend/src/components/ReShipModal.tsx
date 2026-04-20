import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    SentIcon,
    ReloadIcon,
    InformationCircleIcon
} from "@hugeicons/core-free-icons";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { toast } from "react-toastify";
import ContentRenderer from "./ContentRenderer";
import { formatRelativeDate } from "../utils/date";

interface ReShipModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalPost?: any;
    originalProject?: any;
    onSuccess?: () => void;
}

export default function ReShipModal({ isOpen, onClose, originalPost, originalProject, onSuccess }: ReShipModalProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getToken } = useClerkAuth();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Please add some commentary to your re-ship");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            await api.post("/posts", {
                content: content.trim(),
                reposted_post_id: originalPost?.id,
                reposted_project_id: originalProject?.id,
                post_type: "Re-Ship"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Re-shipped successfully!");
            onSuccess?.();
            onClose();
            setContent("");
        } catch (error) {
            console.error("Error re-shipping:", error);
            toast.error("Failed to re-ship");
        } finally {
            setIsSubmitting(false);
        }
    };

    const originalContent = originalPost || originalProject;
    const authorName = originalPost ? (originalPost.user?.name || originalPost.user?.username) : (originalProject.user?.name || originalProject.user?.username);
    const authorAvatar = originalPost ? (originalPost.user?.avatar_url) : (originalProject.user?.avatar_url);
    const typeLabel = originalPost ? "Post" : "Project";

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 11000,
            padding: "20px"
        }} onClick={onClose}>
            <div style={{
                backgroundColor: "var(--bg-card)",
                width: "100%", maxWidth: "600px",
                borderRadius: "20px",
                border: "0.5px solid var(--border-hairline)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                animation: "modalFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: "20px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "10px",
                            backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <HugeiconsIcon icon={ReloadIcon} size={20} />
                        </div>
                        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Re-Ship {typeLabel}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "8px" }}>
                        <HugeiconsIcon icon={Cancel01Icon} size={24} />
                    </button>
                </div>

                {/* Input Area */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <textarea
                        autoFocus
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add your thoughts about this ship..."
                        style={{
                            width: "100%", minHeight: "120px", border: "none", outline: "none",
                            backgroundColor: "transparent", color: "var(--text-primary)",
                            fontSize: "16px", lineHeight: "1.6", resize: "none",
                            fontFamily: "inherit"
                        }}
                    />

                    {/* Quote Preview */}
                    <div style={{
                        padding: "16px",
                        borderRadius: "16px",
                        border: "0.5px solid var(--border-hairline)",
                        backgroundColor: "var(--bg-hover)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        pointerEvents: "none" // Disable interaction inside preview
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                                src={authorAvatar || "https://images.clerk.dev/static/avatar.png"}
                                alt=""
                                style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                            />
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{authorName}</span>
                            <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>• {formatRelativeDate(originalContent?.created_at)}</span>
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                            {originalPost ? <ContentRenderer content={originalPost.content} /> : originalProject?.description}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "20px", borderTop: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)", fontSize: "13px" }}>
                        <HugeiconsIcon icon={InformationCircleIcon} size={16} />
                        <span>This will appear on your profile and feed</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        style={{
                            padding: "10px 24px",
                            borderRadius: "100px",
                            backgroundColor: content.trim() ? "var(--text-primary)" : "var(--bg-hover)",
                            color: content.trim() ? "var(--bg-card)" : "var(--text-tertiary)",
                            border: "none",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: content.trim() ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease"
                        }}
                    >
                        {isSubmitting ? "Shipping..." : (
                            <>
                                <span>Re-Ship</span>
                                <HugeiconsIcon icon={SentIcon} size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes modalFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
