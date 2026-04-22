import { useState, useRef, useMemo, useEffect } from "react";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ImageAdd01Icon,
    AppleReminderIcon,
    SourceCodeIcon,
    FileAddIcon,
    Cancel01Icon,
    WorkIcon,
    UserQuestion01Icon,
    ConfusedIcon,
    AddCircleIcon,
    MinusPlusCircle01Icon,
    ArrowDown01Icon,
    ReloadIcon,
    Attachment01Icon,
    Rocket01Icon
} from "@hugeicons/core-free-icons";
import MentionInput from "./MentionInput";
import LinkPreview from "./LinkPreview";
import { validateImageSize, validateFileSize } from "../constants/upload";
import AvailabilityBadge from "./AvailabilityBadge";
import { compressImage } from "../utils/image";
import { useActivityBroadcast } from "../hooks/useActivityBroadcast";
import { useUserProjects } from "../hooks/useUserProjects";

interface FeedPostComposerProps {
    onCreated: () => void;
}

export default function FeedPostComposer({ onCreated }: FeedPostComposerProps) {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const [content, setContent] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; data: string }[]>([]);
    const [codeSnippet, setCodeSnippet] = useState("");
    const [isCodeExpanded, setIsCodeExpanded] = useState(false);
    const [isPoll, setIsPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
    const [postType, setPostType] = useState("Update");
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const typeMenuRef = useRef<HTMLDivElement>(null);
    const projectMenuRef = useRef<HTMLDivElement>(null);
    const { getToken, isLoaded } = useClerkAuth();
    const { user, isSignedIn } = useClerkUser();
    const [isOG, setIsOG] = useState(false);
    const { announce } = useActivityBroadcast();
    const { projects: userProjects } = useUserProjects(user?.id || null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
                setIsTypeMenuOpen(false);
            }
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
                setIsProjectMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedProject = userProjects.find((p: any) => p.id === selectedProjectId);

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

    const charLimit = 2000;

    const placeholderText = useMemo(() => {
        const textOptions = [
            "Share a messy screenshot of your current project...",
            "What's one thing that broke today?",
            "Messy progress > perfect silence. What are you building?",
            "How many cups of coffee did it take to fix that bug?",
            "Be honest: did you actually write tests for that?",
            "Explain your project to us like we're 5 years old.",
            "Which documentation are you currently crying over?",
            "Working on something raw? Show us the 'before' pic.",
            "What's the lie of the day: 'It works on my machine'?",
            "Found a library that changed your life? Drop the name.",
            "Still fighting with CSS? We've all been there.",
            "Don't be shy, show us that 'spaghetti code' you're refactoring."
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
        e.target.value = "";
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const maxImages = 4;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (!file) continue;

                if (images.length >= maxImages) {
                    alert(`You can upload a maximum of ${maxImages} images`);
                    return;
                }

                const sizeError = validateImageSize(file);
                if (sizeError) {
                    alert(sizeError);
                    continue;
                }

                try {
                    const compressedBase64 = await compressImage(file, 1000, 1000, 0.6);
                    setImages((prev) => [...prev, compressedBase64]);
                } catch (error) {
                    console.error("Paste compression error:", error);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImages((prev) => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (attachments.length >= 1) {
            alert("You can only upload one file per post");
            return;
        }

        const file = files[0];
        const sizeError = validateFileSize(file);
        if (sizeError) {
            alert(sizeError);
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachments([{
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result as string
            }]);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
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
        if ((!content.trim() && images.length === 0 && !isPoll && !codeSnippet.trim()) || isSubmitting || !isLoaded) return;

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

            const postData = {
                content: content.trim(),
                images: images,
                attachments: attachments,
                post_type: postType,
                code_snippet: codeSnippet.trim() || null,
                poll: isPoll ? { options: pollOptions.filter(o => o.trim()) } : null,
                project_id: selectedProjectId
            };

            const res = await api.post("/posts", postData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setContent("");
            setImages([]);
            setAttachments([]);
            setCodeSnippet("");
            setIsCodeExpanded(false);
            setIsPoll(false);
            setPollOptions(["", ""]);
            setSelectedProjectId(null);
            window.dispatchEvent(new CustomEvent("postCreated", { detail: res.data }));
            onCreated();
        } catch (error) {
            console.error("Failed to post:", error);
            alert("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isSignedIn || isMobile) return null;

    return (
        <div
            style={{
                padding: "var(--post-padding, 20px 16px)",
                backgroundColor: "transparent",
                display: "flex",
                gap: "16px",
                position: "relative",
                zIndex: isTypeMenuOpen ? 2000 : 1
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
                    borderRadius: "12px",
                    border: "1px solid var(--border-hairline)",
                    backgroundColor: "transparent",
                    opacity: 0.6,
                    pointerEvents: "none",
                    zIndex: 0
                }} />
            )}

            <div style={{ position: "relative", zIndex: 1, paddingTop: "4px" }}> {/* Lift avatar above guard and align with input */}
                <AvailabilityBadge
                    avatarUrl={avatarUrl}
                    name={user?.fullName || user?.username || "User"}
                    size={40}
                    username={user?.username}
                    isOG={isOG}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: "16px" }}>
                    {isPoll && (
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "8px" }}>
                            Question
                        </div>
                    )}
                    <div onPaste={handlePaste}>
                        <MentionInput
                            value={content}
                            onChange={setContent}
                            placeholder={isPoll ? "Ask a question..." : placeholderText}
                            minHeight="60px"
                            transparent={true}
                        />
                    </div>

                    {isCodeExpanded && (
                        <div style={{
                            marginTop: "12px",
                            backgroundColor: "var(--bg-hover)",
                            border: "0.5px solid var(--border-hairline)",
                            borderRadius: "12px",
                            overflow: "hidden",
                            animation: "reactionFadeUp 0.15s ease-out"
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 16px",
                                borderBottom: "0.5px solid var(--border-hairline)",
                                backgroundColor: "rgba(0,0,0,0.03)"
                            }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Code snippet</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: codeSnippet.length > 2000 ? "#ef4444" : "var(--text-tertiary)" }}>
                                        {codeSnippet.length}/2000
                                    </span>
                                    <button
                                        onClick={() => { setIsCodeExpanded(false); setCodeSnippet(""); }}
                                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={codeSnippet}
                                onChange={(e) => setCodeSnippet(e.target.value)}
                                placeholder="Paste your code here..."
                                style={{
                                    width: "100%",
                                    minHeight: "150px",
                                    padding: "16px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "13.5px",
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                                    lineHeight: "1.6",
                                    resize: "vertical"
                                }}
                            />
                        </div>
                    )}

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
                                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {attachments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    backgroundColor: "var(--bg-hover)",
                                    borderRadius: "var(--radius-sm)",
                                    border: "0.5px solid var(--border-hairline)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                    <HugeiconsIcon icon={Attachment01Icon} size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {file.name}
                                        </span>
                                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeAttachment(index)}
                                    style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "4px" }}
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
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
                                    border: "none",
                                    color: "var(--text-tertiary)",
                                    cursor: "pointer",
                                    padding: 0
                                }}
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={18} />
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
                                        <HugeiconsIcon icon={MinusPlusCircle01Icon} size={20} />
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
                                <HugeiconsIcon icon={AddCircleIcon} size={18} />
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
                    <div style={{ display: "flex", gap: "4px", color: "var(--text-tertiary)", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
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
                                color: "var(--text-tertiary)",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "8px",
                                transition: "all 0.15s var(--ease-smooth)",
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
                            <HugeiconsIcon icon={ImageAdd01Icon} size={20} />
                        </button>
                        <button
                            onClick={() => setIsPoll(!isPoll)}
                            style={{
                                background: isPoll ? "var(--bg-hover)" : "none",
                                border: "none",
                                color: isPoll ? "var(--text-primary)" : "var(--text-tertiary)",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "8px",
                                transition: "all 0.15s var(--ease-smooth)",
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
                            <HugeiconsIcon icon={AppleReminderIcon} size={20} />
                        </button>

                        <button
                            onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                            style={{
                                background: isCodeExpanded ? "var(--bg-hover)" : "none",
                                border: "none",
                                color: isCodeExpanded ? "var(--text-primary)" : "var(--text-tertiary)",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "8px",
                                transition: "all 0.15s var(--ease-smooth)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = "var(--text-primary)";
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            }}
                            onMouseLeave={e => {
                                if (!isCodeExpanded) {
                                    e.currentTarget.style.color = "var(--text-tertiary)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }}
                            title="Add Code Snippet"
                        >
                            <HugeiconsIcon icon={SourceCodeIcon} size={20} />
                        </button>

                        <input
                            type="file"
                            multiple
                            ref={attachmentInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                        />
                        {attachments.length === 0 && (
                            <button
                                onClick={() => attachmentInputRef.current?.click()}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-tertiary)",
                                    cursor: "pointer",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    transition: "all 0.15s var(--ease-smooth)",
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
                                title="Attach File"
                            >
                                <HugeiconsIcon icon={FileAddIcon} size={20} />
                            </button>
                        )}



                        {/* Action Group: Selectors */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                            {/* Post Type Selector */}
                            <div style={{ position: "relative" }} ref={typeMenuRef}>
                                <button
                                    onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "4px 12px",
                                        borderRadius: "100px",
                                        border: postType !== "Update" ? `1px solid ${postType === "WIP" ? "#d97706" : postType === "Stuck" ? "#dc2626" : "#7c3aed"}40` : "1px solid var(--border-light)",
                                        backgroundColor: isTypeMenuOpen ? "var(--bg-hover)" : postType !== "Update" ? "var(--bg-page)" : "transparent",
                                        color: "var(--text-primary)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                                        height: "30px",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = isTypeMenuOpen ? "var(--bg-hover)" : postType !== "Update" ? "var(--bg-page)" : "transparent";
                                        e.currentTarget.style.transform = "none";
                                    }}
                                >
                                    <span style={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: postType === "Update" ? "var(--text-secondary)" :
                                            postType === "WIP" ? "#d97706" :
                                                postType === "Stuck" ? "#dc2626" :
                                                    "#7c3aed"
                                    }}>
                                        {postType === "Update" && <HugeiconsIcon icon={ReloadIcon} size={13} />}
                                        {postType === "WIP" && <HugeiconsIcon icon={WorkIcon} size={13} />}
                                        {postType === "Stuck" && <HugeiconsIcon icon={UserQuestion01Icon} size={13} />}
                                        {postType === "Advice" && <HugeiconsIcon icon={ConfusedIcon} size={13} />}
                                    </span>
                                    <span style={{ opacity: 0.9 }}>{postType}</span>
                                    <HugeiconsIcon icon={ArrowDown01Icon} size={11} style={{
                                        opacity: 0.4,
                                        transform: isTypeMenuOpen ? "rotate(-180deg)" : "none",
                                        transition: "transform 0.2s ease"
                                    }} />
                                </button>

                                {isTypeMenuOpen && (
                                    <div style={{
                                        position: "absolute",
                                        top: "calc(100% + 8px)",
                                        left: 0,
                                        width: "160px",
                                        backgroundColor: "var(--bg-card)",
                                        border: "1px solid var(--border-light)",
                                        borderRadius: "14px",
                                        boxShadow: "var(--shadow-lg)",
                                        padding: "6px",
                                        zIndex: 1000,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "2px",
                                        animation: "fadeIn 0.15s ease-out"
                                    }}>
                                        {[
                                            { label: "Update", icon: <HugeiconsIcon icon={ReloadIcon} size={16} />, color: "var(--text-tertiary)" },
                                            { label: "WIP", icon: <HugeiconsIcon icon={WorkIcon} size={16} />, color: "#ffaa00" },
                                            { label: "Stuck", icon: <HugeiconsIcon icon={UserQuestion01Icon} size={16} />, color: "#ff4d4f" },
                                            { label: "Advice", icon: <HugeiconsIcon icon={ConfusedIcon} size={16} />, color: "#a855f7" }
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
                                                    borderRadius: "10px",
                                                    border: "none",
                                                    backgroundColor: postType === type.label ? "var(--bg-hover)" : "transparent",
                                                    color: postType === type.label ? "var(--text-primary)" : "var(--text-secondary)",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    transition: "all 0.1s ease",
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
                                                <span style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    color: type.color,
                                                    opacity: postType === type.label ? 1 : 0.7
                                                }}>{type.icon}</span>
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Project Selector (Hidden for now) */}
                            <div style={{ position: "relative", display: "none" }} ref={projectMenuRef}>
                                <button
                                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "4px 12px",
                                        borderRadius: "100px",
                                        border: selectedProjectId ? "1px solid var(--border-light)" : "1px solid var(--border-light)",
                                        backgroundColor: isProjectMenuOpen ? "var(--bg-hover)" : selectedProjectId ? "var(--bg-page)" : "transparent",
                                        color: selectedProjectId ? "var(--text-primary)" : "var(--text-secondary)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                                        maxWidth: "180px",
                                        height: "30px",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = isProjectMenuOpen ? "var(--bg-hover)" : selectedProjectId ? "var(--bg-page)" : "transparent";
                                        e.currentTarget.style.transform = "none";
                                    }}
                                >

                                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.9 }}>
                                        {selectedProject ? selectedProject.name.split(' ')[0] : "Project"}
                                    </span>
                                    <HugeiconsIcon icon={ArrowDown01Icon} size={11} style={{
                                        opacity: 0.4,
                                        transform: isProjectMenuOpen ? "rotate(-180deg)" : "none",
                                        transition: "transform 0.2s ease"
                                    }} />
                                </button>

                                {isProjectMenuOpen && (
                                    <div style={{
                                        position: "absolute",
                                        top: "calc(100% + 8px)",
                                        left: 0,
                                        width: "220px",
                                        backgroundColor: "var(--bg-card)",
                                        border: "1px solid var(--border-light)",
                                        borderRadius: "12px",
                                        boxShadow: "var(--shadow-md)",
                                        padding: "6px",
                                        zIndex: 1000,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "2px",
                                        maxHeight: "300px",
                                        overflowY: "auto"
                                    }} className="hide-scrollbar">
                                        <button
                                            onClick={() => {
                                                setSelectedProjectId(null);
                                                setIsProjectMenuOpen(false);
                                            }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "8px 12px",
                                                borderRadius: "12px",
                                                border: "none",
                                                backgroundColor: !selectedProjectId ? "var(--bg-hover)" : "transparent",
                                                color: !selectedProjectId ? "var(--text-primary)" : "var(--text-secondary)",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                cursor: "pointer",
                                                textAlign: "left",
                                            }}
                                        >
                                            <div style={{ width: "20px", display: "flex", justifyContent: "center" }}>
                                                <HugeiconsIcon icon={MinusPlusCircle01Icon} size={14} />
                                            </div>
                                            None
                                        </button>
                                        <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "4px 8px" }} />
                                        {userProjects.map((project: any) => (
                                            <button
                                                key={project.id}
                                                onClick={() => {
                                                    setSelectedProjectId(project.id);
                                                    setIsProjectMenuOpen(false);
                                                }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    padding: "8px 12px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: selectedProjectId === project.id ? "var(--bg-hover)" : "transparent",
                                                    color: selectedProjectId === project.id ? "var(--text-primary)" : "var(--text-secondary)",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    transition: "all 0.15s ease",
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                                onMouseLeave={e => {
                                                    if (selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = "transparent";
                                                }}
                                            >
                                                <div style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "6px",
                                                    backgroundColor: "var(--bg-hover)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "10px",
                                                    overflow: "hidden",
                                                    flexShrink: 0
                                                }}>
                                                    {project.cover_image ? <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <HugeiconsIcon icon={Rocket01Icon} size={12} />}
                                                </div>
                                                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: selectedProjectId === project.id ? 600 : 500 }}>{project.name}</span>
                                            </button>
                                        ))}
                                        {userProjects.length === 0 && (
                                            <div style={{ padding: "16px 12px", fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center" }}>
                                                No active projects found.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                            fontSize: "12px",
                            color: content.length > charLimit ? "#ef4444" : "var(--text-tertiary)",
                            opacity: content.length > (charLimit * 0.8) ? 1 : 0,
                            transition: "opacity 0.2s",
                            fontWeight: 600,
                        }}>
                            {charLimit - content.length}
                        </span>

                        <button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && images.length === 0 && attachments.length === 0 && !isPoll && !codeSnippet.trim()) || isSubmitting || content.length > charLimit || codeSnippet.length > 2000}
                            style={{
                                padding: isMobile ? "8px 16px" : "8px 20px",
                                backgroundColor: (content.trim() || images.length > 0 || attachments.length > 0 || isPoll || codeSnippet.trim()) && !isSubmitting && content.length <= charLimit && codeSnippet.length <= 2000 ? "var(--text-primary)" : "var(--bg-hover)",
                                color: (content.trim() || images.length > 0 || attachments.length > 0 || isPoll || codeSnippet.trim()) && !isSubmitting && content.length <= charLimit && codeSnippet.length <= 2000 ? "var(--bg-page)" : "var(--text-tertiary)",
                                border: "none",
                                borderRadius: "100px",
                                fontWeight: "800",
                                fontSize: "14px",
                                cursor: (content.trim() || images.length > 0 || attachments.length > 0 || isPoll || codeSnippet.trim()) && !isSubmitting && content.length <= charLimit && codeSnippet.length <= 2000 ? "pointer" : "not-allowed",
                                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                                transform: isSubmitting ? "scale(0.98)" : "scale(1)",
                                opacity: isSubmitting ? 0.8 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if ((content.trim() || images.length > 0 || isPoll || codeSnippet.trim()) && !isSubmitting && codeSnippet.length <= 2000 && content.length <= charLimit) {
                                    e.currentTarget.style.filter = "brightness(0.9)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "none";
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
