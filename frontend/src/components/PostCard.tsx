import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Post } from "../hooks/usePosts";
import EditPostModal from "./EditPostModal";
import ImageSlider from "./ImageSlider";

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

  const isOwnPost = currentUser?.id === post.user_id;

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
    } catch (error: any) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      onClick={handleClick}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "50px",
        padding: "35px",
        marginBottom: "16px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* User Info Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
        paddingBottom: "20px",
        borderBottom: "2px solid #f5f7fa",
      }}>
        <img
          src={avatarUrl}
          alt={userName}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "30%",
            objectFit: "cover",
            border: "2px solid #e4e7eb",
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            onClick={handleUserClick}
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#000",
              marginBottom: "2px",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#2563eb";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {userName}
          </div>
          {userEmail && (
            <div style={{
              fontSize: "13px",
              color: "#64748b",
            }}>
              {userEmail}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <time style={{
            color: "#64748b",
            fontSize: "13px",
            fontWeight: 500,
          }}>
            {formatDate(post.created_at)}
          </time>
          {isOwnPost && (
            <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
              <button
                onClick={handleEditClick}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#f0f7ff",
                  border: "1px solid #000",
                  color: "#000",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f7ff";
                  e.currentTarget.style.color = "#000";
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #dc2626",
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
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = "#fef2f2";
                    e.currentTarget.style.color = "#dc2626";
                  }
                }}
              >
                {isDeleting ? "..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <h3 style={{
          color: "#1a1a1a",
          fontSize: "20px",
          fontWeight: 700,
          lineHeight: "1.4",
          marginBottom: "12px",
          marginTop: 0,
          wordBreak: "break-word",
        }}>
          {post.title}
        </h3>
      )}

      {/* Post Content */}
      <p style={{
        color: "#1a1a1a",
        fontSize: "16px",
        lineHeight: "1.6",
        marginBottom: post.images && post.images.length > 0 ? "16px" : 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {post.content}
      </p>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <ImageSlider images={post.images} />
      )}

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