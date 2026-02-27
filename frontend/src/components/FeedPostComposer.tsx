import { useState, useRef } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faTimes } from "@fortawesome/free-solid-svg-icons";
import MentionInput from "./MentionInput";
import LinkPreview from "./LinkPreview";

interface FeedPostComposerProps {
    onCreated: () => void;
}

export default function FeedPostComposer({ onCreated }: FeedPostComposerProps) {
    const [content, setContent] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { getToken, isLoaded } = useClerkAuth();
    const { user, isSignedIn } = useClerkUser();

    const { avatarUrl } = useAvatar(
        user?.id,
        user?.imageUrl,
        user?.fullName || user?.username || "User"
    );

    const charLimit = 280;

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxImages = 4;
        if (images.length + files.length > maxImages) {
            alert(`You can upload a maximum of ${maxImages} images`);
            return;
        }

        const { compressImage } = await import("../utils/image");

        Array.from(files).forEach(async (file) => {
            try {
                // For feed posts, we use slightly more aggressive compression (1000px, 0.6 quality)
                const compressedBase64 = await compressImage(file, 1000, 1000, 0.6);
                setImages((prev) => [...prev, compressedBase64]);
            } catch (error) {
                console.error("Compression error:", error);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages((prev) => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            }
        });

        // Reset input value
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if ((!content.trim() && images.length === 0) || isSubmitting || !isLoaded) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");

            await api.post("/posts", {
                content: content.trim(),
                images: images.length > 0 ? images : null,
                language: "en"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setContent("");
            setImages([]);
            onCreated();
        } catch (error) {
            console.error("Failed to post:", error);
            alert("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isSignedIn) return null;

    return (
        <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #eff3f4",
            display: "flex",
            gap: "12px"
        }}>
            <img
                src={avatarUrl}
                alt="Profile"
                style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    objectFit: "cover"
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "12px" }}>
                    <MentionInput
                        value={content}
                        onChange={setContent}
                        placeholder="What are you building today?"
                        minHeight="60px"
                        transparent={true}
                    />
                </div>

                {/* Link Preview */}
                {(() => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const match = content.match(urlRegex);
                    if (match && images.length === 0) {
                        return <div style={{ marginBottom: "12px" }}><LinkPreview url={match[0]} /></div>;
                    }
                    return null;
                })()}

                {images.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: images.length === 1 ? "1fr" : "1fr 1fr",
                        gap: "8px",
                        marginBottom: "12px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid #eff3f4"
                    }}>
                        {images.map((img, index) => (
                            <div key={index} style={{ position: "relative", aspectRatio: images.length === 1 ? "16/9" : "1/1" }}>
                                <img
                                    src={img}
                                    alt={`Upload ${index}`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <button
                                    onClick={() => removeImage(index)}
                                    style={{
                                        position: "absolute",
                                        top: "8px",
                                        right: "8px",
                                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "28px",
                                        height: "28px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backdropFilter: "blur(4px)"
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: "14px" }} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: (content.length > 0 || images.length > 0) ? "1px solid #eff3f4" : "none"
                }}>
                    <div style={{ display: "flex", gap: "10px", color: "#212121" }}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={handleImageClick}
                            style={{
                                background: "none",
                                border: "none",
                                color: "inherit",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "50%",
                                transition: "background 0.2s"
                            }}
                        >
                            <FontAwesomeIcon icon={faImage} style={{ fontSize: "18px" }} />
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{
                            fontSize: "13px",
                            color: content.length > charLimit ? "#ef4444" : "#64748b",
                            opacity: content.length > 0 ? 1 : 0,
                            transition: "opacity 0.2s"
                        }}>
                            {content.length} / {charLimit}
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && images.length === 0) || isSubmitting || content.length > charLimit}
                            style={{
                                padding: "8px 20px",
                                backgroundColor: (content.trim() || images.length > 0) && !isSubmitting && content.length <= charLimit ? "#0f172a" : "#cbd5e1",
                                color: "#fff",
                                border: "none",
                                borderRadius: "100px",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: (content.trim() || images.length > 0) && !isSubmitting && content.length <= charLimit ? "pointer" : "not-allowed",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => {
                                if ((content.trim() || images.length > 0) && !isSubmitting && content.length <= charLimit) e.currentTarget.style.backgroundColor = "#1e293b";
                            }}
                            onMouseLeave={e => {
                                if ((content.trim() || images.length > 0) && !isSubmitting && content.length <= charLimit) e.currentTarget.style.backgroundColor = "#0f172a";
                            }}
                        >
                            {isSubmitting ? "Post..." : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
