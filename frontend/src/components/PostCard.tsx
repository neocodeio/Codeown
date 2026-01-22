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
  faPenToSquare,
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
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getAvatarUrl = (name: string, email: string | null) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=5046e5&color=ffffff&size=128&bold=true`;
  };

  const userName = post.user?.name || "User";
  const userEmail = post.user?.email || null;
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
        backgroundColor: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        padding: isMobile ? "20px" : "24px",
        marginBottom: "24px",
        boxShadow: "var(--shadow)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        border: "1px solid var(--border-color)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "var(--primary-light)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={avatarUrl}
            alt={userName}
            onClick={handleUserClick}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              objectFit: "cover",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
            }}
          />
          <div>
            <div
              onClick={handleUserClick}
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
              {formatDate(post.created_at)}
            </div>
          </div>
        </div>

        {isOwnPost && (
          <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEditClick}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: "14px" }} />
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "rgba(220, 38, 38, 0.05)",
                color: "var(--error)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px" }} />
            </button>
          </div>
        )}
      </div>

      {post.title && (
        <h3 style={{
          color: "var(--text-primary)",
          fontSize: isMobile ? "18px" : "20px",
          fontWeight: 700,
          lineHeight: "1.4",
          marginBottom: "12px",
          fontFamily: "Outfit, sans-serif",
        }}>
          {post.title}
        </h3>
      )}

      <div style={{
        marginBottom: post.images && post.images.length > 0 ? "16px" : "0",
        color: "var(--text-secondary)",
        fontSize: "15px",
        lineHeight: "1.6",
      }}>
        <ContentRenderer content={post.content} />
      </div>

      {post.images && post.images.length > 0 && (
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "16px" }}>
          <ImageSlider images={post.images} />
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search?q=${encodeURIComponent(`#${tag}`)}`);
              }}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                backgroundColor: "var(--primary-light)",
                color: "white",
                borderRadius: "6px",
                fontWeight: 600,
                opacity: 0.9,
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
          gap: "24px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-light)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={toggleLike}
          disabled={!currentUser || likeLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: isLiked ? "var(--error)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "14px",
            padding: "4px 0",
          }}
        >
          <FontAwesomeIcon 
            icon={faHeartSolid} 
            style={{ 
              fontSize: "18px",
              transition: "transform 0.2s",
              transform: isLiked ? "scale(1.1)" : "scale(1)",
            }}
          />
          <span>{likeCount || 0}</span>
        </button>

        <button
          onClick={() => navigate(`/post/${post.id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "14px",
            padding: "4px 0",
          }}
        >
          <FontAwesomeIcon icon={faComment} style={{ fontSize: "18px" }} />
          <span>{post.comment_count || 0}</span>
        </button>

        <button
          onClick={toggleSave}
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: isSaved ? "var(--primary)" : "var(--text-secondary)",
            fontSize: "18px",
            padding: "4px",
          }}
        >
          <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkRegular} />
        </button>
        
        <button
          style={{
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "18px",
            padding: "4px",
          }}
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            alert("Link copied!");
          }}
        >
          <FontAwesomeIcon icon={faShareNodes} />
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
