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
    const basePadding = isMobile ? 16 : 24;
    if (depth === 0) return { paddingLeft: basePadding, paddingRight: basePadding, borderLeft: "none" };
    
    // Nested indentation
    const maxDepth = isMobile ? 2 : 4;
    const effectiveDepth = Math.min(depth, maxDepth);
    const nestedMargin = isMobile ? 12 : 20;

    return {
      marginLeft: nestedMargin,
      borderLeft: effectiveDepth > 0 ? "1px solid var(--border-hairline)" : "none",
      paddingLeft: isMobile ? 12 : 16,
      paddingRight: basePadding
    };
  };

  const indentStyle = getIndentStyle();

  return (
    <div
      style={{
        ...indentStyle,
        paddingTop: depth === 0 ? "24px" : "12px",
        paddingBottom: depth === 0 ? "24px" : "12px",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? "12px" : "16px" }}>
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
            size={isMobile ? 32 : 44}
            isOpenToOpportunities={comment.user?.is_pro}
            username={comment.user?.username}
          />
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span
              onClick={() => {
                if (comment.user?.username) navigate(`/${comment.user.username}`);
                else if (comment.user_id) navigate(`/user/${comment.user_id}`);
              }}
              style={{ 
                fontSize: "14px", 
                fontWeight: 800, 
                color: "var(--text-primary)", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: "4px", 
                textTransform: "uppercase", 
                letterSpacing: "0.02em" 
              }}
            >
              {name}
              <VerifiedBadge username={comment.user?.username} size="14px" />
              {comment.user?.is_pro && (
                <span style={{
                  fontSize: "9px",
                  fontWeight: "900",
                  padding: "2px 6px",
                  borderRadius: "2px",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  letterSpacing: "0.1em",
                  marginLeft: "4px",
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1
                }}>PRO</span>
              )}
            </span>
            <span style={{ 
              fontSize: "11px", 
              color: "var(--text-tertiary)", 
              fontWeight: 800, 
              fontFamily: "var(--font-mono)", 
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              opacity: 0.8
            }}>
              • {formatRelativeDate(comment.created_at)}
            </span>
          </div>

          {/* Comment Text */}
          <div style={{
            fontSize: "16px",
            lineHeight: "1.7",
            color: "var(--text-primary)",
            wordBreak: "break-word",
            marginBottom: "16px",
            fontWeight: 500,
            opacity: 0.95
          }}>
            <ContentRenderer content={comment.content} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "8px" }}>
            <button
              onClick={toggleLike}
              disabled={!isSignedIn || likeLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                padding: 0,
                color: isLiked ? "#ff4b4b" : "var(--text-tertiary)",
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
                letterSpacing: "0.1em"
              }}
              onMouseEnter={(e) => !isLiked && (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => !isLiked && (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              <FontAwesomeIcon
                icon={isLiked ? faHeartSolid : faHeartRegular}
                style={{ fontSize: "16px" }}
              />
              {likeCount > 0 ? (
                <span>{likeCount}</span>
              ) : (
                <span>LIKE</span>
              )}
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
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "color 0.15s ease",
                  letterSpacing: "0.1em"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Composer Inline */}
          {showReply && isSignedIn && (
            <div style={{ 
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "2px",
              border: "1px solid var(--border-hairline)"
             }}>
              <MentionInput
                value={replyContent}
                onChange={setReplyContent}
                placeholder={`Reply to ${name}...`}
                minHeight="40px"
                transparent={true}
              />
              <div style={{ display: "flex", gap: "12px", marginTop: "16px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setShowReply(false); setReplyContent(""); }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    color: "var(--text-tertiary)",
                    border: "none",
                    borderRadius: "2px",
                    fontWeight: 900,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || submitting}
                  style={{
                    padding: "8px 24px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    borderRadius: "2px",
                    fontWeight: 900,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em"
                  }}
                >
                  {submitting ? "..." : "Send"}
                </button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.children && comment.children.length > 0 && (
            <div style={{ marginTop: "16px" }}>
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
