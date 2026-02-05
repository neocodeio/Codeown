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
  faShareNodes,
  faThumbtack,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { formatRelativeDate } from "../utils/date";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
  index?: number;
  onPin?: () => void;
  isPinned?: boolean;
}

export default function PostCard({ post, onUpdated, index = 0, onPin, isPinned }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isLiked, likeCount, toggleLike, loading: likeLoading } = useLikes(post.id, post.isLiked, post.like_count);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(post.id, post.isSaved);
  const [shareCopied, setShareCopied] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnPost = currentUser?.id === post.user_id;

  useEffect(() => {
    if (post.id && post.user_id) {
      // fetchLikeStatus(); // Handled internally by useLikes hook now
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
  return (
    <>
      <div
        className="slide-up"
        style={{
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          marginBottom: isMobile ? "20px" : "24px",
          padding: "0",
          borderRadius: isMobile ? "20px" : "24px",
          overflow: "hidden",
          animationDelay: `${index * 0.1}s`,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.03)",
        }}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.06)";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.03)";
          e.currentTarget.style.borderColor = "#e0e0e0";
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "14px 14px 10px" : "20px 20px 14px",
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
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              backgroundColor: "#f8fafc",
              border: "1px solid #f1f5f9",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div>
              <div style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "#1e293b",
                marginBottom: "0px",
              }}>
                {userName}
              </div>
              <div style={{
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}>
                {formatRelativeDate(post.created_at)}
              </div>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            {isPinned && (
              <div style={{
                fontSize: "10px",
                color: "#fff",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                backgroundColor: "#364182",
                padding: "6px 12px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(54, 65, 130, 0.2)"
              }}>
                <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: "10px" }} />
                <span>Featured</span>
              </div>
            )}

            {isOwnPost && (
              <div style={{
                display: "flex",
                gap: "8px",
              }}>
                {onPin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPin(); }}
                    style={{
                      width: "38px",
                      height: "38px",
                      background: isPinned ? "#eef2ff" : "white",
                      border: "1px solid",
                      borderColor: isPinned ? "#364182" : "#f1f5f9",
                      color: isPinned ? "#364182" : "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isPinned ? "#e0e7ff" : "#f8fafc";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isPinned ? "#eef2ff" : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: "14px" }} />
                  </button>
                )}
                <button
                  onClick={handleEdit}
                  style={{
                    width: "38px",
                    height: "38px",
                    background: "white",
                    border: "1px solid #f1f5f9",
                    color: "#64748b",
                    cursor: "pointer",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.color = "#1e293b";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.color = "#64748b";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: "14px" }} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    width: "38px",
                    height: "38px",
                    background: "#fff1f2",
                    border: "1px solid #ffe4e6",
                    color: "#ef4444",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = "#ffe4e6";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff1f2";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px" }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? "0 14px 14px" : "0 20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {post.title && (
            <h2 dir="auto" style={{
              fontSize: isMobile ? "15px" : "20px",
              fontWeight: "900",
              color: "#1e293b",
              marginBottom: "0", // Changed from 12px to 0 due to gap on parent
              lineHeight: "1.4",
              letterSpacing: "-0.02em"
            }}>
              {post.title}
            </h2>
          )}
          {post.content && (
            <div style={{
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#475569",
              marginBottom: "16px",
            }}>
              <ContentRenderer content={post.content} />
            </div>
          )}

          {post.images && post.images.length > 0 && (
            <div style={{ marginBottom: "20px", borderRadius: "20px", overflow: "hidden" }}>
              <ImageSlider images={post.images} />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "16px",
            }}>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    backgroundColor: "#f1f5f9",
                    color: "#364182",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid #e2e8f0"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#eef2ff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#364182";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/search?q=${encodeURIComponent(tag)}`);
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "12px 16px 16px" : "14px 20px 20px",
          backgroundColor: "#fff",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
          }}>
            <button
              onClick={handleLike}
              disabled={likeLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: isLiked ? "#fff1f2" : "#f8fafc",
                border: "1px solid",
                borderColor: isLiked ? "#fecdd3" : "#f1f5f9",
                color: isLiked ? "#ef4444" : "#64748b",
                cursor: likeLoading ? "not-allowed" : "pointer",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "800",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                if (!likeLoading) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = isLiked ? "#ffe4e6" : "#f1f5f9";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = isLiked ? "#fff1f2" : "#f8fafc";
              }}
            >
              <FontAwesomeIcon
                icon={faHeartSolid}
                style={{
                  fontSize: "18px",
                  transition: "transform 0.2s ease",
                  transform: isLiked ? "scale(1.1)" : "scale(1)"
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
                padding: "8px 14px",
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
                color: "#64748b",
                cursor: "pointer",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "800",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.color = "#364182";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "18px" }} />
              <span>{post.comment_count || 0}</span>
            </button>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#64748b",
              fontSize: "13px",
              fontWeight: 700,
              marginRight: isMobile ? "2px" : "4px",
            }}>
              <FontAwesomeIcon icon={faEye} style={{ fontSize: "14px", opacity: 0.7 }} />
              <span>{post.view_count || 0}</span>
            </div>

            <button
              onClick={handleShare}
              style={{
                width: "40px",
                height: "40px",
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
                color: shareCopied ? "#10b981" : "#64748b",
                cursor: "pointer",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              title={shareCopied ? "Link Copied!" : "Share Post"}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.backgroundColor = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "#f8fafc";
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
                  padding: "6px 12px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  whiteSpace: "nowrap",
                  marginBottom: "8px",
                  fontWeight: 900,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                }}>
                  COPIED!
                </span>
              )}
            </button>

            <button
              onClick={handleSave}
              style={{
                width: "40px",
                height: "40px",
                background: isSaved ? "#eef2ff" : "#f8fafc",
                border: "1px solid",
                borderColor: isSaved ? "#364182" : "#f1f5f9",
                color: isSaved ? "#364182" : "#64748b",
                cursor: "pointer",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.backgroundColor = isSaved ? "#e0e7ff" : "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = isSaved ? "#eef2ff" : "#f8fafc";
              }}
            >
              <FontAwesomeIcon
                icon={isSaved ? faBookmarkSolid : faBookmarkRegular}
                style={{
                  fontSize: "16px",
                }}
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

