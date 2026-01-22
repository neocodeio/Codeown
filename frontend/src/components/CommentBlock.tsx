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
  onReply: (parentId: number, content: string) => Promise<void>;
}

export default function CommentBlock({ comment, depth, onReply }: CommentBlockProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isLiked, likeCount, loading: likeLoading, toggleLike } = useCommentLikes(comment.id);
  const { isSignedIn } = useClerkUser();
  const navigate = useNavigate();

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  };

  return (
    <div style={{ marginLeft: depth > 0 ? "24px" : 0, marginBottom: "24px" }} className="fade-in">
      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <img
            src={avatarUrl}
            alt={name}
            onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
            style={{
              width: "32px",
              height: "32px",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                onClick={() => comment.user_id && navigate(`/user/${comment.user_id}`)}
                style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer" }}
              >
                {name}
              </span>
              {comment.parent_author_name && (
                <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700 }}>
                  REPLYING TO <span style={{ color: "var(--accent)" }}>@{comment.parent_author_name.toUpperCase()}</span>
                </span>
              )}
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700 }}>{formatDate(comment.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: "20px", fontSize: "15px", lineHeight: "1.6" }}>
          <ContentRenderer content={comment.content} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button
            onClick={toggleLike}
            disabled={!isSignedIn || likeLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              padding: "0",
              color: isLiked ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 800,
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
                gap: "6px",
                background: "none",
                border: "none",
                padding: "0",
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>REPLY</span>
            </button>
          )}
        </div>
      </div>

      {showReply && isSignedIn && (
        <div style={{ marginTop: "16px", border: "1px solid var(--border-color)", padding: "16px", backgroundColor: "var(--bg-elevated)" }} className="fade-in">
          <MentionInput
            value={replyContent}
            onChange={setReplyContent}
            placeholder={`REPLY TO ${name.toUpperCase()}...`}
            minHeight="60px"
          />
          <div style={{ display: "flex", gap: "12px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowReply(false); setReplyContent(""); }}
              style={{ fontSize: "10px", border: "none", padding: "4px 8px" }}
            >
              CANCEL
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={!replyContent.trim() || submitting}
              className="primary"
              style={{ fontSize: "10px" }}
            >
              {submitting ? "POSTING..." : "POST REPLY"}
            </button>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div style={{ marginTop: "12px", borderLeft: "1px solid var(--border-color)" }}>
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
