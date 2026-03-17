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

export interface CommentWithMeta {
  id: number | string;
  post_id?: number;
  content: string;
  user_id: string;
  created_at: string;
  parent_id?: number | string | null;
  parent_author_name?: string | null;
  like_count?: number;
  user?: { name: string; username?: string | null; email: string | null; avatar_url?: string | null };
  children?: CommentWithMeta[];
}

interface CommentBlockProps {
  comment: CommentWithMeta;
  depth: number;
  onReply: (parentId: number | string, content: string) => Promise<void>;
  resourceType: "post" | "project";
}

export default function CommentBlock({ comment, depth, onReply, resourceType }: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isLiked, likeCount, loading: likeLoading, toggleLike } = useCommentLikes(comment.id, resourceType);
  const { isSignedIn } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const name = comment.user?.name || "User";
  const avatarUrl = comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=212121&color=ffffff&bold=true`;

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getIndentStyle = () => {
    if (depth === 0) return { paddingLeft: 0, borderLeft: "none" };
    // Limit nesting depth on mobile to 2 levels, on desktop to 4 levels to prevent squishing
    const maxDepth = isMobile ? 2 : 4;
    const effectiveDepth = Math.min(depth, maxDepth);
    const basePadding = isMobile ? 12 : 24;

    return {
      paddingLeft: basePadding,
      borderLeft: effectiveDepth > 0 ? "0.5px solid var(--border-hairline)" : "none"
    };
  };

  const indentStyle = getIndentStyle();

  return (
    <div
      style={{
        ...indentStyle,
        paddingTop: "16px",
        paddingBottom: "16px",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Avatar */}
        <div
          style={{
            width: isMobile ? "32px" : "36px",
            height: isMobile ? "32px" : "36px",
            borderRadius: "50%",
            overflow: "hidden",
            cursor: "pointer",
            flexShrink: 0
          }}
          onClick={() => {
            if (comment.user?.username) navigate(`/${comment.user.username}`);
            else if (comment.user_id) navigate(`/user/${comment.user_id}`);
          }}
        >
          <img
            src={avatarUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span
              onClick={() => {
                if (comment.user?.username) navigate(`/${comment.user.username}`);
                else if (comment.user_id) navigate(`/user/${comment.user_id}`);
              }}
              style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px", textTransform: "uppercase", letterSpacing: "-0.01em" }}
            >
              {name}
              <VerifiedBadge username={comment.user?.username} size="12px" />
              {(comment.user as any)?.is_pro && (
                <span style={{
                  fontSize: "8px",
                  fontWeight: "800",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  letterSpacing: "0.05em",
                  marginLeft: "4px",
                  fontFamily: "var(--font-mono)"
                }}>PRO</span>
              )}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              • {formatRelativeDate(comment.created_at)}
            </span>
          </div>

          {/* Comment Text */}
          <div style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "var(--text-secondary)",
            wordBreak: "break-word",
            marginBottom: "8px"
          }}>
            <ContentRenderer content={comment.content} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={toggleLike}
              disabled={!isSignedIn || likeLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                padding: 0,
                color: isLiked ? "#ef4444" : "var(--text-tertiary)",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              <FontAwesomeIcon
                icon={isLiked ? faHeartSolid : faHeartRegular}
                style={{ fontSize: "14px" }}
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {isSignedIn && (
              <button
                onClick={() => setShowReply((s) => !s)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--text-tertiary)",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  textTransform: "uppercase"
                }}
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Composer Inline */}
          {showReply && isSignedIn && (
            <div style={{ marginTop: "12px" }}>
              <MentionInput
                value={replyContent}
                onChange={setReplyContent}
                placeholder={`Reply to ${name}...`}
                minHeight="40px"
                transparent={true}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setShowReply(false); setReplyContent(""); }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "var(--text-tertiary)",
                    border: "none",
                    borderRadius: "2px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || submitting}
                  style={{
                    padding: "6px 16px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    borderRadius: "2px",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  {submitting ? "..." : "Reply"}
                </button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.children && comment.children.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              {comment.children.map((c) => (
                <CommentBlock
                  key={c.id}
                  comment={c}
                  depth={depth + 1}
                  onReply={onReply}
                  resourceType={resourceType}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
