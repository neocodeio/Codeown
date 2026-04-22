import { useState, useEffect, useRef, memo, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Post } from "../hooks/usePosts";
import EditPostModal from "./EditPostModal";
import ImageGrid from "./ImageGrid";
import ContentRenderer from "./ContentRenderer";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import {
  Comment01Icon,
  Bookmark02Icon,
  Share01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Delete02Icon,
  SparklesIcon,
  RepostIcon,
  ReloadIcon,
  WorkIcon,
  UserQuestion01Icon,
  ConfusedIcon
} from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import { useWindowSize } from "../hooks/useWindowSize";
import ShareModal from "./ShareModal";
import SendToChatModal from "./SendToChatModal";
import { toast } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import UserHoverCard from "./UserHoverCard";
import Lightbox from "./Lightbox";
import QuickCommentModal from "./QuickCommentModal";
import LikeButton from "./LikeButton";
import { socket } from "../lib/socket";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
  isPinned?: boolean;
}

const PostCard = memo(({ post, onUpdated, isPinned: isPinnedProp }: PostCardProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReShipping, setIsReShipping] = useState(false);
  const { isLiked, likeCount, toggleLike } = useLikes(post.id, post.isLiked, post.like_count || 0);
  const { isSaved, toggleSave } = useSaved(post.id, post.isSaved);
  const [isRepostedLocal, setIsRepostedLocal] = useState(post.isReposted || false);
  const [repostCountLocal, setRepostCountLocal] = useState(post.repost_count || 0);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isQuickCommentOpen, setIsQuickCommentOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isPinned = isPinnedProp !== undefined ? isPinnedProp : isPinnedLocal;
  const isOwnPost = currentUser?.id === post.user_id;

  // Simple and Clean: Display the post as provided. 
  // It is already formatted by the backend helper.
  const displayPost = post;
  const primaryUser = displayPost?.user || { id: "", name: "User", username: "user", avatar_url: null, email: null };

  useEffect(() => {
    if (isPinnedProp !== undefined || !isOwnPost || !currentUser?.id) return;
    const fetchPinnedState = async () => {
      try {
        const token = await getToken();
        const res = await api.get(`/users/${currentUser.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setIsPinnedLocal(res.data?.pinned_post_id === post.id);
      } catch { /* ignore */ }
    };
    fetchPinnedState();
  }, [isPinnedProp, isOwnPost, currentUser?.id, post.id, getToken, isPinned]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryUser?.username) {
      navigate(`/${primaryUser.username}`);
    }
  }, [navigate, primaryUser?.username]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please login to like posts");
      return;
    }
    toggleLike();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please login to save posts");
      return;
    }
    toggleSave();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsQuickCommentOpen(true);
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

  useEffect(() => {
    if (!post.id) return;

    const handleRepostUpdate = (data: any) => {
      // data: { id, content, ..., reposter_id }
      if (data.id === post.id) {
        setRepostCountLocal(prev => prev + 1);
        if (data.reposter_id === currentUser?.id) {
          setIsRepostedLocal(true);
        }
      }
    };

    socket.on("post_reposted", handleRepostUpdate);
    return () => {
      socket.off("post_reposted", handleRepostUpdate);
    };
  }, [post.id, currentUser?.id]);

  const handleReShip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please login to Re-Ship");
      return;
    }
    if (isReShipping) return;

    // Optimistic UI
    const originalState = isRepostedLocal;
    const newState = !originalState;
    setIsRepostedLocal(newState);
    setRepostCountLocal(prev => newState ? prev + 1 : prev - 1);

    try {
      setIsReShipping(true);
      const token = await getToken();
      const res = await api.post('/posts/repost', {
        postId: post.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.action === "reposted") {
        toast.success("Shipped to your profile!");
      } else {
        toast.info("Repost removed");
      }

      onUpdated?.();
    } catch (error) {
      console.error("Error re-shipping:", error);
      // Rollback on error
      setIsRepostedLocal(originalState);
      setRepostCountLocal(prev => originalState ? prev + 1 : prev - 1);
      toast.error("Failed to Re-Ship");
    } finally {
      setIsReShipping(false);
    }
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
    if (displayPost?.id) {
      navigate(`/post/${displayPost.id}`);
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const shareUrl = `${window.location.origin}/post/${post.id}`;
  const userName = primaryUser?.name || "User";

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
      <SendToChatModal
        isOpen={isSendToChatModalOpen}
        onClose={() => setIsSendToChatModalOpen(false)}
        postId={post.id}
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
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={lightboxImage}
        postUrl={shareUrl}
        author={primaryUser ? {
          name: primaryUser.name || "User",
          username: primaryUser.username || "user",
          avatar_url: primaryUser.avatar_url || null
        } : undefined}
      />
      <QuickCommentModal
        isOpen={isQuickCommentOpen}
        onClose={() => setIsQuickCommentOpen(false)}
        resourceId={post.id}
        resourceType="post"
        authorName={(post.user?.name || post.user?.username) ?? undefined}
        onSuccess={() => onUpdated?.()}
      />

      <div
        onClick={handleCardClick}
        style={{
          padding: isMobile ? "16px 12px" : "20px 16px 16px",
          borderBottom: "0.5px solid var(--border-hairline)",
          backgroundColor: "var(--bg-page)",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isMobile) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.01)";
        }}
        onMouseLeave={(e) => {
          if (!isMobile) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {post.is_activity_repost && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            // Align center of tiny avatar (20px) with center of large avatar (44px)
            // Header container is inside card padding (16px/12px)
            marginLeft: isMobile ? "8px" : "12px",
            marginBottom: "8px",
            position: "relative"
          }}>
            <img
              src={post.reposter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.reposter?.name || "U")}&background=212121&color=fff&bold=true`}
              style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", border: "0.5px solid var(--border-hairline)", zIndex: 2 }}
              alt=""
            />
            <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              {post.reposter?.name || "Someone"}
              <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>Re-Shipped</span>
            </div>
            {/* Subtle threaded line */}
            <div style={{
              position: "absolute",
              top: "20px",
              left: "10px",
              width: "0.5px",
              height: "12px",
              backgroundColor: "var(--border-hairline)",
              zIndex: 1
            }} />
          </div>
        )}
        <div style={{ display: "flex", gap: isMobile ? "8px" : "12px" }}>
          <div
            onClick={handleUserClick}
            style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
          >
            <UserHoverCard userId={primaryUser?.id || ""} user={primaryUser as any}>
              <AvailabilityBadge
                avatarUrl={primaryUser?.avatar_url || null}
                name={primaryUser?.name || "User"}
                size={isMobile ? 40 : 48}
                isOpenToOpportunities={!!(primaryUser && (primaryUser as any).is_pro && (primaryUser as any).is_hirable)}
                isOG={(primaryUser as any)?.is_og}
                username={primaryUser?.username || "user"}
              />
            </UserHoverCard>
            {(primaryUser as any)?.is_pro && (
              <div style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                backgroundColor: "var(--bg-page)",
                borderRadius: "50%",
                padding: "2px"
              }}>
                <HugeiconsIcon icon={SparklesIcon} size={12} style={{ color: "#3b82f6" }} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, overflow: "hidden" }}>
                <UserHoverCard userId={primaryUser?.id || ""} user={primaryUser as any}>
                  <span
                    onClick={handleUserClick}
                    style={{
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {userName}
                  </span>
                </UserHoverCard>
                <VerifiedBadge username={primaryUser?.username} />
                <span style={{ color: "var(--text-tertiary)", fontSize: "14px", whiteSpace: "nowrap" }}>
                  @{primaryUser?.username || 'user'}
                </span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "14px", whiteSpace: "nowrap" }}>
                  {formatRelativeDate(displayPost?.created_at)}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {displayPost?.post_type && (
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: displayPost.post_type === "WIP" ? "#ffaa00" :
                      displayPost.post_type === "Stuck" ? "#ff4d4f" :
                        displayPost.post_type === "Advice" ? "#a855f7" :
                          "var(--text-tertiary)",
                    backgroundColor: displayPost.post_type === "Update" ? "transparent" :
                      displayPost.post_type === "WIP" ? "rgba(255, 170, 0, 0.1)" :
                        displayPost.post_type === "Stuck" ? "rgba(255, 77, 79, 0.1)" :
                          "rgba(168, 85, 247, 0.12)",
                    padding: displayPost.post_type === "Update" ? "0" : "2px 8px",
                    borderRadius: "6px",
                    whiteSpace: "nowrap"
                  }}>
                    {displayPost.post_type === "WIP" && <HugeiconsIcon icon={WorkIcon} size={12} />}
                    {displayPost.post_type === "Stuck" && <HugeiconsIcon icon={UserQuestion01Icon} size={12} />}
                    {displayPost.post_type === "Advice" && <HugeiconsIcon icon={ConfusedIcon} size={12} />}
                    {displayPost.post_type === "Update" && <HugeiconsIcon icon={ReloadIcon} size={12} />}
                    {displayPost.post_type}
                  </span>
                )}

                {isOwnPost && (
                  <div style={{ position: "relative" }} ref={menuRef}>
                    <button
                      onClick={toggleMenu}
                      style={{
                        background: "none", border: "none", color: "var(--text-tertiary)",
                        cursor: "pointer", padding: "4px", borderRadius: "var(--radius-md)",
                        transition: "all 0.15s ease", display: "flex", alignItems: "center"
                      }}
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={22} />
                    </button>
                    {isMenuOpen && (
                      <div style={{
                        position: "absolute", top: "100%", right: "0",
                        marginTop: "8px", backgroundColor: "var(--bg-card)",
                        borderRadius: "12px", border: "1px solid var(--border-hairline)",
                        boxShadow: "var(--shadow-lg)", zIndex: 10, width: "160px", overflow: "hidden"
                      }}>
                        <button onClick={handleEdit} style={{
                          width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px",
                          background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer",
                          fontSize: "14px", fontWeight: 600, textAlign: "left"
                        }}>
                          <HugeiconsIcon icon={PencilEdit02Icon} size={18} /> Edit
                        </button>
                        <button onClick={handleDeleteClick} style={{
                          width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px",
                          background: "none", border: "none", color: "#ff4d4f", cursor: "pointer",
                          fontSize: "14px", fontWeight: 600, textAlign: "left"
                        }}>
                          <HugeiconsIcon icon={Delete02Icon} size={18} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              fontSize: "15px", lineHeight: "1.6", color: "var(--text-primary)",
              marginBottom: "12px", position: "relative", wordBreak: "break-word"
            }}>
              {displayPost?.title && <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>{displayPost.title}</h2>}
              {displayPost?.content && (
                <ContentRenderer
                  content={!isExpanded && displayPost.content.length > 300
                    ? displayPost.content.substring(0, 300) + "..."
                    : displayPost.content
                  }
                />
              )}
              {displayPost?.content && displayPost.content.length > 300 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  style={{
                    background: "none", border: "none", color: "var(--text-tertiary)",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: "4px 0",
                    marginTop: "4px"
                  }}
                >
                  {isExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {displayPost?.images && displayPost.images.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <ImageGrid images={displayPost.images} onImageClick={(idx) => {
                  if (displayPost.images?.[idx]) {
                    setLightboxImage(displayPost.images[idx]);
                    setIsLightboxOpen(true);
                  }
                }} />
              </div>
            )}

            <div style={{
              display: "flex", marginTop: "16px", alignItems: "center",
              justifyContent: "space-between", maxWidth: "480px"
            }}>
              <button onClick={handleComment} style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)"
              }}>
                <HugeiconsIcon icon={Comment01Icon} size={20} />
                {(displayPost?.comment_count ?? 0) > 0 && <span style={{ fontSize: "13px", fontWeight: 600 }}>{displayPost?.comment_count}</span>}
              </button>

              <LikeButton isLiked={isLiked} likeCount={likeCount} onToggle={handleLike} />

              <button onClick={handleReShip} disabled={isReShipping} style={{
                display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                cursor: isReShipping ? "default" : "pointer", color: isRepostedLocal ? "#10b981" : "var(--text-tertiary)"
              }}>
                <HugeiconsIcon icon={RepostIcon} size={20} />
                {repostCountLocal > 0 && (
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{repostCountLocal}</span>
                )}
              </button>

              <button onClick={handleSave} style={{
                display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                cursor: "pointer", color: isSaved ? "var(--text-primary)" : "var(--text-tertiary)"
              }}>
                <HugeiconsIcon icon={Bookmark02Icon} size={20} />
              </button>

              <button onClick={handleShare} style={{
                display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                cursor: "pointer", color: "var(--text-tertiary)"
              }}>
                <HugeiconsIcon icon={Share01Icon} size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default PostCard;
