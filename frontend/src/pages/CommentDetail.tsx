import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import CommentBlock, { type CommentWithMeta } from "../components/CommentBlock";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostDetailSkeleton } from "../components/LoadingSkeleton";
import { toast } from "react-toastify";
import MentionInput from "../components/MentionInput";
import { useAvatar } from "../hooks/useAvatar";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import GifPicker from "../components/GifPicker";
import { Gif } from "phosphor-react";
import { HugeiconsIcon as HIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

export default function CommentDetail() {
    const { commentId } = useParams<{ commentId: string }>();
    const navigate = useNavigate();
    const { getToken } = useClerkAuth();
    const { isSignedIn, user } = useClerkUser();
    const queryClient = useQueryClient();
    const { width } = useWindowSize();
    const isDesktop = width >= 1200;
    const isMobile = width < 768;

    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedGif, setSelectedGif] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<number | string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { avatarUrl: currentUserAvatarUrl } = useAvatar(
        user?.id,
        user?.imageUrl,
        user?.fullName || user?.username || "User"
    );

    // 1. Fetch Comment Detail
    const { data, isLoading, isError } = useQuery({
        queryKey: ["commentDetail", commentId],
        queryFn: async () => {
            const response = await api.get(`/comments/detail/${commentId}`);
            return response.data;
        },
        enabled: !!commentId,
    });

    const comment = data?.comment as CommentWithMeta;
    const replies = data?.replies as CommentWithMeta[];

    const handleSubmitReply = async () => {
        if (!isSignedIn) return;
        if (!replyContent.trim() && !selectedGif && !selectedImage) return;
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const finalContent = selectedGif ? `${replyContent.trim()}\n${selectedGif}`.trim() : replyContent.trim();
            await api.post("/comments", {
                post_id: comment.post_id,
                content: finalContent,
                parent_id: comment.id,
                image_url: selectedImage
            }, { headers: { Authorization: `Bearer ${token}` } });
            setReplyContent("");
            setSelectedGif(null);
            setSelectedImage(null);
            await queryClient.invalidateQueries({ queryKey: ["commentDetail", commentId] });
            toast.success("Reply posted!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to post reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async (parentId: number | string, content: string, image_url?: string | null) => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            await api.post("/comments", {
                post_id: comment.post_id,
                content,
                parent_id: parentId,
                image_url
            }, { headers: { Authorization: `Bearer ${token}` } });
            await queryClient.invalidateQueries({ queryKey: ["commentDetail", commentId] });
            toast.success("Reply posted!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to post reply");
        }
    };

    const handleCommentDelete = async () => {
        if (!isSignedIn || !commentToDelete) return;
        setIsDeleting(true);
        try {
            const token = await getToken();
            await api.delete(`/comments/${commentToDelete}`, { headers: { Authorization: `Bearer ${token}` } });
            if (String(commentToDelete) === String(commentId)) {
                navigate(-1);
            } else {
                await queryClient.invalidateQueries({ queryKey: ["commentDetail", commentId] });
            }
            setCommentToDelete(null);
            toast.success("Comment deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete comment");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    if (isLoading) return (
        <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", width: isDesktop ? "920px" : "100%", maxWidth: "920px", position: "relative" }}>
                <div style={{
                    width: isDesktop ? "620px" : "100%",
                    maxWidth: isDesktop ? "620px" : "700px",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    minHeight: "100vh",
                    margin: isDesktop ? "0" : "0 auto",
                    padding: "20px"
                }}>
                    <PostDetailSkeleton />
                </div>
                {isDesktop && (
                    <aside style={{ width: "300px", position: "sticky", top: 0, alignSelf: "flex-start", flexShrink: 0 }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </div>
    );

    if (isError || !comment) return (
        <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", width: isDesktop ? "920px" : "100%", maxWidth: "920px", position: "relative" }}>
                <div style={{
                    width: isDesktop ? "620px" : "100%",
                    maxWidth: isDesktop ? "620px" : "700px",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    minHeight: "100vh",
                    margin: isDesktop ? "0" : "0 auto",
                    padding: "100px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "24px",
                    textAlign: "center",
                    color: "var(--text-tertiary)"
                }}>
                    <p style={{ margin: 0, fontSize: "16px" }}>Comment not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor: "var(--text-primary)",
                            color: "var(--bg-page)",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                        Go Back
                    </button>
                </div>
                {isDesktop && (
                    <aside style={{ width: "300px", position: "sticky", top: 0, alignSelf: "flex-start", flexShrink: 0 }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </div>
    );

    const userName = comment.user?.name || "User";
    const avatarUrl = comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=212121&color=ffffff&bold=true`;

    return (
        <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
            <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", justifyContent: "center", width: "100%" }}>
                <SEO title={`Comment by ${userName}`} description={comment.content} image={avatarUrl} />

                <div style={{ display: "flex", width: isDesktop ? "920px" : "100%", maxWidth: "920px", position: "relative" }}>
                    <div style={{
                        width: isDesktop ? "620px" : "100%",
                        maxWidth: isDesktop ? "620px" : "700px",
                        backgroundColor: "var(--bg-page)",
                        borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                        borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                        minHeight: "100vh",
                        margin: isDesktop ? "0" : "0 auto",
                        position: "relative"
                    }}>
                        <header style={{
                            position: "sticky", top: 0, backgroundColor: "var(--bg-header)", backdropFilter: "blur(24px)", zIndex: 100,
                            padding: "16px 24px", display: "flex", alignItems: "center", gap: "24px", borderBottom: "0.5px solid var(--border-hairline)"
                        }}>
                            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
                                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                            </button>
                            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Thread</h1>
                        </header>

                        {/* Parent Comment — rendered as detail (isDetailView) */}
                        <CommentBlock
                            comment={comment}
                            depth={0}
                            onReply={handleReply}
                            onDelete={(id) => setCommentToDelete(id)}
                            resourceType="post"
                            isDetailView={true}
                        />

                        {/* Reply Composer — directly under parent */}
                        {isSignedIn && (
                            <div style={{
                                padding: isMobile ? "20px 16px" : "24px 24px",
                                borderBottom: "0.5px solid var(--border-hairline)",
                                display: "flex",
                                gap: "16px",
                                position: "relative",
                                zIndex: isGifPickerOpen ? 1002 : 1
                            }}>
                                <img
                                    src={currentUserAvatarUrl}
                                    alt=""
                                    style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover", border: "1px solid var(--border-hairline)", flexShrink: 0 }}
                                />
                                <div style={{ flex: 1 }}>
                                    {selectedGif && (
                                        <div style={{
                                            position: "relative", width: "fit-content", marginBottom: "12px",
                                            borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)",
                                        }}>
                                            <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: "150px", display: "block" }} />
                                            <button
                                                onClick={() => setSelectedGif(null)}
                                                style={{
                                                    position: "absolute", top: "6px", right: "6px",
                                                    backgroundColor: "rgba(0,0,0,0.75)", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%",
                                                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    )}
                                    {selectedImage && (
                                        <div style={{
                                            position: "relative", width: "fit-content", marginBottom: "12px",
                                            borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)",
                                        }}>
                                            <img src={selectedImage} alt="Selected" style={{ maxHeight: "150px", display: "block" }} />
                                            <button
                                                onClick={() => setSelectedImage(null)}
                                                style={{
                                                    position: "absolute", top: "6px", right: "6px",
                                                    backgroundColor: "rgba(0,0,0,0.75)", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%",
                                                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    )}
                                    <MentionInput
                                        value={replyContent}
                                        onChange={setReplyContent}
                                        placeholder="Post your reply"
                                        transparent={true}
                                        minHeight="40px"
                                    />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <div style={{ position: "relative" }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsGifPickerOpen(!isGifPickerOpen);
                                                    }}
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: "6px", padding: "8px",
                                                        backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent", color: isGifPickerOpen ? "var(--text-primary)" : "var(--text-tertiary)",
                                                        border: "0.5px solid var(--border-hairline)", borderRadius: "100px", cursor: "pointer", fontSize: "11px", fontWeight: 700, textTransform: "uppercase"
                                                    }}
                                                >
                                                    <Gif size={18} weight={isGifPickerOpen ? "fill" : "bold"} />
                                                </button>
                                                {isGifPickerOpen && (
                                                    <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "12px", zIndex: 1001 }}>
                                                        <GifPicker onSelect={(gif) => { setSelectedGif(gif); setIsGifPickerOpen(false); }} onClose={() => setIsGifPickerOpen(false)} />
                                                    </div>
                                                )}
                                            </div>

                                            <label style={{
                                                display: "flex", alignItems: "center", gap: "6px", padding: "8px",
                                                backgroundColor: "transparent", color: "var(--text-tertiary)",
                                                border: "0.5px solid var(--border-hairline)", borderRadius: "100px", cursor: "pointer", fontSize: "11px", fontWeight: 700, textTransform: "uppercase"
                                            }}>
                                                <HIcon icon={Image01Icon} size={18} />
                                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={isUploading} />
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleSubmitReply}
                                            disabled={(!replyContent.trim() && !selectedGif && !selectedImage) || isSubmitting || isUploading}
                                            style={{
                                                padding: "8px 24px",
                                                backgroundColor: (replyContent.trim() || selectedGif || selectedImage) && !isSubmitting && !isUploading ? "var(--text-primary)" : "transparent",
                                                color: (replyContent.trim() || selectedGif || selectedImage) && !isSubmitting && !isUploading ? "var(--bg-page)" : "var(--text-tertiary)",
                                                border: "0.5px solid var(--border-hairline)", borderRadius: "100px", fontWeight: 700, fontSize: "13px",
                                                cursor: (replyContent.trim() || selectedGif || selectedImage) && !isSubmitting && !isUploading ? "pointer" : "not-allowed",
                                            }}
                                        >
                                            {isSubmitting ? "..." : isUploading ? "Wait" : "Reply"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Replies List — flat, each is clickable for further drill-down */}
                        <div style={{ padding: "0 0 100px 0" }}>
                            {replies && replies.length > 0 ? (
                                replies.map(reply => (
                                    <div key={reply.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                                        <CommentBlock
                                            comment={reply}
                                            depth={0}
                                            onReply={handleReply}
                                            onDelete={(id) => setCommentToDelete(id)}
                                            resourceType="post"
                                        />
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-tertiary)", fontSize: "14px" }}>
                                    No replies yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    {isDesktop && (
                        <aside style={{
                            width: "300px",
                            padding: "0",
                            position: "sticky",
                            top: 0,
                            alignSelf: "flex-start",
                            flexShrink: 0,
                        }}>
                            <RecommendedUsersSidebar />
                        </aside>
                    )}
                </div>
            </main>

            <ConfirmDeleteModal
                isOpen={commentToDelete !== null}
                onClose={() => setCommentToDelete(null)}
                onConfirm={handleCommentDelete}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                isLoading={isDeleting}
            />
        </div>
    );
}
