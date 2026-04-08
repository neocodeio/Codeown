import { useState, useRef, useMemo, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import { useWindowSize } from "../hooks/useWindowSize";
import { Image as ImageIcon, ListPlus, PlusCircle, MinusCircle, CaretDown, ArrowsClockwise, Bug, Sparkle, Trophy, Question, Lightbulb } from "phosphor-react";
import MentionInput from "./MentionInput";
import LinkPreview from "./LinkPreview";
import { validateImageSize } from "../constants/upload";
import AvailabilityBadge from "./AvailabilityBadge";
import { compressImage } from "../utils/image";
import { useActivityBroadcast } from "../hooks/useActivityBroadcast";

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
    const [postType, setPostType] = useState("Update");
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typeMenuRef = useRef<HTMLDivElement>(null);
    const { getToken, isLoaded } = useClerkAuth();
    const { user, isSignedIn } = useClerkUser();
    const [isOG, setIsOG] = useState(false);
    const { announce } = useActivityBroadcast();

    useEffect(() => {
        if (content.trim()) announce("posting");
    }, [content, announce]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (isSignedIn && user?.id) {
                try {
                    const token = await getToken();
                    const res = await api.get(`/users/${user.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data) {
                        setIsOG(res.data.is_og || false);
                    }
                } catch (err) {
                    console.error("Failed to fetch user data in composer", err);
                }
            }
        };
        fetchUserData();
    }, [isSignedIn, user?.id, getToken]);

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
                setIsTypeMenuOpen(false);
            }
        };
        if (isTypeMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isTypeMenuOpen]);

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
                language: "en",
                post_type: postType
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Celebration removed as per user request
            
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
        <div 
            style={{
                padding: "var(--post-padding, 24px)",
                borderBottom: "0.5px solid var(--border-hairline)",
                backgroundColor: "var(--bg-page)",
                display: "flex",
                gap: "16px",
                position: "relative",
                zIndex: isTypeMenuOpen ? 2000 : 1 // Ensure it sits above feed posts when menu is open
            }}
        >
            {/* OG Presence Guard - Vertical Pill anchor */}
            {isOG && (
                <div style={{
                    position: "absolute",
                    top: "12px",
                    left: isMobile ? "5px" : "32px",
                    // width: "56px",
                    // height: "calc(100% - 24px)",
                    borderRadius: "100px",
                    border: "1px solid var(--border-hairline)",
                    backgroundColor: "transparent",
                    opacity: 0.6,
                    pointerEvents: "none",
                    zIndex: 0
                }} />
            )}

            <div style={{ position: "relative", zIndex: 1 }}> {/* Lift avatar above guard */}
                <AvailabilityBadge
                    avatarUrl={avatarUrl}
                    name={user?.fullName || user?.username || "User"}
                    size={40}
                    username={user?.username}
                    isOG={isOG}
                />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "16px" }}>
                    {isPoll && (
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                            Question
                        </div>
                    )}
                    <MentionInput
                        value={content}
                        onChange={setContent}
                        placeholder={isPoll ? "Ask a question..." : placeholderText}
                        minHeight="60px"
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
                                    gap: "6px", 
                                    marginTop: "12px",
                                }}>
                                    {[...new Set(hashtags)].map((tag, i) => (
                                        <span 
                                            key={i} 
                                            style={{ 
                                                fontSize: "12px", 
                                                fontWeight: 500, 
                                                color: "var(--text-primary)", 
                                                backgroundColor: "var(--bg-hover)",
                                                padding: "4px 10px",
                                                borderRadius: "100px",
                                                border: "0.5px solid var(--border-hairline)",
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
                        borderRadius: "var(--radius-md)",
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
                                        right: "8px",
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        backdropFilter: "blur(4px)",
                                        border: "none",
                                        borderRadius: "100px",
                                        width: "28px",
                                        height: "28px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 100,
                                        color: "#fff",
                                        padding: 0,
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.8)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)";
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {isPoll && (
                    <div style={{
                        marginTop: "12px",
                        marginBottom: "20px",
                        padding: "16px",
                        backgroundColor: "var(--bg-hover)",
                        border: "0.5px solid var(--border-hairline)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)" }}>Poll options</span>
                            <button 
                                onClick={() => setIsPoll(false)}
                                style={{ 
                                    background: "none", 
                                    border: "1px solid var(--text-primary)", 
                                    color: "var(--text-primary)", 
                                    cursor: "pointer", 
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    borderRadius: "50%",
                                    width: "20px",
                                    height: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0
                                }}
                            >
                                X
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
                                        fontSize: "14px",
                                        outline: "none",
                                        borderRadius: "var(--radius-sm)"
                                    }}
                                />
                                {pollOptions.length > 2 && (
                                    <button 
                                        onClick={() => removePollOption(index)}
                                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "4px" }}
                                    >
                                        <MinusCircle size={20} />
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
                                    gap: "6px",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    marginTop: "4px",
                                }}
                            >
                                <PlusCircle size={18} />
                                Add option
                            </button>
                        )}
                    </div>
                )}


                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "16px",
                    borderTop: (content.length > 0 || images.length > 0 || isPoll) ? "0.5px solid var(--border-hairline)" : "none",
                    gap: "12px",
                }}>
                    <div style={{ display: "flex", gap: "10px", color: "var(--text-tertiary)", alignItems: "center" }}>
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
                                borderRadius: "100px",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = "var(--text-primary)";
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = "var(--text-tertiary)";
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            <ImageIcon size={20} weight="regular" />
                        </button>
                        <button
                            onClick={() => setIsPoll(!isPoll)}
                            style={{
                                background: isPoll ? "var(--bg-hover)" : "none",
                                border: "none",
                                color: isPoll ? "var(--text-primary)" : "inherit",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "100px",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = "var(--text-primary)";
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            }}
                            onMouseLeave={e => {
                                if (!isPoll) {
                                    e.currentTarget.style.color = "var(--text-tertiary)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }}
                            title="Add Poll"
                        >
                            <ListPlus size={20} weight="regular" />
                        </button>

                        <div style={{ height: "16px", width: "1px", backgroundColor: "var(--border-hairline)", margin: "0 4px", opacity: 0.5 }} />

                        {/* Post Type Dropdown */}
                        <div style={{ position: "relative" }} ref={typeMenuRef}>
                            <button
                                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: isMobile ? "5px 10px" : "5px 12px",
                                    borderRadius: "100px",
                                    border: "0.5px solid var(--border-hairline)",
                                    backgroundColor: isTypeMenuOpen ? "var(--bg-hover)" : "transparent",
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                onMouseLeave={e => {
                                    if (!isTypeMenuOpen) e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", color: "var(--text-tertiary)" }}>
                                    {postType === "Update" && <ArrowsClockwise size={14} weight="bold" />}
                                    {postType === "Bug" && <Bug size={14} weight="bold" />}
                                    {postType === "Vibe" && <Sparkle size={14} weight="bold" />}
                                    {postType === "Milestone" && <Trophy size={14} weight="bold" />}
                                    {postType === "Question" && <Question size={14} weight="bold" />}
                                    {postType === "Idea" && <Lightbulb size={14} weight="bold" />}
                                </span>
                                <span style={{ textTransform: "uppercase", letterSpacing: "0.02em", fontSize: "10px", lineHeight: 1 }}>{postType}</span>
                                <CaretDown size={10} weight="bold" style={{ opacity: 0.6 }} />
                            </button>

                            {isTypeMenuOpen && (
                                <div style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    left: 0,
                                    width: "160px",
                                    backgroundColor: "var(--bg-card)",
                                    border: "0.5px solid var(--border-hairline)",
                                    borderRadius: "12px",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                    padding: "6px",
                                    zIndex: 1000,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px"
                                }}>
                                    {[
                                        { label: "Update", icon: <ArrowsClockwise size={16} /> },
                                        { label: "Bug", icon: <Bug size={16} /> },
                                        { label: "Vibe", icon: <Sparkle size={16} /> },
                                        { label: "Milestone", icon: <Trophy size={16} /> },
                                        { label: "Question", icon: <Question size={16} /> },
                                        { label: "Idea", icon: <Lightbulb size={16} /> }
                                    ].map((type) => (
                                        <button
                                            key={type.label}
                                            onClick={() => {
                                                setPostType(type.label);
                                                setIsTypeMenuOpen(false);
                                            }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                border: "none",
                                                backgroundColor: postType === type.label ? "var(--bg-hover)" : "transparent",
                                                color: postType === type.label ? "var(--text-primary)" : "var(--text-secondary)",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                cursor: "pointer",
                                                textAlign: "left",
                                                transition: "all 0.15s"
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                                e.currentTarget.style.color = "var(--text-primary)";
                                            }}
                                            onMouseLeave={e => {
                                                if (postType !== type.label) {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                    e.currentTarget.style.color = "var(--text-secondary)";
                                                }
                                            }}
                                        >
                                            <span style={{ color: "var(--text-tertiary)" }}>{type.icon}</span>
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{
                            fontSize: "12px",
                            color: content.length > charLimit ? "#ef4444" : "var(--text-tertiary)",
                            opacity: content.length > (charLimit * 0.8) ? 1 : 0,
                            transition: "opacity 0.2s",
                            fontWeight: 500,
                        }}>
                            {charLimit - content.length}
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && images.length === 0 && !isPoll) || isSubmitting || content.length > charLimit}
                            style={{
                                padding: isMobile ? "8px 18px" : "10px 24px",
                                backgroundColor: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "var(--text-primary)" : "var(--bg-hover)",
                                color: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "none",
                                borderRadius: "100px",
                                fontWeight: "700",
                                fontSize: "14px",
                                cursor: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "pointer" : "not-allowed",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform: isSubmitting ? "scale(0.98)" : "scale(1)",
                                opacity: isSubmitting ? 0.8 : 1,
                                boxShadow: (content.trim() || images.length > 0 || isPoll) && !isSubmitting && content.length <= charLimit ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
                            }}
                            onMouseEnter={(e) => {
                                if ((content.trim() || images.length > 0 || isPoll) && !isSubmitting) {
                                    e.currentTarget.style.filter = "brightness(0.9)";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            {isSubmitting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
