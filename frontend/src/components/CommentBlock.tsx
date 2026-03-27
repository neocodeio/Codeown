import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentRenderer from "./ContentRenderer";
import MentionInput from "./MentionInput";
import { useCommentLikes } from "../hooks/useCommentLikes";
import { useClerkUser } from "../hooks/useClerkUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import { Gif, X } from "phosphor-react";
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
  user?: { name: string; username?: string | null; email: string | null; avatar_url?: string | null; is_pro?: boolean };
  children?: CommentWithMeta[];
}

interface CommentBlockProps {
  comment: CommentWithMeta;
  depth: number;
  onReply: (parentId: number | string, content: string) => Promise<void>;
  onDelete?: (commentId: number | string) => void | Promise<void>;
  resourceType: "post" | "project";
}

export default function CommentBlock({ comment, depth, onReply, onDelete, resourceType }: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const { isLiked, likeCount, loading: likeLoading, toggleLike } = useCommentLikes(comment.id, resourceType, false, comment.like_count);
  const { isSignedIn, user } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const hasChildren = comment.children && comment.children.length > 0;
  const avatarSize = isMobile ? 32 : 44;
  const gap = isMobile ? 12 : 16;
  const horizontalPadding = isMobile ? 16 : 24;

  const name = comment.user?.name || "User";
  const avatarUrl = comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=212121&color=ffffff&bold=true`;

  const handleReplySubmit = async () => {
    if (!replyContent.trim() && !selectedGif) return;
    setSubmitting(true);
    try {
      const finalContent = selectedGif ? `${replyContent.trim()} ${selectedGif}`.trim() : replyContent.trim();
      await onReply(comment.id, finalContent);
      setReplyContent("");
      setSelectedGif(null);
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      paddingTop: depth === 0 ? "24px" : "12px",
      paddingBottom: "12px",
      paddingLeft: depth === 0 ? horizontalPadding : 0,
      paddingRight: depth === 0 ? horizontalPadding : 0,
      position: "relative"
    }}>
      {/* Thread Line for children */}
      {hasChildren && (
        <div style={{
          position: "absolute",
          left: depth === 0 ? (horizontalPadding + avatarSize / 2) : (avatarSize / 2),
          top: depth === 0 ? (24 + avatarSize + 8) : (12 + avatarSize + 8),
          bottom: 0,
          width: "2px",
          backgroundColor: "var(--border-hairline)",
          zIndex: 1
        }} />
      )}

      {/* Main Comment Row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: `${gap}px`, position: "relative", zIndex: 2 }}>
        {/* Avatar */}
        <div
          onClick={() => {
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
              onClick={() => {
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

          <div style={{ fontSize: "15px", lineHeight: "1.5", color: "var(--text-primary)", wordBreak: "break-word", marginBottom: "10px", fontWeight: 400 }}>
            <ContentRenderer content={comment.content} />
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
            <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }}>
              {selectedGif && (
                <div style={{ position: "relative", width: "fit-content", marginBottom: "12px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                  <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: "120px", display: "block" }} />
                  <button onClick={() => setSelectedGif(null)} style={{ position: "absolute", top: "4px", right: "4px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", border: "none", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={10} weight="bold" /></button>
                </div>
              )}
              <MentionInput value={replyContent} onChange={setReplyContent} placeholder="Write a reply..." style={{ minHeight: "80px", fontSize: "14px", borderRadius: "var(--radius-sm)" }} />
              <div style={{ display: "flex", gap: "12px", marginTop: "16px", justifyContent: "flex-end" }}>
                <button onClick={() => { setShowReply(false); setReplyContent(""); }} style={{ padding: "8px 16px", backgroundColor: "transparent", color: "var(--text-tertiary)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                <div style={{ position: "relative" }}>
                   <button type="button" onClick={() => setIsGifPickerOpen(!isGifPickerOpen)} style={{ padding: "8px 16px", backgroundColor: "transparent", color: "var(--text-tertiary)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
                     <Gif size={18} weight={isGifPickerOpen ? "fill" : "regular"} />
                   </button>
                   {isGifPickerOpen && (
                     <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: "12px", zIndex: 100 }}>
                       <GifPicker onSelect={(gifUrl) => { setSelectedGif(gifUrl); setIsGifPickerOpen(false); }} onClose={() => setIsGifPickerOpen(false)} />
                     </div>
                   )}
                </div>
                <button onClick={handleReplySubmit} disabled={(!replyContent.trim() && !selectedGif) || submitting} style={{ padding: "8px 24px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontSize: "13px" }}>{submitting ? "Sending..." : "Send"}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies with horizontal connector */}
      <div style={{ 
        marginTop: "16px", 
        marginLeft: `${avatarSize / 2}px`,
        display: (comment.children && comment.children.length > 0) ? "block" : "none"
      }}>
        {comment.children?.map((c) => (
          <div key={c.id} style={{ position: "relative", paddingLeft: `${avatarSize / 2 + gap}px` }}>
            {/* Horizontal Tick connecting vertical line to child avatar */}
            <div style={{
              position: "absolute",
              left: 0,
              top: `${avatarSize / 2 + 12}px`, // Alignment with child avatar center
              width: `${avatarSize / 2 + gap}px`,
              height: "2px",
              backgroundColor: "var(--border-hairline)",
              zIndex: 1
            }} />
            <CommentBlock 
              comment={c} 
              depth={depth + 1} 
              onReply={onReply} 
              onDelete={onDelete}
              resourceType={resourceType} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
