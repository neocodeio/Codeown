import { useState, useEffect, useRef, memo } from "react";
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
import { ChatCircle, Heart, BookmarkSimple, ShareNetwork, DotsThree, PencilSimple, Trash, ChartBar, PaperPlaneTilt, PushPin } from "phosphor-react";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
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
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);

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
        padding: isMobile ? "24px 20px" : "40px",
        backgroundColor: "var(--bg-page)",
        borderBottom: "0.5px solid var(--border-hairline)",
        display: "flex",
        gap: "20px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <UserHoverCard userId={post.user_id} user={post.user as any}>
              <span
                onClick={handleUserClick}
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.012em",
                  cursor: "pointer"
                }}
              >
                {userName}
              </span>
            </UserHoverCard>
            <VerifiedBadge username={post.user?.username} isPro={post.user?.is_pro} size="14px" />
            <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 400 }}>
              @{post.user?.username || 'user'}
            </span>
            <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
            <span style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
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
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "var(--radius-md)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                  <DotsThree size={22} weight="thin" />
                </button>

              {isMenuOpen && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0,
                    backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)",
                    boxShadow: "none", zIndex: 10, padding: "4px", minWidth: "160px"
                  }}>
                    {[
                      { icon: PushPin, label: isPinned ? "Unpin" : "Pin to Profile", onClick: handlePinPost, color: "var(--text-primary)" },
                      { icon: PencilSimple, label: "Edit", onClick: handleEdit, color: "var(--text-primary)" },
                      { icon: Trash, label: "Delete", onClick: handleDeleteClick, color: "#ef4444" }
                    ].map((item, i) => (
                      <button key={i} onClick={item.onClick} style={{
                        width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px",
                        border: "none", background: "none", cursor: "pointer", borderRadius: "var(--radius-sm)",
                        fontSize: "12px", fontWeight: 600, color: item.color,
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
          fontSize: "15.5px",
          lineHeight: "1.5",
          color: "var(--text-primary)",
          marginBottom: "16px",
        }}>
          {post.title && <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.015em" }}>{post.title}</h2>}
          <ContentRenderer content={post.content} />
        </div>

        {post.images && post.images.length > 0 && (
          <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)", marginBottom: "24px" }}>
            <ImageSlider images={post.images} onImageClick={handleImageClick} />
          </div>
        )}

        {/* Poll UI */}
        {post.poll && post.poll.options && post.poll.options.length > 0 && (
          <div style={{
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "var(--bg-hover)",
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Shimmer Animation Style */}
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ChartBar size={18} weight="bold" color="var(--text-primary)" />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Poll</span>
              </div>
              {votedOption !== null && (
                 <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Results
                 </div>
              )}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {post.poll.options.map((option, idx) => {
                const votes = post.poll?.votes || {};
                const voteCount = Number(votes[idx] || 0);
                const totalVotes = Object.values(votes).reduce((a: number, b: any) => a + Number(b), 0) || (votedOption !== null ? 1 : 0);
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const isSelected = votedOption === idx;
                
                // Logic for "Founder's Choice" (Creator's vote)
                // If the poll has creatorVoteIndex, use it. Otherwise, if author is current user, use votedOption.
                const isCreatorVote = post.poll?.creatorVoteIndex === idx || (isOwnPost && votedOption === idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleVote(idx)}
                    disabled={votedOption !== null || isVoting}
                    style={{
                      position: "relative",
                      width: "100%",
                      padding: "14px 16px",
                      backgroundColor: isSelected ? "var(--text-primary)" : "var(--bg-page)",
                      border: "0.5px solid var(--border-hairline)",
                      borderRadius: "var(--radius-sm)",
                      cursor: votedOption !== null ? "default" : "pointer",
                      textAlign: "left",
                      overflow: "hidden",
                      transition: "all 0.3s var(--ease-smooth)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    {/* Glassmorphic Progress Bar */}
                    {votedOption !== null && (
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${percentage}%`,
                        backgroundColor: isSelected ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.04)",
                        transition: "width 1s var(--ease-smooth)",
                        zIndex: 0,
                        overflow: "hidden"
                      }}>
                        {/* Shimmer Effect */}
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                          animation: "shimmer 2s infinite linear",
                          display: isSelected ? "block" : "none"
                        }} />
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1, width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          fontSize: "14px",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "var(--bg-page)" : "var(--text-primary)",
                        }}>
                          {option}
                        </span>
                        {isCreatorVote && votedOption !== null && (
                          <div 
                            title="Founder's Choice"
                            style={{ 
                              fontSize: "10px", 
                              backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--bg-hover)",
                              color: isSelected ? "var(--bg-page)" : "var(--text-tertiary)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              border: isSelected ? "none" : "0.5px solid var(--border-hairline)"
                            }}
                          >
                            <PushPin size={10} weight="fill" />
                            FOUNDER
                          </div>
                        )}
                      </div>
                      
                      {votedOption !== null && (
                        <span style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: isSelected ? "var(--bg-page)" : "var(--text-primary)",
                          opacity: isSelected ? 1 : 0.6
                        }}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
               <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                  {Object.values(post.poll?.votes || {}).reduce((a: number, b: any) => a + Number(b), 0) + (votedOption !== null && post.poll && !post.poll.votes?.[votedOption] ? 1 : 0)} votes • {votedOption !== null ? "Results" : "Select to vote"}
               </span>
               {votedOption !== null && (
                 <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3].map(i => (
                       <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)", opacity: 0.4 }} />
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Interaction Tray */}
        <div style={{ 
          display: "flex", 
          marginTop: "44px",
          gap: isMobile ? "32px" : "96px", 
          alignItems: "center",
          justifyContent: "flex-start"
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
