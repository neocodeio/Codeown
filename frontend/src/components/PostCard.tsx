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
import { ChatCircle, Heart, BookmarkSimple, ShareNetwork, DotsThree, PencilSimple, Trash } from "phosphor-react";
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
        padding: isMobile ? "32px 20px" : "48px 40px",
        backgroundColor: "var(--bg-page)",
        borderBottom: "0.5px solid var(--border-hairline)",
        display: "flex",
        gap: "24px",
        transition: "all 0.15s ease",
        width: "100%",
        boxSizing: "border-box"
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-page)";
      }}
    >
      {/* Avatar Col */}
      <div style={{ flexShrink: 0 }}>
        <div onClick={handleUserClick} style={{ cursor: "pointer" }}>
          <AvailabilityBadge
            avatarUrl={post.user?.avatar_url || null}
            name={post.user?.name || "User"}
            size={40}
            isOpenToOpportunities={post.user?.is_pro === true && post.user?.is_hirable === true}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              onClick={handleUserClick}
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                textTransform: "uppercase"
              }}
            >
              {userName}
            </span>
            <VerifiedBadge username={post.user?.username} isPro={post.user?.is_pro} size="14px" />
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              @{post.user?.username || 'user'}
            </span>
            <span style={{ color: "var(--border-hairline)" }}>•</span>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              {formatRelativeDate(post.created_at).toUpperCase()}
            </span>
          </div>

          {isOwnPost && (
            <div style={{ position: "relative" }} ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "2px",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                  <DotsThree size={20} weight="thin" />
                </button>

              {isMenuOpen && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0,
                    backgroundColor: "var(--bg-page)", borderRadius: "2px", border: "0.5px solid var(--border-hairline)",
                    boxShadow: "none", zIndex: 10, padding: "4px", minWidth: "160px"
                  }}>
                    {[
                      { icon: PencilSimple, label: "Edit", onClick: handleEdit, color: "var(--text-primary)" },
                      { icon: Trash, label: "Delete", onClick: handleDeleteClick, color: "#ef4444" }
                    ].map((item, i) => (
                      <button key={i} onClick={item.onClick} style={{
                        width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px",
                        border: "none", background: "none", cursor: "pointer", borderRadius: "2px",
                        fontSize: "11px", fontWeight: 800, color: item.color, fontFamily: "var(--font-mono)", textTransform: "uppercase"
                      }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                        <item.icon size={16} weight="thin" />
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
          lineHeight: "1.7",
          color: "var(--text-secondary)",
          marginBottom: "24px",
        }}>
          {post.title && <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 12px", letterSpacing: "-0.02em", textTransform: "uppercase" }}>{post.title}</h2>}
          <ContentRenderer content={post.content} />
        </div>

        {/* Media */}
        {post.images && post.images.length > 0 && (
          <div style={{ borderRadius: "2px", overflow: "hidden", border: "0.5px solid var(--border-hairline)", marginBottom: "24px" }}>
            <ImageSlider images={post.images} />
          </div>
        )}

        {/* Interaction Tray */}
        <div style={{ 
          display: "flex", 
          marginTop: "24px",
          gap: isMobile ? "20px" : "40px", 
          alignItems: "center",
          justifyContent: "flex-start"
        }}>
          {[
            { 
              icon: ChatCircle, 
              count: post.comment_count, 
              onClick: handleComment, 
              hoverColor: "var(--text-primary)",
            },
            { 
              icon: Heart, 
              count: likeCount, 
              onClick: handleLike, 
              active: isLiked, 
              activeColor: "var(--text-primary)",
              weight: isLiked ? "fill" as const : "thin" as const
            },
            { 
              icon: BookmarkSimple, 
              onClick: handleSave, 
              active: isSaved, 
              activeColor: "var(--text-primary)",
              weight: isSaved ? "fill" as const : "thin" as const
            },
            { 
              icon: ShareNetwork, 
              onClick: handleShare, 
              hoverColor: "var(--text-primary)",
            }
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", padding: "4px 0",
                cursor: "pointer", color: action.active ? action.activeColor : "var(--text-tertiary)",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-mono)",
                fontSize: "12px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = action.hoverColor || action.activeColor || "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = action.active ? action.activeColor : "var(--text-tertiary)";
              }}
            >
                 <action.icon size={20} weight={action.weight || "thin"} />
              {action.count !== undefined && action.count > 0 && (
                <span style={{ fontWeight: 800, letterSpacing: "0.05em" }}>{action.count.toString().padStart(2, '0')}</span>
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

