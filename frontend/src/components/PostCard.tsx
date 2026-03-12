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
  PinIcon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import UserHoverCard from "./UserHoverCard";
import ShareModal from "./ShareModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
  isPinned?: boolean;
}

export default function PostCard({ post, onUpdated, isPinned }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isLiked, likeCount, toggleLike, loading: likeLoading } = useLikes(post.id, post.isLiked, post.like_count);
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
  const isPro = post.user?.is_pro === true;

  const postCardContent = (
    <div
      className="fade-in post-card-x-style"
      style={{
        cursor: "pointer",
        transition: "background 0.15s ease",
        backgroundColor: isPro ? "rgba(255, 255, 255, 0.75)" : "#fff",
        backdropFilter: isPro ? "blur(12px)" : "none",
        WebkitBackdropFilter: isPro ? "blur(12px)" : "none",
        padding: isMobile ? "16px 16px" : "20px 24px",
        position: "relative",
        display: "flex",
        gap: "12px",
        borderBottom: "1px solid #f1f5f9",
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isPro ? "rgba(255, 255, 255, 0.82)" : "#fcfcfc";
        if (isPro) e.currentTarget.style.transform = "translateY(-1px)";
        const actions = e.currentTarget.querySelector('.post-owner-actions') as HTMLDivElement;
        if (actions) actions.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isPro ? "rgba(255, 255, 255, 0.75)" : "#fff";
        if (isPro) e.currentTarget.style.transform = "translateY(0)";
        const actions = e.currentTarget.querySelector('.post-owner-actions') as HTMLDivElement;
        if (actions) actions.style.opacity = "0";
      }}
    >
      {/* Left Column: Avatar */}
      <div style={{ flexShrink: 0 }}>
        <div
          onClick={handleUserClick}
          style={{
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <AvailabilityBadge
            avatarUrl={post.user?.avatar_url || null}
            name={userName}
            size={isMobile ? 40 : 44}
            isOpenToOpportunities={post.user?.is_pro === true && post.user?.is_hirable === true}
            ringColor={isPro ? "#d4a853" : "#3b82f6"}
          />
        </div>
      </div>

      {/* Right Column: Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Row: Name, Handle, Time, Actions */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "4px",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", minWidth: 0, flex: 1 }}>
            {post.user_id ? (
              <UserHoverCard userId={post.user_id}>
                <span
                  onClick={handleUserClick}
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: "#0f172a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "1px",
                    letterSpacing: "-0.01em"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  {userName}
                  <VerifiedBadge username={post.user?.username} isPro={post.user?.is_pro} size="14px" />
                  {post.user?.is_pro && (
                    <span style={{
                      fontSize: "9px",
                      fontWeight: "800",
                      padding: "1px 4px",
                      borderRadius: "4px",
                      background: "#000",
                      color: "#fff",
                      letterSpacing: "0.06em",
                      marginLeft: "4px",
                      textTransform: "uppercase"
                    }}>PRO</span>
                  )}
                </span>
              </UserHoverCard>
            ) : (
              <span
                onClick={handleUserClick}
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  letterSpacing: "-0.01em"
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >
                {userName}
                <VerifiedBadge username={post.user?.username} isPro={post.user?.is_pro} size="14px" />
              </span>
            )}
            <span
              onClick={handleUserClick}
              style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "400", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              @{post.user?.username || 'user'}
            </span>
            <span style={{ fontSize: "14px", color: "#e2e8f0" }}>•</span>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "400" }}>
              {formatRelativeDate(post.created_at)}
            </span>
            {isPinned && (
              <HugeiconsIcon icon={PinIcon} style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "2px" }} />
            )}
          </div>

          {/* Actions Menu */}
          {isOwnPost && (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={toggleMenu}
                style={{
                  background: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "30px",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  backgroundColor: isMenuOpen ? "#f1f5f9" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (!isMenuOpen) e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  if (!isMenuOpen) e.currentTarget.style.backgroundColor = "transparent";
                  if (!isMenuOpen) e.currentTarget.style.color = "#94a3b8";
                }}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} style={{ fontSize: "16px" }} />
              </button>

              {isMenuOpen && (
                <div
                  className="fade-in"
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    border: "1px solid #e0e0e0",
                    marginTop: "6px",
                    width: "140px",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    zIndex: 100,
                    padding: "4px",
                    overflow: "hidden"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      handleEdit(e);
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                      color: "#0f172a",
                      fontSize: "13px",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <HugeiconsIcon icon={Pen01Icon} style={{ fontSize: "14px" }} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      handleDeleteClick(e);
                      setIsMenuOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                      color: "#ef4444",
                      fontSize: "13px",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <HugeiconsIcon icon={Delete01Icon} style={{ fontSize: "14px" }} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title - Optional in X style but we keep it */}
        {post.title && post.title !== post.content && (
          <h2 dir="auto" style={{
            fontSize: "15px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 4px 0",
            lineHeight: "1.4",
            overflowWrap: "anywhere",
            wordBreak: "break-word"
          }}>
            {post.title}
          </h2>
        )}

        {/* Content */}
        <div dir="auto" style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#0f172a",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          marginBottom: "12px",
          letterSpacing: "-0.01em"
        }}>
          <ContentRenderer content={post.content} />
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div style={{
            marginTop: "12px",
            marginBottom: "16px",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid #f1f5f9",
            transition: "border-color 0.2s"
          }}>
            <ImageSlider images={post.images} />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px", marginTop: "12px" }}>
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  color: "#3b82f6",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  transition: "all 0.2s"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(tag)}`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "425px",
          marginTop: "26px",
          marginLeft: "-8px" // Align icons perfectly with text above
        }}>
          {/* Comment */}
          <button
            onClick={handleComment}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              padding: "4px 0",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#3b82f6";
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) {
                icon.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                icon.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) {
                icon.style.backgroundColor = "transparent";
                icon.style.transform = "scale(1)";
              }
            }}
          >
            <div className="footer-icon" style={{ padding: "8px", borderRadius: "50%", display: "flex", transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
              <HugeiconsIcon icon={Comment02Icon} style={{ fontSize: "16px" }} />
            </div>
            {(post.comment_count || 0) > 0 && <span style={{ fontWeight: 500 }}>{post.comment_count}</span>}
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`post-action-button like-button ${isLiked ? 'is-liked' : ''}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              background: "none",
              border: "none",
              color: isLiked ? "#f91880" : "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              padding: "2px 10px 2px 2px",
              borderRadius: "100px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!isLiked) {
                e.currentTarget.style.color = "#f91880";
                e.currentTarget.style.backgroundColor = "rgba(249, 24, 128, 0.08)";
              }
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) icon.style.transform = "scale(1.15)";
            }}
            onMouseLeave={(e) => {
              if (!isLiked) {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.backgroundColor = "transparent";
              }
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) icon.style.transform = "scale(1)";
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <div
              className="footer-icon"
              style={{
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                animation: isLiked ? "like-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none"
              }}
            >
              <HugeiconsIcon
                icon={FavouriteIcon}
                style={{
                  fontSize: "18px",
                  fill: isLiked ? "currentColor" : "none",
                  strokeWidth: isLiked ? "0" : "1.5px"
                }}
              />
            </div>
            {likeCount > 0 && (
              <span style={{
                fontWeight: isLiked ? "800" : "600",
                transition: "all 0.2s ease",
                transform: isLiked ? "scale(1.05)" : "scale(1)"
              }}>
                {likeCount}
              </span>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 186, 124, 0.08)";
              e.currentTarget.style.color = "#00ba7c";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <HugeiconsIcon icon={Share01Icon} style={{ fontSize: "16px" }} />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              display: "flex",
              background: "none",
              border: "none",
              color: isSaved ? "#3b82f6" : "#64748b",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
              e.currentTarget.style.color = "#3b82f6";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              if (!isSaved) e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <HugeiconsIcon icon={isSaved ? Bookmark01Icon : Bookmark02Icon} style={{ fontSize: "16px" }} />
          </button>
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
      <style>{`
          @keyframes like-pop {
            0% { transform: scale(1); }
            25% { transform: scale(1.3); }
            50% { transform: scale(0.9); }
            100% { transform: scale(1); }
          }
          .post-action-button:active {
            transform: scale(0.95);
          }
        `}</style>

      {!isPro ? (
        postCardContent
      ) : (
        <div
          className="pro-post-expensive-wrapper"
          style={{
            position: "relative",
            margin: "0px",
            borderRadius: "0px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
            borderTop: "none",
            padding: "0px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "-180%",
              width: "180%",
              height: "100%",
              background: "linear-gradient(105deg, transparent 0%, rgba(212, 168, 83, 0.05) 35%, rgba(212, 168, 83, 0.4) 50%, rgba(212, 168, 83, 0.05) 65%, transparent 100%)",
              transform: "skewX(-25deg)",
              animation: "proLuxuryShine 6s cubic-bezier(0.0, 0, 0.2, 1) infinite",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, borderRadius: "0px", overflow: "hidden" }}>
            {postCardContent}
          </div>
          <style>{`
                @keyframes proLuxuryShine {
                  0% { left: -180%; opacity: 0; }
                  10% { opacity: 1; }
                  40% { left: 180%; opacity: 1; }
                  50% { left: 180%; opacity: 0; }
                  100% { left: 180%; opacity: 0; }
                }
              `}</style>
        </div>
      )}
    </>
  );
}

