import { useState, useEffect, useRef } from "react";
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
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Share01Icon,
  FavouriteIcon,
  Comment02Icon,
  Bookmark01Icon,
  Bookmark02Icon,
  Delete01Icon,
  Pen01Icon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import ShareModal from "./ShareModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
}

export default function PostCard({ post, onUpdated }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isLiked, likeCount, toggleLike } = useLikes(post.id, post.isLiked, post.like_count);
  const { isSaved, toggleSave } = useSaved(post.id, post.isSaved);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnPost = currentUser?.id === post.user_id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user?.username) {
      navigate(`/${post.user.username.toLowerCase()}`);
    } else if (post.user_id) {
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const token = await getToken();
      await api.delete(`/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsDeleteModalOpen(false);
      onUpdated?.();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    navigate(`/post/${post.id}`);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const userName = post.user?.name || post.user?.username || "User";
  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const postCardContent = (
    <div
      className="fade-in"
      style={{
        cursor: "pointer",
        padding: isMobile ? "24px 16px" : "32px 24px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        gap: "16px",
        transition: "background-color 0.2s ease",
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#fafafa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#fff";
      }}
    >
      {/* Avatar Col */}
      <div style={{ flexShrink: 0 }}>
        <div onClick={handleUserClick} style={{ cursor: "pointer" }}>
          <AvailabilityBadge
            avatarUrl={post.user?.avatar_url || null}
            name={userName}
            size={isMobile ? 42 : 48}
            isOpenToOpportunities={post.user?.is_pro === true && post.user?.is_hirable === true}
            ringColor="#f1f5f9"
          />
        </div>
      </div>

      {/* Content Col */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Info */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "6px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span
              onClick={handleUserClick}
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              {userName}
            </span>
            <VerifiedBadge username={post.user?.username} isPro={post.user?.is_pro} size="14px" />
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>
              @{post.user?.username || 'user'}
            </span>
            <span style={{ color: "#e2e8f0" }}>•</span>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>
              {formatRelativeDate(post.created_at)}
            </span>
          </div>

          {isOwnPost && (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={toggleMenu}
                style={{
                  background: "none",
                  border: "none",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#0f172a"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#cbd5e1"}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} style={{ fontSize: "18px" }} />
              </button>

              {isMenuOpen && (
                <div style={{
                  position: "absolute", top: "100%", right: 0,
                  backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)", zIndex: 10, padding: "4px", minWidth: "120px"
                }}>
                  {[
                    { icon: Pen01Icon, label: "Edit", onClick: handleEdit, color: "#0f172a" },
                    { icon: Delete01Icon, label: "Delete", onClick: handleDeleteClick, color: "#ef4444" }
                  ].map((item, i) => (
                    <button key={i} onClick={item.onClick} style={{
                      width: "100%", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px",
                      border: "none", background: "none", cursor: "pointer", borderRadius: "6px",
                      fontSize: "13px", fontWeight: "600", color: item.color
                    }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                       onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <HugeiconsIcon icon={item.icon} style={{ fontSize: "14px" }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Text */}
        <div style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#1e293b",
          marginBottom: "16px",
          letterSpacing: "-0.01em"
        }}>
          {post.title && <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>{post.title}</h2>}
          <ContentRenderer content={post.content} />
        </div>

        {/* Media */}
        {post.images && post.images.length > 0 && (
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "16px" }}>
            <ImageSlider images={post.images} />
          </div>
        )}

        {/* Interaction Tray */}
        <div style={{ 
          display: "flex", 
          gap: isMobile ? "12px" : "32px", 
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start"
        }}>
          {[
            { 
              icon: Comment02Icon, 
              count: post.comment_count, 
              onClick: handleComment, 
              hoverColor: "#3b82f6",
              hoverBg: "rgba(59, 130, 246, 0.05)"
            },
            { 
              icon: FavouriteIcon, 
              count: likeCount, 
              onClick: handleLike, 
              active: isLiked, 
              activeColor: "#f91880",
              hoverColor: "#f91880",
              hoverBg: "rgba(249, 24, 128, 0.05)"
            },
            { 
              icon: isSaved ? Bookmark01Icon : Bookmark02Icon, 
              onClick: handleSave, 
              active: isSaved, 
              activeColor: "#3b82f6",
              hoverColor: "#3b82f6",
              hoverBg: "rgba(59, 130, 246, 0.05)"
            },
            { 
              icon: Share01Icon, 
              onClick: handleShare, 
              hoverColor: "#00ba7c",
              hoverBg: "rgba(0, 186, 124, 0.05)"
            }
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", padding: "6px 8px", borderRadius: "8px",
                cursor: "pointer", color: action.active ? action.activeColor : "#94a3b8",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = action.hoverColor;
                e.currentTarget.style.backgroundColor = action.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = action.active ? action.activeColor : "#94a3b8";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <HugeiconsIcon icon={action.icon} style={{ 
                fontSize: "18px",
                fill: action.active ? "currentColor" : "none" 
              }} />
              {action.count !== undefined && action.count > 0 && (
                <span style={{ fontSize: "13px", fontWeight: "700" }}>{action.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onUpdated={onUpdated || (() => { })}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={shareUrl}
        title="Share this post"
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
      {postCardContent}
    </>
  );
}

