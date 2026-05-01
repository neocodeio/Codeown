import { useState, useEffect, useRef, memo, useLayoutEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import { socket } from "../lib/socket";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
import {
  Comment01Icon,
  Bookmark02Icon,
  Share01Icon,
  SentIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Delete02Icon,
  PinIcon,
  SparklesIcon,
  ArrowUpBigIcon,
  StarIcon
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
import Tooltip from "./Tooltip";
import { getOptimizedImageUrl } from "../utils/image";
import ShareModal from "./ShareModal";
import SendToChatModal from "./SendToChatModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "react-toastify";
import UserHoverCard from "./UserHoverCard";
import RollingNumber from "./RollingNumber";
import QuickCommentModal from "./QuickCommentModal";

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Use prop if provided, otherwise use local state
  const isPinned = isPinnedProp !== undefined ? isPinnedProp : isPinnedLocal;

  const isOwnProject = currentUser?.id === project.user_id;

  const [localCommentCount, setLocalCommentCount] = useState(project.comment_count || 0);

  useEffect(() => {
    if (!project.id) return;

    const handleCommentUpdate = (data: any) => {
      if (String(data.projectId) === String(project.id)) {
        setLocalCommentCount(data.commentCount);
      }
    };

    socket.on("project_commented", handleCommentUpdate);
    return () => {
      socket.off("project_commented", handleCommentUpdate);
    };
  }, [project.id]);

  // Fetch pinned state on mount only if prop is not provided
  useEffect(() => {
    if (isPinnedProp !== undefined || !isOwnProject || !currentUser?.id) return;
    const fetchPinnedState = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await api.get(`/users/${currentUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
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

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    // Target the parent wrapper which might have animation/stacking contexts
    const parentWrapper = menuRef.current.closest('article')?.parentElement;
    if (parentWrapper) {
      if (isMenuOpen) {
        parentWrapper.style.zIndex = "9999";
        parentWrapper.style.position = "relative";
      } else {
        parentWrapper.style.zIndex = "1";
        parentWrapper.style.position = "relative";
      }
    }
  }, [isMenuOpen]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.user?.username) {
      navigate(`/${project.user.username}`);
    } else if (project.user_id) {
      navigate(`/user/${project.user_id}`);
    }
  };

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

  const getInitials = (title: string) => {
    if (!title) return "??";
    const parts = title.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return title.substring(0, 2).toUpperCase();
  };

  return (
    <article
      onClick={handleClick}
      className="fade-in"
      style={{
        cursor: "pointer",
        padding: isMobile ? "16px 12px" : "20px 24px",
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? "16px" : "20px",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
        boxSizing: "border-box",
        borderBottom: "0.5px solid var(--border-hairline)",
        position: "relative",
        zIndex: isMenuOpen ? 9999 : 1,
        isolation: isMenuOpen ? "isolate" : "auto"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Upvote Button (Top Right) */}
      <div style={{ position: "absolute", top: isMobile ? "12px" : "20px", right: isMobile ? "12px" : "20px", zIndex: 10 }}>
        <Tooltip text={isLiked ? "Remove upvote" : "Upvote project"}>
          <button
            onClick={handleLike}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? "40px" : "48px",
              height: isMobile ? "54px" : "64px",
              borderRadius: "14px",
              border: isLiked ? "1.5px solid #3b82f6" : "1.5px solid var(--border-hairline)",
              backgroundColor: isLiked ? "rgba(59, 130, 246, 0.04)" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => { 
              if (!isLiked) {
                e.currentTarget.style.borderColor = "var(--text-tertiary)";
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              } else {
                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.08)";
              }
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => { 
              if (!isLiked) {
                e.currentTarget.style.borderColor = "var(--border-hairline)";
                e.currentTarget.style.backgroundColor = "transparent";
              } else {
                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.04)";
              }
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <HugeiconsIcon 
              icon={ArrowUpBigIcon} 
              size={isMobile ? 18 : 20} 
              style={{ 
                color: isLiked ? "#3b82f6" : "var(--text-secondary)", 
                marginBottom: "1px",
                transition: "transform 0.2s ease" 
              }} 
            />
            <RollingNumber 
              value={likeCount} 
              fontWeight={700} 
              fontSize={isMobile ? "13px" : "15px"} 
              color={isLiked ? "#3b82f6" : "var(--text-secondary)"} 
            />
          </button>
        </Tooltip>
      </div>

      {/* More Options (Bottom Right) */}
      <div 
        style={{ position: "absolute", bottom: isMobile ? "8px" : "0px", right: isMobile ? "8px" : "4px", zIndex: 100 }} 
        ref={menuRef}
      >
        <button
          onClick={toggleMenu}
          style={{
            background: "none", border: "none", color: "var(--text-tertiary)",
            cursor: "pointer", padding: "8px", borderRadius: "50%",
            transition: "all 0.2s ease"
          }}
          // onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
        </button>

        {isMenuOpen && (
          <div style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: "8px",
            backgroundColor: "var(--bg-header)", 
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "14px",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
            zIndex: 2000,
            minWidth: "180px",
            padding: "6px",
            animation: "dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {[
              { icon: Bookmark02Icon, label: isSaved ? "Saved" : "Save project", onClick: handleSave, color: isSaved ? "#3b82f6" : "var(--text-primary)" },
              { icon: Share01Icon, label: "Share", onClick: handleShare, color: "var(--text-primary)" },
              { icon: SentIcon, label: "Send to chat", onClick: handleSendToChat, color: "var(--text-primary)" },
              ...(isOwnProject ? [
                { icon: PinIcon, label: isPinned ? "Unpin from profile" : "Pin to profile", onClick: handlePinProject, color: "var(--text-primary)" },
                { icon: PencilEdit02Icon, label: "Edit project", onClick: handleEditClick, color: "var(--text-primary)" },
                { icon: Delete02Icon, label: "Delete project", onClick: handleDeleteClick, color: "#ef4444" }
              ] : [])
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
                  fontSize: "13px",
                  fontWeight: 600,
                  color: item.color,
                  textAlign: "left",
                  transition: "all 0.1s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <HugeiconsIcon icon={item.icon} size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. Project Icon / Logo */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: isMobile ? "54px" : "64px",
          height: isMobile ? "54px" : "64px",
          borderRadius: "14px",
          backgroundColor: "var(--bg-secondary)",
          border: "1.5px solid var(--border-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          // boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          transition: "transform 0.2s ease"
        }}>
          {project.cover_image ? (
            <img 
              src={getOptimizedImageUrl(project.cover_image)} 
              alt={project.title} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          ) : (
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", opacity: 0.8 }}>
              {getInitials(project.title)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Content */}
      <div style={{ 
        flex: 1, 
        minWidth: 0, 
        display: "flex", 
        flexDirection: "column", 
        gap: "4px",
        paddingRight: isMobile ? "48px" : "64px" // Account for absolute buttons on the right
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <h3 style={{
            fontSize: isMobile ? "17px" : "19px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {project.title}
          </h3>
          {project.tech_match !== undefined && project.tech_match >= 80 && (
             <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "0.5px solid rgba(34, 197, 94, 0.2)",
              padding: "2px 8px",
              borderRadius: "100px",
            }}>
              <HugeiconsIcon icon={SparklesIcon} size={10} style={{ color: "#16a34a" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a" }}>High Match</span>
            </div>
          )}
        </div>

        <p style={{
          fontSize: isMobile ? "13.5px" : "14.5px",
          color: "var(--text-tertiary)",
          margin: 0,
          fontWeight: 400,
          lineHeight: "1.4",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          opacity: 0.9
        }}>
          {project.description}
        </p>

        {/* Metadata Row */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px", 
          marginTop: "4px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <HugeiconsIcon icon={StarIcon} size={14} style={{ color: "#eab308" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
              {(project.rating || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", opacity: 0.6 }}>
              ({project.rating_count || 0})
            </span>
          </div>

          <div 
            onClick={(e) => { e.stopPropagation(); setIsQuickCommentOpen(true); }}
            style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
          >
            <HugeiconsIcon icon={Comment01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>{localCommentCount}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {project.technologies_used?.slice(0, 2).map((tech, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <TechIcon name={tech} size={12} />
                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-tertiary)" }}>{tech}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", opacity: 0.5 }}>by</span>
            <UserHoverCard userId={project.user_id} user={project.user as any}>
              <span 
                onClick={handleUserClick}
                style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer" }}
              >
                {(project.user?.name || "User").split(" ")[0]}
              </span>
            </UserHoverCard>
            <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="10px" />
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", opacity: 0.5 }}>
            {formatRelativeDate(project.created_at)}
          </div>
        </div>
      </div>

      {/* 3. Empty spacer for absolute positioning (ensures min-height) */}
      <div style={{ width: isMobile ? "40px" : "48px", flexShrink: 0 }} />

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
    </article>
  );
});

export default ProjectCard;
