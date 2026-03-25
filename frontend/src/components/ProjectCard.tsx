import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
import { useWindowSize } from "../hooks/useWindowSize";
import { ShareNetwork, ArrowCircleUp, ChatCircle, BookmarkSimple, PencilSimple, Trash, DotsThree, PaperPlaneTilt, PushPin } from "phosphor-react";

import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import AvailabilityBadge from "./AvailabilityBadge";
import { getOptimizedImageUrl } from "../utils/image";
import ShareModal from "./ShareModal";
import SendToChatModal from "./SendToChatModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";
import UserHoverCard from "./UserHoverCard";
import RollingNumber from "./RollingNumber";

interface ProjectCardProps {
  project: Project;
  onUpdated?: () => void;
  isPinned?: boolean;
}

const ProjectCard = memo(({ project, onUpdated, isPinned: isPinnedProp }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const { isLiked, likeCount, toggleLike } = useProjectLikes(project.id, project.isLiked, project.like_count);
  const { isSaved, toggleSave } = useProjectSaved(project.id, project.isSaved);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);

  // Use prop if provided, otherwise use local state
  const isPinned = isPinnedProp !== undefined ? isPinnedProp : isPinnedLocal;

  const isOwnProject = currentUser?.id === project.user_id;

  // Fetch pinned state on mount only if prop is not provided
  useEffect(() => {
    if (isPinnedProp !== undefined || !isOwnProject || !currentUser?.id) return;
    const fetchPinnedState = async () => {
      try {
        const token = await getToken();
        const res = await api.get(`/users/${currentUser.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setIsPinnedLocal(res.data?.pinned_project_id === project.id);
      } catch { /* ignore */ }
    };
    fetchPinnedState();
  }, [isPinnedProp, isOwnProject, currentUser?.id, project.id, getToken]);

  const handlePinProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    try {
      const token = await getToken();
      if (!token) return;
      const endpoint = isPinned ? "/users/pin-project/unpin" : `/users/pin-project/${project.id}`;
      await api.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPinnedLocal(!isPinned);
      toast.success(isPinned ? "Project unpinned" : "Project pinned to profile");
      // Trigger profile refetch so PINNED label updates without page refresh
      window.dispatchEvent(new Event("profileUpdated"));
      onUpdated?.();
    } catch (error) {
      console.error("Error toggling project pin:", error);
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
    if (project.user?.username) {
      navigate(`/${project.user.username}`);
    } else if (project.user_id) {
      navigate(`/user/${project.user_id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'paused': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'in_progress': return 'IN PROGRESS';
      case 'paused': return 'PAUSED';
      default: return status.toUpperCase();
    }
  };

  const userName = project.user?.name || "User";
  const shareUrl = `${window.location.origin}/project/${project.id}`;

  const handleClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    navigate(`/project/${project.id}`);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const token = await getToken();
      if (!token) return;
      await api.delete(`/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsDeleteModalOpen(false);
      onUpdated ? onUpdated() : window.location.reload();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }
    await toggleLike();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }
    await toggleSave();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleSendToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSendToChatModalOpen(true);
  };

  return (
    <article
      onClick={handleClick}
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
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-page)";
      }}
    >
      {/* Avatar Col */}
      <div style={{ flexShrink: 0 }}>
        <UserHoverCard userId={project.user_id} user={project.user as any}>
          <div onClick={handleUserClick} style={{ cursor: "pointer" }}>
            <AvailabilityBadge
              avatarUrl={project.user?.avatar_url || null}
              name={userName}
              size={isMobile ? 32 : 36}
              isOpenToOpportunities={project.user?.is_pro === true && project.user?.is_hirable === true}
              isOG={project.user?.is_og}
              username={project.user?.username}
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
            <UserHoverCard userId={project.user_id} user={project.user as any}>
              <span
                onClick={handleUserClick}
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.012em",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                {userName}
              </span>
            </UserHoverCard>
            <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="14px" />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              @{project.user?.username || 'user'}
            </span>
            <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
              {formatRelativeDate(project.created_at).toUpperCase()}
            </span>
            
            {project.looking_for_contributors && (
              <>
                <span style={{ color: "var(--border-hairline)" }}>•</span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "0.5px solid rgba(34, 197, 94, 0.2)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Seeking Co-Founder</span>
                </div>
              </>
            )}
            
            {/* Status pill inside header flow */}
            <div style={{
              marginLeft: "12px",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "transparent",
              border: "0.5px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <div style={{ width: "4px", height: "4px", borderRadius: "var(--radius-xs)", backgroundColor: getStatusColor(project.status) }} />
              <span style={{ fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{getStatusText(project.status)}</span>
            </div>
          </div>

          {isOwnProject && (
            <div style={{ position: "relative" }} ref={menuRef}>
                <button
                onClick={toggleMenu}
                style={{
                  background: "none", border: "none", color: "var(--text-tertiary)",
                  cursor: "pointer", padding: "4px", borderRadius: "var(--radius-sm)",
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
                    { icon: PushPin, label: isPinned ? "Unpin" : "Pin to Profile", onClick: handlePinProject, color: "var(--text-primary)" },
                    { icon: PencilSimple, label: "Edit", onClick: handleEditClick, color: "var(--text-primary)" },
                    { icon: Trash, label: "Delete", onClick: handleDeleteClick, color: "#ef4444" }
                  ].map((item, i) => (
                    <button key={i} onClick={(e) => { item.onClick(e); setIsMenuOpen(false); }} style={{
                      width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px",
                      border: "none", background: "none", cursor: "pointer", borderRadius: "var(--radius-sm)",
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

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "10px", letterSpacing: "-0.01em", textTransform: "uppercase" }}>{project.title}</h3>
          <p style={{ fontSize: "14.5px", lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "20px" }}>{project.description}</p>
          
          {/* Tech Stack Chips */}
          {project.technologies_used && project.technologies_used.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {project.technologies_used.map((tech, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/?type=projects&tag=${encodeURIComponent(tech)}`);
                  }}
                    style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "transparent",
                    color: "var(--text-tertiary)",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {tech}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {project.cover_image && (
          <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "0.5px solid var(--border-hairline)", marginBottom: "24px", aspectRatio: "16/9" }}>
            <img src={getOptimizedImageUrl(project.cover_image)} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
        )}

        {/* Interactions */}
        <div style={{ 
          display: "flex", 
          gap: isMobile ? "20px" : "40px", 
          alignItems: "center",
          justifyContent: "flex-start"
        }}>
          { [
            { 
              icon: ChatCircle, 
              count: project.comment_count, 
              onClick: (e: any) => { e.stopPropagation(); navigate(`/project/${project.id}`); }, 
              hoverColor: "var(--text-primary)",
            },
            { 
              icon: ArrowCircleUp, 
              count: likeCount, 
              onClick: handleLike, 
              active: isLiked, 
              activeColor: "#3b82f6",
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
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = action.hoverColor || action.activeColor || (Icon === ArrowCircleUp ? "#3b82f6" : "var(--text-primary)");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = action.active ? action.activeColor : "var(--text-tertiary)";
                }}
              >
                <Icon size={22} weight={action.weight || "thin"} />
                {Icon === ArrowCircleUp ? (
                  <RollingNumber value={action.count || 0} fontWeight={800} fontSize="12px" color="inherit" />
                ) : (
                  action.count !== undefined && action.count > 0 && (
                    <span style={{ fontWeight: 800, letterSpacing: "0.05em" }}>{action.count}</span>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showEditModal && (
        <ProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            if (onUpdated) onUpdated();
          }}
          project={project}
        />
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={shareUrl}
        title="Share this project"
      />
      <SendToChatModal
        isOpen={isSendToChatModalOpen}
        onClose={() => setIsSendToChatModalOpen(false)}
        projectId={project.id}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete project"
        message="Delete this project? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </article>
  );
});

export default ProjectCard;
