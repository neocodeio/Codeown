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
import { getOptimizedImageUrl } from "../utils/image";
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
        padding: isMobile ? "24px 16px" : "32px 24px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        gap: "16px",
        transition: "background-color 0.2s ease",
      }}
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
            avatarUrl={project.user?.avatar_url || null}
            name={userName}
            size={isMobile ? 42 : 48}
            isOpenToOpportunities={project.user?.is_pro === true && project.user?.is_hirable === true}
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
            <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="14px" />
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>
              @{project.user?.username || 'user'}
            </span>
            <span style={{ color: "#e2e8f0" }}>•</span>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>
              {formatRelativeDate(project.created_at)}
            </span>
            
            {/* Status pill inside header flow */}
            <div style={{
              marginLeft: "4px",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "#f8fafc",
              border: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: getStatusColor(project.status) }} />
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>{getStatusText(project.status)}</span>
            </div>
          </div>

          {isOwnProject && (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={toggleMenu}
                style={{
                  background: "none", border: "none", color: "#cbd5e1",
                  cursor: "pointer", padding: "4px", borderRadius: "50%",
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
                    { icon: Pen01Icon, label: "Edit", onClick: handleEditClick, color: "#0f172a" },
                    { icon: Delete01Icon, label: "Delete", onClick: handleDeleteClick, color: "#ef4444" }
                  ].map((item, i) => (
                    <button key={i} onClick={(e) => { item.onClick(e); setIsMenuOpen(false); }} style={{
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

        {/* Project Details */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.01em" }}>{project.title}</h3>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#475569" }}>{project.description}</p>
        </div>

        {/* Media */}
        {project.cover_image && (
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "16px", aspectRatio: "16/9" }}>
            <img src={getOptimizedImageUrl(project.cover_image)} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Interactions */}
        <div style={{ 
          display: "flex", 
          gap: isMobile ? "12px" : "32px", 
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start"
        }}>
          {[
            { 
              icon: Comment02Icon, 
              count: project.comment_count, 
              onClick: (e: any) => { e.stopPropagation(); navigate(`/project/${project.id}`); }, 
              hoverColor: "#3b82f6",
              hoverBg: "rgba(59, 130, 246, 0.05)"
            },
            { 
              icon: CircleArrowUp01Icon, 
              count: likeCount, 
              onClick: handleLike, 
              active: isLiked, 
              activeColor: "#00ba7c",
              hoverColor: "#00ba7c",
              hoverBg: "rgba(0, 186, 124, 0.05)"
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
              <HugeiconsIcon icon={action.icon} style={{ fontSize: "18px" }} />
              {action.count !== undefined && action.count > 0 && (
                <span style={{ fontSize: "13px", fontWeight: "700" }}>{action.count}</span>
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

  return cardElement;
}
