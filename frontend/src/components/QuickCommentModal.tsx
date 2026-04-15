import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    MessageQuestionIcon,
    SentIcon,
    Gif01Icon,
    Image01Icon,
    Cancel02Icon
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";
import GifPicker from "./GifPicker";

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
    const [selectedGif, setSelectedGif] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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
            setSelectedGif(null);
            setSelectedImage(null);
            setIsGifPickerOpen(false);
            setTimeout(() => textareaRef.current?.focus(), 150);
        }
    }, [isOpen, resourceId]);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if ((!content.trim() && !selectedGif && !selectedImage) || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const finalContent = selectedGif ? `${content.trim()}\n${selectedGif}`.trim() : content.trim();

            if (resourceType === "post") {
                await api.post(
                    "/comments",
                    { post_id: resourceId, content: finalContent, image_url: selectedImage },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await api.post(
                    `/projects/${resourceId}/comments`,
                    { content: finalContent, image_url: selectedImage },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

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
                zIndex: 12000,
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
                        <div style={{ padding: "8px", backgroundColor: "var(--bg-hover)", borderRadius: "100px", display: "flex" }}>
                            <HugeiconsIcon icon={MessageQuestionIcon} size={20} color="var(--text-primary)" />
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
                        {(selectedGif || selectedImage) && (
                            <div style={{ marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", animation: "reactionFadeUpSimple 0.2s ease-out" }}>
                                {selectedGif && (
                                    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1.5px solid var(--border-hairline)", width: "fit-content" }}>
                                        <img src={selectedGif} alt="GIF" style={{ maxHeight: "150px", opacity: 1, display: "block" }} />
                                        <button
                                            onClick={() => setSelectedGif(null)}
                                            style={{ position: "absolute", top: "6px", right: "6px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                        >
                                            <HugeiconsIcon icon={Cancel02Icon} size={14} />
                                        </button>
                                    </div>
                                )}
                                {selectedImage && (
                                    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1.5px solid var(--border-hairline)", width: "fit-content" }}>
                                        <img src={selectedImage} alt="Image" style={{ maxHeight: "150px", opacity: 1, display: "block" }} />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            style={{ position: "absolute", top: "6px", right: "6px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                        >
                                            <HugeiconsIcon icon={Cancel02Icon} size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What's your reply?"
                            style={{
                                width: "100%",
                                minHeight: "100px",
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "0.5px solid var(--border-hairline)"
                }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px", padding: "10px",
                                backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent",
                                color: isGifPickerOpen ? "var(--text-primary)" : "var(--text-tertiary)",
                                border: "0.5px solid var(--border-hairline)", borderRadius: "14px",
                                cursor: "pointer", transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => !isGifPickerOpen && (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                            onMouseLeave={(e) => !isGifPickerOpen && (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                            <HugeiconsIcon icon={Gif01Icon} size={20} />
                        </button>

                        <label style={{
                            display: "flex", alignItems: "center", gap: "6px", padding: "10px",
                            backgroundColor: "transparent", color: "var(--text-tertiary)",
                            border: "0.5px solid var(--border-hairline)", borderRadius: "14px",
                            cursor: "pointer", transition: "all 0.2s ease"
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <HugeiconsIcon icon={Image01Icon} size={20} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: "none" }}
                                disabled={isUploading}
                            />
                        </label>

                        {isGifPickerOpen && (
                            <div style={{ position: "absolute", bottom: "calc(100% + 15px)", left: 0, zIndex: 13000, animation: "reactionFadeUpSimple 0.2s ease-out" }}>
                                <GifPicker
                                    onSelect={(gifUrl) => { setSelectedGif(gifUrl); setIsGifPickerOpen(false); }}
                                    onClose={() => setIsGifPickerOpen(false)}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }} className="hide-mobile">
                            Ctrl + Enter
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && !selectedGif && !selectedImage) || isSubmitting || isUploading}
                            style={{
                                padding: "12px 28px",
                                borderRadius: "100px",
                                backgroundColor: (content.trim() || selectedGif || selectedImage) ? "var(--text-primary)" : "var(--bg-hover)",
                                color: (content.trim() || selectedGif || selectedImage) ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "none",
                                fontSize: "14px",
                                fontWeight: 800,
                                cursor: (content.trim() || selectedGif || selectedImage) ? "pointer" : "default",
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
                                    {isUploading ? "Wait" : "Post reply"}
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
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
