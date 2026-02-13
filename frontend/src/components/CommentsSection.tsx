import { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import CommentBlock, { type CommentWithMeta } from "./CommentBlock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

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
  const { width } = useWindowSize();
  const isMobile = width < 768;

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
          border: "3px solid rgba(16, 99, 59, 0.1)",
          borderTopColor: "#10633b",
          borderRadius: "50%",
          animation: "spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite",
          margin: "0 auto"
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "0 10px" : "0" }}>
      {/* Premium Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid rgba(0,0,0,0.04)"
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#0f172a",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          Comments
          <span style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            padding: "2px 10px",
            borderRadius: "100px"
          }}>
            {comments.length}
          </span>
        </h3>
      </div>

      {/* Modern Composer */}
      {currentUser && (
        <div style={{
          marginBottom: "40px",
          backgroundColor: "#fff",
          borderRadius: "24px",
          padding: isFocused ? "20px" : "12px",
          border: isFocused ? "2px solid #10633b" : "1px solid #e2e8f0",
          boxShadow: isFocused ? "0 10px 25px rgba(16, 99, 59, 0.08)" : "0 2px 8px rgba(0,0,0,0.02)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative"
        }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div style={{
              width: isFocused ? "44px" : "40px",
              height: isFocused ? "44px" : "40px",
              borderRadius: "14px",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
            }}>
              <img
                src={currentUser.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || "U")}&background=10633b&color=ffffff&bold=true`}
                alt={currentUser.fullName || "User"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => !newComment && setIsFocused(false)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts..."
                disabled={submitting}
                style={{
                  width: "100%",
                  minHeight: isFocused ? "100px" : "40px",
                  padding: isFocused ? "8px 0" : "10px 0",
                  border: "none",
                  outline: "none",
                  fontSize: "16px",
                  fontWeight: 500,
                  resize: "none",
                  fontFamily: "inherit",
                  color: "#0f172a",
                  transition: "all 0.3s ease",
                  backgroundColor: "transparent"
                }}
              />

              {isFocused && (
                <div style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  animation: "fadeIn 0.2s ease"
                }}>
                  <button
                    onClick={() => { setIsFocused(false); setNewComment(""); }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "transparent",
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      borderRadius: "100px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    style={{
                      padding: "10px 24px",
                      backgroundColor: newComment.trim() && !submitting ? "#10633b" : "#e2e8f0",
                      color: "#fff",
                      border: "none",
                      borderRadius: "100px",
                      cursor: newComment.trim() && !submitting ? "pointer" : "not-allowed",
                      fontWeight: 700,
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isFocused ? "translateY(0)" : "translateY(5px)",
                      boxShadow: newComment.trim() && !submitting ? "0 4px 12px rgba(16, 99, 59, 0.2)" : "none"
                    }}
                  >
                    {submitting ? "Posting..." : <>
                      Post <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "12px" }} />
                    </>}
                  </button>
                </div>
              )}
            </div>
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
              color: "#10633b"
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
