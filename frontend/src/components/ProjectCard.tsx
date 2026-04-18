import { useState, useEffect, useRef, memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
import {
  TriangleIcon,
  Comment01Icon,
  Bookmark02Icon,
  Share01Icon,
  SentIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Delete02Icon,
  PinIcon,
  SparklesIcon
} from "@hugeicons/core-free-icons";

import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";
import { useWindowSize } from "../hooks/useWindowSize";

const TechIcon = ({ name, size = 12 }: { name: string, size?: number }) => {
  // Normalize: remove dots (next.js -> nextjs), handle spaces, etc.
  const input = name.toLowerCase().trim();
  const normalized = input.replace(/\.js$/, "").replace(/\.js\s/, "").replace(/\./g, "dot");

  const iconMap: Record<string, string> = {
    react: "react",
    reactjs: "react",
    nextjs: "nextdotjs",
    nextdotjs: "nextdotjs",
    node: "nodedotjs",
    nodejs: "nodedotjs",
    nodedotjs: "nodedotjs",
    go: "go",
    golang: "go",
    typescript: "typescript",
    ts: "typescript",
    javascript: "javascript",
    js: "javascript",
    python: "python",
    tailwind: "tailwindcss",
    tailwindcss: "tailwindcss",
    supabase: "supabase",
    postgresql: "postgresql",
    postgres: "postgresql",
    docker: "docker",
    rust: "rust",
    github: "github",
    aws: "amazonaws",
    amazonaws: "amazonaws",
    firebase: "firebase",
    flutter: "flutter",
    vue: "vuedotjs",
    vuejs: "vuedotjs",
    vuedotjs: "vuedotjs",
    angular: "angular",
    mongodb: "mongodb",
    redis: "redis",
    mysql: "mysql",
    mariadb: "mariadb",
    sqlite: "sqlite",
    drizzle: "drizzle",
    drizzleorm: "drizzle",
    prisma: "prisma",
    cloudflare: "cloudflare",
    workers: "cloudflareworkers",
    worker: "cloudflareworkers",
    cloudflareworkers: "cloudflareworkers",
    vite: "vite",
    stripe: "stripe",
    clerk: "clerk",
    vercel: "vercel",
    html: "html5",
    css: "css3",
    sass: "sass",
    framer: "framer",
    figma: "figma",
    openai: "openai",
    anthropic: "anthropic",
  };

  const slug = iconMap[normalized] || iconMap[input] || null;

  if (slug) {
    // Using official brand colors (removed /fff) so they are visible on light & dark mode
    const url = `https://cdn.simpleicons.org/${slug}`;
    return <img
      src={url}
      alt={name}
      style={{
        width: size,
        height: size,
        opacity: 0.9,
        display: "block",
        transition: "transform 0.15s ease"
      }}
      onLoad={(e) => (e.currentTarget.style.display = "block")}
      onError={(e) => (e.currentTarget.style.display = "none")}
    />;
  }
  return null;
}
import AvailabilityBadge from "./AvailabilityBadge";
import { getOptimizedImageUrl } from "../utils/image";
import ShareModal from "./ShareModal";
import SendToChatModal from "./SendToChatModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";
import UserHoverCard from "./UserHoverCard";
import RollingNumber from "./RollingNumber";
import QuickCommentModal from "./QuickCommentModal";
import Lightbox from "./Lightbox";
import InlineFollowButton from "./InlineFollowButton";

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
  const [isQuickCommentOpen, setIsQuickCommentOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

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

  const handleImageClick = (e: React.MouseEvent, src: string) => {
    e.stopPropagation();
    setLightboxImage(src);
    setIsLightboxOpen(true);
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
        padding: "var(--post-padding, 20px 16px)",
        backgroundColor: "transparent",
        display: "flex",
        gap: isMobile ? "12px" : "16px",
        transition: "background-color 0.15s linear",
        width: "100%",
        boxSizing: "border-box"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Avatar Col */}
      <div style={{ flexShrink: 0 }}>
        <UserHoverCard userId={project.user_id} user={project.user as any}>
          <div onClick={handleUserClick} style={{ cursor: "pointer" }}>
            <AvailabilityBadge
              avatarUrl={project.user?.avatar_url || null}
              name={userName}
              size={40}
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
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            <UserHoverCard userId={project.user_id} user={project.user as any}>
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
            <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="14px" />
            <InlineFollowButton userId={project.user_id} />
            <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 400 }}>
              @{project.user?.username || 'user'}
            </span>
            <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
            <span style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
              {formatRelativeDate(project.created_at)}
            </span>

            {project.looking_for_contributors && (
              <>
                <span style={{ color: "var(--border-hairline)" }}>•</span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(34, 197, 94, 0.08)",
                  border: "0.5px solid rgba(34, 197, 94, 0.2)",
                  padding: "2px 10px",
                  borderRadius: "var(--radius-pill)",
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a" }}>Seeking Co-founder</span>
                </div>
              </>
            )}

            {project.tech_match !== undefined && project.tech_match > 0 && (
              <>
                <span style={{ color: "var(--border-hairline)" }}>•</span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: project.tech_match >= 80 ? "rgba(74, 222, 128, 0.08)" : "rgba(56, 189, 248, 0.08)",
                  border: project.tech_match >= 80 ? "0.5px solid rgba(74, 222, 128, 0.2)" : "0.5px solid rgba(56, 189, 248, 0.2)",
                  padding: "2px 10px",
                  borderRadius: "var(--radius-pill)",
                }}>
                  <HugeiconsIcon icon={SparklesIcon} size={12} style={{ color: project.tech_match >= 80 ? "#16a34a" : "#0284c7" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: project.tech_match >= 80 ? "#16a34a" : "#0284c7" }}>
                    {project.tech_match}% Match
                  </span>
                </div>
              </>
            )}

            {/* Status pill */}
            <div style={{
              marginLeft: "8px",
              padding: "2px 10px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "transparent",
              border: "0.5px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "var(--radius-pill)", backgroundColor: getStatusColor(project.status) }} />
              <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>{project.status.replace("_", " ")}</span>
            </div>
          </div>

          {isOwnProject && (
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={toggleMenu}
                style={{
                  background: "none", border: "none", color: "var(--text-tertiary)",
                  cursor: "pointer", padding: "4px", borderRadius: "var(--radius-sm)",
                  transition: "all var(--transition-fast)"
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
                  right: 0,
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
                    { icon: PinIcon, label: isPinned ? "Unpin from profile" : "Pin to profile", onClick: handlePinProject, color: "var(--text-primary)" },
                    { icon: PencilEdit02Icon, label: "Edit project", onClick: handleEditClick, color: "var(--text-primary)" },
                    { icon: Delete02Icon, label: "Delete project", onClick: handleDeleteClick, color: "#ef4444" }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={(e) => { item.onClick(e); setIsMenuOpen(false); }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: item.color,
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        transition: "all 0.1s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = item.color === "#ef4444" ? "rgba(239, 68, 68, 0.08)" : "var(--bg-hover)";
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

        <div style={{ marginBottom: "12px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "-0.02em" }}>{project.title}</h3>
          <p style={{ fontSize: isMobile ? "14.5px" : "15px", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "12px", fontWeight: 400, letterSpacing: "-0.01em", wordBreak: "break-word", overflowWrap: "break-word" }}>{project.description}</p>

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
                    padding: "4px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "transparent",
                    color: "var(--text-tertiary)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.opacity = "0.6";
                  }}
                >
                  <TechIcon name={tech} />
                  {tech}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {project.cover_image && (
          <div
            onClick={(e) => handleImageClick(e, project.cover_image!)}
            style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "0.5px solid var(--border-hairline)", marginBottom: "16px", aspectRatio: "16/9", cursor: "zoom-in" }}
          >
            <img src={getOptimizedImageUrl(project.cover_image)} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
        )}

        {/* Interactions */}
        <div style={{
          display: "flex",
          marginTop: isMobile ? "24px" : "32px",
          gap: isMobile ? "32px" : "64px",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingRight: isMobile ? "0" : "0"
        }}>
          {[
            {
              icon: Comment01Icon,
              count: project.comment_count,
              onClick: (e: any) => { e.stopPropagation(); setIsQuickCommentOpen(true); },
              hoverColor: "var(--text-primary)",
            },
            {
              icon: TriangleIcon,
              count: likeCount,
              onClick: handleLike,
              active: isLiked,
              activeColor: "#3b82f6",
            },
            {
              icon: Bookmark02Icon,
              onClick: handleSave,
              active: isSaved,
              activeColor: "var(--text-primary)",
            },
            {
              icon: Share01Icon,
              onClick: handleShare,
              hoverColor: "var(--text-primary)",
            },
            {
              icon: SentIcon,
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
                  transition: "all var(--transition-normal)",
                  fontSize: "13px",
                  fontWeight: 600
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = action.hoverColor || action.activeColor || (Icon === TriangleIcon ? "#3b82f6" : "var(--text-primary)");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = action.active ? action.activeColor : "var(--text-tertiary)";
                }}
              >
                <HugeiconsIcon
                  icon={Icon}
                  size={20}
                  className={action.active && (Icon === TriangleIcon || Icon === Bookmark02Icon) ? "hugeicon-filled" : ""}
                />
                {Icon === TriangleIcon ? (
                  <RollingNumber value={action.count || 0} fontWeight={600} fontSize="13px" color="inherit" />
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
      <QuickCommentModal
        isOpen={isQuickCommentOpen}
        onClose={() => setIsQuickCommentOpen(false)}
        resourceId={project.id}
        resourceType="project"
        authorName={(project.user?.name || project.user?.username) ?? undefined}
        onSuccess={() => onUpdated?.()}
      />

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={lightboxImage}
      />
    </article>
  );
});

export default ProjectCard;
