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
// import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faComment,
  faBookmark as faBookmarkSolid,
  faBookmark as faBookmarkRegular,
  faTrash,
  faPen,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
  index?: number;
}

export default function PostCard({ post, onUpdated, index = 0 }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isLiked, likeCount, toggleLike, fetchLikeStatus, loading: likeLoading } = useLikes(post.id);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(post.id);
  const [shareCopied, setShareCopied] = useState(false);
  //   const { width } = useWindowSize();
  //   const isMobile = width < 768;

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
    const shareData = {
      title: `Codeown - Post by ${post.user?.name || post.user?.username || 'User'}`,
      text: post.title || post.content?.substring(0, 100) || '',
      url: `https://codeown.space/post/${post.id}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`https://codeown.space/post/${post.id}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
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

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  };

  return (
    <>
      <div
        className="card fade-in slide-up"
        style={{
          cursor: "pointer",
          transition: "all 0.3s ease",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          marginBottom: "30px",
          padding: "10px",
          borderRadius: "25px",
          overflow: "hidden",
          animationDelay: `${index * 0.1}s`
        }}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px",
          borderBottom: "1px solid #e0e0e0",
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
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              backgroundColor: "rgba(0,0,0,0.03)",
              padding: "4px 8px",
              borderRadius: "8px",
            }}>
              {formatRelativeDate(post.created_at)}
            </div>

            {isOwnPost && (
              <div style={{
                display: "flex",
                gap: "0",
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
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: "14px", backgroundColor: "#fff", borderRadius: "8px", padding: "8px", color: "#000", border: "2px solid #e0e0e0" }} />
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
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px", backgroundColor: "red", borderRadius: "8px", padding: "8px", color: "#fff", border: "2px solid #e0e0e0", }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {post.title && (
            <h2 dir="auto" style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "12px",
              lineHeight: "1.4",
            }}>
              {post.title}
            </h2>
          )}
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
          backgroundColor: "#fff",
          borderRadius: "15px",
          border: "1px solid #e0e0e0",
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
                background: "red",
                border: "none",
                color: isLiked ? "var(--error)" : "#fff",
                cursor: likeLoading ? "not-allowed" : "pointer",
                borderRadius: "10px",
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
              onClick={handleShare}
              style={{
                padding: "8px",
                background: "none",
                border: "none",
                color: shareCopied ? "var(--success, #10b981)" : "var(--text-secondary)",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              title={shareCopied ? "Link Copied!" : "Share Post"}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = shareCopied ? "#10b981" : "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = shareCopied ? "#10b981" : "var(--text-secondary)";
              }}
            >
              <FontAwesomeIcon
                icon={faShareNodes}
                style={{ fontSize: "16px" }}
              />
              {shareCopied && (
                <span style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  whiteSpace: "nowrap",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}>
                  COPIED!
                </span>
              )}
            </button>

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
        onUpdated={onUpdated || (() => { })}
      />
    </>
  );
}

