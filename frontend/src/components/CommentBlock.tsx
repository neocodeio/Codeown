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

export interface CommentWithMeta {
  id: number;
  post_id: number;
  content: string;
  user_id: string;
  created_at: string;
  parent_id?: number | null;
  parent_author_name?: string | null;
  like_count?: number;
  user?: { name: string; email: string | null; avatar_url?: string | null };
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
  const avatarUrl = comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=ffffff&bold=true`;

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

  return (
    <div
      style={{
        marginLeft: depth > 0 ? (isMobile ? "12px" : "36px") : 0,
        marginBottom: "16px",
        position: "relative"
      }}
      className="fade-in"
    >
      {/* Curved Connector for Replies */}
      {depth > 0 && (
        <div style={{
          position: "absolute",
          left: isMobile ? "-12px" : "-20px",
          top: "-16px",
          height: "36px",
          width: "20px",
          borderLeft: "2px solid #e2e8f0",
          borderBottom: "2px solid #e2e8f0",
          borderBottomLeftRadius: "12px",
          zIndex: 0
        }} />
      )}

      <div
        style={{
          padding: isMobile ? "16px" : "20px",
          backgroundColor: "#fff",
          borderRadius: "18px",
          border: "1px solid #f1f5f9",
          boxShadow: depth === 0 ? "0 4px 12px rgba(0,0,0,0.03)" : "none",
          position: "relative",
          zIndex: 1
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <img
            src={avatarUrl}
            alt={name}
            onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              objectFit: "cover"
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span
                onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
                style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", cursor: "pointer" }}
              >
                {name}
              </span>
              {comment.parent_author_name && (
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                  <span style={{ margin: "0 2px", opacity: 0.5 }}>•</span>
                  REPLYING TO <span style={{ color: "#364182" }}>@{comment.parent_author_name}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, marginTop: "1px" }}>
              {formatRelativeDate(comment.created_at).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{
          marginBottom: "14px",
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#334155"
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
              gap: "5px",
              background: "none",
              border: "none",
              padding: "4px 8px",
              borderRadius: "8px",
              color: isLiked ? "#ff4757" : "#64748b",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: isLiked ? "#fff1f2" : "transparent"
            }}
          >
            <FontAwesomeIcon icon={faHeart} />
            <span>{likeCount ?? 0}</span>
          </button>

          {isSignedIn && (
            <button
              onClick={() => setShowReply((s) => !s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                padding: "4px 8px",
                borderRadius: "8px",
                color: "#364182",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eef2ff")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>REPLY</span>
            </button>
          )}
        </div>
      </div>

      {showReply && isSignedIn && (
        <div
          style={{
            marginTop: "12px",
            border: "1px solid #e2e8f0",
            padding: "16px",
            borderRadius: "18px",
            backgroundColor: "#f8fafc"
          }}
          className="fade-in"
        >
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder={`Reply to ${name}...`}
            minHeight="60px"
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowReply(false); setReplyContent(""); }}
              style={{
                padding: "6px 14px",
                backgroundColor: "transparent",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || submitting}
              style={{
                padding: "6px 16px",
                backgroundColor: "#364182",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "12px"
              }}
            >
              {submitting ? "POSTING..." : "POST REPLY"}
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div style={{ marginTop: "12px", position: "relative" }}>
          {/* Vertical Main Thread Line */}
          <div style={{
            position: "absolute",
            left: isMobile ? "16px" : "16px",
            top: "-12px",
            bottom: "20px",
            width: "2px",
            backgroundColor: "#e2e8f0",
            zIndex: 0
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
    </div>
  );
}
