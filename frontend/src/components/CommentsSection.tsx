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

      // Update comments state to include the new reply
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
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ 
          width: "24px", 
          height: "24px", 
          border: "2px solid var(--border-light)", 
          borderTopColor: "var(--primary)", 
          borderRadius: "50%", 
          animation: "spin 0.6s linear infinite",
          margin: "0 auto"
        }} />
      </div>
    );
  }

  return (
    <div>
      {currentUser && (
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              <img
                src={currentUser.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || "U")}&background=000000&color=ffffff&bold=true`}
                alt={currentUser.fullName || "User"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a comment..."
                disabled={submitting}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "12px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ marginTop: "12px", textAlign: "right" }}>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: newComment.trim() && !submitting ? "#000" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: newComment.trim() && !submitting ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        {comments.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-tertiary)",
            fontSize: "16px",
            fontWeight: 600,
          }}>
            <FontAwesomeIcon icon={faComment} style={{ marginBottom: "12px", fontSize: "24px" }} />
            <div>No comments yet. Be the first to comment!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}
