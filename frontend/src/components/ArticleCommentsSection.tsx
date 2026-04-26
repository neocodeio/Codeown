import React, { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import { useAvatar } from "../hooks/useAvatar";
import { formatRelativeDate } from "../utils/date";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  FavouriteIcon, 
  Delete02Icon
} from "@hugeicons/core-free-icons";
import { socket } from "../lib/socket";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";

interface Comment {
  id: number;
  user_id: string;
  article_id: number;
  content: string;
  parent_id?: number | null;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
  users: {
    id: string;
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
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { avatarUrl } = useAvatar(
    currentUser?.id,
    currentUser?.imageUrl,
    currentUser?.fullName || currentUser?.username || "User"
  );

  useEffect(() => {
    fetchComments();

    socket.on("content_update", (update: { type: string; data: any }) => {
      if (Number(update.data.article_id) !== Number(articleId)) return;

      if (update.type === "article_comment") {
        setComments(prev => {
          // Prevent duplicates from multiple renders/reconnects
          if (prev.some(c => Number(c.id) === Number(update.data.comment.id))) return prev;
          return [update.data.comment, ...prev];
        });
      } else if (update.type === "article_comment_deleted") {
        setComments(prev => prev.filter(c => Number(c.id) !== Number(update.data.commentId)));
      } else if (update.type === "article_comment_like") {
        setComments(prev => prev.map(c => 
          Number(c.id) === Number(update.data.commentId) ? { ...c, likes_count: update.data.likes_count } : c
        ));
      }
    });

    return () => {
      socket.off("content_update");
    };
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
      await api.post(`/articles/${articleId}/comments`, {
        content: newComment.trim(),
        parent_id: replyTo?.id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The socket listener will add the comment to the list
      setNewComment("");
      setReplyTo(null);
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!currentUser) return;
    try {
      const token = await getToken();
      const { data } = await api.post(`/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { 
          ...c, 
          liked: data.liked,
          likes_count: data.likes_count 
        } : c
      ));
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      await api.delete(`/articles/${articleId}/comments/${commentToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Socket listener handles UI removal
      setIsDeleteModalOpen(false);
      setCommentToDelete(null);
    } catch (error) {
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
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
          {replyTo && (
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "8px 12px", 
              backgroundColor: "var(--bg-hover)", 
              borderRadius: "8px 8px 0 0",
              borderBottom: "1px solid var(--border-hairline)",
              marginBottom: "0",
              fontSize: "13px",
              color: "var(--text-secondary)"
            }}>
              <span>Replying to <strong>{replyTo.users.name}</strong></span>
              <button 
                type="button"
                onClick={() => setReplyTo(null)}
                style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          )}
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
                placeholder={replyTo ? "Write your reply..." : "What are your thoughts?"}
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  borderRadius: replyTo ? "0 0 12px 12px" : "12px",
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
                  {submitting ? "Posting..." : replyTo ? "Reply" : "Post Comment"}
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
        {comments.map(comment => {
          // Find root comments and their replies (for simple threading UI)
          if (comment.parent_id) return null; // We'll render replies under their parents
          
          const replies = comments.filter(r => r.parent_id === comment.id);

          return (
            <div key={comment.id} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <CommentItem 
                comment={comment} 
                onReply={() => {
                  setReplyTo(comment);
                  window.scrollTo({ top: document.querySelector('form')?.offsetTop ? document.querySelector('form')!.offsetTop - 100 : 0, behavior: 'smooth' });
                }}
                onLike={() => handleLikeComment(comment.id)}
                onDelete={() => {
                  setCommentToDelete(comment.id);
                  setIsDeleteModalOpen(true);
                }}
                isOwner={currentUser?.id === comment.user_id}
              />
              
              {replies.length > 0 && (
                <div style={{ marginLeft: "48px", display: "flex", flexDirection: "column", gap: "24px", borderLeft: "2px solid var(--border-hairline)", paddingLeft: "24px" }}>
                  {replies.map(reply => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      onLike={() => handleLikeComment(reply.id)}
                      onDelete={() => {
                        setCommentToDelete(reply.id);
                        setIsDeleteModalOpen(true);
                      }}
                      isOwner={currentUser?.id === reply.user_id}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        isLoading={isDeleting}
      />
    </div>
  );
};

const CommentItem = ({ 
  comment, 
  onReply, 
  onLike, 
  onDelete, 
  isOwner 
}: { 
  comment: Comment, 
  onReply?: () => void, 
  onLike: () => void, 
  onDelete: () => void,
  isOwner: boolean
}) => {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
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
        <p style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: "1.5", whiteSpace: "pre-wrap", marginBottom: "8px" }}>
          {comment.content}
        </p>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={onLike}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "4px", 
              background: "none", 
              border: "none", 
              fontSize: "13px", 
              color: comment.liked ? "#ef4444" : "var(--text-tertiary)", 
              cursor: "pointer",
              padding: 0
            }}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={14} className={comment.liked ? "hugeicon-filled" : ""} />
            <span style={{ fontWeight: 600 }}>{comment.likes_count || 0}</span>
          </button>
          
          {onReply && (
            <button 
              onClick={onReply}
              style={{ background: "none", border: "none", fontSize: "13px", color: "var(--text-tertiary)", cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              Reply
            </button>
          )}

          {isOwner && (
            <button 
              onClick={onDelete}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0 }}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCommentsSection;
