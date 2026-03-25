import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import CommentBlock, { type CommentWithMeta } from "./CommentBlock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { Gif, X } from "phosphor-react";
import GifPicker from "./GifPicker";

interface CommentsSectionProps {
  resourceId: number;
  resourceType: "post" | "project";
  onCommentAdded?: () => void;
}

export default function CommentsSection({ resourceId, resourceType, onCommentAdded }: CommentsSectionProps) {
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

  const queryKey = resourceType === "project" 
    ? ["project_comments", String(resourceId)] 
    : ["comments", String(resourceId)];

  const { data: comments = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      const response = await api.get(endpoint);
      return response.data || [];
    },
    enabled: !!resourceId
  });

  const handleSubmitComment = async () => {
    if ((!newComment.trim() && !selectedGif) || !currentUser) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const finalContent = selectedGif ? `${newComment.trim()}\n${selectedGif}`.trim() : newComment.trim();

      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      const response = await api.post(
        endpoint,
        { content: finalContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      queryClient.setQueryData(queryKey, (old: CommentWithMeta[] | undefined) => {
        return [response.data, ...(old || [])];
      });
      queryClient.invalidateQueries({ queryKey });

      setNewComment("");
      setSelectedGif(null);
      setIsFocused(false);
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number | string, content: string) => {
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

      queryClient.setQueryData(queryKey, (old: CommentWithMeta[] | undefined) => {
        if (!old) return [response.data];
        return updateCommentsWithReply(old);
      });
      queryClient.invalidateQueries({ queryKey });

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
      resourceType={resourceType}
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
          border: "2px solid var(--border-hairline)",
          borderTopColor: "var(--text-primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
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
        borderBottom: "0.5px solid var(--border-hairline)"
      }}>
        <h3 style={{
          fontSize: "14px",
          fontWeight: 800,
          color: "var(--text-primary)",
          margin: 0,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          Comments ({comments.length.toString().padStart(2, '0')})
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
            style={{ width: "44px", height: "44px", borderRadius: "var(--radius-sm)", objectFit: "cover", border: "1px solid var(--border-hairline)", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            {selectedGif && (
              <div style={{ 
                position: "relative", 
                width: "fit-content", 
                marginBottom: "12px",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                border: "0.5px solid var(--border-hairline)",
                animation: "reactionFadeUp 0.15s ease-out"
              }}>
                <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: "150px", display: "block" }} />
                <button 
                  onClick={() => setSelectedGif(null)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "10px"
                  }}
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            )}
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
                borderRadius: "var(--radius-sm)",
                resize: "none",
                fontFamily: "inherit",
                color: "var(--text-primary)",
                backgroundColor: "transparent",
                borderBottom: isFocused ? "1px solid var(--text-primary)" : "0.5px solid var(--border-hairline)",
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
                    padding: "8px 20px",
                    backgroundColor: newComment.trim() && !submitting ? "var(--text-primary)" : "transparent",
                    color: newComment.trim() && !submitting ? "var(--bg-page)" : "var(--text-tertiary)",
                    border: "0.5px solid var(--border-hairline)",
                    borderRadius: "var(--radius-sm)",
                    cursor: newComment.trim() && !submitting ? "pointer" : "not-allowed",
                    fontWeight: 800,
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                >
                  {submitting ? "..." : "Post"}
                </button>
              </div>
            )}

            {isFocused && (
              <div style={{ position: "relative", marginTop: "12px", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    backgroundColor: "transparent",
                    color: "var(--text-tertiary)",
                    border: "0.5px solid var(--border-hairline)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                  <Gif size={18} weight={isGifPickerOpen ? "fill" : "regular"} />
                  GIF
                </button>

                {isGifPickerOpen && (
                  <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "12px", zIndex: 100 }}>
                    <GifPicker 
                      onSelect={(gifUrl) => {
                        setSelectedGif(gifUrl);
                        setIsGifPickerOpen(false);
                      }}
                      onClose={() => setIsGifPickerOpen(false)}
                    />
                  </div>
                )}
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
            backgroundColor: "var(--bg-hover)",
            borderRadius: "var(--radius-sm)",
            border: "0.5px solid var(--border-hairline)",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              border: "0.5px solid var(--border-hairline)",
              color: "var(--text-primary)"
            }}>
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "28px" }} />
            </div>
            <div style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "12px",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase"
            }}>
              No replies yet
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 700, maxWidth: "300px", margin: "0 auto", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
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
