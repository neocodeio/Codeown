import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentRenderer from "./ContentRenderer";
import MentionInput from "./MentionInput";
import { useCommentLikes } from "../hooks/useCommentLikes";
import { useClerkUser } from "../hooks/useClerkUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faHeart as faHeartRegular, faXmark, faImage } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import { Gif, ChatCircle } from "phosphor-react";
import GifPicker from "./GifPicker";
import RollingNumber from "./RollingNumber";

export interface CommentWithMeta {
  id: number | string;
  post_id?: number;
  content: string;
  user_id: string;
  created_at: string;
  parent_id?: number | string | null;
  parent_author_name?: string | null;
  like_count?: number;
  reply_count?: number;
  image_url?: string | null;
  user?: { name: string; username?: string | null; email: string | null; avatar_url?: string | null; is_pro?: boolean };
  children?: CommentWithMeta[];
}

interface CommentBlockProps {
  comment: CommentWithMeta;
  depth: number;
  onReply: (parentId: number | string, content: string, image_url?: string | null) => Promise<void>;
  onDelete?: (commentId: number | string) => void | Promise<void>;
  onImageClick?: (url: string) => void;
  resourceType: "post" | "project";
  isDetailView?: boolean;
}

export default function CommentBlock({ comment, depth, onReply, onDelete, onImageClick, resourceType, isDetailView }: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { isLiked, likeCount, loading: likeLoading, toggleLike } = useCommentLikes(comment.id, resourceType, undefined, comment.like_count);
  const { isSignedIn, user } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const avatarSize = isMobile ? 32 : 44;
  const gap = isMobile ? 12 : 16;
  const horizontalPadding = isMobile ? 16 : 24;

  // Reply count: from API (reply_count) or from children array length
  const replyCount = comment.reply_count ?? (comment.children?.length || 0);

  const name = comment.user?.name || "User";
  const avatarUrl = comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=212121&color=ffffff&bold=true`;

  const handleReplySubmit = async () => {
    if (!replyContent.trim() && !selectedGif && !selectedImage) return;
    setSubmitting(true);
    try {
      const finalContent = selectedGif ? `${replyContent.trim()} ${selectedGif}`.trim() : replyContent.trim();
      await onReply(comment.id, finalContent, selectedImage);
      setReplyContent("");
      setSelectedGif(null);
      setSelectedImage(null);
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setSelectedImage(reader.result as string); setIsUploading(false); };
    reader.readAsDataURL(file);
  };

  // Navigate to comment detail (drill-down) when clicking the comment body
  const handleDrillDown = () => {
    navigate(`/comment/${comment.id}`);
  };

  return (
    <div style={{
      paddingTop: depth === 0 ? (isDetailView ? "32px" : "24px") : "12px",
      paddingBottom: "12px",
      paddingLeft: depth === 0 ? horizontalPadding : 0,
      paddingRight: depth === 0 ? horizontalPadding : 0,
      position: "relative"
    }}>
      {/* Main Comment Row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: `${gap}px`, position: "relative", zIndex: 2 }}>
        {/* Avatar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (comment.user?.username) navigate(`/${comment.user.username}`);
            else if (comment.user_id) navigate(`/user/${comment.user_id}`);
          }}
          style={{ cursor: "pointer", flexShrink: 0 }}
        >
          <AvailabilityBadge
            avatarUrl={avatarUrl}
            name={name}
            size={avatarSize}
            isOpenToOpportunities={comment.user?.is_pro}
            username={comment.user?.username}
          />
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (comment.user?.username) navigate(`/${comment.user.username}`);
                else if (comment.user_id) navigate(`/user/${comment.user_id}`);
              }}
              style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              {name}
              <VerifiedBadge username={comment.user?.username} size="14px" />
              {comment.user?.is_pro && (
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 8px", borderRadius: "100px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", marginLeft: "4px" }}>Pro</span>
              )}
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 400 }}>
              • {formatRelativeDate(comment.created_at)}
            </span>
          </div>

          {/* Replying-to indicator */}
          {comment.parent_author_name && !isDetailView && (
            <div style={{ fontSize: "12.5px", color: "var(--text-tertiary)", marginBottom: "4px", fontWeight: 500 }}>
              Replying to <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>@{comment.parent_author_name}</span>
            </div>
          )}

          {/* Clickable content area for drill-down */}
          <div
            onClick={handleDrillDown}
            style={{ cursor: "pointer" }}
          >
            <div style={{ fontSize: "15px", lineHeight: "1.5", color: "var(--text-primary)", wordBreak: "break-word", marginBottom: "10px", fontWeight: 400 }}>
              <ContentRenderer content={comment.content} />
              {comment.image_url && (
                <div style={{ marginTop: "10px", borderRadius: "12px", overflow: "hidden", border: "0.5px solid var(--border-hairline)", width: "fit-content", maxWidth: "100%" }}>
                  <img
                    src={comment.image_url}
                    alt=""
                    style={{ maxWidth: "100%", maxHeight: "400px", display: "block", cursor: "zoom-in" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick ? onImageClick(comment.image_url!) : window.open(comment.image_url!, '_blank');
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <button
              onClick={toggleLike}
              disabled={!isSignedIn || likeLoading}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", padding: 0, color: isLiked ? "#ff4b4b" : "var(--text-tertiary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease" }}
            >
              <FontAwesomeIcon icon={isLiked ? faHeartSolid : faHeartRegular} style={{ fontSize: "15px" }} />
              <RollingNumber value={likeCount || 0} fontWeight={500} fontSize="13px" color="inherit" />
              {likeCount === 0 && <span style={{ marginLeft: "-2px" }}>Like</span>}
            </button>

            {/* Reply count indicator — clicking drills down */}
            <button
              onClick={handleDrillDown}
              style={{
                display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", padding: 0,
                color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
            >
              <ChatCircle size={16} weight="bold" />
              {replyCount > 0 && <span>{replyCount}</span>}
            </button>

            {isSignedIn && (
              <button
                onClick={() => setShowReply((s) => !s)}
                style={{ background: "none", border: "none", padding: 0, color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "color 0.15s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
              >
                Reply
              </button>
            )}

            {isSignedIn && (comment.user_id === user?.id) && (
              <button
                onClick={() => onDelete?.(comment.id)}
                style={{ background: "none", border: "none", padding: 0, color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "color 0.15s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#ff4b4b"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
              >
                Delete
              </button>
            )}
          </div>

          {showReply && (
            <div style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "16px",
              border: "0.5px solid var(--border-hairline)",
              position: "relative",
              animation: "replySlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 10
            }}>
              <style>{`
                @keyframes replySlideIn {
                  from { opacity: 0; transform: translateY(-8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              {selectedGif && (
                <div style={{ position: "relative", width: "fit-content", marginBottom: "12px", borderRadius: "12px", overflow: "hidden", border: "0.5px solid var(--border-hairline)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: "160px", display: "block", borderRadius: "8px" }} />
                  <button
                    onClick={() => setSelectedGif(null)}
                    style={{
                      position: "absolute", top: "8px", right: "8px",
                      backgroundColor: "rgba(0,0,0,0.7)", color: "#fff", border: "none",
                      width: "28px", height: "28px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 0.2s ease",
                      backdropFilter: "blur(4px)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#000"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)"}
                  >
                    <FontAwesomeIcon icon={faXmark} style={{ fontSize: "14px" }} />
                  </button>
                </div>
              )}

              {selectedImage && (
                <div style={{ position: "relative", width: "fit-content", marginBottom: "12px", borderRadius: "12px", overflow: "hidden", border: "0.5px solid var(--border-hairline)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  <img src={selectedImage} alt="Selected" style={{ maxHeight: "160px", display: "block", borderRadius: "8px" }} />
                  <button onClick={() => setSelectedImage(null)} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.7)", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              )}

              <div style={{
                backgroundColor: "var(--bg-page)",
                borderRadius: "12px",
                border: "0.5px solid var(--border-hairline)",
                transition: "all 0.2s ease",
                position: "relative",
              }}>
                <MentionInput
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write a reply..."
                  minHeight="100px"
                  style={{
                    fontSize: "14px",
                    backgroundColor: "transparent",
                    border: "none",
                  }}
                />

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderTop: "0.5px solid var(--border-hairline)",
                  backgroundColor: "rgba(0,0,0,0.02)"
                }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                        style={{
                          height: "32px",
                          padding: "0 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent",
                          color: isGifPickerOpen ? "var(--text-primary)" : "var(--text-tertiary)",
                          border: "0.5px solid var(--border-hairline)",
                          borderRadius: "100px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.02em"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                          e.currentTarget.style.borderColor = "var(--text-primary)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isGifPickerOpen) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.borderColor = "var(--border-hairline)";
                            e.currentTarget.style.color = "var(--text-tertiary)";
                          }
                        }}
                      >
                        <Gif size={20} weight={isGifPickerOpen ? "fill" : "bold"} />
                      </button>
                      {isGifPickerOpen && (
                        <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "12px", zIndex: 1000 }}>
                          <GifPicker onSelect={(gifUrl) => { setSelectedGif(gifUrl); setIsGifPickerOpen(false); }} onClose={() => setIsGifPickerOpen(false)} />
                        </div>
                      )}
                    </div>

                    <label style={{
                      height: "32px",
                      padding: "0 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      backgroundColor: "transparent",
                      color: "var(--text-tertiary)",
                      border: "0.5px solid var(--border-hairline)",
                      borderRadius: "100px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontSize: "10px",
                      fontWeight: 800,
                      textTransform: "uppercase"
                    }}>
                      <FontAwesomeIcon icon={faImage} />
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      onClick={() => { setShowReply(false); setReplyContent(""); setSelectedGif(null); }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "transparent",
                        color: "var(--text-tertiary)",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "13px",
                        borderRadius: "100px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={(!replyContent.trim() && !selectedGif && !selectedImage) || submitting || isUploading}
                      style={{
                        padding: "8px 24px",
                        backgroundColor: (replyContent.trim() || selectedGif || selectedImage) && !submitting && !isUploading ? "var(--text-primary)" : "transparent",
                        color: (replyContent.trim() || selectedGif || selectedImage) && !submitting && !isUploading ? "var(--bg-page)" : "var(--text-tertiary)",
                        border: "none",
                        borderRadius: "100px",
                        fontWeight: 700,
                        cursor: (replyContent.trim() || selectedGif || selectedImage) && !submitting && !isUploading ? "pointer" : "not-allowed",
                        fontSize: "13px",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        opacity: (replyContent.trim() || selectedGif || selectedImage) ? 1 : 0.5,
                        transform: submitting ? "scale(0.98)" : "scale(1)",
                        boxShadow: (replyContent.trim() || selectedGif || selectedImage) && !submitting && !isUploading ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
                      }}
                      onMouseEnter={(e) => {
                        if (replyContent.trim() || selectedGif || selectedImage) {
                          e.currentTarget.style.filter = "brightness(0.9)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {submitting ? "Sending..." : isUploading ? "Wait..." : "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NO nested replies rendered inline — drill-down only. 
          The reply count badge in the action bar serves as the cue. */}
    </div>
  );
}
