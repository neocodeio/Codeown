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
  faPenToSquare
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
    if (post.id) {
      fetchLikeStatus();
      fetchSavedStatus();
    }
  }, [post.id]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post card click
    if (post.user_id) {
      navigate(`/user/${post.user_id}`);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  // Generate avatar URL from user's name or email (fallback if no avatar_url)
  const getAvatarUrl = (name: string, email: string | null) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=000&color=ffffff&size=128&bold=true&font-size=0.5`;
  };

  const userName = post.user?.name || "User";
  const userEmail = post.user?.email || null;
  // Use avatar_url from backend if available, otherwise generate one
  const avatarUrl = post.user?.avatar_url || getAvatarUrl(userName, userEmail);

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to delete post");
        setIsDeleting(false);
        return;
      }

      await api.delete(`/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (onUpdated) {
        onUpdated();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete post";
      alert(`Failed to delete post: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      onClick={handleClick}
      style={{
        backgroundColor: "#0F172A",
        borderRadius: "30px",
        padding: isMobile ? "20px" : "28px",
        marginBottom: "50px",
        boxShadow: "var(--shadow)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        border: "1px solid var(--border-light)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-hover)";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--border-light)";
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--border-light)",
        flexWrap: isMobile ? "wrap" : "nowrap",
      }}>
        <img
          src={avatarUrl}
          alt={userName}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--border-color)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            onClick={handleUserClick}
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "2px",
              cursor: "pointer",
              transition: "color 0.2s",
              wordBreak: "break-word",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {userName}
          </div>
          {userEmail && !isMobile && (
            <div style={{
              fontSize: "13px",
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {userEmail}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <time style={{
            color: "#fff",
            fontSize: isMobile ? "11px" : "13px",
            fontWeight: 500,
          }}>
            {formatDate(post.created_at)}
          </time>
          {isOwnPost && (
            <div style={{ display: "flex", gap: "4px", marginLeft: isMobile ? "0" : "8px", flexWrap: "wrap" }}>
              <button
                onClick={handleEditClick}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "var(--bg-hover)",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary)";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              >
                <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: "12px" }} />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  borderRadius: "6px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                  opacity: isDeleting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "#dc2626";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = "#fef2f2";
                    e.currentTarget.style.color = "#dc2626";
                    e.currentTarget.style.borderColor = "#fecaca";
                  }
                }}
              >
                {isDeleting ? "..." : <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {post.title && (
        <h3 style={{
          color: "#fff",
          fontSize: isMobile ? "18px" : "22px",
          fontWeight: 700,
          lineHeight: "1.3",
          marginBottom: "12px",
          marginTop: 0,
          wordBreak: "break-word",
          letterSpacing: "-0.01em",
        }}>
          {post.title}
        </h3>
      )}

      {/* Post Content */}
      <div style={{
        marginBottom: post.images && post.images.length > 0 ? "16px" : 0, color: "#fff",
      }}>
        <ContentRenderer content={post.content} fontSize={isMobile ? "14px" : "16px"} />
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <ImageSlider images={post.images} />
      )}

      {post.tags && post.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px", marginBottom: "16px" }}>
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search?q=${encodeURIComponent(`#${tag}`)}`);
              }}
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                backgroundColor: "var(--bg-hover)",
                color: "#fff",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                border: "1px solid var(--border-color)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "12px" : "20px",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-light)",
          flexWrap: "wrap",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={toggleLike}
          disabled={!currentUser || likeLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: "transparent",
            border: "none",
            cursor: currentUser && !likeLoading ? "pointer" : "not-allowed",
            borderRadius: "var(--radius-md)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            color: isLiked ? "var(--heart-liked)" : "#fff",
            opacity: currentUser ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (currentUser && !likeLoading) {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon 
            icon={faHeartSolid} 
            style={{ 
              fontSize: "20px",
              color: isLiked ? "var(--heart-liked)" : "var(--text-secondary)",
            }}
            className={isLiked ? "liked-heart" : "unliked-heart"}
            color={isLiked ? "var(--heart-liked)" : "var(--text-secondary)"}
          />
          <span style={{ fontSize: "15px", fontWeight: 600 }}>
            {likeCount || post.like_count || 0}
          </span>
        </button>

        <button
          onClick={() => navigate(`/post/${post.id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            color: "#fff",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon 
            icon={faComment} 
            style={{ fontSize: "20px" }}
          />
          <span style={{ fontSize: "15px", fontWeight: 600 }}>
            {post.comment_count || 0}
          </span>
        </button>

        {currentUser && (
          <button
            onClick={toggleSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              color: isSaved ? "#262bef" : "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <FontAwesomeIcon 
              icon={isSaved ? faBookmarkSolid : faBookmarkRegular} 
              style={{ fontSize: "20px" }}
            />
          </button>
        )}
      </div>

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => {
          if (onUpdated) {
            onUpdated();
          } else {
            window.location.reload();
          }
        }}
        post={post}
      />
    </article>
  );
}