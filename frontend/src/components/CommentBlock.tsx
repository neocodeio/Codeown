import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentRenderer from "./ContentRenderer";
import MentionInput from "./MentionInput";
import { useCommentLikes } from "../hooks/useCommentLikes";
import { useClerkUser } from "../hooks/useClerkUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faReply } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";

export interface CommentWithMeta {
  id: number;
  post_id: number;
  content: string;
  user_id: string;
  created_at: string;
  parent_id?: number | null;
  parent_author_name?: string | null;
  like_count?: number;
  user?: { name: string; username?: string | null; email: string | null; avatar_url?: string | null };
  children?: CommentWithMeta[];
}

interface CommentBlockProps {
  comment: CommentWithMeta;
  depth: number;
  onReply: (parentId: number, content: string) => Promise<void>;
}

export default function CommentBlock({ comment, depth, onReply }: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isLiked, likeCount, loading: likeLoading, toggleLike } = useCommentLikes(comment.id);
  const { isSignedIn } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const name = comment.user?.name || "User";
  const avatarUrl = comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10633b&color=ffffff&bold=true`;

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

  const getMarginLeft = () => {
    if (depth === 0) return 0;
    const baseMargin = isMobile ? 12 : 32;
    const maxDepth = isMobile ? 3 : 8;
    return Math.min(depth, maxDepth) * baseMargin;
  };

  return (
    <div
      style={{
        marginLeft: getMarginLeft(),
        marginBottom: isMobile ? "12px" : "16px",
        position: "relative",
        animation: "slideIn 0.4s cubic-bezier(0, 0, 0.2, 1) forwards"
      }}
    >
      {/* Thread Connector Line */}
      {depth > 0 && (
        <div style={{
          position: "absolute",
          left: isMobile ? "-10px" : "-20px",
          top: "-12px",
          height: "36px",
          width: isMobile ? "10px" : "20px",
          borderLeft: "2px solid #e2e8f0",
          borderBottom: "2px solid #e2e8f0",
          borderBottomLeftRadius: "12px",
          zIndex: 0,
          opacity: 0.6
        }} />
      )}

      <div
        style={{
          padding: isMobile ? "16px" : "20px 24px",
          backgroundColor: "#fff",
          borderRadius: isMobile ? "20px" : "24px",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          boxShadow: depth === 0 ? "0 4px 12px rgba(0, 0, 0, 0.03)" : "none",
          position: "relative",
          zIndex: 1,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        className="comment-card"
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              width: isMobile ? "32px" : "40px",
              height: isMobile ? "32px" : "40px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid #fff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
              cursor: "pointer",
              transition: "all 0.2s ease",
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span
                  onClick={() => {
                    if (comment.user?.username) navigate(`/${comment.user.username}`);
                    else if (comment.user_id) navigate(`/user/${comment.user_id}`);
                  }}
                  style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  {name}
                  <VerifiedBadge username={comment.user?.username} size="14px" />
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                  • {formatRelativeDate(comment.created_at)}
                </span>
              </div>
            </div>

            {comment.parent_author_name && (
              <div style={{
                fontSize: "11px",
                color: "#10633b",
                fontWeight: 700,
                backgroundColor: "rgba(16, 99, 59, 0.05)",
                display: "inline-block",
                padding: "1px 8px",
                borderRadius: "4px",
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.02em"
              }}>
                Replying to <span style={{ opacity: 0.8 }}>@{comment.parent_author_name}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          marginBottom: "16px",
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#334155",
          wordBreak: "break-word",
          paddingLeft: isMobile ? "0px" : "0px",
        }}>
          <ContentRenderer content={comment.content} />
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderTop: depth === 0 ? "1px solid rgba(226, 232, 240, 0.4)" : "none",
          paddingTop: depth === 0 ? "12px" : "0"
        }}>
          <button
            onClick={toggleLike}
            disabled={!isSignedIn || likeLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: isLiked ? "rgba(239, 68, 68, 0.08)" : "rgba(241, 245, 249, 0.6)",
              border: "none",
              padding: "6px 12px",
              borderRadius: "100px",
              color: isLiked ? "#ef4444" : "#64748b",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <FontAwesomeIcon
              icon={faHeart}
              style={{
                fontSize: "15px",
                transform: isLiked ? "scale(1.1)" : "scale(1)",
                opacity: isLiked ? 1 : 0.6
              }}
            />
            <span>{likeCount ?? 0}</span>
          </button>

          {isSignedIn && (
            <button
              onClick={() => setShowReply((s) => !s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: showReply ? "rgba(16, 99, 59, 0.08)" : "rgba(241, 245, 249, 0.6)",
                border: "none",
                padding: "6px 12px",
                borderRadius: "100px",
                color: showReply ? "#10633b" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <FontAwesomeIcon icon={faReply} style={{ fontSize: "13px" }} />
              <span>Reply</span>
            </button>
          )}
        </div>
      </div>

      {showReply && isSignedIn && (
        <div
          style={{
            marginTop: "12px",
            border: "2px solid #10633b",
            padding: "16px",
            borderRadius: "20px",
            backgroundColor: "#fff",
            boxShadow: "0 10px 25px rgba(16, 99, 59, 0.08)",
            animation: "fadeIn 0.3s ease",
            zIndex: 10,
            position: "relative"
          }}
        >
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder={`Reply to ${name}...`}
            minHeight={isMobile ? "40px" : "50px"}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowReply(false); setReplyContent(""); }}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "100px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.2s"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || submitting}
              style={{
                padding: "8px 20px",
                backgroundColor: "#10633b",
                color: "#fff",
                border: "none",
                borderRadius: "100px",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "12px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(16, 99, 59, 0.2)"
              }}
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div style={{ marginTop: "12px", position: "relative" }}>
          <div style={{
            position: "absolute",
            left: isMobile ? "14px" : "18px",
            top: "-12px",
            bottom: "20px",
            width: "2px",
            backgroundColor: "#e2e8f0",
            zIndex: 0,
            opacity: 0.6
          }} />

          {comment.children.map((c) => (
            <CommentBlock
              key={c.id}
              comment={c}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .comment-card:hover {
          border-color: rgba(16, 99, 59, 0.2) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.04) !important;
        }
      `}</style>
    </div>
  );
}
