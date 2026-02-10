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

  // Calculate responsive margin to prevent deep threads from becoming too narrow on mobile
  const getMarginLeft = () => {
    if (depth === 0) return 0;
    const baseMargin = isMobile ? 12 : 36;
    const maxDepth = isMobile ? 3 : 10; // Cap indentation depth on mobile
    return Math.min(depth, maxDepth) * baseMargin;
  };

  return (
    <div
      style={{
        marginLeft: getMarginLeft(),
        marginBottom: isMobile ? "12px" : "16px",
        position: "relative"
      }}
      className="fade-in"
    >
      {/* Curved Connector for Replies */}
      {depth > 0 && (!isMobile || depth <= 4) && (
        <div style={{
          position: "absolute",
          left: isMobile ? "-10px" : "-20px",
          top: "-12px",
          height: "32px",
          width: isMobile ? "10px" : "20px",
          borderLeft: "2px solid #e2e8f0",
          borderBottom: "2px solid #e2e8f0",
          borderBottomLeftRadius: "10px",
          zIndex: 0
        }} />
      )}

      <div
        style={{
          padding: isMobile ? "16px" : "24px",
          backgroundColor: "#fff",
          borderRadius: isMobile ? "24px" : "32px",
          border: "1px solid rgba(226, 232, 240, 0.5)",
          boxShadow: depth === 0 ? "0 4px 20px rgba(0, 0, 0, 0.02), 0 10px 40px rgba(0, 0, 0, 0.03)" : "none",
          position: "relative",
          zIndex: 1,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => {
          if (depth === 0) e.currentTarget.style.borderColor = "rgba(226, 232, 240, 1)";
        }}
        onMouseLeave={(e) => {
          if (depth === 0) e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.5)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div
            style={{
              width: isMobile ? "32px" : "36px",
              height: isMobile ? "32px" : "36px",
              borderRadius: "100%",
              overflow: "hidden",
              border: "1px solid #fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "transform 0.2s ease"
            }}
            onClick={() => {
              if (comment.user?.username) navigate(`/${comment.user.username}`);
              else if (comment.user_id) navigate(`/user/${comment.user_id}`);
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <img
              src={avatarUrl}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span
                onClick={() => {
                  if (comment.user?.username) navigate(`/${comment.user.username}`);
                  else if (comment.user_id) navigate(`/user/${comment.user_id}`);
                }}
                style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                {name}
                <VerifiedBadge username={comment.user?.username} size="13px" />
              </span>
              {comment.parent_author_name && (
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                  <span style={{ margin: "0 2px", opacity: 0.5 }}>•</span>
                  REPLY TO <span style={{ color: "#475569" }}>@{comment.parent_author_name}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>
              {formatRelativeDate(comment.created_at)}
            </div>
          </div>
        </div>

        <div style={{
          marginBottom: "16px",
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#475569",
          wordBreak: "break-word"
        }}>
          <ContentRenderer content={comment.content} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              color: isLiked ? "#ef4444" : "#cbd5e1",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              if (!isLiked) e.currentTarget.style.color = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              if (!isLiked) e.currentTarget.style.color = "#cbd5e1";
            }}
          >
            <FontAwesomeIcon icon={faHeart} style={{ fontSize: "16px" }} />
            <span style={{ color: isLiked ? "#ef4444" : "#94a3b8" }}>{likeCount ?? 0}</span>
          </button>

          {isSignedIn && (
            <button
              onClick={() => setShowReply((s) => !s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                padding: 0,
                color: "#cbd5e1",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.color = "#94a3b8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              <FontAwesomeIcon icon={faReply} style={{ fontSize: "14px" }} />
              <span style={{ color: "#94a3b8" }}>REPLY</span>
            </button>
          )}
        </div>
      </div>

      {showReply && isSignedIn && (
        <div
          style={{
            marginTop: "12px",
            border: "1px solid rgba(226, 232, 240, 0.5)",
            padding: "20px",
            borderRadius: "24px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
          }}
          className="fade-in"
        >
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder={`Reply to ${name}...`}
            minHeight={isMobile ? "50px" : "60px"}
          />
          <div style={{ display: "flex", gap: "12px", marginTop: "14px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowReply(false); setReplyContent(""); }}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "1px solid #e2e8f0",
                borderRadius: "100px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#0f172a"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
            >
              Cancel
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || submitting}
              style={{
                padding: "8px 20px",
                backgroundColor: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "100px",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "12px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.backgroundColor = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "#0f172a";
              }}
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div style={{ marginTop: "12px", position: "relative" }}>
          {/* Vertical Main Thread Line - Hide if depth is very deep on mobile */}
          {(!isMobile || depth < 4) && (
            <div style={{
              position: "absolute",
              left: isMobile ? "14px" : "16px",
              top: "-12px",
              bottom: "16px",
              width: "2px",
              backgroundColor: "#e2e8f0",
              zIndex: 0
            }} />
          )}

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
    </div>
  );
}
