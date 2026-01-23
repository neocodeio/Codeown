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
    if (post.id) {
      fetchLikeStatus();
      fetchSavedStatus();
    }
  }, [post.id]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user_id) {
      navigate(`/user/${post.user_id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  };

  const userName = post.user?.name || "User";
  const userEmail = post.user?.email || null;
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=000000&color=ffffff&bold=true`;

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this post?")) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.delete(`/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated ? onUpdated() : window.location.reload();
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      onClick={handleClick}
      className="fade-in"
      style={{
        backgroundColor: "#f5f5f5",
        padding: "0",
        borderRadius: "20px",
        marginBottom: "30px",
        cursor: "pointer",
        border: "1px solid #e0e0e0",
        position: "relative",
        transition: "transform 0.2s ease",
      }}
    >
      <div style={{ padding: "24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div 
              onClick={handleUserClick}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "var(--primary)",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            </div>
            <div>
              <div
                onClick={handleUserClick}
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                {userName}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700, letterSpacing: "0.1em" }}>
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>

          {isOwnPost && (
            <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleEditClick}
                style={{
                  padding: "4px 8px",
                  border: "1px solid gray",
                  borderRadius: "4px",
                  fontSize: "15px",
                  backgroundColor: "gray",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  padding: "4px 8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "4px",
                  fontSize: "15px",
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )}
        </div>

        {post.title && (
          <h3 style={{
            fontSize: "24px",
            fontWeight: 800,
            marginBottom: "16px",
          }}>
            {post.title}
          </h3>
        )}

        <div style={{
          marginBottom: post.images && post.images.length > 0 ? "24px" : "0",
          fontSize: "16px",
          lineHeight: "1.6",
        }}>
          <ContentRenderer content={post.content} />
        </div>

        {post.images && post.images.length > 0 && (
          <div style={{ border: "1px solid var(--border-color)", marginBottom: "24px" }}>
            <ImageSlider images={post.images} />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(`#${tag}`)}`);
                }}
                style={{
                  fontSize: "13px",
                  marginTop: "5px",
                  padding: "2px 8px",
                  border: "1px solid var(--border-color)",
                  fontWeight: 800,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          borderTop: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={toggleLike}
          disabled={!currentUser || likeLoading}
          style={{
            flex: 1,
            border: "none",
            borderRight: "1px solid var(--border-color)",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            justifyContent: "center",
            gap: "8px",
            fontSize: "12px",
            backgroundColor: isLiked ? "var(--text-primary)" : "transparent",
            color: isLiked ? "var(--bg-page)" : "var(--text-primary)",
          }}
        >
          <FontAwesomeIcon icon={faHeartSolid} />
          <span>{likeCount || 0}</span>
        </button>

        <button
          onClick={() => navigate(`/post/${post.id}`)}
          style={{
            flex: 1,
            border: "none",
            borderRight: "1px solid var(--border-color)",
            padding: "12px",
            display: "flex",
            color: "#000",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>{post.comment_count || 0}</span>
        </button>

        <button
          onClick={toggleSave}
          style={{
            flex: 1,
            border: "none",
            padding: "12px",
            display: "flex",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            backgroundColor: isSaved ? "var(--accent)" : "transparent",
            color: isSaved ? "#2563eb" : "var(--text-primary)",
          }}
        >
          <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkRegular} />
        </button>
      </div>

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => onUpdated ? onUpdated() : window.location.reload()}
        post={post}
      />
    </article>
  );
}
