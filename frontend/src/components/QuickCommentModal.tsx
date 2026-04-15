import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    MessageQuestion01Icon,
    SentIcon
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";

interface QuickCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceId: number;
    resourceType: "post" | "project";
    onSuccess?: () => void;
    authorName?: string;
}

export default function QuickCommentModal({
    isOpen,
    onClose,
    resourceId,
    resourceType,
    onSuccess,
    authorName
}: QuickCommentModalProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getToken } = useClerkAuth();
    const { user } = useClerkUser();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { avatarUrl } = useAvatar(
        user?.id,
        user?.imageUrl,
        user?.fullName || user?.username || "User"
    );

    useEffect(() => {
        if (isOpen) {
            setContent("");
            setTimeout(() => textareaRef.current?.focus(), 150);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const endpoint = resourceType === "project"
                ? `/projects/${resourceId}/comments`
                : `/posts/${resourceId}/comments`;

            await api.post(
                endpoint,
                { content: content.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Comment posted!");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Error posting quick comment:", error);
            toast.error("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            onClose();
        }
    };

    const modalContent = (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                zIndex: 4000,
                animation: "fadeIn 0.2s ease-out"
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-hairline)",
                    boxShadow: "var(--shadow-xl)",
                    padding: "24px",
                    position: "relative",
                    animation: "reactionFadeUpSimple 0.2s ease-out"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ padding: "8px", backgroundColor: "var(--bg-hover)", borderRadius: "10px" }}>
                            <HugeiconsIcon icon={MessageQuestion01Icon} size={20} color="var(--text-primary)" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--text-primary)" }}>
                            Reply {authorName ? `to ${authorName}` : ""}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-tertiary)",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={20} />
                    </button>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <img
                        src={avatarUrl}
                        alt="Your avatar"
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            objectFit: "cover",
                            border: "1px solid var(--border-hairline)",
                            flexShrink: 0
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What's your reply?"
                            style={{
                                width: "100%",
                                minHeight: "140px",
                                backgroundColor: "transparent",
                                border: "none",
                                outline: "none",
                                fontSize: "16px",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                resize: "none",
                                fontFamily: "inherit",
                                padding: "4px 0",
                                lineHeight: 1.5
                            }}
                        />
                    </div>
                </div>

                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "0.5px solid var(--border-hairline)"
                }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                            Ctrl + Enter to post
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                            style={{
                                padding: "12px 28px",
                                borderRadius: "100px",
                                backgroundColor: content.trim() ? "var(--text-primary)" : "var(--bg-hover)",
                                color: content.trim() ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: 800,
                                cursor: content.trim() ? "pointer" : "default",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                        >
                            {isSubmitting ? (
                                <div className="loading-spinner-tiny" />
                            ) : (
                                <>
                                    Post reply
                                    <HugeiconsIcon icon={SentIcon} size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .loading-spinner-tiny {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(var(--bg-page-rgb), 0.3);
          border-top-color: var(--bg-page);
          borderRadius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
