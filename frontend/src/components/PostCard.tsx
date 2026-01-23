import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Post } from "../hooks/usePosts";
import EditPostModal from "./EditPostModal";
import ImageSlider from "./ImageSlider";
import ContentRenderer from "./ContentRenderer";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart as faHeartSolid,
  faComment,
  faBookmark as faBookmarkSolid,
  faBookmark as faBookmarkRegular,
  faTrash,
  faPen, 
  faShareNodes
} from "@fortawesome/free-solid-svg-icons";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
}

export default function PostCard({ post, onUpdated }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isLiked, likeCount, toggleLike, fetchLikeStatus, loading: likeLoading } = useLikes(post.id);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(post.id);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnPost = currentUser?.id === post.user_id;

  useEffect(() => {
    if (post.id && post.user_id) {
      fetchLikeStatus();
      fetchSavedStatus();
    }
  }, [post.id, post.user_id]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user_id) {
      navigate(`/user/${post.user_id}`);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/post/${post.id}#comments`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user?.name || post.user?.username || 'User'}`,
          text: post.content?.substring(0, 100) || '',
          url: `${window.location.origin}/post/${post.id}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      try {
        const token = await getToken();
        await api.delete(`/posts/${post.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onUpdated?.();
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  const avatarUrl = post.user?.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name || post.user?.username || "User")}&background=000&color=ffffff&size=64`;
  const userName = post.user?.name || post.user?.username || "User";

  return (
    <>
      <div 
        className="card"
        style={{
          cursor: "pointer",
          transition: "all 0.3s ease",
          backgroundColor: "#f5f5f5",
          border: "2px solid #e0e0e0",
          marginBottom: "30px",
          padding: "10px",
          borderRadius: "25px",
          overflow: "hidden",
        }}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px",
          borderBottom: "1px solid var(--border-light)",
        }}>
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}
            onClick={handleUserClick}
          >
            <div className="avatar avatar-md" style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            </div>
            <div>
              <div style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text-primary)",
                marginBottom: "2px",
              }}>
                {userName}
              </div>
              <div style={{
                fontSize: "12px",
                color: "var(--text-tertiary)",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {isOwnPost && (
            <div style={{
              display: "flex",
              gap: "8px",
            }}>
              <button
                onClick={handleEdit}
                style={{
                  padding: "8px",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <FontAwesomeIcon icon={faPen} style={{ fontSize: "14px" }} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px",
                  background: "none",
                  border: "none",
                  color: isDeleting ? "var(--text-tertiary)" : "var(--text-secondary)",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = "var(--error)";
                    e.currentTarget.style.color = "var(--text-inverse)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = isDeleting ? "var(--text-tertiary)" : "var(--text-secondary)";
                }}
              >
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px" }} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {post.content && (
            <div style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}>
              <ContentRenderer content={post.content} />
            </div>
          )}

          {post.images && post.images.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <ImageSlider images={post.images} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderTop: "1px solid var(--border-light)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}>
            <button
              onClick={handleLike}
              disabled={likeLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "none",
                border: "none",
                color: isLiked ? "var(--error)" : "var(--text-secondary)",
                cursor: likeLoading ? "not-allowed" : "pointer",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!likeLoading) {
                  e.currentTarget.style.backgroundColor = isLiked ? "var(--error)" : "var(--bg-hover)";
                  e.currentTarget.style.color = isLiked ? "var(--text-inverse)" : "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = isLiked ? "var(--error)" : "var(--text-secondary)";
              }}
            >
              <FontAwesomeIcon 
                icon={faHeartSolid} 
                style={{ 
                  fontSize: "16px",
                  transition: "transform 0.2s ease",
                }}
              />
              <span>{likeCount || 0}</span>
            </button>

            <button
              onClick={handleComment}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "16px" }} />
              <span>{post.comment_count || 0}</span>
            </button>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}>
            <button
              onClick={handleSave}
              style={{
                padding: "8px",
                background: "none",
                border: "none",
                color: isSaved ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isSaved ? "var(--accent)" : "var(--bg-hover)";
                e.currentTarget.style.color = isSaved ? "var(--text-inverse)" : "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = isSaved ? "var(--accent)" : "var(--text-secondary)";
              }}
            >
              <FontAwesomeIcon 
                icon={isSaved ? faBookmarkSolid : faBookmarkRegular} 
                style={{ fontSize: "16px" }} 
              />
            </button>
          </div>
        </div>
      </div>

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onUpdated={onUpdated || (() => {})}
      />
    </>
  );
}
    
