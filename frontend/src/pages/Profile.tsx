import { useState, useEffect } from "react";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserPosts } from "../hooks/useUserPosts";
import { useSavedPosts } from "../hooks/useSavedPosts";
import { useUserProjects } from "../hooks/useUserProjects";
import { useUserSavedProjects } from "../hooks/useUserSavedProjects";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import EditProfileModal from "../components/EditProfileModal";
import ProjectModal from "../components/ProjectModal";
import FollowersModal from "../components/FollowersModal";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faThumbtack, faPlus, faEllipsisH, faUserEdit, faLink, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  username_changed_at: string | null;
  follower_count: number;
  following_count: number;
  total_likes: number;
  pinned_post_id: number | null;
  pinned_post: any | null;
}

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { signOut, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;
  const { posts, fetchUserPosts } = useUserPosts(userId);
  const { savedPosts, loading: savedPostsLoading, fetchSavedPosts } = useSavedPosts();
  const { projects, fetchUserProjects } = useUserProjects(userId);
  const { projects: savedProjects, loading: savedProjectsLoading, fetchUserSavedProjects } = useUserSavedProjects(userId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "projects">("posts");
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "projects">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [techStack, setTechStack] = useState<string[]>([]);

  // Extracted tech stack from projects
  useEffect(() => {
    if (projects && projects.length > 0) {
      const allTech = projects.flatMap(p => p.technologies_used || []);
      const uniqueTech = Array.from(new Set(allTech)).slice(0, 10);
      setTechStack(uniqueTech);
    }
  }, [projects]);

  // Close menu when clicking outside
  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data) setUserProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    if (userId) fetchProfile();
  }, [userId, getToken]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfileUpdated = async () => {
    if (userId) {
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUserProfile(res.data);
        fetchUserPosts();
        fetchSavedPosts();
        fetchUserProjects();
        fetchUserSavedProjects();
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  const handlePinPost = async (postId: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      const endpoint = userProfile?.pinned_post_id === postId ? "/users/pin/unpin" : `/users/pin/${postId}`;
      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      const res = await api.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUserProfile(res.data);
    } catch (error) {
      console.error("Error pinning post:", error);
    }
  };

  if (!isLoaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "100px" }}>
      <style>{`
        @keyframes mesh-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-gentle {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .glass-sidebar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .skill-bar-bg {
          height: 6px;
          background: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 6px;
        }
        .skill-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #0f172a 0%, #3b82f6 100%);
          border-radius: 10px;
        }
        .badge-circle {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          color: #0f172a;
        }
        .badge-circle:hover {
          background: #0f172a;
          color: white;
          transform: translateY(-3px) rotate(8deg);
        }
        .mesh-gradient {
          background: linear-gradient(-45deg, #0f172a, #1e293b, #334155, #000000);
          background-size: 400% 400%;
          animation: mesh-move 15s ease infinite;
        }
        .tech-badge {
          background: white;
          border: 1px solid #e2e8f0;
          color: #475569;
          transition: all 0.2s ease;
          cursor: default;
        }
        .tech-badge:hover {
          background: #0f172a;
          color: white;
          transform: scale(1.05);
          border-color: #0f172a;
        }
        .activity-sq {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        .activity-sq:hover {
          transform: scale(1.3);
          z-index: 2;
        }
        .tab-btn {
          position: relative;
          transition: all 0.3s ease;
        }
        .tab-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 3px;
          background: #000;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .tab-btn.active::after {
          width: 80%;
        }
      `}</style>

      {/* Premium Mesh Banner */}
      <div className="mesh-gradient" style={{
        height: isMobile ? "160px" : "280px",
        marginTop: "20px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "25px",
      }}>
        {/* Abstract code pattern overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />

        {!isMobile && (
          <div style={{
            position: "absolute",
            bottom: "40px",
            right: "40px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
            fontFamily: "monospace",
            textAlign: "right"
          }}>
            {/* <div>const stack = ['react', 'node', 'supabase'];</div>
            <div>developer.status = 'collaborating';</div> */}
          </div>
        )}
      </div>

      <div className="container" style={{
        maxWidth: "1200px",
        margin: isMobile ? "-60px auto 0" : "-100px auto 0",
        position: "relative",
        zIndex: 1,
        padding: isMobile ? "0 15px" : "0 30px"
      }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "30px",
          alignItems: "flex-start"
        }}>
          {/* LEFT SIDEBAR (Profile info) */}
          <aside style={{
            width: isMobile ? "100%" : "360px",
            flexShrink: 0,
            position: isMobile ? "static" : "sticky",
            top: "80px"
          }}>
            <section className="fade-in slide-up glass-sidebar" style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "32px",
              padding: "40px",
              textAlign: isMobile ? "center" : "left"
            }}>
              <div style={{
                width: isMobile ? "120px" : "180px",
                height: isMobile ? "120px" : "180px",
                margin: isMobile ? "-100px auto 25px" : "-130px 0 25px",
                borderRadius: "50px",
                border: "4px solid #e0e0e0",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                backgroundColor: "#f5f5f5",
                animation: "float-gentle 6s ease-in-out infinite"
              }}>
                <img
                  src={userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.fullName}&background=0f172a&color=fff&bold=true`}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "4px", color: "#0f172a", letterSpacing: "-0.5px" }}>
                {userProfile?.name || user?.fullName}
              </h1>
              <p style={{ color: "#64748b", fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>
                @{userProfile?.username || user?.username}
              </p>

              {userProfile?.bio ? (
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#475569", marginBottom: "16px" }}>
                    {userProfile.bio}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "#94a3b8", fontStyle: "italic", marginBottom: "24px" }}>
                  Define your mission in your bio...
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "30px", justifyContent: isMobile ? "center" : "flex-start" }}>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Edit Profile
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#f5f5f5",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <FontAwesomeIcon icon={faEllipsisH} />
                  </button>
                  {isMenuOpen && (
                    <div style={{ position: "absolute", top: "120%", right: 0, backgroundColor: "#fff", border: "1px solid #eee", borderRadius: "12px", boxShadow: "var(--shadow-lg)", minWidth: "120px", zIndex: 10, padding: "5px" }}>
                      <button onClick={handleSignOut} style={{ width: "100%", textAlign: "left", padding: "10px", border: "none", background: "none", color: "#ff4d4d", fontWeight: 600, cursor: "pointer" }}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "24px"
              }}>
                <div
                  onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
                  style={{ cursor: "pointer", padding: "12px", background: "#fff", borderRadius: "16px", textAlign: "center" }}
                >
                  <div style={{ fontWeight: 900, fontSize: "20px", color: "#0f172a" }}>{userProfile?.follower_count || 0}</div>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Followers</div>
                </div>
                <div
                  onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
                  style={{ cursor: "pointer", padding: "12px", background: "#fff", borderRadius: "16px", textAlign: "center" }}
                >
                  <div style={{ fontWeight: 900, fontSize: "20px", color: "#0f172a" }}>{userProfile?.following_count || 0}</div>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Following</div>
                </div>
                <div style={{ gridColumn: "span 2", padding: "12px", background: "#fff", color: "#000", borderRadius: "16px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontWeight: 900, fontSize: "20px", color: "#0f172a" }}>{userProfile?.total_likes || 0}</div>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, color: "#000" }}>Total Likes Accrued</div>
                </div>
              </div>
            </section>

            {/* Add Project Button */}
            <button
              onClick={() => setIsProjectModalOpen(true)}
              style={{
                width: "90%",
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: "16px",
                padding: "14px",
                backgroundColor: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 10px 20px rgba(15, 23, 42, 0.2)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 15px 30px rgba(15, 23, 42, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(15, 23, 42, 0.2)";
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
              New Project
            </button>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div style={{ flex: 1, width: "100%" }}>
            <nav className="fade-in" style={{
              display: "flex",
              gap: isMobile ? "5px" : "15px",
              marginBottom: "30px",
              backgroundColor: "white",
              padding: "8px",
              borderRadius: "24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
              border: "1px solid #f1f5f9",
              overflowX: "auto"
            }}>
              {[
                { id: "posts", label: "Your Posts", count: posts.length },
                { id: "projects", label: "Your Projects", count: projects.length },
                { id: "saved", label: "Saved", count: savedPosts.length + savedProjects.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  style={{
                    flex: isMobile ? "none" : 1,
                    padding: "14px 20px",
                    fontSize: "14px",
                    fontWeight: 800,
                    backgroundColor: activeTab === tab.id ? "#0f172a" : "transparent",
                    color: activeTab === tab.id ? "white" : "#64748b",
                    border: "none",
                    borderRadius: "18px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: "11px",
                    backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                    color: activeTab === tab.id ? "white" : "#64748b",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}>{tab.count}</span>
                </button>
              ))}
            </nav>

            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {activeTab === "posts" ? (
                posts.length === 0 ? (
                  <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO POSTS YET.</div>
                ) : (
                  posts.map((p, i) => (
                    <div key={p.id} style={{ position: "relative" }}>
                      <PostCard post={p} index={i} onUpdated={handleProfileUpdated} />
                      {userProfile?.pinned_post_id === p.id && (
                        <div style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          backgroundColor: "#000",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 800,
                          zIndex: 5,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          Featured
                        </div>
                      )}
                      <button
                        onClick={() => handlePinPost(p.id)}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #eee",
                          color: userProfile?.pinned_post_id === p.id ? "#3b82f6" : "#ccc",
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          zIndex: 5,
                          boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbtack} />
                      </button>
                    </div>
                  ))
                )
              ) : activeTab === "projects" ? (
                projects.length === 0 ? (
                  <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700, textAlign: "center" }}>
                    NO PROJECTS YET.
                    <br />
                    <button
                      onClick={() => setIsProjectModalOpen(true)}
                      style={{
                        marginTop: "20px",
                        padding: "12px 24px",
                        backgroundColor: "#000",
                        color: "#fff",
                        border: "none",
                        borderRadius: "25px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
                      Launch First Project
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "20px"
                  }}>
                    {projects.map((p, i) => (
                      <div key={p.id} style={{ transition: "all 0.3s ease" }}>
                        <ProjectCard project={p} index={i} onUpdated={() => fetchUserProjects()} />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div>
                  {/* Sub-tabs for saved content */}
                  <div style={{ display: "flex", gap: "15px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)" }}>
                    <button
                      onClick={() => setSavedSubTab("posts")}
                      style={{
                        padding: "10px 0",
                        border: "none",
                        background: "transparent",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: savedSubTab === "posts" ? "var(--primary)" : "var(--text-secondary)",
                        borderBottom: savedSubTab === "posts" ? "2px solid var(--primary)" : "2px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      POSTS ({savedPosts.length})
                    </button>
                    <button
                      onClick={() => setSavedSubTab("projects")}
                      style={{
                        padding: "10px 0",
                        border: "none",
                        background: "transparent",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: savedSubTab === "projects" ? "var(--primary)" : "var(--text-secondary)",
                        borderBottom: savedSubTab === "projects" ? "2px solid var(--primary)" : "2px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      PROJECTS ({savedProjects.length})
                    </button>
                  </div>

                  {/* Saved content based on sub-tab */}
                  {savedSubTab === "posts" ? (
                    savedPostsLoading ? (
                      <div style={{ padding: "60px 0", color: "var(--text-secondary)", fontWeight: 700 }}>Loading saved posts...</div>
                    ) : savedPosts.length === 0 ? (
                      <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO SAVED POSTS.</div>
                    ) : (
                      savedPosts.map((p, i) => <PostCard key={p.id} post={p} index={i} onUpdated={handleProfileUpdated} />)
                    )
                  ) : (
                    savedProjectsLoading ? (
                      <div style={{ padding: "60px 0", color: "var(--text-secondary)", fontWeight: 700 }}>Loading saved projects...</div>
                    ) : savedProjects.length === 0 ? (
                      <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO SAVED PROJECTS.</div>
                    ) : (
                      savedProjects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={fetchUserSavedProjects} />)
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {userProfile && (
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />
      )}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onUpdated={() => fetchUserProjects()}
      />
      {userId && (
        <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"} />
      )}
    </main>
  );
}
