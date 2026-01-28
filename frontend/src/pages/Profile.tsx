import { useState, useEffect } from "react";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useUserPosts } from "../hooks/useUserPosts";
import { useSavedPosts } from "../hooks/useSavedPosts";
import { useUserProjects } from "../hooks/useUserProjects";
import { useUserSavedProjects } from "../hooks/useUserSavedProjects";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import EditProfileModal from "../components/EditProfileModal";
import ProjectModal from "../components/ProjectModal";
import FollowersModal from "../components/FollowersModal";
import BioRenderer from "../components/BioRenderer";
import SkillsRenderer from "../components/SkillsRenderer";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEllipsisH } from "@fortawesome/free-solid-svg-icons";

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
  is_organization: boolean;
  organization_id: string | null;
  skills: string[] | null;
  job_title: string | null;
  location: string | null;
  experience_level: string | null;
  is_hirable: boolean;
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
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "saved">("posts");
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "projects">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=000&color=fff&bold=true`;

  return (
    <main style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .profile-btn {
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
          display: flex;
          alignItems: center;
          gap: 8px;
          background: white;
          color: #0f172a;
          cursor: pointer;
        }
        .profile-btn:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .profile-btn-primary {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }
        .profile-btn-primary:hover {
          background: #1e293b;
          color: white;
        }
        .tab-item {
          padding: 16px 8px;
          font-size: 14px;
          font-weight: 800;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          border: none;
          background: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .tab-item.active {
          color: #0f172a;
        }
        .tab-item.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: #0f172a;
          border-radius: 2px;
        }
        .stat-card {
          padding: 16px;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          background: #fff;
          border-color: #e2e8f0;
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.03);
        }
        .pinned-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          color: white;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
        }
        .role-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .role-badge-dev {
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .role-badge-org {
          background-color: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .hirable-badge {
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #10b981;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hirable-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
        }
      `}</style>

      {/* Modern High-End Banner */}
      <div style={{
        height: isMobile ? "180px" : "120px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} />
        <div style={{
          position: "absolute",
          bottom: "-50px",
          right: "-50px",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(132, 155, 255, 0.1) 0%, transparent 70%)"
        }} />
      </div>

      <div className="container" style={{
        maxWidth: "1000px",
        margin: "-80px auto 0",
        position: "relative",
        zIndex: 10,
        padding: isMobile ? "0 20px" : "0"
      }}>
        {/* Profile Header Content */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "32px",
          padding: isMobile ? "24px" : "40px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
          border: "1px solid #f1f5f9"
        }} className="slide-up">
          <div style={{ position: "absolute", top: "24px", right: "24px", display: "flex", gap: "10px" }}>
            {userProfile && (
              userProfile.is_organization ? (
                <div className="role-badge role-badge-org">Organization</div>
              ) : (
                <div className="role-badge role-badge-dev">Developer</div>
              )
            )}
          </div>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-end",
            gap: "24px",
            marginBottom: "32px",
            textAlign: isMobile ? "center" : "left"
          }}>
            <div style={{
              width: isMobile ? "120px" : "160px",
              height: isMobile ? "120px" : "160px",
              borderRadius: "48px",
              border: "6px solid white",
              boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
              overflow: "hidden",
              marginTop: isMobile ? "-80px" : "-100px",
              backgroundColor: "#f8fafc"
            }}>
              <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
            </div>

            <div style={{ flex: 1, paddingBottom: isMobile ? "0" : "8px" }}>
              <h1 style={{ fontSize: isMobile ? "22px" : "32px", fontWeight: 900, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.04em" }}>
                {userProfile?.name || user?.fullName}
              </h1>
              <p style={{ fontSize: "16px", color: "#64748b", fontWeight: 700, letterSpacing: "0.02em" }}>
                @{userProfile?.username || user?.username}
              </p>
              {(userProfile?.job_title || userProfile?.location) && (
                <div style={{ display: "flex", gap: "16px", marginTop: "8px", color: "#64748b", fontSize: "14px", fontWeight: 600 }}>
                  {userProfile.job_title && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>💼 {userProfile.job_title}</span>
                    </div>
                  )}
                  {userProfile.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📍 {userProfile.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {userProfile?.bio && (
              <div className="slide-up" style={{ fontSize: "18px", lineHeight: "1.6", color: "#475569", marginBottom: "16px", maxWidth: "800px", margin: isMobile ? "0 auto 16px" : "0 0 16px" }}>
                <BioRenderer bio={userProfile.bio} />
              </div>
            )}

            {userProfile?.skills && userProfile.skills.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <SkillsRenderer skills={userProfile.skills} />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
              <button onClick={() => setIsEditModalOpen(true)} className="profile-btn profile-btn-primary">
                Edit Profile
              </button>



              {userProfile?.is_organization && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "12px", border: "1px solid #bbf7d0", fontSize: "13px", fontWeight: 700 }}>
                  Organization Account
                </div>
              )}

              {!userProfile?.is_organization && userProfile?.is_hirable && (
                <div className="hirable-badge">
                  <div className="hirable-dot"></div>
                  Available to hire
                </div>
              )}

              <div style={{ position: "relative" }}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="profile-btn">
                  <FontAwesomeIcon icon={faEllipsisH} />
                </button>
                {isMenuOpen && (
                  <div style={{ position: "absolute", top: "120%", right: 0, backgroundColor: "#fff", border: "1px solid #f1f5f9", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", minWidth: "180px", zIndex: 100, padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <button
                      onClick={() => navigate("/forgot-password")}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "none", background: "none", color: "#0f172a", fontWeight: 700, cursor: "pointer", borderRadius: "8px", fontSize: "13px" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Reset Password
                    </button>
                    <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 8px" }} />
                    <button
                      onClick={handleSignOut}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "none", background: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", borderRadius: "8px", fontSize: "13px" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff1f2"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Minimal Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: "16px",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "32px"
          }}>
            <div className="stat-card" onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{userProfile?.follower_count || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Followers</div>
            </div>
            <div className="stat-card" onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{userProfile?.following_count || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Following</div>
            </div>
            <div className="stat-card" style={{ cursor: "default" }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{userProfile?.total_likes || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Total Likes</div>
            </div>
            <div className="stat-card" style={{ background: "#0f172a", border: "none" }} onClick={() => setIsProjectModalOpen(true)}>
              <div style={{ color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "100%", fontWeight: 800, fontSize: "14px" }}>
                <FontAwesomeIcon icon={faPlus} />
                New Project
              </div>
            </div>
          </div>
        </div>

        {/* Content Navigation */}
        <div style={{ marginTop: "48px" }}>
          <div style={{ display: "flex", gap: "32px", borderBottom: "2px solid #f1f5f9", marginBottom: "32px" }} className="fade-in">
            <button
              onClick={() => setActiveTab("posts")}
              className={`tab-item ${activeTab === "posts" ? 'active' : ''}`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`tab-item ${activeTab === "projects" ? 'active' : ''}`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`tab-item ${activeTab === "saved" ? 'active' : ''}`}
            >
              Saved ({savedPosts.length + savedProjects.length})
            </button>
          </div>

          <div className="slide-up">
            {activeTab === "posts" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {posts.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>No posts published yet.</div>
                ) : (
                  posts.map((p, i) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      index={i}
                      onUpdated={handleProfileUpdated}
                      onPin={() => handlePinPost(p.id)}
                      isPinned={userProfile?.pinned_post_id === p.id}
                    />
                  ))
                )}
              </div>
            ) : activeTab === "projects" ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                {projects.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>No projects launched yet.</div>
                ) : (
                  projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={() => fetchUserProjects()} />)
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  <button onClick={() => setSavedSubTab("posts")} className={`profile-btn ${savedSubTab === "posts" ? 'profile-btn-primary' : ''}`} style={{ padding: "8px 16px" }}>
                    Saved Posts ({savedPosts.length})
                  </button>
                  <button onClick={() => setSavedSubTab("projects")} className={`profile-btn ${savedSubTab === "projects" ? 'profile-btn-primary' : ''}`} style={{ padding: "8px 16px" }}>
                    Saved Projects ({savedProjects.length})
                  </button>
                </div>
                {savedSubTab === "posts" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {savedPostsLoading ? <div style={{ padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                      savedPosts.length === 0 ? <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>No saved posts.</div> :
                        savedPosts.map((p, i) => <PostCard key={p.id} post={p} index={i} onUpdated={handleProfileUpdated} />)
                    }
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                    {savedProjectsLoading ? <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                      savedProjects.length === 0 ? <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>No saved projects.</div> :
                        savedProjects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={fetchUserSavedProjects} />)
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{
        padding: "40px 20px 80px",
        height: "0px",
        textAlign: "center",
        borderTop: "1px solid #f1f5f9",
        marginTop: "40px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}>
          <Link to="/about" style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>About Us</Link>
          <Link to="/privacy" style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Terms of Service</Link>
        </div>
        <p style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>© {new Date().getFullYear()} Codeown. Built for developers.</p>
      </footer>

      {userProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => fetchUserProjects()} />
      {userId && <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"} />}
    </main>
  );
}
