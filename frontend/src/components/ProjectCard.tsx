import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
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
  faStar
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

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

  const isOwnProject = currentUser?.id === project.user_id;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.user_id) {
      navigate(`/user/${project.user_id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
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

  return (
    <article
      onClick={handleClick}
      className="fade-in slide-up"
      style={{
        backgroundColor: "#f5f5f5",
        padding: "0",
        borderRadius: "20px",
        marginBottom: "30px",
        cursor: "pointer",
        border: "1px solid #e0e0e0",
        position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        animationDelay: `${index * 0.1}s`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {project.cover_image && (
        <div style={{
          width: "100%",
          height: "200px",
          overflow: "hidden",
          borderRadius: "20px 20px 0 0",
          position: "relative"
        }}>
          <img
            src={project.cover_image}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            backgroundColor: getStatusColor(project.status),
            color: "white",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            {getStatusIcon(project.status) && (
              <FontAwesomeIcon icon={getStatusIcon(project.status)} />
            )}
            {getStatusText(project.status)}
          </div>
        </div>
      )}

      <div style={{ padding: "24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              onClick={handleUserClick}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "var(--primary)",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
                cursor: "pointer",
                borderRadius: "50%",
              }}
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
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                {userName}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700, letterSpacing: "0.1em" }}>
                {formatDate(project.created_at)}
              </div>
            </div>
          </div>
          {project.rating ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#fff9c4", padding: "4px 8px", borderRadius: "12px", border: "1px solid #f9a825" }}>
              <FontAwesomeIcon icon={faStar} style={{ color: "#f9a825", fontSize: "12px" }} />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#f57f17" }}>{project.rating.toFixed(1)}</span>
              <span style={{ fontSize: "10px", color: "#f9a825" }}>({project.rating_count})</span>
            </div>
          ) : null}
        </div>

        {isOwnProject && (
          <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEditClick}
              style={{
                padding: "8px 12px",
                border: "1px solid #007bff",
                backgroundColor: "#007bff",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              style={{
                padding: "8px 12px",
                border: "1px solid #dc3545",
                backgroundColor: "#dc3545",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}

        <h3 style={{
          fontSize: "24px",
          fontWeight: 800,
          marginBottom: "12px",
          lineHeight: "1.3",
        }}>
          {project.title}
        </h3>

        <p style={{
          fontSize: "16px",
          lineHeight: "1.6",
          color: "var(--text-secondary)",
          marginBottom: "20px",
        }}>
          {project.description}
        </p>

        {project.technologies_used && project.technologies_used.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
            {project.technologies_used.map((tech, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(tech)}`);
                }}
                style={{
                  fontSize: "13px",
                  padding: "4px 10px",
                  backgroundColor: "#e9ecef",
                  color: "#495057",
                  borderRadius: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#dee2e6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                }}
              >
                {tech}
              </span>
            ))}
          </div>
      )}


      {project.contributors && project.contributors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)" }}>CONTRIBUTORS:</span>
              <div style={{ display: "flex", marginLeft: "4px" }}>
                {project.contributors.map((contrib, idx) => (
                  <div
                    key={contrib.user_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${contrib.user_id}`);
                    }}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "2px solid #fff",
                      overflow: "hidden",
                      marginLeft: idx > 0 ? "-8px" : "0",
                      cursor: "pointer",
                      zIndex: 10 - idx
                    }}
                    title={contrib.username}
                  >
                    <img
                      src={contrib.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contrib.name || contrib.username)}&background=000000&color=ffffff&bold=true`}
                      alt={contrib.username}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          {
            project.github_repo && (
              <a
                href={project.github_repo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#24292e",
                  color: "#fff",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0366d6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#24292e";
                }}
              >
                <FontAwesomeIcon icon={faGithub} />
                GitHub
              </a>
            )
          }
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
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#218838";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#28a745";
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
          borderTop: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleLike}
          disabled={!currentUser}
          style={{
            flex: 1,
            border: "none",
            borderRight: "1px solid var(--border-color)",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            cursor: currentUser ? "pointer" : "not-allowed",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            backgroundColor: isLiked ? "#ff6b6b" : "transparent",
            color: isLiked ? "#fff" : "var(--text-primary)",
            transition: "background-color 0.2s ease",
          }}
        >
          <FontAwesomeIcon icon={faHeartSolid} />
          <span>{likeCount || 0}</span>
        </button>

        <button
          onClick={() => navigate(`/project/${project.id}`)}
          style={{
            flex: 1,
            border: "none",
            borderRight: "1px solid var(--border-color)",
            padding: "12px",
            display: "flex",
            color: "#000",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8f9fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>{project.comment_count || 0}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!currentUser}
          style={{
            flex: 1,
            border: "none",
            padding: "12px",
            display: "flex",
            cursor: currentUser ? "pointer" : "not-allowed",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            backgroundColor: isSaved ? "#007bff" : "transparent",
            color: isSaved ? "#fff" : "var(--text-primary)",
            transition: "background-color 0.2s ease",
          }}
        >
          <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkRegular} />
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
