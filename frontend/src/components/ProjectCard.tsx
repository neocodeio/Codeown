import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Share01Icon,
  CircleArrowUp01Icon,
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
import UserHoverCard from "./UserHoverCard";
import { getOptimizedImageUrl, handleImageError } from "../utils/image";
import ShareModal from "./ShareModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";

interface ProjectCardProps {
  project: Project;
  onUpdated?: () => void;
}

export default function ProjectCard({ project, onUpdated }: ProjectCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const { isLiked, likeCount, toggleLike } = useProjectLikes(project.id, project.isLiked, project.like_count);
  const { isSaved, toggleSave } = useProjectSaved(project.id, project.isSaved);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnProject = currentUser?.id === project.user_id;

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
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      default: return status;
    }
  };

  const userName = project.user?.name || "User";
  const shareUrl = `${window.location.origin}/project/${project.id}`;
  const isPro = project.user?.is_pro === true;

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

  const cardElement = (
    <article
      onClick={handleClick}
      className="fade-in"
      style={{
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: isPro ? "rgba(255, 255, 255, 0.75)" : "#fff",
        backdropFilter: isPro ? "blur(12px)" : "none",
        WebkitBackdropFilter: isPro ? "blur(12px)" : "none",
        padding: isMobile ? "16px" : "24px",
        display: "flex",
        gap: "14px",
        borderBottom: isPro ? "none" : "1px solid #eff3f4",
        borderRadius: isPro ? "0px" : undefined,
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isPro ? "rgba(255, 255, 255, 0.82)" : "#fcfcfc";
        if (isPro) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isPro ? "rgba(255, 255, 255, 0.75)" : "#fff";
        if (isPro) e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Left Column: Avatar */}
      <div style={{ flexShrink: 0 }}>
        <div
          onClick={handleUserClick}
          style={{
            cursor: "pointer",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <AvailabilityBadge
            avatarUrl={project.user?.avatar_url || null}
            name={userName}
            size={isMobile ? 42 : 48}
            isOpenToOpportunities={project.user?.is_pro === true && project.user?.is_hirable === true}
            ringColor={isPro ? "#d4a853" : "#3b82f6"}
          />
        </div>
      </div>

      {/* Right Column: Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Row */}
        <div style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          marginBottom: "2px",
          gap: "8px",
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", minWidth: 0, flex: 1 }}>
            {project.user_id ? (
              <UserHoverCard userId={project.user_id}>
                <span
                  onClick={handleUserClick}
                  style={{
                    fontSize: "15px",
                    fontWeight: 750,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isMobile ? "150px" : "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  {userName}
                </span>
              </UserHoverCard>
            ) : (
              <span
                onClick={handleUserClick}
                style={{
                  fontSize: "15px",
                  fontWeight: 750,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: isMobile ? "150px" : "none"
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >
                {userName}
              </span>
            )}
            <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="14px" />
            {project.user?.is_pro === true && (
              <span style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "4px",
                background: "#000",
                color: "#fff",
                letterSpacing: "0.06em",
                lineHeight: "1",
                textTransform: "uppercase",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}>PRO</span>
            )}
            <span style={{ fontSize: "14px", color: "#64748b", whiteSpace: "nowrap" }}>
              @{project.user?.username || 'user'}
            </span>
            <span style={{ fontSize: "14px", color: "#cbd5e1" }}>•</span>
            <span style={{ fontSize: "14px", color: "#64748b", whiteSpace: "nowrap" }}>
              {formatRelativeDate(project.created_at)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Minimal Status Indicator */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              backgroundColor: "#f8fafc",
              borderRadius: "6px",
              border: "1px solid #f1f5f9"
            }}>
              <div style={{
                backgroundColor: getStatusColor(project.status),
                width: "6px",
                height: "6px",
                borderRadius: "50%"
              }} />
              <span style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.02em"
              }}>
                {getStatusText(project.status)}
              </span>
            </div>

            {isOwnProject && (
              <div style={{ position: "relative" }} ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    borderRadius: "50%"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} style={{ fontSize: "18px" }} />
                </button>

                {isMenuOpen && (
                  <div className="fade-in" style={{
                    position: "absolute", top: "100%", right: 0,
                    backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)", zIndex: 100, padding: "4px", minWidth: "120px"
                  }}>
                    {[
                      { icon: Pen01Icon, label: "Edit", onClick: handleEditClick, color: "#0f172a" },
                      { icon: Delete01Icon, label: "Delete", onClick: handleDeleteClick, color: "#ef4444" }
                    ].map((item, i) => (
                      <button key={i} onClick={(e) => { item.onClick(e); setIsMenuOpen(false); }} style={{
                        width: "100%", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px",
                        border: "none", background: "none", cursor: "pointer", borderRadius: "8px",
                        fontSize: "13px", fontWeight: 600, color: item.color
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
        </div>

        {/* Project Content */}
        <div style={{ marginTop: "4px" }}>
          <h3 style={{
            fontSize: "17px",
            fontWeight: 750,
            color: isPro ? "#1a1a1a" : "#0f172a",
            margin: "0 0 6px 0",
            lineHeight: "1.4",
            letterSpacing: isPro ? "0.02em" : "-0.01em",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            textTransform: isPro ? "capitalize" : "none",
          }}>
            {project.title}
          </h3>
          <p style={{
            fontSize: "15px",
            lineHeight: "1.5",
            color: "#475569",
            margin: "0 0 12px 0",
            display: "-webkit-box",
            WebkitLineClamp: "3",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
            wordBreak: "break-word"
          }}>
            {project.description}
          </p>

          {project.cover_image && (
            <div style={{
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #f1f5f9",
              aspectRatio: "16/9",
              backgroundColor: "#f8fafc",
              marginBottom: "16px"
            }}>
              <img
                src={getOptimizedImageUrl(project.cover_image)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
                onError={(e) => handleImageError(e.currentTarget)}
              />
            </div>
          )}

          {project.technologies_used && project.technologies_used.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              {project.technologies_used.map((tech, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.05)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(59, 130, 246, 0.1)"
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start",
          gap: isMobile ? "4px" : "24px",
          marginTop: "12px",
          maxWidth: isMobile ? "100%" : "425px"
        }}>
          {/* Interaction Icons matching PostCard functionality but with a cleaner Look */}
          {[
            {
              icon: Comment02Icon,
              count: project.comment_count,
              onClick: (e: any) => { e.stopPropagation(); navigate(`/project/${project.id}`); },
              hoverColor: "#3b82f6"
            },
            {
              icon: CircleArrowUp01Icon,
              count: likeCount,
              onClick: handleLike,
              active: isLiked,
              activeColor: "#00ba7c",
              hoverColor: "#00ba7c"
            },
            {
              icon: isSaved ? Bookmark01Icon : Bookmark02Icon,
              onClick: handleSave,
              active: isSaved,
              activeColor: "#3b82f6",
              hoverColor: "#3b82f6"
            },
            {
              icon: Share01Icon,
              onClick: handleShare,
              active: false,
              activeColor: "#00ba7c",
              hoverColor: "#00ba7c"
            }
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                padding: "4px 0",
                cursor: "pointer",
                color: action.active ? action.activeColor : "#64748b",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = action.hoverColor || "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = action.active ? (action.activeColor || "#64748b") : "#64748b";
              }}
            >
              <HugeiconsIcon
                icon={action.icon}
                style={{
                  fontSize: "18px",
                  // Removed automatic fill to prevent solid green blobs
                }}
              />
              {action.count !== undefined && action.count > 0 && (
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{action.count}</span>
              )}
            </button>
          ))}
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

  if (!isPro) return cardElement;

  return (
    <div
      className="pro-card-expensive-wrapper"
      style={{
        position: "relative",
        margin: "0px",
        borderRadius: "0px",
        borderBottom: "1px solid #eff3f4",
        borderTop: "none",
        padding: "0px",
        overflow: "hidden",
      }}
    >
      {/* Horizontal Silk/Diamond Shine Sweep */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-180%",
          width: "180%",
          height: "100%",
          background: "linear-gradient(105deg, transparent 0%, rgba(197, 160, 89, 0.05) 35%, rgba(249, 208, 5, 0.98) 50%, rgba(197, 160, 89, 0.05) 65%, transparent 100%)",
          transform: "skewX(-25deg)",
          animation: "proLuxuryShine 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          zIndex: 0,
        }}
      />
      {/* Card sits on top with semi-transparency to let shine through if desired, or just above */}
      <div style={{ position: "relative", zIndex: 1, borderRadius: "0px", overflow: "hidden" }}>
        {cardElement}
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
  );
}
