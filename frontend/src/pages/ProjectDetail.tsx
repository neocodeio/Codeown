import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import api from "../api/axios";
import type { Project } from "../types/project";
import { formatRelativeDate } from "../utils/date";
import ProjectModal from "../components/ProjectModal";
import CommentsSection from "../components/CommentsSection";
import ContentRenderer from "../components/ContentRenderer";
import { ArrowLeft, PencilSimple, Trash, Globe, GithubLogo, Star, ShareNetwork, BookmarkSimple, Handshake, Code } from "phosphor-react";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import ShareModal from "../components/ShareModal";
import ProjectChangelog from "../components/ProjectChangelog";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import AvailabilityBadge from "../components/AvailabilityBadge";
import CoFounderRequestModal from "../components/CoFounderRequestModal";
import { toast } from "react-toastify";
import SendToChatModal from "../components/SendToChatModal";
import { PaperPlaneTilt } from "phosphor-react";

export default function ProjectDetail() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [likeCount, setLikeCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCofounderModalOpen, setIsCofounderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "changelog">("details");
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);

  const viewLogged = useRef(false);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchReactionStatus();

      // View count increment logic moved to fetchProject to get target_user_id
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = await getToken();
      const response = await api.get(`/projects/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setProject(response.data);

      setLikeCount(response.data.like_count || 0);
      setUserRating(response.data.user_rating || 0);

      // Track project view analytics
      if (!viewLogged.current) {
        viewLogged.current = true;
        const token = await getToken();
        api.post(`/analytics/track`, {
          event_type: 'project_view',
          target_user_id: response.data.user_id,
          project_id: response.data.id
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(err => console.error("Failed to record analytics", err));
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchReactionStatus = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [likeRes, savedRes] = await Promise.all([
        api.get(`/projects/${id}/like`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/projects/${id}/save`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setIsLiked(likeRes.data.isLiked);
      setIsSaved(savedRes.data.isSaved);
    } catch (error) {
      console.log("Reaction status not available (Guest)");
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--text-primary)';
      case 'in_progress': return 'var(--text-primary)';
      case 'paused': return 'var(--text-tertiary)';
      default: return 'var(--text-tertiary)';
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

  const handleUserClick = () => {
    if (project?.user_id) {
      navigate(`/user/${project.user_id}`);
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsDeleteModalOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${id}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  }


  const handleRate = async (rating: number) => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserRating(rating);
      // Update project with new average
      setProject(prev => prev ? {
        ...prev,
        rating: response.data.average,
        rating_count: response.data.count
      } : null);
    } catch (error) {
      console.error("Error rating project:", error);
    }
  };

  const handleShare = () => {
    if (!project) return;
    setIsShareModalOpen(true);
  };

  const handleSendToChat = () => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }
    setIsSendToChatModalOpen(true);
  };

  const handleProjectUpdated = () => {
    fetchProject();
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
        <div style={{
          width: "24px",
          height: "24px",
          border: "0.5px solid var(--border-hairline)",
          borderTopColor: "var(--text-primary)",
          borderRadius: "999px",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div>Project not found</div>
      </div>
    );
  }

  const isOwnProject = currentUser?.id === project.user_id;
  const userName = project.user?.name || "User";
  const shareUrl = `${window.location.origin}/project/${id}`;
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=212121&color=ffffff&bold=true`;

  return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", padding: isMobile ? "20px 0 100px 0" : "60px 20px" }}>
      <SEO
        title={`${project.title} by ${userName}`}
        description={project.description && project.description.length > 160 ? project.description.substring(0, 157) + "..." : (project.description || `Check out ${project.title} on Codeown.`)}
        image={project.cover_image || avatarUrl}
        url={window.location.href}
        type="article"
        author={userName}
        publishedTime={project.created_at}
        keywords={project.technologies_used || ["project", "software", "code"]}
        schema={{
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          "name": project.title,
          "description": project.description,
          "programmingLanguage": project.technologies_used?.[0] || "Code",
          "author": {
            "@type": "Person",
            "name": userName
          },
          "codeRepository": project.github_repo || "",
          "runtimePlatform": project.technologies_used?.join(", ") || ""
        }}
      />
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "40px",
            padding: "8px 0",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.transform = "translateX(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <ArrowLeft size={16} weight="thin" />
          BACK
        </button>

        {project.cover_image && (
          <div style={{
            width: "100%",
            height: isMobile ? "240px" : "560px",
            overflow: "hidden",
            borderRadius: "2px",
            border: "0.5px solid var(--border-hairline)",
            marginBottom: "56px",
            position: "relative",
            backgroundColor: "var(--bg-hover)"
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
              top: "20px",
              right: "20px",
              backgroundColor: "var(--bg-page)",
              color: "var(--text-primary)",
              padding: "6px 12px",
              borderRadius: "0",
              border: "0.5px solid var(--border-hairline)",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textTransform: "uppercase"
            }}>
              <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: getStatusColor(project.status) }} />
              {getStatusText(project.status)}
            </div>
          </div>
        )}

        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "flex-start",
          marginBottom: "40px",
          gap: isMobile ? "24px" : "0"
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: width < 768 ? "32px" : "48px",
              fontWeight: 800,
              marginBottom: "24px",
              lineHeight: "1.1",
              letterSpacing: "-0.04em",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              textTransform: "uppercase"
            }}>
              {project.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
              <div
                onClick={handleUserClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <AvailabilityBadge
                  avatarUrl={project.user?.avatar_url || null}
                  name={userName}
                  size={isMobile ? 44 : 52}
                  isOpenToOpportunities={project.user?.is_pro === true && project.user?.is_hirable === true}
                />
                <div>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-primary)"
                  }}>
                    {userName}
                    <VerifiedBadge username={project.user?.username} isPro={project.user?.is_pro} size="16px" />
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 400, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span>@{project.user?.username || 'user'}</span>
                    <span>•</span>
                    <span>{formatRelativeDate(project.created_at).toUpperCase()}</span>
                    {project.view_count !== undefined && (
                      <>
                        <span>•</span>
                        <span>{project.view_count} VIEWS</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p style={{
              fontSize: "18px",
              lineHeight: "1.6",
              color: "var(--text-secondary)",
              marginBottom: "30px",
            }}>
              {project.description}
            </p>

            {/* OWNER REVIEW SECTION */}
            {isOwnProject && Array.isArray(project.cofounderRequests) && project.cofounderRequests.length > 0 && (
              <div style={{
                marginBottom: "56px",
                border: "0.5px solid var(--border-hairline)",
                borderRadius: "2px",
                padding: isMobile ? "24px" : "40px",
                backgroundColor: "rgba(255, 255, 255, 0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                  <Handshake size={24} weight="fill" />
                  <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>
                    Applications ({project.cofounderRequests.length})
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {project.cofounderRequests.map(req => (
                    <div key={req.id} style={{
                      padding: "24px",
                      border: "0.5px solid var(--border-hairline)",
                      borderRadius: "2px",
                      backgroundColor: "var(--bg-page)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={req.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name)}&background=212121&color=ffffff&bold=true`}
                            style={{ width: "40px", height: "40px", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "14px" }}>{req.user.name.toUpperCase()}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>@{req.user.username}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const projectSkills = Array.isArray(req.skills) ? req.skills.join(", ") : "";
                            const msg = `Hey ${req.user.name}, I saw your request to join ${project.title} as a Co-Founder. I'd love to chat more about your skills in ${projectSkills}!`;
                            navigate(`/messages?userId=${req.user_id}&message=${encodeURIComponent(msg)}`);
                          }}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "var(--text-primary)",
                            color: "var(--bg-page)",
                            border: "none",
                            borderRadius: "2px",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
                          }}
                        >
                          MESSAGE APPLICANT
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: 800, color: "var(--text-tertiary)", display: "block", marginBottom: "4px", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Skills</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {Array.isArray(req.skills) ? req.skills.map(s => (
                              <span key={s} style={{ fontSize: "10px", padding: "2px 6px", border: "0.5px solid var(--border-hairline)", borderRadius: "2px", color: "var(--text-secondary)" }}>{s}</span>
                            )) : <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>No skills listed</span>}
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: "9px", fontWeight: 800, color: "var(--text-tertiary)", display: "block", marginBottom: "4px", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Commitment</label>
                          <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{req.hours_per_week || req.commitment_hours || 0} HOURS/WEEK</div>
                        </div>
                        <div style={{ gridColumn: isMobile ? "auto" : "span 2" }}>
                          <label style={{ fontSize: "9px", fontWeight: 800, color: "var(--text-tertiary)", display: "block", marginBottom: "4px", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Motivation & Contribution</label>
                          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>{req.reason}</p>
                          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", lineHeight: "1.5" }}><strong>What I bring:</strong> {req.contribution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.looking_for_contributors && !isOwnProject && (
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-hairline)",
                padding: "32px",
                marginBottom: "48px",
                borderRadius: "2px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: "24px"
              }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <Handshake size={20} weight="duotone" />
                    Join as Co-Founder
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "400px", lineHeight: "1.5" }}>
                    The creator is looking for a partner to build this project. Ready to join the mission?
                  </p>
                </div>
                <button
                  onClick={() => !project.hasAppliedToCofounder && setIsCofounderModalOpen(true)}
                  disabled={project.hasAppliedToCofounder}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: project.hasAppliedToCofounder ? "rgba(255, 255, 255, 0.05)" : "var(--text-primary)",
                    color: project.hasAppliedToCofounder ? "var(--text-tertiary)" : "var(--bg-page)",
                    border: project.hasAppliedToCofounder ? "1px solid var(--border-hairline)" : "none",
                    borderRadius: "2px",
                    fontSize: "12px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    cursor: project.hasAppliedToCofounder ? "default" : "pointer",
                    whiteSpace: "nowrap",
                    opacity: project.hasAppliedToCofounder ? 0.7 : 1
                  }}
                >
                  {project.hasAppliedToCofounder ? "ALREADY APPLIED" : "Apply to Join"}
                </button>
              </div>
            )}

            {project.technologies_used && project.technologies_used.length > 0 && (
              <div style={{ marginBottom: "40px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 600, marginBottom: "16px", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tech Stack</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {project.technologies_used.map((tech, idx) => (
                    <span
                      key={idx}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(tech)}`)}
                      style={{
                        fontSize: "11px",
                        padding: "6px 14px",
                        backgroundColor: "var(--bg-page)",
                        color: "var(--text-secondary)",
                        borderRadius: "0",
                        border: "0.5px solid var(--border-hairline)",
                        fontWeight: 500,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textTransform: "uppercase"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--text-primary)";
                        e.currentTarget.style.color = "var(--text-primary)";
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-hairline)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.backgroundColor = "var(--bg-page)";
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.contributors && project.contributors.length > 0 && (
              <div style={{ marginBottom: "40px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 600, marginBottom: "16px", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Contributors</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {project.contributors.map((contrib) => (
                    <div
                      key={contrib.user_id}
                      onClick={() => navigate(`/user/${contrib.user_id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px 10px 10px",
                        backgroundColor: "var(--bg-page)",
                        borderRadius: "2px",
                        cursor: "pointer",
                        border: "0.5px solid var(--border-hairline)",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
                    >
                      <img
                        src={contrib.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contrib.name || contrib.username)}&background=212121&color=ffffff&bold=true`}
                        alt={contrib.username}
                        style={{ width: "28px", height: "28px", borderRadius: "2px" }}
                      />
                      <span style={{ fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", color: "var(--text-primary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                        {contrib.name || contrib.username}
                        <VerifiedBadge username={contrib.username} size="12px" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "40px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 600, marginBottom: "16px", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Community Rating</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: (hoverRating || userRating) >= star ? "var(--text-primary)" : "var(--text-tertiary)",
                      transition: "all 0.15s ease",
                      transform: hoverRating >= star ? "scale(1.1)" : "scale(1)"
                    }}
                  >
                    <Star size={22} weight={(hoverRating || userRating) >= star ? "fill" : "bold"} />
                  </button>
                ))}
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginLeft: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                  {project.rating ? `${project.rating.toFixed(1)} / ${project.rating_count || 0} RATINGS` : "NO RATINGS YET"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "40px" }}>
              {project.github_repo && (
                <a
                  href={project.github_repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 24px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    borderRadius: "2px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <GithubLogo size={18} weight="thin" />
                  Source Code
                </a>
              )}
              {project.live_demo && (
                <a
                  href={project.live_demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 24px",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    borderRadius: "2px",
                    border: "0.5px solid var(--border-hairline)",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                  }}
                >
                  <Globe size={18} weight="thin" />
                  Live Preview
                </a>
              )}
            </div>

            {/* EMBED BADGE SECTION (Only for Owner) */}
            {isOwnProject && (
              <div style={{
                marginTop: "40px",
                padding: "24px",
                backgroundColor: "var(--bg-hover)",
                border: "0.5px solid var(--border-hairline)",
                borderRadius: "2px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <Code size={18} weight="thin" color="var(--text-tertiary)" />
                  <h3 style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    margin: 0
                  }}>
                    Embed Badge
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px", alignItems: isMobile ? "flex-start" : "center" }}>
                  {/* Badge Preview */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: "9px", color: "var(--text-tertiary)", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase" }}>Preview</div>
                    <a href={window.location.href} target="_blank" rel="noopener noreferrer">
                      <img
                        src={`${window.location.origin}/badges/listed-on-codeown.svg`}
                        alt="Listed on Codeown"
                        style={{ height: "40px", display: "block" }}
                      />
                    </a>
                  </div>

                  {/* Embed Code */}
                  <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontSize: "9px", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase" }}>Embed HTML Code</div>
                      <button
                        onClick={() => {
                          const code = `<a href="${window.location.origin}/project/${project.id}" target="_blank">\n  <img src="${window.location.origin}/badges/listed-on-codeown.svg" alt="Listed on Codeown" width="170" height="40" />\n</a>`;
                          navigator.clipboard.writeText(code);
                          setCopiedBadge(true);
                          setTimeout(() => setCopiedBadge(false), 2000);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: copiedBadge ? "#4ade80" : "var(--text-primary)",
                          fontSize: "9px",
                          fontWeight: 800,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        {copiedBadge ? "COPIED" : "COPY CODE"}
                      </button>
                    </div>
                    <div style={{
                      backgroundColor: "var(--bg-page)",
                      padding: "12px",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}>
                      {`<a href="${window.location.origin}/project/${project.id}" ... />`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: "12px", marginBottom: isMobile ? "40px" : "0" }}>
            {isOwnProject && (
              <>
                <button
                  onClick={handleEditClick}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--border-hairline)",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <PencilSimple size={16} weight="thin" />
                  EDIT
                </button>
                <button
                  onClick={handleDeleteClick}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    color: "#ef4444",
                    border: "0.5px solid #ef4444",
                    borderRadius: "2px",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Trash size={16} weight="thin" />
                  DELETE
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: isMobile ? "row" : "row",
          gap: isMobile ? "8px" : "16px",
          padding: isMobile ? "12px" : "20px",
          backgroundColor: "var(--bg-page)",
          border: "0.5px solid var(--border-hairline)",
          borderRadius: "2px",
          marginBottom: "64px",
        }}>
          <button
            onClick={handleLike}
            disabled={!currentUser}
            style={{
              flex: 1,
              padding: "16px",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "2px",
              backgroundColor: isLiked ? "var(--text-primary)" : "transparent",
              color: isLiked ? "var(--bg-page)" : "var(--text-primary)",
              cursor: currentUser ? "pointer" : "not-allowed",
              fontWeight: 800,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            <Star size={20} weight={isLiked ? "fill" : "bold"} />
            {likeCount > 0 ? `${likeCount} ` : ""}UPVOTE
          </button>

          <button
            onClick={handleSave}
            disabled={!currentUser}
            style={{
              flex: 1,
              padding: "16px",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "2px",
              backgroundColor: isSaved ? "var(--text-primary)" : "transparent",
              color: isSaved ? "var(--bg-page)" : "var(--text-primary)",
              cursor: currentUser ? "pointer" : "not-allowed",
              fontWeight: 800,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            <BookmarkSimple
              size={20}
              weight={isSaved ? "fill" : "thin"}
            />
            {isSaved ? "SAVED" : "SAVE"}
          </button>

          <button
            onClick={handleShare}
            style={{
              flex: 1,
              padding: "16px",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <ShareNetwork size={20} weight="thin" />
            SHARE
          </button>

          <button
            onClick={handleSendToChat}
            style={{
              flex: 1,
              padding: "16px",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <PaperPlaneTilt size={20} weight="thin" />
            SEND
          </button>
        </div>

        <div style={{ marginBottom: "64px" }}>
          {/* Custom Tabs */}
          <div style={{
            display: "flex",
            gap: "32px",
            borderBottom: "0.5px solid var(--border-hairline)",
            marginBottom: "32px",
            overflowX: "auto"
          }}>
            <button
              onClick={() => setActiveTab("details")}
              style={{
                background: "transparent",
                border: "none",
                padding: "12px 0",
                fontSize: "11px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: activeTab === "details" ? "var(--text-primary)" : "var(--text-tertiary)",
                borderBottom: activeTab === "details" ? "1px solid var(--text-primary)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.15em"
              }}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab("changelog")}
              style={{
                background: "transparent",
                border: "none",
                padding: "12px 0",
                fontSize: "11px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: activeTab === "changelog" ? "var(--text-primary)" : "var(--text-tertiary)",
                borderBottom: activeTab === "changelog" ? "1px solid var(--text-primary)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.15em"
              }}
            >
              CHANGELOG
            </button>
          </div>

          <div style={{ minHeight: "200px" }}>
            {activeTab === "details" ? (
              <div style={{
                fontSize: "16px",
                lineHeight: "1.8",
                color: "var(--text-secondary)",
              }}>
                <ContentRenderer content={project.project_details} />
              </div>
            ) : (
              <ProjectChangelog projectId={project.id} isOwner={isOwnProject} />
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "11px", fontWeight: 800, marginBottom: "32px", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Discussions</h2>
          <CommentsSection
            resourceId={project.id}
            resourceType="project"
            onCommentAdded={() => {
              // Refresh project to update comment count
              fetchProject();
            }}
          />
        </div>
      </div>

      {
        project && (
          <ProjectModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onUpdated={handleProjectUpdated}
            project={project}
          />
        )
      }

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
      <CoFounderRequestModal
        isOpen={isCofounderModalOpen}
        onClose={() => setIsCofounderModalOpen(false)}
        onSuccess={fetchProject}
        projectId={project.id}
        projectTitle={project.title}
      />
      {project && (
        <SendToChatModal
          isOpen={isSendToChatModalOpen}
          onClose={() => setIsSendToChatModalOpen(false)}
          projectId={project.id}
          initialMessage={`Check out this project: ${project.title}`}
        />
      )}
    </main>
  );
}
