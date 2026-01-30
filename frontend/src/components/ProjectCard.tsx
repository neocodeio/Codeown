import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faComment,
  faBookmark as faBookmarkSolid,
  faBookmark as faBookmarkRegular,
  faTrash,
  faPen,
  faExternalLinkAlt,
  faPlay,
  faPause,
  faCheck,
  faStar,
  faShareNodes,
  // faEye
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { formatRelativeDate } from "../utils/date";

interface ProjectCardProps {
  project: Project;
  onUpdated?: () => void;
  index?: number;
}

export default function ProjectCard({ project, onUpdated, index = 0 }: ProjectCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const { isLiked, likeCount, toggleLike } = useProjectLikes(project.id);
  const { isSaved, toggleSave } = useProjectSaved(project.id);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnProject = currentUser?.id === project.user_id;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.user_id) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return faCheck;
      case 'in_progress': return faPlay;
      case 'paused': return faPause;
      default: return faCheck;
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
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=000000&color=ffffff&bold=true`;

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This action cannot be undone.")) return;

    setIsDeleting(true);
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
      className="fade-in slide-up"
      style={{
        backgroundColor: "white",
        borderRadius: isMobile ? "20px" : "24px",
        marginBottom: isMobile ? "20px" : "24px",
        cursor: "pointer",
        border: "1px solid #f1f5f9",
        position: "relative",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        animationDelay: `${index * 0.1}s`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 30px 60px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.03)";
        e.currentTarget.style.borderColor = "#f1f5f9";
      }}
    >
      {project.cover_image && (
        <div style={{
          width: "100%",
          height: "220px",
          overflow: "hidden",
          position: "relative"
        }}>
          <img
            src={project.cover_image}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
          <div style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            backgroundColor: getStatusColor(project.status),
            color: "white",
            padding: "8px 16px",
            borderRadius: "14px",
            fontSize: "11px",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            {getStatusIcon(project.status) && (
              <FontAwesomeIcon icon={getStatusIcon(project.status)} style={{ fontSize: "10px" }} />
            )}
            {getStatusText(project.status)}
          </div>
        </div>
      )}

      <div style={{ padding: "20px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              onClick={handleUserClick}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#f8fafc",
                border: "1px solid #f1f5f9",
                overflow: "hidden",
                cursor: "pointer",
                borderRadius: "12px",
                transition: "transform 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div>
              <div
                onClick={handleUserClick}
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                {userName}
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {formatRelativeDate(project.created_at)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {project.rating ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#fff9c4", padding: "6px 12px", borderRadius: "12px", border: "1px solid #f9a825", boxShadow: "0 4px 10px rgba(249, 168, 37, 0.1)" }}>
                <FontAwesomeIcon icon={faStar} style={{ color: "#f9a825", fontSize: "12px" }} />
                <span style={{ fontSize: "12px", fontWeight: 900, color: "#f57f17" }}>{project.rating.toFixed(1)}</span>
              </div>
            ) : null}

            {project.looking_for_contributors && (
              <div style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "6px 12px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "1px solid #bae6fd",
                boxShadow: "0 4px 10px rgba(3, 105, 161, 0.05)"
              }}>
                Hiring
              </div>
            )}
          </div>
        </div>

        {isOwnProject && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEditClick}
              style={{
                padding: "10px 16px",
                border: "1px solid #eef2ff",
                backgroundColor: "#eef2ff",
                color: "#364182",
                borderRadius: "12px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 800,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e0e7ff"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#eef2ff"}
            >
              <FontAwesomeIcon icon={faPen} style={{ marginRight: "8px" }} /> Edit
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              style={{
                padding: "10px 16px",
                border: "1px solid #fff1f2",
                backgroundColor: "#fff1f2",
                color: "#ef4444",
                borderRadius: "12px",
                fontSize: "13px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                fontWeight: 800,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ffe4e6"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff1f2"}
            >
              <FontAwesomeIcon icon={faTrash} style={{ marginRight: "8px" }} /> Delete
            </button>
          </div>
        )}

        <h3 style={{
          fontSize: "20px",
          fontWeight: 900,
          marginBottom: "10px",
          lineHeight: "1.3",
          color: "#1e293b",
          letterSpacing: "-0.03em"
        }}>
          {project.title}
        </h3>

        <p style={{
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#475569",
          marginBottom: "20px",
          display: "-webkit-box",
          WebkitLineClamp: "3",
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {project.description}
        </p>

        {project.technologies_used && project.technologies_used.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {project.technologies_used.map((tech, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(tech)}`);
                }}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  backgroundColor: "#f8fafc",
                  color: "#364182",
                  borderRadius: "10px",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: "1px solid #f1f5f9",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#eef2ff";
                  e.currentTarget.style.borderColor = "#364182";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", fontWeight: 600, marginBottom: "24px" }}>
          <FontAwesomeIcon icon={faEye} style={{ fontSize: "12px", opacity: 0.7 }} />
          <span>{project.view_count || 0}</span>
        </div> */}

        {
          project.contributors && project.contributors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contributors</span>
              <div style={{ display: "flex", marginLeft: "4px" }}>
                {project.contributors.map((contrib, idx) => (
                  <div
                    key={contrib.user_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${contrib.user_id}`);
                    }}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      border: "2px solid #fff",
                      overflow: "hidden",
                      marginLeft: idx > 0 ? "-10px" : "0",
                      cursor: "pointer",
                      zIndex: 10 - idx,
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.zIndex = "20";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.zIndex = (10 - idx).toString();
                    }}
                    title={contrib.username}
                  >
                    <img
                      src={contrib.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contrib.name || contrib.username)}&background=364182&color=ffffff&bold=true`}
                      alt={contrib.username}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        <div style={{ display: "flex", gap: "10px", marginBottom: "0" }}>
          {project.github_repo && (
            <a
              href={project.github_repo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "#0f172a",
                color: "#fff",
                borderRadius: "14px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 800,
                transition: "all 0.2s ease",
                boxShadow: "0 8px 16px rgba(15, 23, 42, 0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 20px rgba(15, 23, 42, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(15, 23, 42, 0.1)";
              }}
            >
              <FontAwesomeIcon icon={faGithub} />
              GitHub
            </a>
          )}
          {
            project.live_demo && (
              <a
                href={project.live_demo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: "#364182",
                  color: "#fff",
                  borderRadius: "14px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 800,
                  transition: "all 0.2s ease",
                  boxShadow: "0 8px 16px rgba(54, 65, 130, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 20px rgba(54, 65, 130, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(54, 65, 130, 0.1)";
                }}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Live Demo
              </a>
            )
          }
        </div >
      </div >

      <div
        style={{
          display: "flex",
          borderTop: "1px solid #f1f5f9",
          padding: "16px 20px 20px",
          gap: "12px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleLike}
          disabled={!currentUser}
          style={{
            flex: 1,
            border: "1px solid",
            borderColor: isLiked ? "#fecdd3" : "#f1f5f9",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            cursor: currentUser ? "pointer" : "not-allowed",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 800,
            borderRadius: "14px",
            backgroundColor: isLiked ? "#fff1f2" : "#f8fafc",
            color: isLiked ? "#ef4444" : "#64748b",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isLiked ? "#ffe4e6" : "#f1f5f9";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLiked ? "#fff1f2" : "#f8fafc";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon icon={faHeartSolid} />
          <span>{likeCount || 0}</span>
        </button>

        <button
          onClick={() => navigate(`/project/${project.id}`)}
          style={{
            flex: 1,
            border: "1px solid #f1f5f9",
            padding: "10px",
            display: "flex",
            color: "#64748b",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 800,
            borderRadius: "14px",
            backgroundColor: "#f8fafc",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.color = "#364182";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>{project.comment_count || 0}</span>
        </button>

        <button
          onClick={handleShare}
          style={{
            width: "44px",
            border: "1px solid #f1f5f9",
            padding: "10px",
            display: "flex",
            color: shareCopied ? "#10b981" : "#64748b",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px",
            backgroundColor: "#f8fafc",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          {shareCopied && (
            <span style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#10b981",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "10px",
              whiteSpace: "nowrap",
              marginBottom: "12px",
              fontWeight: 900,
              boxShadow: "0 8px 16px rgba(16, 185, 129, 0.2)"
            }}>
              COPIED!
            </span>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={!currentUser}
          style={{
            width: "44px",
            border: "1px solid",
            borderColor: isSaved ? "#364182" : "#f1f5f9",
            padding: "10px",
            display: "flex",
            cursor: currentUser ? "pointer" : "not-allowed",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px",
            backgroundColor: isSaved ? "#eef2ff" : "#f8fafc",
            color: isSaved ? "#364182" : "#64748b",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isSaved ? "#e0e7ff" : "#f1f5f9";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isSaved ? "#eef2ff" : "#f8fafc";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FontAwesomeIcon
            icon={isSaved ? faBookmarkSolid : faBookmarkRegular}
          />
        </button>
      </div>

      {
        showEditModal && (
          <ProjectModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onUpdated={() => {
              setShowEditModal(false);
              if (onUpdated) onUpdated();
            }}
            project={project}
          />
        )
      }
    </article >
  );
}
