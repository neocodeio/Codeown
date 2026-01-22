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
    <div style={{ marginLeft: isReply ? "24px" : 0, marginBottom: "12px" }}>
      <div
        style={{
          padding: "14px",
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
          <img
            src={avatarUrl}
            alt={name}
            onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid var(--border-color)",
              cursor: "pointer",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
                style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}
              >
                {name}
              </span>
              {comment.parent_author_name && (
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Replying to {comment.parent_author_name}
                </span>
              )}
            </div>
            <time style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              {formatDate(comment.created_at)}
            </time>
          </div>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <ContentRenderer content={comment.content} fontSize="15px" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isSignedIn && (
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                background: "none",
                border: "none",
                cursor: likeLoading ? "not-allowed" : "pointer",
                color: isLiked ? "var(--heart-liked)" : "var(--heart-unliked)",
                fontSize: "13px",
              }}
            >
              <FontAwesomeIcon icon={faHeart} style={{ fontSize: "14px" }} />
              {likeCount ?? comment.like_count ?? 0}
            </button>
          )}
          {!isSignedIn && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
              <FontAwesomeIcon icon={faHeart} /> {likeCount ?? comment.like_count ?? 0}
            </span>
          )}
          {isSignedIn && (
            <button
              onClick={() => setShowReply((s) => !s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "13px",
              }}
            >
              <FontAwesomeIcon icon={faReply} /> Reply
            </button>
          )}
        </div>
      </div>

      {showReply && isSignedIn && (
        <div style={{ marginTop: "10px", marginLeft: "0" }}>
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder={`Reply to ${name}...`}
            minHeight="80px"
            style={{ marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || submitting}
              style={{
                padding: "8px 16px",
                backgroundColor: replyContent.trim() && !submitting ? "#000" : "var(--border-color)",
                color: "#fff",
                border: "none",
                fontWeight: "600",
                borderRadius: "8px",
                fontSize: "15px",
                cursor: replyContent.trim() && !submitting ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? "Posting..." : "Reply"}
            </button>
            <button
              onClick={() => { setShowReply(false); setReplyContent(""); }}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid var(--border-color)",
                color: "#fff",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          {comment.children.map((c) => (
            <CommentBlock
              key={c.id}
              comment={c}
              depth={depth + 1}
              getAvatarUrl={getAvatarUrl}
              formatDate={formatDate}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
