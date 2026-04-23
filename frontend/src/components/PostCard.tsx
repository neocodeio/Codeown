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
  ConfusedIcon,
  SmartPhone02Icon
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
import InlineFollowButton from "./InlineFollowButton";
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
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count || 0);

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
      // data: { id, content, ..., reposter_id, removed }
      if (String(data.id) === String(post.id)) {
        if (data.removed) {
          setRepostCountLocal(prev => Math.max(0, prev - 1));
          if (data.reposter_id === currentUser?.id) {
            setIsRepostedLocal(false);
          }
        } else {
          setRepostCountLocal(prev => prev + 1);
          if (data.reposter_id === currentUser?.id) {
            setIsRepostedLocal(true);
          }
        }
      }
    };

    const handleCommentUpdate = (data: any) => {
      if (String(data.postId) === String(post.id)) {
        setLocalCommentCount(data.commentCount);
      }
    };

    socket.on("post_reposted", handleRepostUpdate);
    socket.on("post_commented", handleCommentUpdate);

    return () => {
      socket.off("post_reposted", handleRepostUpdate);
      socket.off("post_commented", handleCommentUpdate);
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

  const postType = displayPost?.post_type;
  const getPostTypeTheme = () => {
    switch (postType) {
      case "WIP":
        return {
          glow: "rgba(255, 170, 0, 0.02)",
          accent: "#ffaa00",
          border: "rgba(255, 170, 0, 0.15)",
          icon: WorkIcon,
          mesh: "radial-gradient(circle at 100% 0%, rgba(255, 170, 0, 0.05) 0%, transparent 40%)"
        };
      case "Stuck":
        return {
          glow: "rgba(255, 77, 79, 0.02)",
          accent: "#ff4d4f",
          border: "rgba(255, 77, 79, 0.15)",
          icon: UserQuestion01Icon,
          mesh: "radial-gradient(circle at 100% 0%, rgba(255, 77, 79, 0.05) 0%, transparent 40%)"
        };
      case "Advice":
        return {
          glow: "rgba(168, 85, 247, 0.02)",
          accent: "#a855f7",
          border: "rgba(168, 85, 247, 0.15)",
          icon: ConfusedIcon,
          mesh: "radial-gradient(circle at 100% 0%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)"
        };
      case "Update":
        return {
          glow: "transparent",
          accent: "var(--text-tertiary)",
          border: "var(--border-hairline)",
          icon: ReloadIcon,
          mesh: "none"
        };
      default:
        return {
          glow: "transparent",
          accent: "var(--text-tertiary)",
          border: "var(--border-hairline)",
          icon: null,
          mesh: "none"
        };
    }
  };

  const theme = getPostTypeTheme();
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
          padding: isMobile ? "12px 10px 14px" : "20px 16px 16px",
          borderBottom: "0.5px solid var(--border-hairline)",
          backgroundColor: theme.glow !== "transparent" ? theme.glow : "var(--bg-page)",
          backgroundImage: theme.mesh,
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          width: "100%"
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.backgroundColor = theme.glow !== "transparent"
              ? theme.glow.replace("0.02", "0.04")
              : "rgba(var(--text-primary-rgb), 0.01)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.backgroundColor = theme.glow !== "transparent" ? theme.glow : "transparent";
          }
        }}
      >
        {/* Subtle Side Indicator */}
        {postType && postType !== "Update" && (
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: isMobile ? "0px" : "0px",
            backgroundColor: theme.accent,
            opacity: 0.3,
            zIndex: 1
          }} />
        )}

        {post.is_activity_repost && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: isMobile ? "32px" : "44px", // Align with content, not avatar
            marginBottom: "6px",
            position: "relative"
          }}>
            <img
              src={post.reposter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.reposter?.name || "U")}&background=212121&color=fff&bold=true`}
              style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover", border: "0.5px solid var(--border-hairline)", zIndex: 2 }}
              alt=""
            />
            <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              {post.reposter?.name || "Someone"}
              <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>Re-Shipped</span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: isMobile ? "10px" : "12px" }}>
          <div
            onClick={handleUserClick}
            style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
          >
            <UserHoverCard userId={primaryUser?.id || ""} user={primaryUser as any}>
              <AvailabilityBadge
                avatarUrl={primaryUser?.avatar_url || null}
                name={primaryUser?.name || "User"}
                size={isMobile ? 38 : 48}
                isOpenToOpportunities={!!(primaryUser && (primaryUser as any).is_pro && (primaryUser as any).is_hirable)}
                isOG={(primaryUser as any)?.is_og}
                username={primaryUser?.username || "user"}
              />
            </UserHoverCard>
            {(primaryUser as any)?.is_pro && (
              <div style={{
                position: "absolute",
                bottom: "-1px",
                right: "-1px",
                backgroundColor: "var(--bg-page)",
                borderRadius: "50%",
                padding: "1px",
                display: "flex"
              }}>
                <HugeiconsIcon icon={SparklesIcon} size={isMobile ? 10 : 12} style={{ color: "#3b82f6" }} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "4px",
              gap: "4px"
            }}>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                    <UserHoverCard userId={primaryUser?.id || ""} user={primaryUser as any}>
                      <span
                        onClick={handleUserClick}
                        style={{
                          fontWeight: 700,
                          fontSize: isMobile ? "14px" : "15px",
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
                  </div>
                  {!isMobile && <InlineFollowButton userId={primaryUser?.id || ""} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: isMobile ? "0px" : "-2px" }}>
                  <span style={{ color: "var(--text-tertiary)", fontSize: isMobile ? "12px" : "13px", whiteSpace: "nowrap" }}>
                    @{primaryUser?.username || 'user'}
                  </span>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "12px", opacity: 0.5 }}>•</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: "var(--text-tertiary)", fontSize: isMobile ? "12px" : "13px", whiteSpace: "nowrap" }}>
                      {formatRelativeDate(displayPost?.created_at)}
                    </span>
                    {(displayPost as any)?.is_mobile && (
                      <div className="mobile-tooltip-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <HugeiconsIcon 
                        icon={SmartPhone02Icon} 
                        size={13} 
                        strokeWidth={2.5}
                        style={{ color: "var(--text-tertiary)", opacity: 0.9, cursor: "help" }}
                      />
                      <div className="mobile-tooltip">Posted via mobile app</div>
                    </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                {postType && (
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: isMobile ? "9px" : "10px",
                    fontWeight: 800,
                    color: theme.accent,
                    backgroundColor: postType === "Update" ? "transparent" : theme.glow.replace("0.02", "0.1"),
                    padding: postType === "Update" ? "0" : "2px 6px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                    border: postType === "Update" ? "none" : `0.5px solid ${theme.border}`,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}>
                    {theme.icon && <HugeiconsIcon icon={theme.icon} size={isMobile ? 10 : 12} />}
                    {postType}
                  </span>
                )}

                {isOwnPost && (
                  <div style={{ position: "relative" }} ref={menuRef}>
                    <button
                      onClick={toggleMenu}
                      style={{
                        background: "none", border: "none", color: "var(--text-tertiary)",
                        cursor: "pointer", padding: "4px", borderRadius: "100px",
                        transition: "all 0.15s ease", display: "flex", alignItems: "center"
                      }}
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={isMobile ? 18 : 20} />
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
              fontSize: isMobile ? "14px" : "15px", 
              lineHeight: "1.5", 
              color: "var(--text-primary)",
              marginBottom: "12px", 
              position: "relative", 
              wordBreak: "break-word"
            }}>
              {displayPost?.title && <h2 style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 700, margin: "0 0 6px" }}>{displayPost.title}</h2>}
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
              <div style={{ marginBottom: isMobile ? "10px" : "16px" }}>
                <ImageGrid images={displayPost.images} onImageClick={(idx) => {
                  if (displayPost.images?.[idx]) {
                    setLightboxImage(displayPost.images[idx]);
                    setIsLightboxOpen(true);
                  }
                }} />
              </div>
            )}

            <div style={{
              display: "flex", 
              marginTop: isMobile ? "12px" : "16px", 
              alignItems: "center",
              gap: isMobile ? "24px" : "36px",
              justifyContent: "flex-start"
            }}>
              <button 
                onClick={handleComment} 
                className="post-action-btn comment"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)",
                  padding: "0", transition: "all 0.2s ease"
                }}
              >
                <div className="icon-wrapper" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "34px", height: "34px", borderRadius: "50%",
                  transition: "all 0.2s ease", margin: "0 -7px"
                }}>
                  <HugeiconsIcon icon={Comment01Icon} size={isMobile ? 18 : 20} />
                </div>
                {localCommentCount > 0 && <span className="count-text" style={{ fontSize: "12px", fontWeight: 700 }}>{localCommentCount}</span>}
              </button>

              <LikeButton isLiked={isLiked} likeCount={likeCount} onToggle={handleLike} />

              <button 
                onClick={handleReShip} 
                disabled={isReShipping} 
                className="post-action-btn reship"
                style={{
                  display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                  cursor: isReShipping ? "default" : "pointer", 
                  color: isRepostedLocal ? "#10b981" : "var(--text-tertiary)",
                  padding: "0", transition: "all 0.2s ease"
                }}
              >
                <div className="icon-wrapper" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "34px", height: "34px", borderRadius: "50%",
                  transition: "all 0.2s ease", margin: "0 -7px"
                }}>
                  <HugeiconsIcon icon={RepostIcon} size={isMobile ? 18 : 20} />
                </div>
                {repostCountLocal > 0 && (
                  <span className="count-text" style={{ fontSize: "12px", fontWeight: 700 }}>{repostCountLocal}</span>
                )}
              </button>

              <button 
                onClick={handleSave} 
                className="post-action-btn save"
                style={{
                  display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                  cursor: "pointer", 
                  color: isSaved ? "#3b82f6" : "var(--text-tertiary)",
                  padding: "0", transition: "all 0.2s ease"
                }}
              >
                <div className="icon-wrapper" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "34px", height: "34px", borderRadius: "50%",
                  transition: "all 0.2s ease", margin: "0 -7px"
                }}>
                  <HugeiconsIcon icon={Bookmark02Icon} size={isMobile ? 18 : 20} className={isSaved ? "hugeicon-filled" : ""} />
                </div>
              </button>

              <button 
                onClick={handleShare} 
                className="post-action-btn share"
                style={{
                  display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                  cursor: "pointer", color: "var(--text-tertiary)",
                  padding: "0", transition: "all 0.2s ease"
                }}
              >
                <div className="icon-wrapper" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "34px", height: "34px", borderRadius: "50%",
                  transition: "all 0.2s ease", margin: "0 -7px"
                }}>
                  <HugeiconsIcon icon={Share01Icon} size={isMobile ? 18 : 20} />
                </div>
              </button>

              <style>{`
                .mobile-tooltip {
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%) translateY(-10px);
                  background-color: #000;
                  color: #fff;
                  padding: 6px 12px;
                  border-radius: 10px;
                  font-size: 11px;
                  font-weight: 700;
                  white-space: nowrap;
                  opacity: 0;
                  visibility: hidden;
                  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                  z-index: 1001;
                  pointer-events: none;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .mobile-tooltip-wrapper:hover .mobile-tooltip {
                  opacity: 1;
                  visibility: visible;
                  transform: translateX(-50%) translateY(-6px);
                }
                .post-action-btn:hover .icon-wrapper { background-color: rgba(var(--text-primary-rgb), 0.05); } 
                .post-action-btn.comment:hover { color: #6366f1 !important; }
                .post-action-btn.comment:hover .icon-wrapper { background-color: rgba(99, 102, 241, 0.1) !important; }
                .post-action-btn.reship:hover { color: #10b981 !important; }
                .post-action-btn.reship:hover .icon-wrapper { background-color: rgba(16, 185, 129, 0.1) !important; }
                .post-action-btn.save:hover { color: #3b82f6 !important; }
                .post-action-btn.save:hover .icon-wrapper { background-color: rgba(59, 130, 246, 0.1) !important; }
                .post-action-btn.share:hover { color: #3b82f6 !important; }
                .post-action-btn.share:hover .icon-wrapper { background-color: rgba(59, 130, 246, 0.1) !important; }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default PostCard;
