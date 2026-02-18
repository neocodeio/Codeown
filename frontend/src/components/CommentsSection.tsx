import { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import CommentBlock, { type CommentWithMeta } from "./CommentBlock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";

interface CommentsSectionProps {
  resourceId: number;
  resourceType: "post" | "project";
  onCommentAdded?: () => void;
}

export default function CommentsSection({ resourceId, resourceType, onCommentAdded }: CommentsSectionProps) {
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [resourceId, resourceType]);

  const fetchComments = async () => {
    try {
      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      const response = await api.get(endpoint);
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      const response = await api.post(
        endpoint,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(prev => [response.data, ...prev]);
      setNewComment("");
      setIsFocused(false);
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    if (!currentUser) return;

    try {
      const token = await getToken();
      if (!token) return;

      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      const response = await api.post(
        endpoint,
        { content, parent_id: parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updateCommentsWithReply = (comments: CommentWithMeta[]): CommentWithMeta[] => {
        return comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              children: [...(comment.children || []), response.data]
            };
          }
          if (comment.children) {
            return {
              ...comment,
              children: updateCommentsWithReply(comment.children)
            };
          }
          return comment;
        });
      };

      setComments(prev => updateCommentsWithReply(prev));
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply");
    }
  };

  const renderComment = (comment: CommentWithMeta, depth: number = 0) => (
    <CommentBlock
      key={comment.id}
      comment={comment}
      depth={depth}
      onReply={handleReply}
    />
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="loading-spinner" style={{
          width: "32px",
          height: "32px",
          border: "3px solid rgba(33, 33, 33, 0.1)",
          borderTopColor: "#212121",
          borderRadius: "50%",
          animation: "spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite",
          margin: "0 auto"
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      {/* Simple Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9"
      }}>
        <h3 style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#1a1a1a",
          margin: 0,
        }}>
          Comments ({comments.length})
        </h3>
      </div>

      {/* integrated Composer */}
      {currentUser && (
        <div style={{
          marginBottom: "32px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start"
        }}>
          <img
            src={currentUser.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || "U")}&background=212121&color=ffffff&bold=true`}
            alt={currentUser.fullName || "User"}
            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
          />
          <div style={{ flex: 1 }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={submitting}
              style={{
                width: "100%",
                minHeight: isFocused ? "80px" : "40px",
                padding: "8px 0",
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontWeight: 500,
                resize: "none",
                fontFamily: "inherit",
                color: "#1a1a1a",
                backgroundColor: "transparent",
                borderBottom: isFocused ? "1px solid #1a1a1a" : "1px solid #f1f5f9",
                transition: "border-color 0.2s"
              }}
            />

            {isFocused && (
              <div style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px"
              }}>
                <button
                  onClick={() => { setIsFocused(false); setNewComment(""); }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "#666",
                    border: "none",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  style={{
                    padding: "6px 20px",
                    backgroundColor: newComment.trim() && !submitting ? "#1a1a1a" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: newComment.trim() && !submitting ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    fontSize: "13px"
                  }}
                >
                  {submitting ? "..." : "Post"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments List */}
      <div>
        {comments.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 40px",
            backgroundColor: "#f8fafc",
            borderRadius: "32px",
            border: "2px dashed #e2e8f0",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#fff",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.03)",
              color: "#212121"
            }}>
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "28px" }} />
            </div>
            <div style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "8px"
            }}>
              No comments yet
            </div>
            <div style={{ color: "#64748b", fontSize: "14px", maxWidth: "260px", margin: "0 auto" }}>
              Be the first to share your thoughts and start the conversation!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
