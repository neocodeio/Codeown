import { useState, useEffect, useCallback } from "react";
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
import { formatJoinDate } from "../utils/date";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEllipsisV, faUserEdit, faSignOutAlt, faKey, faHeart, faUsers, faUserFriends, faLayerGroup, faRocket, faBookmark, faCalendarAlt, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";

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
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#364182", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=364182&color=fff&bold=true`;

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
          background: #364182;
          color: white;
          border-color: #364182;
        }
        .profile-btn-primary:hover {
          background: #2d3568;
          border-color: #2d3568;
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
          color: #364182;
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
          background: #eef2ff;
          color: #364182;
        }
      `}</style>

      {/* Dynamic Banner */}
      <div style={{
        height: isMobile ? "200px" : "150px",
        background: "linear-gradient(135deg, #364182 0%, #849bff 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
        <div style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
          borderRadius: "50%"
        }} />
      </div>

      <div className="container" style={{
        maxWidth: "1000px",
        margin: isMobile ? "-60px auto 0" : "-100px auto 0",
        position: "relative",
        zIndex: 10,
        padding: isMobile ? "0 12px" : "0 20px"
      }}>
        {/* Profile Card */}
        <div style={{
          backgroundColor: "white",
          borderRadius: isMobile ? "24px" : "32px",
          padding: isMobile ? "20px" : "40px",
          boxShadow: isMobile ? "0 10px 25px rgba(0,0,0,0.05)" : "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #f1f5f9"
        }} className="slide-up">
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-start",
            gap: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? "24px" : "32px",
            textAlign: isMobile ? "center" : "left"
          }}>
            <div style={{
              width: isMobile ? "120px" : "160px",
              height: isMobile ? "120px" : "160px",
              minWidth: isMobile ? "120px" : "160px",
              borderRadius: isMobile ? "36px" : "48px",
              border: isMobile ? "4px solid white" : "8px solid white",
              boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
              overflow: "hidden",
              marginTop: isMobile ? "-80px" : "-100px",
              backgroundColor: "#f8fafc",
              position: "relative"
            }}>
              <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
            </div>

            <div style={{ flex: 1, paddingBottom: isMobile ? "0" : "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", marginBottom: "8px" }}>
                <h1 style={{ fontSize: isMobile ? "24px" : "36px", fontWeight: 900, color: "#1e293b", marginBottom: "0", letterSpacing: "-0.03em" }}>
                  {userProfile?.name || user?.fullName}
                </h1>
                {/* <span style={{
                  padding: isMobile ? "3px 10px" : "4px 12px",
                  background: userProfile?.is_organization ? "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)" : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  color: userProfile?.is_organization ? "#364182" : "#64748b",
                  borderRadius: "10px",
                  fontSize: isMobile ? "10px" : "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  border: "1px solid",
                  borderColor: userProfile?.is_organization ? "#dbeafe" : "#e2e8f0",
                }}>
                  {userProfile?.is_organization ? "Org" : "Dev"}
                </span> */}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", marginBottom: "16px", color: "#64748b" }}>
                <span style={{
                  fontSize: "14px",
                  color: "#364182",
                  fontWeight: 800,
                }}>
                  @{userProfile?.username || user?.username}
                </span>
              </div>

              {userProfile?.bio && (
                <div style={{ fontSize: "16px", lineHeight: "1.6", color: "#475569", marginBottom: "20px", maxWidth: "600px", wordBreak: "break-word" }}>
                  <BioRenderer bio={userProfile.bio} />
                </div>
              )}

              {/* Joined Date & Social Links */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "24px",
                marginBottom: "20px",
                padding: "12px 0",
                justifyContent: isMobile ? "center" : "flex-start"
              }}>
                {userProfile?.created_at && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px", fontWeight: 700 }}>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>Joined {formatJoinDate(userProfile.created_at)}</span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {userProfile?.github_url && (
                    <a href={userProfile.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0f172a", fontSize: "18px", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                      <FontAwesomeIcon icon={faGithub} />
                    </a>
                  )}
                  {userProfile?.twitter_url && (
                    <a href={userProfile.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1da1f2", fontSize: "18px", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                      <FontAwesomeIcon icon={faInstagram} />
                    </a>
                  )}
                  {userProfile?.linkedin_url && (
                    <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0a66c2", fontSize: "18px", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                      <FontAwesomeIcon icon={faLinkedin} />
                    </a>
                  )}
                  {userProfile?.website_url && (
                    <a href={userProfile.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", fontSize: "18px", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                      <FontAwesomeIcon icon={faGlobe} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "8px", justifyContent: isMobile ? "center" : "flex-end" }}>
              <button onClick={() => setIsEditModalOpen(true)} className="profile-btn profile-btn-primary" style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}>
                <FontAwesomeIcon icon={faUserEdit} />
                <span style={{ display: isMobile ? "none" : "inline" }}>Edit Profile</span>
              </button>
              <div style={{ position: "relative" }}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="profile-btn" style={{ width: "45px", justifyContent: "center", padding: "10px 0" }}>
                  <FontAwesomeIcon icon={faEllipsisV} />
                </button>
                {isMenuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "125%",
                    right: 0,
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

          {/* Stats Section */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? "12px" : "16px",
            borderTop: "1px solid #f1f5f9",
            paddingTop: isMobile ? "24px" : "32px",
            marginTop: "8px"
          }}>
            <div className="stat-card" onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}>
              <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#1e293b" }}>{userProfile?.follower_count || 0}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Followers</div>
            </div>
            <div className="stat-card" onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}>
              <div className="stat-icon"><FontAwesomeIcon icon={faUserFriends} /></div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#1e293b" }}>{userProfile?.following_count || 0}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Following</div>
            </div>
            <div className="stat-card" style={{ cursor: "default" }}>
              <div className="stat-icon"><FontAwesomeIcon icon={faHeart} /></div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#1e293b" }}>{userProfile?.total_likes || 0}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Total Likes</div>
            </div>
            <button className="stat-card" style={{ background: "linear-gradient(135deg, #364182 0%, #4a59b3 100%)", border: "none" }} onClick={() => setIsProjectModalOpen(true)}>
              <div className="stat-icon" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}><FontAwesomeIcon icon={faPlus} /></div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "15px", textAlign: "center" }}>New Project</div>
            </button>
          </div>
        </div>

        {/* Content Navigation */}
        <div style={{ marginTop: "48px" }}>
          <div style={{
            display: "flex",
            gap: "4px",
            marginBottom: isMobile ? "16px" : "32px",
            backgroundColor: "white",
            padding: "4px",
            borderRadius: "18px",
            width: isMobile ? "100%" : "fit-content",
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
            border: "1px solid #f1f5f9",
            overflowX: "auto",
            scrollbarWidth: "none",
          }} className="fade-in">
            <button
              onClick={() => setActiveTab("posts")}
              className={`tab-item ${activeTab === "posts" ? 'active' : ''}`}
              style={{
                flex: isMobile ? 1 : "initial",
                justifyContent: "center",
                padding: isMobile ? "12px 8px" : "16px 24px",
                borderRadius: "14px",
                backgroundColor: activeTab === "posts" ? "#f1f5f9" : "transparent"
              }}
            >
              <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: isMobile ? "12px" : "14px" }} />
              <span style={{ fontSize: isMobile ? "12px" : "14px" }}>Posts</span>
              <span style={{ fontSize: "10px", opacity: 0.6, background: activeTab === "posts" ? "#364182" : "#94a3b8", color: "white", padding: "1px 5px", borderRadius: "6px" }}>{posts.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`tab-item ${activeTab === "projects" ? 'active' : ''}`}
              style={{
                flex: isMobile ? 1 : "initial",
                justifyContent: "center",
                padding: isMobile ? "12px 8px" : "16px 24px",
                borderRadius: "14px",
                backgroundColor: activeTab === "projects" ? "#f1f5f9" : "transparent"
              }}
            >
              <FontAwesomeIcon icon={faRocket} style={{ fontSize: isMobile ? "12px" : "14px" }} />
              <span style={{ fontSize: isMobile ? "12px" : "14px" }}>Projects</span>
              <span style={{ fontSize: "10px", opacity: 0.6, background: activeTab === "projects" ? "#364182" : "#94a3b8", color: "white", padding: "1px 5px", borderRadius: "6px" }}>{projects.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`tab-item ${activeTab === "saved" ? 'active' : ''}`}
              style={{
                flex: isMobile ? 1 : "initial",
                justifyContent: "center",
                padding: isMobile ? "12px 8px" : "16px 24px",
                borderRadius: "14px",
                backgroundColor: activeTab === "saved" ? "#f1f5f9" : "transparent"
              }}
            >
              <FontAwesomeIcon icon={faBookmark} style={{ fontSize: isMobile ? "12px" : "14px" }} />
              <span style={{ fontSize: isMobile ? "12px" : "14px" }}>Saved</span>
              <span style={{ fontSize: "10px", opacity: 0.6, background: activeTab === "saved" ? "#364182" : "#94a3b8", color: "white", padding: "1px 5px", borderRadius: "6px" }}>{savedPosts.length + savedProjects.length}</span>
            </button>
          </div>

          <div className="slide-up">
            {activeTab === "posts" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {posts.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                {projects.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                    No projects launched yet.
                  </div>
                ) : (
                  projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={() => fetchUserProjects()} />)
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setSavedSubTab("posts")}
                    className="profile-btn"
                    style={{
                      borderRadius: "12px",
                      backgroundColor: savedSubTab === "posts" ? "#364182" : "white",
                      color: savedSubTab === "posts" ? "white" : "#334155",
                      borderColor: savedSubTab === "posts" ? "#364182" : "#e2e8f0"
                    }}
                  >
                    Saved Posts ({savedPosts.length})
                  </button>
                  <button
                    onClick={() => setSavedSubTab("projects")}
                    className="profile-btn"
                    style={{
                      borderRadius: "12px",
                      backgroundColor: savedSubTab === "projects" ? "#364182" : "white",
                      color: savedSubTab === "projects" ? "white" : "#334155",
                      borderColor: savedSubTab === "projects" ? "#364182" : "#e2e8f0"
                    }}
                  >
                    Saved Projects ({savedProjects.length})
                  </button>
                </div>
                {savedSubTab === "posts" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {savedPostsLoading ? <div style={{ padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                      savedPosts.length === 0 ? <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px" }}>No saved posts.</div> :
                        savedPosts.map((p, i) => <PostCard key={p.id} post={p} index={i} onUpdated={handleProfileUpdated} />)
                    }
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                    {savedProjectsLoading ? <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                      savedProjects.length === 0 ? <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px" }}>No saved projects.</div> :
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
        padding: "60px 20px 100px",
        textAlign: "center",
        marginTop: "100px",
        background: "white",
        borderTop: "1px solid #f1f5f9"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          flexWrap: "wrap",
          marginBottom: "24px"
        }}>
          <Link to="/about" style={{ fontSize: "14px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>About Us</Link>
          <Link to="/privacy" style={{ fontSize: "14px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: "14px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>Terms of Service</Link>
        </div>
        <p style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 700 }}>© {new Date().getFullYear()} Codeown. Crafted with passion by developers.</p>
      </footer>

      {userProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => fetchUserProjects()} />
      {userId && <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"} />}
    </main >
  );
}
