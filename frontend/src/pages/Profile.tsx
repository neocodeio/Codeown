import { useState, useEffect, useCallback } from "react";
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
import BioRenderer from "../components/BioRenderer";
import { formatJoinDate } from "../utils/date";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faUserEdit, faSignOutAlt, faKey, faLayerGroup, faRocket, faCalendarAlt, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import VerifiedBadge from "../components/VerifiedBadge";

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
  job_title: string | null;
  location: string | null;
  experience_level: string | null;
  skills: string[] | null;
  is_hirable: boolean;
  is_organization: boolean;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  banner_url: string | null;
  created_at: string | null;
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

  const handleProfileUpdated = useCallback(async () => {
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
  }, [userId, getToken, fetchUserPosts, fetchSavedPosts, fetchUserProjects, fetchUserSavedProjects]);

  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    window.addEventListener("profileUpdated", handleProfileUpdated);
    window.addEventListener("projectCreated", fetchUserProjects);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      window.removeEventListener("projectCreated", fetchUserProjects);
    };
  }, [handleProfileUpdated, fetchUserProjects]);

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
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=212121&color=fff&bold=true`;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .profile-btn {
          padding: 10px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #334155;
          cursor: pointer;
        }
        .profile-btn:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .profile-btn-primary {
          background: #212121;
          color: white;
          border-color: #212121;
        }
        .profile-btn-primary:hover {
          background: #444;
          border-color: #444;
          color: white;
        }
        .tab-item {
          padding: 16px 24px;
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
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tab-item.active {
          color: #212121;
        }
        .stat-card {
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          background: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.05);
          border-color: #e2e8f0;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          background: #f1f5f9;
          color: #64748b;
          transition: all 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          background: #f0f0f0;
          color: #212121;
        }
      `}</style>

      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "40px 20px"
      }}>
        {/* Banner Section */}
        <div style={{
          width: "100%",
          height: isMobile ? "180px" : "280px",
          borderRadius: "32px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          position: "relative",
          marginBottom: "24px"
        }}>
          {userProfile?.banner_url ? (
            <img
              src={userProfile.banner_url}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="Banner"
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cbd5e1",
              fontSize: isMobile ? "24px" : "48px",
              fontWeight: 900
            }}>
              CODEOWN
            </div>
          )}

          {/* Avatar overlapped bottom left */}
          <div style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            width: isMobile ? "60px" : "80px",
            height: isMobile ? "60px" : "80px",
            borderRadius: "16px",
            border: "4px solid white",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
            backgroundColor: "white",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img
              src={avatarUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="Logo"
            />
          </div>
        </div>

        {/* User Info Section */}
        <div style={{ padding: "0 10px" }}>
          <div style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "12px" : "16px",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h1 style={{
                fontSize: isMobile ? "28px" : "42px",
                fontWeight: 900,
                color: "#000",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "-0.04em",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {userProfile?.name || user?.fullName}
                <VerifiedBadge username={userProfile?.username || user?.username} size={isMobile ? "24px" : "16px"} />
              </h1>
              <div style={{
                fontSize: "18px",
                color: "#64748b",
                fontWeight: 500
              }}>
                @{userProfile?.username || user?.username}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "100px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                <FontAwesomeIcon icon={faUserEdit} style={{ fontSize: "14px" }} />
                Edit Profile
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "8px",
                    fontSize: "18px"
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisV} />
                </button>
                {isMenuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: isMobile ? "auto" : 0,
                    right: isMobile ? 0 : "auto",
                    backgroundColor: "#fff",
                    border: "1px solid #f1f5f9",
                    borderRadius: "18px",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
                    minWidth: "200px",
                    zIndex: 100,
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    animation: "slideUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)"
                  }}>
                    <button
                      onClick={() => navigate("/forgot-password")}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "none", background: "none", color: "#1e293b", fontWeight: 700, cursor: "pointer", borderRadius: "12px", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <FontAwesomeIcon icon={faKey} style={{ width: "16px", opacity: 0.6 }} />
                      Reset Password
                    </button>
                    <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 8px" }} />
                    <button
                      onClick={handleSignOut}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "none", background: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", borderRadius: "12px", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff1f2"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} style={{ width: "16px", opacity: 0.8 }} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {userProfile?.bio && (
            <div style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#334155",
              marginBottom: "20px",
              maxWidth: "600px"
            }}>
              <BioRenderer bio={userProfile.bio} />
            </div>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "24px"
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              Joined {formatJoinDate(userProfile?.created_at || "")}
            </span>
            <span
              onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
              style={{ cursor: "pointer", color: "#1e293b" }}
            >
              <strong style={{ fontWeight: 800 }}>{userProfile?.follower_count || 0}</strong> followers
            </span>
            <span
              onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
              style={{ cursor: "pointer", color: "#1e293b" }}
            >
              <strong style={{ fontWeight: 800 }}>{userProfile?.following_count || 0}</strong> following
            </span>
            <span style={{ color: "#1e293b" }}>
              <strong style={{ fontWeight: 800 }}>{userProfile?.total_likes || 0}</strong> likes
            </span>
          </div>

          {/* Social Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
            {userProfile?.github_url && (
              <a href={userProfile.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGithub} />
              </a>
            )}
            {userProfile?.twitter_url && (
              <a href={userProfile.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            )}
            {userProfile?.linkedin_url && (
              <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
            )}
            {userProfile?.website_url && (
              <a href={userProfile.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGlobe} />
              </a>
            )}
          </div>

          {/* Tech Stack / Skills */}
          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Tech Stack</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {userProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#334155",
                      transition: "all 0.2s ease",
                      cursor: "default"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#212121";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div style={{
          display: "flex",
          gap: "32px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "32px"
        }}>
          <button
            onClick={() => setActiveTab("posts")}
            style={{
              padding: "16px 4px",
              border: "none",
              background: "none",
              fontSize: "14px",
              fontWeight: 800,
              color: activeTab === "posts" ? "#000" : "#94a3b8",
              borderBottom: activeTab === "posts" ? "2px solid #000" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            POSTS
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            style={{
              padding: "16px 4px",
              border: "none",
              background: "none",
              fontSize: "14px",
              fontWeight: 800,
              color: activeTab === "projects" ? "#000" : "#94a3b8",
              borderBottom: activeTab === "projects" ? "2px solid #000" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            PROJECTS
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            style={{
              padding: "16px 4px",
              border: "none",
              background: "none",
              fontSize: "14px",
              fontWeight: 800,
              color: activeTab === "saved" ? "#000" : "#94a3b8",
              borderBottom: activeTab === "saved" ? "2px solid #000" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            SAVED
          </button>
        </div>

        {/* Tab Content */}
        <div className="slide-up">
          {activeTab === "posts" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {posts.length === 0 ? (
                <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faLayerGroup} /></div>
                  No posts published yet.
                </div>
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
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {projects.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                  No projects launched yet.
                </div>
              ) : (
                projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={() => fetchUserProjects()} />)
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                <button
                  onClick={() => setSavedSubTab("posts")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: savedSubTab === "posts" ? "#000" : "white",
                    color: savedSubTab === "posts" ? "white" : "#64748b",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  POSTS
                </button>
                <button
                  onClick={() => setSavedSubTab("projects")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: savedSubTab === "projects" ? "#000" : "white",
                    color: savedSubTab === "projects" ? "white" : "#64748b",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  PROJECTS
                </button>
              </div>
              {savedSubTab === "posts" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {savedPostsLoading ? <div style={{ padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                    savedPosts.length === 0 ? <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>No saved posts.</div> :
                      savedPosts.map((p, i) => <PostCard key={p.id} post={p} index={i} onUpdated={handleProfileUpdated} />)
                  }
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                  {savedProjectsLoading ? <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                    savedProjects.length === 0 ? <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>No saved projects.</div> :
                      savedProjects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={fetchUserSavedProjects} />)
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {userProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => fetchUserProjects()} />
      {userId && <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"} />}
    </main>
  );
}
