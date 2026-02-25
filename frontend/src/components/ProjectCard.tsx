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
import { getOptimizedImageUrl, handleImageError } from "../utils/image";

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
  const [shareCopied, setShareCopied] = useState(false);
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

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This action cannot be undone.")) return;

    try {
      const token = await getToken();
      if (!token) return;
      await api.delete(`/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated ? onUpdated() : window.location.reload();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `https://codeown.space/project/${project.id}`;
    const shareData = {
      title: `Codeown Project - ${project.title}`,
      text: project.description?.substring(0, 100) || '',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <article
      onClick={handleClick}
      className="fade-in project-card-x-style"
      style={{
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "#fff",
        padding: isMobile ? "16px" : "24px",
        position: "relative",
        display: "flex",
        gap: "12px",
        borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#fcfcfc";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#fff";
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
            avatarUrl={project.user?.avatar_url || null}
            name={userName}
            size={isMobile ? 40 : 44}
            isOpenToOpportunities={project.user?.is_hirable}
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
              <VerifiedBadge username={project.user?.username} size="14px" />
            </span>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "400" }}>
              @{project.user?.username || 'user'}
            </span>
            <span style={{ fontSize: "14px", color: "#e2e8f0" }}>•</span>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "400" }}>
              {formatRelativeDate(project.created_at)}
            </span>
            <div style={{
              marginLeft: "2px",
              backgroundColor: getStatusColor(project.status),
              width: "8px",
              height: "8px",
              borderRadius: "50%"
            }} title={getStatusText(project.status)} />
          </div>

          {/* Actions Menu */}
          {isOwnProject && (
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
                      handleEditClick(e);
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

        {/* Project Title & Description */}
        <div style={{ marginBottom: "12px" }}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 4px 0",
            lineHeight: "1.4"
          }}>
            {project.title}
          </h3>
          <p style={{
            fontSize: "15px",
            lineHeight: "1.6",
            color: "#0f172a",
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: "3",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            letterSpacing: "-0.01em"
          }}>
            {project.description}
          </p>
        </div>

        {/* Cover Image */}
        {project.cover_image && (
          <div style={{
            marginTop: "12px",
            marginBottom: "16px",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid rgba(0, 0, 0, 0.04)",
            aspectRatio: "16/9",
            transition: "border-color 0.2s"
          }}>
            <img
              src={getOptimizedImageUrl(project.cover_image, 600)}
              alt={project.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
              onError={(e) => handleImageError(e.currentTarget)}
            />
          </div>
        )}

        {/* Technologies */}
        {project.technologies_used && project.technologies_used.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
            {project.technologies_used.map((tech, idx) => (
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
                  navigate(`/?type=projects&tag=${encodeURIComponent(tech)}`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                #{tech.replace(/\s+/g, "")}
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
          marginTop: "16px",
          marginLeft: "-8px"
        }}>
          {/* Comment */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`); }}
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
            <span style={{ fontWeight: 500 }}>{project.comment_count || 0}</span>
          </button>

          {/* Upvote */}
          <button
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              background: isLiked ? "rgba(0, 186, 124, 0.1)" : "none",
              border: "none",
              color: isLiked ? "#00ba7c" : "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              padding: "2px 10px 2px 2px",
              borderRadius: "100px",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
            onMouseEnter={(e) => {
              if (!isLiked) {
                e.currentTarget.style.color = "#00ba7c";
                e.currentTarget.style.backgroundColor = "rgba(0, 186, 124, 0.05)";
              }
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) {
                icon.style.transform = "scale(1.15) translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLiked) {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.backgroundColor = "transparent";
              } else {
                e.currentTarget.style.backgroundColor = "rgba(0, 186, 124, 0.1)";
              }
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) {
                icon.style.transform = "scale(1) translateY(0)";
              }
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <div className="footer-icon" style={{
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}>
              <HugeiconsIcon
                icon={CircleArrowUp01Icon}
                style={{
                  fontSize: "18px",
                  fill: isLiked ? "rgba(0, 186, 124, 0.2)" : "none",
                }}
              />
            </div>
            <span style={{ fontWeight: isLiked ? "800" : "600" }}>{likeCount || 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              background: "none",
              border: "none",
              color: shareCopied ? "#00ba7c" : "#64748b",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 186, 124, 0.1)";
              e.currentTarget.style.color = "#00ba7c";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              if (!shareCopied) e.currentTarget.style.color = "#64748b";
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
    </article>
  );
}
