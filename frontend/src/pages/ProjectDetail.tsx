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
import { CaretLeft, Globe, GithubLogo, Star, ShareNetwork, BookmarkSimple, Handshake, Rocket } from "phosphor-react";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import ShareModal from "../components/ShareModal";
import ProjectChangelog from "../components/ProjectChangelog";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import CoFounderRequestModal from "../components/CoFounderRequestModal";
import { toast } from "react-toastify";
import SendToChatModal from "../components/SendToChatModal";

export default function ProjectDetail() {
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
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
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);

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
      <div style={{ width: "20px", height: "20px", border: "0.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "999px", animation: "spin 0.6s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!project) return <div style={{ textAlign: "center", padding: "100px", color: "var(--text-tertiary)" }}>Project not found</div>;

  const isOwnProject = currentUser?.id === project.user_id;
  const userName = project.user?.name || "User";
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=212121&color=ffffff&bold=true`;
  const shareUrl = `${window.location.origin}/project/${id}`;

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: isDesktop ? "0 0 40px 0" : "0 24px 40px" }}>
      {/* Links Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {project.live_demo && (
          <a href={project.live_demo} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 700, fontSize: "14px", justifyContent: "center" }}>
            <Globe size={18} weight="bold" /> View Live Project
          </a>
        )}
        {project.github_repo && (
          <a href={project.github_repo} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", textDecoration: "none", fontWeight: 700, fontSize: "14px", justifyContent: "center" }}>
            <GithubLogo size={18} weight="bold" /> View Source Code
          </a>
        )}
        <button onClick={() => setIsShareModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", fontWeight: 700, fontSize: "14px", justifyContent: "center", cursor: "pointer" }}>
          <ShareNetwork size={18} weight="bold" /> Share Project
        </button>
      </div>

      {/* Tech Stack */}
      {project.technologies_used && project.technologies_used.length > 0 && (
        <div>
          <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Tech Stack</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {project.technologies_used.map(tech => (
              <span key={tech} style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontWeight: 500 }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Community Rating */}
      <div style={{ padding: "24px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }}>
        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Community Rating</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              size={24} 
              weight={(hoverRating || userRating || (project.rating || 0)) >= star ? "fill" : "regular"}
              style={{ 
                color: (hoverRating || userRating || (project.rating || 0)) >= star ? "var(--text-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
                transition: "all 0.15s ease"
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

      {/* Contributors */}
      {project.contributors && project.contributors.length > 0 && (
        <div>
          <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Contributors</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {project.contributors.map(c => (
              <div key={c.user_id} onClick={() => navigate(`/user/${c.user_id}`)} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <img src={c.avatar_url || avatarUrl} style={{ width: "32px", height: "32px", borderRadius: "10px", border: "0.5px solid var(--border-hairline)" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{c.name || c.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <main style={{ 
      backgroundColor: "var(--bg-page)", 
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      width: "100%"
    }}>
      <SEO title={project.title} description={project.description} image={project.cover_image || avatarUrl} />
      
      <div style={{ display: "flex", width: isDesktop ? "1020px" : "100%", maxWidth: "1020px", position: "relative" }}>
        
        {/* Main Content Column */}
        <div style={{ 
          flex: 1, 
          width: isDesktop ? "var(--feed-width)" : "100%", 
          maxWidth: isDesktop ? "var(--feed-width)" : "700px",
          borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
          borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
          backgroundColor: "var(--bg-page)",
          minHeight: "100vh",
          margin: isDesktop ? "0" : "0 auto",
        }}>
          {/* Header */}
          <header style={{ 
            position: "sticky", 
            top: 0, 
            backgroundColor: "rgba(var(--bg-page-rgb, 255, 255, 255), 0.8)", 
            backdropFilter: "blur(20px)", 
            zIndex: 100, 
            padding: "16px 24px", 
            display: "flex", 
            alignItems: "center", 
            gap: "24px", 
            borderBottom: "0.5px solid var(--border-hairline)" 
          }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
              <CaretLeft size={20} weight="thin" color="var(--text-primary)" />
            </button>
            <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Project</h1>
            <div style={{ flex: 1 }} />
            {isOwnProject && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setIsEditModalOpen(true)} style={{ background: "none", border: "0.5px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                <button onClick={() => setIsDeleteModalOpen(true)} style={{ background: "none", border: "0.5px solid var(--border-hairline)", color: "rgba(239, 68, 68, 0.8)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
              </div>
            )}
          </header>

          {/* Project Banner */}
          {project.cover_image && (
            <div style={{ width: "100%", height: isMobile ? "240px" : "380px", overflow: "hidden", borderBottom: "0.5px solid var(--border-hairline)" }}>
              <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {/* Project Intro */}
          <div style={{ padding: "32px 24px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", margin: "0 0 16px" }}>{project.title}</h2>
                <div onClick={() => navigate(`/${project.user?.username || project.user_id}`)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <img src={avatarUrl} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "0.5px solid var(--border-hairline)" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                      {userName} <VerifiedBadge username={project.user?.username} size="14px" />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>@{project.user?.username} • {formatRelativeDate(project.created_at)}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                 <button onClick={handleLike} style={{ background: isLiked ? "rgba(249, 24, 128, 0.1)" : "var(--bg-hover)", border: isLiked ? "0.5px solid rgba(249, 24, 128, 0.3)" : "0.5px solid var(--border-hairline)", color: isLiked ? "#f91880" : "var(--text-secondary)", borderRadius: "var(--radius-sm)", padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", transition: "all 0.2s" }}>
                   <Star size={20} weight={isLiked ? "fill" : "regular"} />
                   <span style={{ fontSize: "15px", fontWeight: 800 }}>{likeCount}</span>
                 </button>
                 <button onClick={handleSave} style={{ background: isSaved ? "var(--bg-hover)" : "transparent", border: "0.5px solid var(--border-hairline)", color: isSaved ? "var(--text-primary)" : "var(--text-tertiary)", borderRadius: "var(--radius-sm)", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                   <BookmarkSimple size={20} weight={isSaved ? "fill" : "regular"} />
                 </button>
              </div>
            </div>

            {/* Founder's Vision Callout */}
            {project.founder_vision && (
              <div style={{ marginBottom: "32px", padding: "24px", backgroundColor: "var(--bg-hover)", borderLeft: "3px solid var(--text-primary)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "8px" }}>
                  <Rocket size={14} weight="fill" /> Founder's Vision
                </div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>"{project.founder_vision}"</p>
              </div>
            )}

            {/* Project Tabs */}
            <div style={{ display: "flex", borderBottom: "0.5px solid var(--border-hairline)", marginBottom: "32px" }}>
              <button onClick={() => setActiveTab("details")} style={{ flex: 1, padding: "16px", background: "none", border: "none", borderBottom: activeTab === "details" ? "2px solid var(--text-primary)" : "none", color: activeTab === "details" ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Details</button>
              <button onClick={() => setActiveTab("changelog")} style={{ flex: 1, padding: "16px", background: "none", border: "none", borderBottom: activeTab === "changelog" ? "2px solid var(--text-primary)" : "none", color: activeTab === "changelog" ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Changelog</button>
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: "400px", paddingBottom: "60px" }}>
              {activeTab === "details" ? (
                <div>
                  <div style={{ fontSize: "17px", lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap", marginBottom: "48px" }}>
                    <ContentRenderer content={project.description || ""} />
                  </div>

                  {/* Co-founder Call-to-action */}
                  {project.looking_for_contributors && !isOwnProject && (
                    <div style={{ padding: "32px", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-md)", marginBottom: "48px" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
                        <Handshake size={20} weight="fill" /> Join as a Co-Founder
                      </h3>
                      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>The creator is looking for a partner to build this mission. Apply now to connect.</p>
                      <button onClick={() => setIsCofounderModalOpen(true)} disabled={project.hasAppliedToCofounder} style={{ width: "100%", padding: "14px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
                        {project.hasAppliedToCofounder ? "Application Sent" : "Pitch Myself"}
                      </button>
                    </div>
                  )}

                  {!isDesktop && <SidebarContent />}

                  <div style={{ marginTop: "40px", borderTop: "0.5px solid var(--border-hairline)", paddingTop: "40px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "32px" }}>Discussion</h3>
                    <CommentsSection resourceId={Number(id)} resourceType="project" />
                  </div>
                </div>
              ) : (
                <ProjectChangelog projectId={Number(id)} isOwner={isOwnProject} />
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        {isDesktop && (
          <aside style={{ width: "340px", padding: "32px 0 32px 32px", position: "sticky", top: 0, alignSelf: "flex-start", flexShrink: 0 }}>
             <SidebarContent />
          </aside>
        )}
      </div>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={shareUrl} title={`Share ${project.title}`} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Delete Project?" message="This will permanently remove the project and all its changelogs." isLoading={isDeleting} />
      <SendToChatModal isOpen={isSendToChatModalOpen} onClose={() => setIsSendToChatModalOpen(false)} projectId={project.id} initialMessage={`Check out this project: ${project.title}`} />
      <ProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} project={project} onUpdated={fetchProject} />
      {project && <CoFounderRequestModal isOpen={isCofounderModalOpen} onClose={() => setIsCofounderModalOpen(false)} projectId={project.id} projectTitle={project.title} onSuccess={fetchProject} />}
    </main>
  );
}
