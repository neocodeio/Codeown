import React, { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { useAvatar } from "../hooks/useAvatar";
import { formatRelativeDate } from "../utils/date";

interface Comment {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  users: {
    name: string;
    username: string;
    avatar_url: string;
  };
}

const ArticleCommentsSection = ({ articleId }: { articleId: number }) => {
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { avatarUrl } = useAvatar(
    currentUser?.id,
    currentUser?.imageUrl,
    currentUser?.fullName || currentUser?.username || "User"
  );

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/articles/${articleId}/comments`);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await api.post(`/articles/${articleId}/comments`, {
        content: newComment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(prev => [data, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: "48px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>
        Comments ({comments.length})
      </h3>

      {currentUser ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <img 
              src={avatarUrl} 
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--border-hairline)" }} 
              alt="" 
            />
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts?"
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: "15px",
                  resize: "none",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--text-primary)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-hairline)"}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    borderRadius: "100px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    opacity: submitting || !newComment.trim() ? 0.6 : 1
                  }}
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--bg-hover)", textAlign: "center", marginBottom: "40px" }}>
           <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
             Please sign in to join the conversation.
           </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {comments.map(comment => (
          <div key={comment.id} style={{ display: "flex", gap: "12px" }}>
            <img 
              src={comment.users.avatar_url || "/default-avatar.png"} 
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--border-hairline)", flexShrink: 0 }} 
              alt="" 
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{comment.users.name}</span>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{formatRelativeDate(comment.created_at)}</span>
              </div>
              <p style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleCommentsSection;
