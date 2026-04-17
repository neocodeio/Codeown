import { useState, useEffect, useRef } from "react";
import { socket } from "../lib/socket";
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
import { CaretLeft, Globe, GithubLogo, Star, BookmarkSimple, ShareNetwork, Handshake, Rocket, Plus } from "phosphor-react";
import CreatePostModal from "../components/CreatePostModal";
import Lightbox from "../components/Lightbox";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import ShareModal from "../components/ShareModal";
import PostCard from "../components/PostCard";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import CoFounderRequestModal from "../components/CoFounderRequestModal";
import ProjectAnalyticsDashboard from "../components/ProjectAnalyticsDashboard";
import { toast } from "react-toastify";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ProjectDetail() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();

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
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "posts" | "analytics">("details");

  const viewLogged = useRef(false);

  // 1. Fetch Project Data
  const { data: project = null, isLoading: projectLoading, refetch: refetchProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get(`/projects/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Track Analytics
      if (!viewLogged.current) {
        viewLogged.current = true;
        api.post(`/analytics/track`, {
          event_type: 'project_view',
          target_user_id: response.data.user_id,
          project_id: response.data.id
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(() => { });
      }

      return response.data as Project;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Reaction Status
  const { data: reactionData = { isLiked: false, isSaved: false } } = useQuery({
    queryKey: ["projectReactions", id, currentUser?.id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return { isLiked: false, isSaved: false };
      const [likeRes, savedRes] = await Promise.all([
        api.get(`/projects/${id}/like`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/projects/${id}/save`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      return { isLiked: likeRes.data.isLiked, isSaved: savedRes.data.isSaved };
    },
    enabled: !!id && !!currentUser?.id,
    staleTime: 1 * 60 * 1000,
  });

  // 3. Fetch Project Posts
  const { data: postsData = { posts: [] }, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["projectPosts", project?.id],
    queryFn: async () => {
      const token = await getToken();
      // Filter specifically by numerical projectId to ensure ONLY posts tagged with this project show up
      const response = await api.get(`/posts?projectId=${project?.id}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    },
    enabled: !!project?.id && activeTab === "posts",
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (project) {
      setLikeCount(project.like_count || 0);
      setUserRating(project.user_rating || 0);
    }
  }, [project]);

  useEffect(() => {
    setIsLiked(reactionData.isLiked);
    setIsSaved(reactionData.isSaved);
  }, [reactionData]);

  // Real-time synchronization
  useEffect(() => {
    if (!id) return;

    const handleProjectLiked = (payload: { id: number, likeCount: number }) => {
      if (Number(payload.id) === Number(id)) {
        setLikeCount(payload.likeCount);
      }
    };

    socket.on("project_liked", handleProjectLiked);
    return () => {
      socket.off("project_liked", handleProjectLiked);
    };
  }, [id]);

  const loading = projectLoading;
  const fetchProject = async () => { await refetchProject(); };

  const handleLike = async () => {
    if (!currentUser) { navigate("/sign-in"); return; }

    // Save previous state for rollback
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistically update UI
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const response = await api.post(`/projects/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setIsLiked(response.data.isLiked);
        setLikeCount(response.data.likeCount);
      }
    } catch (error) {
      console.error("Error toggling project like:", error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    }
  };

  const handleSave = async () => {
    if (!currentUser) { navigate("/sign-in"); return; }
    const previousIsSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const token = await getToken();
      const response = await api.post(`/projects/${id}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error(error);
      setIsSaved(previousIsSaved);
    }
  };

  const handleRate = async (rating: number) => {
    if (!currentUser) { navigate("/sign-in"); return; }
    try {
      const token = await getToken();
      await api.post(`/projects/${id}/rate`, { rating }, { headers: { Authorization: `Bearer ${token}` } });
      setUserRating(rating);
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
    } catch (error) { console.error(error); }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      await api.delete(`/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate("/");
    } catch (error) { toast.error("Failed to delete project"); } finally { setIsDeleting(false); }
  };

  const handleImageClick = (e: React.MouseEvent, src: string) => {
    e.stopPropagation();
    setLightboxImage(src);
    setIsLightboxOpen(true);
  };

  const isDesktop = width >= 1024;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <div style={{ width: "20px", height: "20px", border: "0.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "999px", animation: "spin 0.6s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!project) return <div style={{ textAlign: "center", padding: "100px", color: "var(--text-tertiary)" }}>Project not found</div>;

  const isOwnProject = currentUser?.id === project.user_id;
  const userName = project.user?.name || "User";
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=212121&color=ffffff&bold=true`;
  const shareUrl = `${window.location.origin}/project/${id}`;

  const ProjectActions = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "stretch", width: "100%" }}>
      {project.live_demo && (
        <a href={project.live_demo} target="_blank" rel="noreferrer" style={{
          flex: 1, minWidth: "140px", display: "flex", alignItems: "center", gap: "8px", padding: "14px 20px",
          backgroundColor: "var(--text-primary)", color: "var(--bg-page)",
          borderRadius: "14px", textDecoration: "none",
          fontWeight: 700, fontSize: "13px", justifyContent: "center",
          transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s"
        }} onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.02)"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}>
          <Globe size={18} weight="bold" /> Live Demo
        </a>
      )}
      {project.github_repo && (
        <a href={project.github_repo} target="_blank" rel="noreferrer" style={{
          flex: 1, minWidth: "140px", display: "flex", alignItems: "center", gap: "8px", padding: "14px 20px",
          backgroundColor: "var(--bg-hover)", color: "var(--text-primary)",
          borderRadius: "14px", border: "0.5px solid var(--border-hairline)",
          textDecoration: "none", fontWeight: 700, fontSize: "13px", justifyContent: "center",
          transition: "all 0.2s ease"
        }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--border-hairline)"; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}>
          <GithubLogo size={18} weight="bold" /> GitHub
        </a>
      )}
      {!project.live_demo && !project.github_repo && (
        <div style={{ flex: 1, padding: "14px", backgroundColor: "var(--bg-hover)", borderRadius: "14px", border: "0.5px solid var(--border-hairline)", color: "var(--text-tertiary)", fontSize: "12px", textAlign: "center", fontWeight: 600 }}>
          No external links provided
        </div>
      )}
    </div>
  );

  const ProjectMetadata = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        {/* Rating Section */}
        <div>
          <h4 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Rating</h4>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
              {project.rating ? project.rating.toFixed(1) : "0.0"}
            </div>
            <div>
              <div style={{ display: "flex", gap: "2px", marginBottom: "4px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    weight={(hoverRating || userRating || (project.rating || 0)) >= star ? "fill" : "regular"}
                    style={{
                      color: (hoverRating || userRating || (project.rating || 0)) >= star ? "var(--text-primary)" : "var(--text-tertiary)",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                  />
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                {project.rating_count || 0} votes
              </div>
            </div>
          </div>
        </div>

        {/* Tech Section */}
        {project.technologies_used && project.technologies_used.length > 0 && (
          <div>
            <h4 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Stack</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {project.technologies_used.map(tech => (
                <span key={tech} style={{
                  fontSize: "10px", padding: "4px 10px",
                  backgroundColor: "rgba(var(--text-primary-rgb), 0.03)",
                  border: "0.5px solid var(--border-hairline)",
                  borderRadius: "6px",
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  textTransform: "lowercase"
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owner Actions */}
      {isOwnProject && (
        <div style={{ display: "flex", gap: "10px", paddingTop: "24px", borderTop: "1px solid var(--border-hairline)" }}>
          <button onClick={() => setIsEditModalOpen(true)} style={{
            flex: 1, padding: "10px", background: "none",
            border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)",
            borderRadius: "12px", fontWeight: 700, fontSize: "12px", cursor: "pointer",
            transition: "all 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Edit
          </button>
          <button onClick={() => setIsDeleteModalOpen(true)} style={{
            padding: "10px 20px", background: "none",
            border: "0.5px solid var(--border-hairline)", color: "#ef4444",
            borderRadius: "12px", fontWeight: 700, fontSize: "12px", cursor: "pointer",
            transition: "all 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.05)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <main style={{
        backgroundColor: "var(--bg-page)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}>
        <SEO title={project.title} description={project.description} image={project.cover_image || avatarUrl} />

        <div style={{
          display: "flex",
          width: isDesktop ? "920px" : "100%",
          maxWidth: "920px",
          position: "relative",
        }}>
          {/* Main Column */}
          <div style={{
            width: isDesktop ? "620px" : "100%",
            maxWidth: isDesktop ? "620px" : "700px",
            backgroundColor: "var(--bg-page)",
            borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
            borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
            minHeight: "100vh",
            margin: isDesktop ? "0" : "0 auto",
            position: "relative",
            flexShrink: 0
          }}>
            {/* Header */}
            <header style={{
              position: "sticky",
              top: 0,
              backgroundColor: "var(--bg-page)",
              opacity: 0.98,
              backdropFilter: "blur(24px)",
              zIndex: 100,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              borderBottom: "0.5px solid var(--border-hairline)"
            }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <CaretLeft size={20} weight="thin" color="var(--text-primary)" />
              </button>
              <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Project
              </h1>
            </header>

            {/* Banner Section */}
            {project.cover_image && (
              <div style={{ width: "100%", height: isMobile ? "240px" : "320px", padding: "16px 24px 0" }}>
                <div
                  onClick={(e) => handleImageClick(e, project.cover_image!)}
                  style={{ width: "100%", height: "100%", borderRadius: "var(--radius-md)", overflow: "hidden", border: "0.5px solid var(--border-hairline)", cursor: "zoom-in" }}
                >
                  <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Project banner" />
                </div>
              </div>
            )}

            {/* Content Top */}
            <div style={{ padding: isMobile ? "24px 16px" : "32px 24px" }}>
              <h2 style={{ fontSize: isMobile ? "28px" : "32px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", margin: "0 0 24px" }}>
                {project.title}
              </h2>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div onClick={() => navigate(`/${project.user?.username || project.user_id}`)} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                  <img src={avatarUrl} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "0.5px solid var(--border-hairline)" }} />
                  <div>
                    <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                      {userName} <VerifiedBadge username={project.user?.username} size="14px" />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                      @{project.user?.username || 'user'} • {formatRelativeDate(project.created_at)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleLike} style={{
                    background: isLiked ? "rgba(249, 24, 128, 0.1)" : "var(--bg-hover)",
                    border: isLiked ? "0.5px solid rgba(249, 24, 128, 0.3)" : "0.5px solid var(--border-hairline)",
                    color: isLiked ? "#f91880" : "var(--text-secondary)",
                    borderRadius: "100px",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 700
                  }}>
                    <Star size={18} weight={isLiked ? "fill" : "regular"} />
                    <span>{likeCount}</span>
                  </button>
                  <button onClick={handleSave} style={{ background: isSaved ? "var(--bg-hover)" : "transparent", border: "0.5px solid var(--border-hairline)", color: isSaved ? "var(--text-primary)" : "var(--text-tertiary)", borderRadius: "100px", padding: "8px", display: "flex", cursor: "pointer" }}>
                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "regular"} />
                  </button>
                  <button onClick={() => setIsShareModalOpen(true)} style={{ background: "transparent", border: "0.5px solid var(--border-hairline)", color: "var(--text-tertiary)", borderRadius: "100px", padding: "8px", display: "flex", cursor: "pointer" }}>
                    <ShareNetwork size={18} />
                  </button>
                </div>
              </div>

              {activeTab === "posts" && isOwnProject && (
                <button
                  onClick={() => setIsShipModalOpen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "var(--shadow-sm)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-card)";
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Plus size={16} weight="bold" />
                  Ship Update
                </button>
              )}

              {/* Vision Callout */}
              {project.founder_vision && (
                <div style={{ marginBottom: "40px", padding: "24px", backgroundColor: "var(--bg-hover)", borderLeft: "4px solid var(--text-primary)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "12px" }}>
                    <Rocket size={16} weight="fill" /> Founder's Vision
                  </div>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>"{project.founder_vision}"</p>
                </div>
              )}

              {/* Mobile Actions */}
              {!isDesktop && (
                <div style={{ marginBottom: "40px" }}>
                  <ProjectActions />
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "0.5px solid var(--border-hairline)", marginBottom: "32px" }}>
                <button
                  onClick={() => setActiveTab("details")}
                  style={{
                    padding: "12px 24px",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "details" ? "3px solid var(--text-primary)" : "3px solid transparent",
                    color: activeTab === "details" ? "var(--text-primary)" : "var(--text-tertiary)",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: "pointer",
                    borderRadius: "0px",
                    transition: "all 0.2s ease"
                  }}
                >
                  Project Details
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  style={{
                    padding: "12px 24px",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "posts" ? "3px solid var(--text-primary)" : "3px solid transparent",
                    color: activeTab === "posts" ? "var(--text-primary)" : "var(--text-tertiary)",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: "pointer",
                    borderRadius: "0px",
                    transition: "all 0.2s ease"
                  }}
                >
                  Posts
                </button>
                {isOwnProject && (
                  <button
                    onClick={() => setActiveTab("analytics")}
                    style={{
                      padding: "12px 24px",
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === "analytics" ? "3px solid var(--text-primary)" : "3px solid transparent",
                      color: activeTab === "analytics" ? "var(--text-primary)" : "var(--text-tertiary)",
                      fontWeight: 800,
                      fontSize: "14px",
                      cursor: "pointer",
                      borderRadius: "0px",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    Analytics
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div style={{ minHeight: "400px" }}>
                {activeTab === "details" ? (
                  <div>
                    <div style={{ fontSize: "16px", lineHeight: 1.8, color: "var(--text-primary)", marginBottom: "32px" }}>
                      <ContentRenderer content={project.description || ""} />
                    </div>

                    {/* Integrated Project Info Card */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                      padding: "32px",
                      backgroundColor: "var(--bg-hover)",
                      borderRadius: "var(--radius-md)",
                      border: "0.5px solid var(--border-hairline)",
                      marginBottom: "48px"
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "32px" }}>
                        <ProjectActions />
                        <ProjectMetadata />
                      </div>
                    </div>

                    {/* Join Mission Card */}
                    {project.looking_for_contributors && !isOwnProject && (
                      <div style={{ padding: "32px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-md)", marginBottom: "48px" }}>
                        <h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)" }}>
                          <Handshake size={24} weight="fill" /> Join as a Co-Founder
                        </h3>
                        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>The creator is looking for specialized partners to help build this mission. Send a pitch if you're interested.</p>
                        <button
                          onClick={() => setIsCofounderModalOpen(true)}
                          disabled={project.hasAppliedToCofounder}
                          style={{
                            width: "100%", padding: "14px",
                            backgroundColor: "var(--text-primary)", color: "var(--bg-page)",
                            border: "none", borderRadius: "100px", fontWeight: 700, cursor: "pointer",
                            transition: "opacity 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                          {project.hasAppliedToCofounder ? "Application Sent" : "Pitch Myself"}
                        </button>
                      </div>
                    )}

                    <div style={{ marginTop: "40px", borderTop: "0.5px solid var(--border-hairline)", paddingTop: "40px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "32px" }}>Community Discussion</h3>
                      <CommentsSection resourceId={Number(id)} resourceType="project" />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border-hairline)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                    {postsLoading ? (
                      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", backgroundColor: "var(--bg-page)" }}>
                        Loading posts...
                      </div>
                    ) : postsData.posts.length === 0 ? (
                      <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--text-tertiary)", backgroundColor: "var(--bg-page)" }}>
                        <Rocket size={40} weight="thin" style={{ marginBottom: "16px", opacity: 0.5 }} />
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>No ships yet</p>
                        <p style={{ fontSize: "13px" }}>Every post tagged with this project will appear here.</p>
                      </div>
                    ) : (
                      postsData.posts.map((post: any) => (
                        <div key={post.id} style={{ backgroundColor: "var(--bg-page)" }}>
                          <PostCard post={post} onUpdated={refetchPosts} />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "analytics" && isOwnProject && (
                  <ProjectAnalyticsDashboard projectId={project.id} projectTitle={project.title} />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          {isDesktop && (
            <aside style={{
              width: "300px",
              padding: "0",
              position: "sticky",
              top: 0,
              alignSelf: "flex-start",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              <RecommendedUsersSidebar />
            </aside>
          )}
        </div>
      </main>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={shareUrl} title={project.title} />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
      <CreatePostModal
        isOpen={isShipModalOpen}
        onClose={() => setIsShipModalOpen(false)}
        onCreated={() => {
          setIsShipModalOpen(false);
          refetchPosts();
        }}
        initialProjectId={project?.id}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "0" : "0 24px" }}></div>
      <ProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} project={project} onUpdated={fetchProject} />
      {project && <CoFounderRequestModal isOpen={isCofounderModalOpen} onClose={() => setIsCofounderModalOpen(false)} projectId={project.id} projectTitle={project.title} onSuccess={fetchProject} />}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={lightboxImage}
      />
    </div>
  );
}
