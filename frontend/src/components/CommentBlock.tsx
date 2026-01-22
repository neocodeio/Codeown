import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentRenderer from "./ContentRenderer";
import MentionInput from "./MentionInput";
import { useCommentLikes } from "../hooks/useCommentLikes";
import { useClerkUser } from "../hooks/useClerkUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faReply } from "@fortawesome/free-solid-svg-icons";

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
  getAvatarUrl: (name: string, email: string | null) => string;
  formatDate: (date: string) => string;
  onReply: (parentId: number, content: string) => Promise<void>;
}

export default function CommentBlock({ comment, depth, getAvatarUrl, formatDate, onReply }: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isLiked, likeCount, loading: likeLoading, toggleLike } = useCommentLikes(comment.id);
  const { isSignedIn } = useClerkUser();
  const navigate = useNavigate();

  const name = comment.user?.name || "User";
  const email = comment.user?.email || null;
  const avatarUrl = comment.user?.avatar_url || getAvatarUrl(name, email);

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

  const isReply = !!comment.parent_id;

  return (
    <div style={{ marginLeft: isReply ? "16px" : 0, marginBottom: "16px" }} className="fade-in">
      <div
        style={{
          padding: "20px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-light)"}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
          <img
            src={avatarUrl}
            alt={name}
            onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              objectFit: "cover",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
                style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
              >
                {name}
              </span>
              {comment.parent_author_name && (
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Replying to <span style={{ color: "var(--primary)", fontWeight: 600 }}>@{comment.parent_author_name}</span>
                </span>
              )}
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>•</span>
              <time style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                {formatDate(comment.created_at)}
              </time>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: "16px", paddingLeft: "48px" }}>
          <ContentRenderer content={comment.content} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", paddingLeft: "48px" }}>
          <button
            onClick={toggleLike}
            disabled={!isSignedIn || likeLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              cursor: isSignedIn && !likeLoading ? "pointer" : "default",
              color: isLiked ? "var(--error)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <FontAwesomeIcon icon={faHeart} style={{ fontSize: "14px", transform: isLiked ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }} />
            <span>{likeCount ?? 0}</span>
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
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>Reply</span>
            </button>
          )}
        </div>
      </div>

      {showReply && isSignedIn && (
        <div style={{ marginTop: "12px", paddingLeft: "48px" }} className="fade-in">
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder={`Reply to ${name}...`}
            minHeight="80px"
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowReply(false); setReplyContent(""); }}
              style={{ padding: "8px 20px", backgroundColor: "transparent", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || submitting}
              style={{ padding: "8px 20px", backgroundColor: "var(--primary)", border: "none", color: "white", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, opacity: replyContent.trim() ? 1 : 0.6 }}
            >
              {submitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div style={{ marginTop: "12px", borderLeft: "2px solid var(--border-light)", marginLeft: "18px" }}>
          {comment.children.map((c) => (
            <CommentBlock
              key={c.id}
              comment={c}
              depth={depth + 1}
              getAvatarUrl={getAvatarUrl}
              formatDate={formatDate}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
