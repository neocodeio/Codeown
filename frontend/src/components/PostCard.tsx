import { useState, useEffect, useRef, memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Post } from "../hooks/usePosts";
import EditPostModal from "./EditPostModal";
import ImageGrid from "./ImageGrid";
import ContentRenderer, { CodeBlock } from "./ContentRenderer";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import {
  WorkIcon,
  HourglassIcon,
  ConfusedIcon,
  Comment01Icon,
  Bookmark02Icon,
  Share01Icon,
  SentIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Delete02Icon,
  ChartBarLineIcon,
  PinIcon,
  RepostIcon,
  CheckmarkCircle02Icon,
  Download01Icon,
  AttachmentIcon,
  SparklesIcon
} from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import { useWindowSize } from "../hooks/useWindowSize";
import ShareModal from "./ShareModal";
import SendToChatModal from "./SendToChatModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";
import UserHoverCard from "./UserHoverCard";
import Lightbox from "./Lightbox";
import QuickCommentModal from "./QuickCommentModal";
import InlineFollowButton from "./InlineFollowButton";
import LikeButton from "./LikeButton";
import ReShipModal from "./ReShipModal";

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
  const [isVoting, setIsVoting] = useState(false);
  const [votedOption, setVotedOption] = useState<number | null>(post.poll?.userVoted ?? null);
  const { isLiked, likeCount, toggleLike } = useLikes(post.id, post.isLiked, post.like_count);
  const { isSaved, toggleSave } = useSaved(post.id, post.isSaved);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isQuickCommentOpen, setIsQuickCommentOpen] = useState(false);
  const [isReShipModalOpen, setIsReShipModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Use prop if provided, otherwise use local state
  const isPinned = isPinnedProp !== undefined ? isPinnedProp : isPinnedLocal;

  const isOwnPost = currentUser?.id === post.user_id;

  // Fetch pinned state on mount only if prop is not provided
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
  }, [isPinnedProp, isOwnPost, currentUser?.id, post.id, getToken]);

  const handlePinPost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    try {
      const token = await getToken();
      if (!token) return;
      const endpoint = isPinned ? "/users/pin/unpin" : `/users/pin/${post.id}`;
      await api.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPinnedLocal(!isPinned);
      toast.success(isPinned ? "Post unpinned" : "Post pinned to profile");
      // Trigger profile refetch so PINNED label updates without page refresh
      window.dispatchEvent(new Event("profileUpdated"));
      onUpdated?.();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin");
    }
  };

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
    setIsQuickCommentOpen(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleSendToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSendToChatModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleReShip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReShipModalOpen(true);
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

  const handleVote = async (optionIndex: number) => {
    if (!currentUser || votedOption !== null || isVoting) return;

    setIsVoting(true);
    try {
      const token = await getToken();
      await api.post(`/posts/${post.id}/vote`, {
        optionIndex
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVotedOption(optionIndex);
      toast.success("Vote recorded!");
      onUpdated?.();
    } catch (error) {
      console.error("Error voting:", error);
      // Fallback for demo if endpoint doesn't exist yet
      setVotedOption(optionIndex);
      toast.info("Vote simulated (backend support pending)");
    } finally {
      setIsVoting(false);
    }
  };

  const handleImageClick = (index: number) => {
    if (post.images && post.images[index]) {
      setLightboxImage(post.images[index]);
      setIsLightboxOpen(true);
    }
  };

  const handleCardClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    navigate(`/post/${post.id}`);
  };

  const handleDownload = (e: React.MouseEvent, fileSource: string | undefined, fileName: string) => {
    e.stopPropagation();
    if (!fileSource) return;
    const link = document.createElement("a");
    link.href = fileSource;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        padding: "var(--post-padding, 20px 16px)",
        backgroundColor: "transparent",
        display: "flex",
        gap: isMobile ? "12px" : "16px",
        transition: "background-color 0.15s linear",
        width: "100%",
        boxSizing: "border-box",
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Avatar Col */}
      <div style={{ flexShrink: 0 }}>
        <UserHoverCard userId={post.user_id} user={post.user as any}>
          <div onClick={handleUserClick} style={{ cursor: "pointer" }}>
            <AvailabilityBadge
              avatarUrl={post.user?.avatar_url || null}
              name={post.user?.name || "User"}
              size={36}
              isOpenToOpportunities={post.user?.is_pro === true && post.user?.is_hirable === true}
              isOG={post.user?.is_og}
              username={post.user?.username}
            />
          </div>
        </UserHoverCard>
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
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Name + Badges Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <UserHoverCard userId={post.user_id} user={post.user as any}>
                  <span
                    onClick={handleUserClick}
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.015em",
                      cursor: "pointer"
                    }}
                  >
                    {userName}
                  </span>
                </UserHoverCard>
                <VerifiedBadge username={post.user?.username} isPro={post.user?.is_pro} size="14px" />
                <InlineFollowButton userId={post.user_id} />
              </div>
            </div>

            {(post.post_type === "Announcement" || post.post_type === "Re-Ship") && (
              <div style={{
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: post.post_type === "Re-Ship" ? "#3b82f6" : "#f59e0b",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                <HugeiconsIcon icon={post.post_type === "Re-Ship" ? RepostIcon : SparklesIcon} size={14} />
                <span>{post.post_type}</span>
              </div>
            )}

            {/* Handle + Metadata Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "1px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                @{post.user?.username || 'user'}
              </span>
              <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
              <span style={{ fontSize: "12.5px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                {formatRelativeDate(post.created_at)}
              </span>

              {post.project && (
                <>
                  <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/project/${post.project?.id}`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12.5px",
                      color: "#0096ff",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "1px 8px",
                      borderRadius: "var(--radius-xs)",
                      transition: "all 0.15s ease",
                      backgroundColor: "rgba(0, 150, 255, 0.05)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 150, 255, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 150, 255, 0.05)"}
                  >
                    <span>{post.project.name}</span>
                  </div>
                </>
              )}
            </div>


          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {post.post_type && (
              <span style={{
                fontSize: "9.5px",
                fontWeight: 700,
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-hover)",
                padding: "2px 10px",
                borderRadius: "var(--radius-pill)",
                display: isMobile ? "none" : "flex",
                alignItems: "center",
                gap: "4px",
                border: `0.5px solid ${post.post_type === "Update" ? "var(--border-hairline)" :
                  post.post_type === "WIP" ? "rgba(255, 170, 0, 0.4)" :
                    post.post_type === "Stuck" ? "rgba(255, 77, 79, 0.4)" :
                      "rgba(168, 85, 247, 0.4)"
                  }`,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                transition: "all 0.2s ease"
              }}>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  color: post.post_type === "Update" ? "var(--text-tertiary)" :
                    post.post_type === "WIP" ? "#ffaa00" :
                      post.post_type === "Stuck" ? "#ff4d4f" :
                        "#a855f7"
                }}>
                  {post.post_type === "Update" && <HugeiconsIcon icon={RepostIcon} size={11} />}
                  {post.post_type === "WIP" && <HugeiconsIcon icon={WorkIcon} size={11} />}
                  {post.post_type === "Stuck" && <HugeiconsIcon icon={HourglassIcon} size={11} />}
                  {post.post_type === "Advice" && <HugeiconsIcon icon={ConfusedIcon} size={11} />}
                </span>
                {post.post_type}
              </span>
            )}

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
                    borderRadius: "var(--radius-md)",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={22} />
                </button>

                {isMenuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: "0",
                    marginTop: "8px",
                    backgroundColor: "var(--bg-card)",
                    border: "0.5px solid var(--border-hairline)",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    minWidth: isMobile ? "200px" : "180px",
                    padding: "6px",
                    animation: "dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}>
                    {[
                      { icon: PencilEdit02Icon, label: "Edit post", onClick: handleEdit, color: "var(--text-primary)" },
                      { icon: PinIcon, label: isPinned ? "Unpin from profile" : "Pin to profile", onClick: handlePinPost, color: "var(--text-primary)" },
                      { icon: Delete02Icon, label: "Delete post", onClick: handleDeleteClick, color: "#ff4d4f" }
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={item.onClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          width: "100%",
                          padding: "10px 14px",
                          background: "none",
                          border: "none",
                          color: item.color,
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          borderRadius: "10px",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          transition: "all 0.1s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = item.color === "#ff4d4f" ? "rgba(255, 77, 79, 0.08)" : "var(--bg-hover)";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <HugeiconsIcon icon={item.icon} size={18} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Text */}
        <div style={{
          fontSize: isMobile ? "14.5px" : "15px",
          lineHeight: "1.6",
          color: "var(--text-primary)",
          marginBottom: "12px",
          position: "relative",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          wordBreak: "break-word",
          overflowWrap: "break-word"
        }}>
          {post.title && <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{post.title}</h2>}

          <div style={{ position: "relative" }}>
            <ContentRenderer
              content={!isExpanded && post.content.length > 300
                ? post.content.substring(0, 300) + "..."
                : post.content
              }
              hidePreview={!!(post.images && post.images.length > 0)}
            />

            {(post as any).code_snippet && (
              <div style={{ marginTop: "16px" }}>
                <CodeBlock language="typescript" code={(post as any).code_snippet} />
              </div>
            )}

            {post.content.length > 300 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 0",
                  marginTop: "8px",
                  display: "block",
                  opacity: 0.8,
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>

        {/* Re-Ship (Quote) Preview */}
        {(post.reposted_post || post.reposted_project) && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (post.reposted_post) navigate(`/post/${post.reposted_post.id}`);
              else if (post.reposted_project) navigate(`/project/${post.reposted_project.id}`);
            }}
            style={{
              marginBottom: "20px",
              padding: "16px",
              borderRadius: "16px",
              border: "0.5px solid var(--border-hairline)",
              backgroundColor: "var(--bg-hover)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--text-tertiary)";
              e.currentTarget.style.backgroundColor = "var(--bg-card)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border-hairline)";
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            }}
          >
            {/* Header of quoted content */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={(post.reposted_post?.user?.avatar_url || post.reposted_project?.user?.avatar_url) || "https://images.clerk.dev/static/avatar.png"}
                alt=""
                style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
              />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                {post.reposted_post?.user?.name || post.reposted_project?.user?.name || "User"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                • {formatRelativeDate(post.reposted_post?.created_at || post.reposted_project?.created_at)}
              </span>
            </div>

            {/* Content of quoted content */}
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {post.reposted_post ? (
                <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  <ContentRenderer content={post.reposted_post.content} />
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{post.reposted_project?.title}</div>
                  <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.reposted_project?.description}
                  </div>
                </>
              )}
            </div>

            {/* Quoted Image Preview */}
            {(post.reposted_post?.images?.[0] || post.reposted_project?.cover_image) && (
              <div style={{
                borderRadius: "12px",
                overflow: "hidden",
                height: "160px",
                border: "0.5px solid var(--border-hairline)"
              }}>
                <img
                  src={(post.reposted_post?.images?.[0] || post.reposted_project?.cover_image) || undefined}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
          </div>
        )}

        {post.images && post.images.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <ImageGrid images={post.images} onImageClick={handleImageClick} />
          </div>
        )}

        {/* Attachments Section */}
        {post.attachments && post.attachments.length > 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px"
          }}>
            {/* <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <DownloadSimple size={18} weight="bold" color="var(--text-primary)" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Downloads</span>
            </div> */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {post.attachments.map((file, idx) => (
                <div
                  key={idx}
                  onClick={(e) => handleDownload(e, file.url || (file as any).data, file.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-hover)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-hairline)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.backgroundColor = "var(--bg-page)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor: "var(--bg-page)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "0.5px solid var(--border-hairline)",
                      flexShrink: 0
                    }}>
                      <HugeiconsIcon icon={AttachmentIcon} size={18} style={{ color: "var(--text-primary)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <HugeiconsIcon icon={Download01Icon} size={20} style={{ color: "var(--text-tertiary)" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll UI */}
        {post.poll && post.poll.options && post.poll.options.length > 0 && (
          <div style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "var(--bg-hover)",
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <HugeiconsIcon icon={ChartBarLineIcon} size={18} style={{ color: "var(--text-primary)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Poll</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {post.poll.options.map((option, idx) => {
                const votes = post.poll?.votes || {};
                const voteCount = Number(votes[idx] || 0);
                const totalVotes = Object.values(votes).reduce((a: number, b: any) => a + Number(b), 0) || (votedOption !== null ? 1 : 0);
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const isSelected = votedOption === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleVote(idx)}
                    disabled={votedOption !== null || isVoting}
                    style={{
                      position: "relative",
                      width: "100%",
                      padding: "14px 16px",
                      backgroundColor: "transparent",
                      border: isSelected ? "1.5px solid var(--text-primary)" : "1.5px solid var(--border-hairline)",
                      borderRadius: "var(--radius-sm)",
                      cursor: votedOption !== null ? "default" : "pointer",
                      textAlign: "left",
                      overflow: "hidden",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                  >
                    {votedOption !== null && (
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${percentage}%`,
                        backgroundColor: "var(--bg-hover)",
                        borderRight: percentage > 0 ? "1px solid var(--border-hairline)" : "none",
                        borderRadius: "var(--radius-sm)",
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                        zIndex: 0
                      }} />
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        opacity: isSelected ? 1 : 0.8
                      }}>
                        {option || "Option " + (idx + 1)}
                        {isSelected && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} style={{ marginLeft: "8px", verticalAlign: "middle" }} />}
                      </span>
                      {votedOption !== null && (
                        <span style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: isSelected ? "var(--text-primary)" : "var(--text-tertiary)",
                        }}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                {Object.values(post.poll?.votes || {}).reduce((a: number, b: any) => a + Number(b), 0) + (votedOption !== null && post.poll && !post.poll.votes?.[votedOption] ? 1 : 0)} votes • {votedOption !== null ? "Final results" : "Select an option to vote"}
              </span>
            </div>
          </div>
        )}

        {/* Interaction Tray */}
        <div style={{
          display: "flex",
          marginTop: isMobile ? "24px" : "32px",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: isMobile ? "0" : "12px",
          maxWidth: "480px"
        }}>
          {/* Comment */}
          <button
            onClick={handleComment}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", padding: "4px 0",
              cursor: "pointer", color: "var(--text-tertiary)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
          >
            <HugeiconsIcon icon={Comment01Icon} size={20} />
            {(post.comment_count ?? 0) > 0 && (
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{post.comment_count}</span>
            )}
          </button>

          {/* Like */}
          <LikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            onToggle={handleLike}
          />

          {/* Re-Ship */}
          <button
            onClick={handleReShip}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", padding: "4px 0",
              cursor: "pointer", color: "var(--text-tertiary)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#3b82f6"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
            title="Re-Ship"
          >
            <HugeiconsIcon icon={RepostIcon} size={20} />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", padding: "4px 0",
              cursor: "pointer", color: isSaved ? "var(--text-primary)" : "var(--text-tertiary)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = isSaved ? "var(--text-primary)" : "var(--text-tertiary)"}
          >
            <HugeiconsIcon icon={Bookmark02Icon} size={20} className={isSaved ? "hugeicon-filled" : ""} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", padding: "4px 0",
              cursor: "pointer", color: "var(--text-tertiary)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
          >
            <HugeiconsIcon icon={Share01Icon} size={20} />
          </button>

          {/* Send */}
          <button
            onClick={handleSendToChat}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", padding: "4px 0",
              cursor: "pointer", color: "var(--text-tertiary)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
          >
            <HugeiconsIcon icon={SentIcon} size={20} />
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
      <ReShipModal
        isOpen={isReShipModalOpen}
        onClose={() => setIsReShipModalOpen(false)}
        originalPost={post}
        onSuccess={onUpdated}
      />
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={lightboxImage}
        postUrl={shareUrl}
        author={post.user ? {
          name: post.user.name || "User",
          username: post.user.username || "user",
          avatar_url: post.user.avatar_url || null
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
      {postCardContent}
    </>
  );
});

export default PostCard;
