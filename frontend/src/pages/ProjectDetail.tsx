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
import { CaretLeft, Globe, GithubLogo, Star, BookmarkSimple, ShareNetwork, Handshake, Rocket } from "phosphor-react";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import ShareModal from "../components/ShareModal";
import ProjectChangelog from "../components/ProjectChangelog";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import CoFounderRequestModal from "../components/CoFounderRequestModal";
import { toast } from "react-toastify";

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

  const viewLogged = useRef(false);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchReactionStatus();
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

      if (!viewLogged.current) {
        viewLogged.current = true;
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
      console.log("Reaction status not available");
    }
  };

  const handleLike = async () => {
    if (!currentUser) { navigate("/sign-in"); return; }
    try {
      const token = await getToken();
      const response = await api.post(`/projects/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) { console.error(error); }
  };

  const handleSave = async () => {
    if (!currentUser) { navigate("/sign-in"); return; }
    try {
      const token = await getToken();
      const response = await api.post(`/projects/${id}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsSaved(response.data.isSaved);
    } catch (error) { console.error(error); }
  };

  const handleRate = async (rating: number) => {
    if (!currentUser) { navigate("/sign-in"); return; }
    try {
      const token = await getToken();
      const response = await api.post(`/projects/${id}/rate`, { rating }, { headers: { Authorization: `Bearer ${token}` } });
      setUserRating(rating);
      setProject(prev => prev ? { ...prev, rating: response.data.average, rating_count: response.data.count } : null);
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

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "999px", animation: "spin 0.6s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!project) return <div style={{ textAlign: "center", padding: "100px", color: "var(--text-tertiary)" }}>Project not found</div>;

  const isOwnProject = currentUser?.id === project.user_id;
  const userName = project.user?.name || "User";
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=212121&color=ffffff&bold=true`;
  const shareUrl = `${window.location.origin}/project/${id}`;

  return (
    <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <SEO title={project.title} description={project.description} image={project.cover_image || avatarUrl} />

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "20px" : "40px" }}>
        
        {/* Back Button */}
        <div style={{ marginBottom: "32px" }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              background: "none", 
              border: "none", 
              color: "var(--text-secondary)", 
              fontWeight: 700, 
              fontSize: "14px", 
              cursor: "pointer",
              padding: "0" 
            }}
          >
            <CaretLeft size={20} weight="bold" />
            Back
          </button>
        </div>

        {/* Banner Section */}
        {project.cover_image && (
          <div style={{ width: "100%", height: isMobile ? "240px" : "400px", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "32px", border: "0.5px solid var(--border-hairline)" }}>
            <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "24px" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h1 style={{ fontSize: isMobile ? "32px" : "44px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", margin: "0 0 24px" }}>{project.title}</h1>
            
            <div onClick={() => navigate(`/${project.user?.username || project.user_id}`)} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <img src={avatarUrl} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "0.5px solid var(--border-hairline)" }} />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  {userName} <VerifiedBadge username={project.user?.username} size="14px" />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>@{project.user?.username} • {formatRelativeDate(project.created_at)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={handleLike} style={{ 
              background: isLiked ? "rgba(249, 24, 128, 0.1)" : "var(--bg-hover)", 
              border: isLiked ? "0.5px solid rgba(249, 24, 128, 0.3)" : "0.5px solid var(--border-hairline)", 
              color: isLiked ? "#f91880" : "var(--text-secondary)", 
              borderRadius: "var(--radius-sm)", 
              padding: "12px 24px", 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              cursor: "pointer" 
            }}>
              <Star size={20} weight={isLiked ? "fill" : "regular"} />
              <span style={{ fontSize: "16px", fontWeight: 800 }}>{likeCount}</span>
            </button>
            <button onClick={handleSave} style={{ background: isSaved ? "var(--bg-hover)" : "transparent", border: "0.5px solid var(--border-hairline)", color: isSaved ? "var(--text-primary)" : "var(--text-tertiary)", borderRadius: "var(--radius-sm)", padding: "12px", display: "flex", cursor: "pointer" }}>
              <BookmarkSimple size={20} weight={isSaved ? "fill" : "regular"} />
            </button>
            <button onClick={() => setIsShareModalOpen(true)} style={{ background: "transparent", border: "0.5px solid var(--border-hairline)", color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)", padding: "12px", display: "flex", cursor: "pointer" }}>
              <ShareNetwork size={20} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: "60px" }}>
          
          <div style={{ minWidth: 0 }}>
            {/* Vision Callout */}
            {project.founder_vision && (
              <div style={{ marginBottom: "48px", padding: "32px", backgroundColor: "var(--bg-hover)", borderLeft: "4px solid var(--text-primary)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "12px" }}>
                  <Rocket size={16} weight="fill" /> Founder's Vision
                </div>
                <p style={{ margin: 0, fontSize: "17px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>"{project.founder_vision}"</p>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "0.5px solid var(--border-hairline)", marginBottom: "40px" }}>
              <button 
                onClick={() => setActiveTab("details")} 
                style={{ 
                  padding: "16px 32px", 
                  background: "none", 
                  border: "none", 
                  borderBottom: activeTab === "details" ? "3px solid var(--text-primary)" : "3px solid transparent", 
                  color: activeTab === "details" ? "var(--text-primary)" : "var(--text-tertiary)", 
                  fontWeight: 800, 
                  fontSize: "14px", 
                  cursor: "pointer",
                  borderRadius: "0",
                  transition: "all 0.2s ease"
                }}
              >
                Project Details
              </button>
              <button 
                onClick={() => setActiveTab("changelog")} 
                style={{ 
                  padding: "16px 32px", 
                  background: "none", 
                  border: "none", 
                  borderBottom: activeTab === "changelog" ? "3px solid var(--text-primary)" : "3px solid transparent", 
                  color: activeTab === "changelog" ? "var(--text-primary)" : "var(--text-tertiary)", 
                  fontWeight: 800, 
                  fontSize: "14px", 
                  cursor: "pointer",
                  borderRadius: "0",
                  transition: "all 0.2s ease"
                }}
              >
                Changelog
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: "400px" }}>
              {activeTab === "details" ? (
                <div>
                  <div style={{ fontSize: "17px", lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-wrap", marginBottom: "60px" }}>
                    <ContentRenderer content={project.description || ""} />
                  </div>
                  
                  {/* Join Mission Card */}
                  {project.looking_for_contributors && !isOwnProject && (
                    <div style={{ padding: "40px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-md)", marginBottom: "60px" }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px" }}>
                        <Handshake size={24} weight="fill" /> Join as a Co-Founder
                      </h3>
                      <p style={{ margin: "0 0 32px", fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6 }}>The creator is looking for specialized partners to help build this mission. Send a pitch if you're interested.</p>
                      <button onClick={() => setIsCofounderModalOpen(true)} disabled={project.hasAppliedToCofounder} style={{ width: "100%", padding: "16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
                        {project.hasAppliedToCofounder ? "Application Sent" : "Pitch Myself"}
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: "60px", borderTop: "0.5px solid var(--border-hairline)", paddingTop: "40px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "32px" }}>Community Discussion</h3>
                    <CommentsSection resourceId={Number(id)} resourceType="project" />
                  </div>
                </div>
              ) : (
                <ProjectChangelog projectId={Number(id)} isOwner={isOwnProject} />
              )}
            </div>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {/* Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {project.live_demo && (
                <a href={project.live_demo} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 700, fontSize: "13px", justifyContent: "center" }}>
                  <Globe size={18} weight="bold" /> View Live Project
                </a>
              )}
              {project.github_repo && (
                <a href={project.github_repo} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", textDecoration: "none", fontWeight: 700, fontSize: "13px", justifyContent: "center" }}>
                  <GithubLogo size={18} weight="bold" /> Source Code
                </a>
              )}
            </div>

            {/* Rating */}
            <div>
              <h4 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Community Rating</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={24} 
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
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {project.rating ? `${project.rating.toFixed(1)} / 5.0` : "No ratings yet"}
                <span style={{ color: "var(--text-tertiary)", marginLeft: "6px", fontWeight: 400 }}>({project.rating_count || 0} votes)</span>
              </div>
            </div>

            {/* Tech Stack */}
            {project.technologies_used && project.technologies_used.length > 0 && (
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Tech Stack</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {project.technologies_used.map(tech => (
                    <span key={tech} style={{ fontSize: "11px", padding: "6px 12px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontWeight: 600 }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Actions */}
            {isOwnProject && (
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px", paddingTop: "20px", borderTop: "0.5px solid var(--border-hairline)" }}>
                <button onClick={() => setIsEditModalOpen(true)} style={{ width: "100%", padding: "12px", background: "none", border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Edit Project</button>
                <button onClick={() => setIsDeleteModalOpen(true)} style={{ width: "100%", padding: "12px", background: "none", border: "0.5px solid var(--border-hairline)", color: "#ef4444", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Delete Project</button>
              </div>
            )}
          </aside>
        </div>
      </main>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={shareUrl} title={project.title} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} isLoading={isDeleting} title="Delete Project?" message="This action cannot be undone." />
      <ProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} project={project} onUpdated={fetchProject} />
      {project && <CoFounderRequestModal isOpen={isCofounderModalOpen} onClose={() => setIsCofounderModalOpen(false)} projectId={project.id} projectTitle={project.title} onSuccess={fetchProject} />}
    </div>
  );
}
