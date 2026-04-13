import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Post } from "../hooks/usePosts";
import EditPostModal from "./EditPostModal";
import ImageSlider from "./ImageSlider";
import ContentRenderer, { CodeBlock } from "./ContentRenderer";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { ChatCircle, Heart, BookmarkSimple, ShareNetwork, DotsThree, PencilSimple, Trash, ChartBar, PaperPlaneTilt, PushPin, ArrowsClockwise, CheckCircle, DownloadSimple, Paperclip } from "phosphor-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    WorkIcon, 
    HourglassIcon, 
    ConfusedIcon 
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
import RollingNumber from "./RollingNumber";

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
    navigate(`/post/${post.id}#comments`);
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
        boxSizing: "border-box"
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        // Absolute minimal interaction - relies entirely on the pointer cursor
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.015)";
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
              </div>
            </div>

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
                      navigate(`/project/${post.project?.slug}`);
                    }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "4px", 
                      fontSize: "12.5px", 
                      color: "#0096ff", 
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "1px 6px",
                      borderRadius: "6px",
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
                  fontWeight: 900, 
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-hover)",
                  padding: "2px 10px",
                  borderRadius: "100px",
                  display: isMobile ? "none" : "flex",
                  alignItems: "center",
                  gap: "4px",
                  border: `0.5px solid ${
                    post.post_type === "Update" ? "var(--border-hairline)" :
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
                    {post.post_type === "Update" && <ArrowsClockwise size={11} weight="bold" />}
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
                    <DotsThree size={22} weight="thin" />
                  </button>

              {isMenuOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "4px",
                  backgroundColor: "var(--bg-card)",
                  border: "0.5px solid var(--border-hairline)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  minWidth: "160px",
                  padding: "6px",
                  animation: "dropdownFadeIn 0.15s ease-out"
                }}>
                  {[
                      { icon: PencilSimple, label: "Edit post", onClick: handleEdit, color: "var(--text-primary)" },
                      { icon: PushPin, label: isPinned ? "Unpin from profile" : "Pin to profile", onClick: handlePinPost, color: "var(--text-primary)", weight: isPinned ? "fill" : "regular" },
                      { icon: Trash, label: "Delete post", onClick: handleDeleteClick, color: "#ff4d4f" }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.onClick}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px 12px",
                        background: "none",
                        border: "none",
                        color: item.color,
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        borderRadius: "var(--radius-sm)",
                        transition: "background-color 0.15s linear"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.color === "#ff4d4f" ? "rgba(255, 77, 79, 0.1)" : "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <item.icon size={16} weight={(item as any).weight || "regular"} />
                      {item.label}
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
                  fontWeight: 800,
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

        {post.images && post.images.length > 0 && (
          <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)", marginBottom: "16px" }}>
            <ImageSlider images={post.images} onImageClick={handleImageClick} />
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
                    borderRadius: "14px",
                    border: "1px solid var(--border-hairline)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                    e.currentTarget.style.transform = "translateY(-1px)";
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
                      borderRadius: "10px",
                      backgroundColor: "var(--bg-page)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "0.5px solid var(--border-hairline)",
                      flexShrink: 0
                    }}>
                      <Paperclip size={18} color="var(--text-primary)" />
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
                  <DownloadSimple size={20} color="var(--text-tertiary)" weight="thin" />
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
              <ChartBar size={18} weight="bold" color="var(--text-primary)" />
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
                      borderRadius: "14px",
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
                        {isSelected && <CheckCircle size={14} weight="fill" style={{ marginLeft: "8px", verticalAlign: "middle" }} />}
                      </span>
                      {votedOption !== null && (
                        <span style={{
                          fontSize: "13px",
                          fontWeight: 800,
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
          marginTop: isMobile ? "8px" : "12px",
          gap: isMobile ? "0" : "var(--post-interact-gap, 48px)", 
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start",
          paddingRight: isMobile ? "0" : "0"
        }}>
          { [
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
              activeColor: "#ef4444",
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
            },
            {
              icon: PaperPlaneTilt,
              onClick: handleSendToChat,
              hoverColor: "var(--text-primary)",
            }
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.onClick}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "none", border: "none", padding: "4px 0",
                  cursor: "pointer", color: action.active ? action.activeColor : "var(--text-tertiary)",
                  transition: "all 0.2s ease",
                  fontSize: "13px",
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = action.hoverColor || action.activeColor || (Icon === Heart ? "#ef4444" : "var(--text-primary)");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = action.active ? action.activeColor : "var(--text-tertiary)";
                }}
              >
                <Icon size={20} weight={action.weight || "regular"} />
                {Icon === Heart ? (
                  <RollingNumber value={action.count || 0} fontWeight={500} fontSize="13px" color="inherit" />
                ) : (
                  action.count !== undefined && action.count > 0 && (
                    <span>{action.count}</span>
                  )
                )}
              </button>
            );
          })}
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
      <Lightbox 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
        imageSrc={lightboxImage} 
      />
      {postCardContent}
    </>
  );
});

export default PostCard;
