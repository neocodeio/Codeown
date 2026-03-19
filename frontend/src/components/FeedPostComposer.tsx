import { useState, useRef, useMemo } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import { useWindowSize } from "../hooks/useWindowSize";
import { Image as ImageIcon, ListPlus, PlusCircle, MinusCircle } from "phosphor-react";
import MentionInput from "./MentionInput";
import LinkPreview from "./LinkPreview";
import { validateImageSize } from "../constants/upload";

interface FeedPostComposerProps {
    onCreated: () => void;
}

export default function FeedPostComposer({ onCreated }: FeedPostComposerProps) {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const [content, setContent] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [isPoll, setIsPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
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

    const placeholderText = useMemo(() => {
        const textOptions = [
            "What did you build today?",
            "Shipped any bugs to production today?",
            "What's the latest side project you're working on?",
            "Learned a new tech stack? Share it!",
            "What are you currently stuck on? Ask the community!",
            "Squashed any bugs today? ",
            "What's your current dev obsession?",
            "Drop a link to your latest repository",
            "Did you remember to center that div?",
            "Share a snippet you're proud of today",
            "What's on your coding playlist today?",
            "Refactored any messy code recently?"
        ];
        return textOptions[Math.floor(Math.random() * textOptions.length)];
    }, []);

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

        for (const file of Array.from(files)) {
            const sizeError = validateImageSize(file);
            if (sizeError) {
                alert(sizeError);
                e.target.value = "";
                return;
            }
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

    const addPollOption = () => {
        if (pollOptions.length < 4) {
            setPollOptions([...pollOptions, ""]);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handleSubmit = async () => {
        if ((!content.trim() && images.length === 0 && !isPoll) || isSubmitting || !isLoaded) return;

        if (isPoll) {
            if (!content.trim()) {
                alert("Please enter a question for your poll.");
                return;
            }
            if (pollOptions.filter(o => o.trim() !== "").length < 2) {
                alert("Please provide at least 2 options for the poll.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("No token");

            await api.post("/posts", {
                content: content.trim(),
                images: images.length > 0 ? images : null,
                poll: isPoll ? { options: pollOptions.filter(o => o.trim() !== "") } : null,
                language: "en"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setContent("");
            setImages([]);
            setIsPoll(false);
            setPollOptions(["", ""]);
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
            padding: isMobile ? "24px 16px" : "24px 40px",
            borderBottom: "0.7px solid var(--border-hairline)",
            backgroundColor: "var(--bg-page)",
            display: "flex",
            gap: "24px",
        }}>
            <img
                src={avatarUrl}
                alt="Profile"
                style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "2px",
                    objectFit: "cover",
                    border: "0.5px solid var(--border-hairline)"
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "20px" }}>
                    {isPoll && (
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                            Question
                        </div>
                    )}
                    <MentionInput
                        value={content}
                        onChange={setContent}
                        placeholder={isPoll ? "Ask a question..." : placeholderText}
                        minHeight="40px"
                        transparent={true}
                    />
                    
                    {/* Hashtags Preview */}
                    {(() => {
                        const hashtagRegex = /#(\w+)/g;
                        const hashtags = content.match(hashtagRegex);
                        if (hashtags && hashtags.length > 0) {
                            return (
                                <div style={{ 
                                    display: "flex", 
                                    flexWrap: "wrap", 
                                    gap: "8px", 
                                    marginTop: "12px",
                                    padding: "4px 0"
                                }}>
                                    {[...new Set(hashtags)].map((tag, i) => (
                                        <span 
                                            key={i} 
                                            style={{ 
                                                fontSize: "11px", 
                                                fontWeight: 700, 
                                                color: "var(--text-primary)", 
                                                backgroundColor: "var(--bg-hover)",
                                                padding: "4px 10px",
                                                borderRadius: "2px",
                                                fontFamily: "var(--font-mono)",
                                                border: "0.5px solid var(--border-hairline)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em"
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            );
                        }
                        return null;
                    })()}
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
                        gap: "10px",
                        marginBottom: "16px",
                        borderRadius: "2px",
                        overflow: "hidden",
                        border: "0.5px solid var(--border-hairline)"
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
                                        right: "9px",
                                        backgroundColor: "#000",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        borderRadius: "2px",
                                        width: "22px",
                                        height: "22px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 100,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                        padding: 0,
                                        transition: "all 0.15s var(--ease-smooth)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#333";
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#000";
                                        e.currentTarget.style.transform = "scale(1)";
                                    }}
                                >
                                    <div style={{ position: "relative", width: "10px", height: "10px" }}>
                                        <div style={{ position: "absolute", top: "50%", left: "0", width: "100%", height: "1.5px", backgroundColor: "#fff", transform: "rotate(45deg)", borderRadius: "1px" }} />
                                        <div style={{ position: "absolute", top: "50%", left: "0", width: "100%", height: "1.5px", backgroundColor: "#fff", transform: "rotate(-45deg)", borderRadius: "1px" }} />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {isPoll && (
                    <div style={{
                        marginTop: "12px",
                        marginBottom: "20px",
                        padding: "20px",
                        backgroundColor: "var(--bg-hover)",
                        border: "0.5px solid var(--border-hairline)",
                        borderRadius: "2px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Poll Options</span>
                            <button 
                                onClick={() => setIsPoll(false)}
                                style={{ 
                                    background: "none", 
                                    border: "0.5px solid var(--border-hairline)", 
                                    color: "var(--text-tertiary)", 
                                    cursor: "pointer", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    padding: "6px",
                                    borderRadius: "2px",
                                    transition: "all 0.15s var(--ease-smooth)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-page)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                    e.currentTarget.style.borderColor = "var(--text-primary)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "var(--text-tertiary)";
                                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                                }}
                            >
                                <div style={{ position: "relative", width: "10px", height: "10px" }}>
                                    <div style={{ position: "absolute", top: "50%", left: "0", width: "100%", height: "1.2px", backgroundColor: "currentColor", transform: "rotate(45deg)", borderRadius: "1px" }} />
                                    <div style={{ position: "absolute", top: "50%", left: "0", width: "100%", height: "1.2px", backgroundColor: "currentColor", transform: "rotate(-45deg)", borderRadius: "1px" }} />
                                </div>
                            </button>
                        </div>
                        {pollOptions.map((option, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                    value={option}
                                    onChange={(e) => updatePollOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    maxLength={30}
                                    style={{
                                        flex: 1,
                                        padding: "10px 14px",
                                        backgroundColor: "var(--bg-page)",
                                        border: "0.5px solid var(--border-hairline)",
                                        color: "var(--text-primary)",
                                        fontSize: "13px",
                                        fontFamily: "var(--font-mono)",
                                        outline: "none",
                                        borderRadius: "1px"
                                    }}
                                />
                                {pollOptions.length > 2 && (
                                    <button 
                                        onClick={() => removePollOption(index)}
                                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "4px" }}
                                    >
                                        <MinusCircle size={20} weight="thin" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {pollOptions.length < 4 && (
                            <button
                                onClick={addPollOption}
                                style={{
                                    alignSelf: "flex-start",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    marginTop: "4px",
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase"
                                }}
                            >
                                <PlusCircle size={18} weight="thin" />
                                Add Option
                            </button>
                        )}
                    </div>
                )}

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "20px",
                    borderTop: (content.length > 0 || images.length > 0 || isPoll) ? "0.5px solid var(--border-hairline)" : "none"
                }}>
                    <div style={{ display: "flex", gap: "10px", color: "var(--text-tertiary)" }}>
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
                                borderRadius: "2px",
                                transition: "all 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
                        >
                            <ImageIcon size={22} weight="thin" />
                        </button>
                        <button
                            onClick={() => setIsPoll(!isPoll)}
                            style={{
                                background: isPoll ? "var(--bg-hover)" : "none",
                                border: "none",
                                color: isPoll ? "var(--text-primary)" : "inherit",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "2px",
                                transition: "all 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                            onMouseLeave={e => !isPoll && (e.currentTarget.style.color = "var(--text-tertiary)")}
                            title="Add Poll"
                        >
                            <ListPlus size={22} weight="thin" />
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <span style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            color: content.length > charLimit ? "#ef4444" : "var(--text-tertiary)",
                            opacity: content.length > 0 ? 1 : 0,
                            transition: "opacity 0.2s",
                            fontWeight: 700,
                            letterSpacing: "0.05em"
                        }}>
                            {content.length.toString().padStart(3, '0')} / {charLimit}
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && images.length === 0 && !isPoll) || isSubmitting || content.length > charLimit}
                            style={{
                                padding: "8px 24px",
                                backgroundColor: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "var(--text-primary)" : "transparent",
                                color: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "1.50px solid var(--border-hairline)",
                                borderRadius: "2px",
                                fontWeight: 800,
                                fontSize: "11px",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                cursor: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "pointer" : "not-allowed",
                                transition: "all 0.15s ease"
                            }}
                        >
                            {isSubmitting ? "WAIT..." : "POST"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
