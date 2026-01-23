import { useState, useEffect } from "react";
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
import { faSignOutAlt, faThumbtack, faPlus, faEllipsisH, faPen, faUserEdit } from "@fortawesome/free-solid-svg-icons";

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
    <main className="container" style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <section className="fade-in slide-up" style={{ marginBottom: "60px", borderBottom: "4px solid var(--border-color)", paddingBottom: "10px", backgroundColor: "#f5f5f5", padding: "30px", borderRadius: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
            <div style={{ width: "160px", height: "160px", border: "1px solid #ddd", overflow: "hidden", borderRadius: "50%" }}>
              <img
                src={userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.fullName}&background=000000&color=fff&bold=true`}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, border: "none", padding: "4px", backgroundColor: "#000", borderRadius: "25px", color: "#fff" }}
              >
                <FontAwesomeIcon icon={faPlus} size="lg" />
                <span style={{ fontWeight: 600, border: "none", padding: "4px", backgroundColor: "#000", borderRadius: "25px", color: "#fff" }}>Add Project</span>
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="btn-secondary"
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "16px",
                    fontWeight: 600,
                    border: "none",
                    color: "#000",
                    backgroundColor: "#f5f5f5",
                    justifyContent: "center",
                    padding: 0,
                    borderRadius: "50%"
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisH} size="lg" style={{ border: "none", padding: "5px", borderRadius: "25px", color: "#000" }} />
                </button>

                {isMenuOpen && (
                  <div
                    className="fade-in scale-in"
                    style={{
                      position: "absolute",
                      top: "120%",
                      right: 0,
                      backgroundColor: "#fff",
                      border: "2px solid #e0e0e0",
                      borderRadius: "15px",
                      boxShadow: "var(--shadow-lg)",
                      minWidth: "160px",
                      zIndex: 50,
                      padding: "6px",
                      overflow: "hidden"
                    }}
                  >
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#000",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderRadius: "6px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <FontAwesomeIcon icon={faUserEdit} style={{ width: "16px" }} />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderRadius: "6px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} style={{ width: "16px" }} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <header style={{ marginBottom: "40px" }} className="stagger-1 slide-up">
            <h1 style={{ fontSize: "48px", marginBottom: "8px" }}>{userProfile?.name || user?.fullName}</h1>
            <p style={{ color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 800, marginBottom: "24px" }}>
              @{userProfile?.username || user?.username}
            </p>
            {userProfile?.bio && (
              <p style={{ fontSize: "18px", lineHeight: "1.6", maxWidth: "600px", color: "var(--text-secondary)" }}>
                {userProfile.bio}
              </p>
            )}
          </header>

          <div className="stagger-1 slide-up" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "2px solid #e0e0e0", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: "25px" }}>
            <div
              onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
              style={{ padding: "24px", borderRight: "1px solid #e0e0e0", cursor: "pointer" }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile?.follower_count || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>FOLLOWERS</div>
            </div>
            <div
              onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
              style={{ padding: "24px", borderRight: "1px solid #e0e0e0", cursor: "pointer" }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile?.following_count || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>FOLLOWING</div>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile?.total_likes || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>LIKES</div>
            </div>
          </div>
        </section>

        <nav className="stagger-2 slide-up" style={{ display: "flex", gap: "40px", marginBottom: "40px", borderBottom: "1px solid var(--border-light)" }}>
          <button
            onClick={() => setActiveTab("posts")}
            style={{
              border: "2px solid #e0e0e0",
              padding: "12px 6px",
              fontSize: "13px",
              fontWeight: 800,
              color: activeTab === "posts" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "posts" ? "2px solid var(--text-primary)" : "2px solid transparent",
              borderRadius: "15px"
            }}
          >
            POSTS ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            style={{
              border: "2px solid #e0e0e0",
              padding: "12px 6px",
              fontSize: "13px",
              fontWeight: 800,
              color: activeTab === "projects" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "projects" ? "2px solid var(--text-primary)" : "2px solid transparent",
              borderRadius: "15px"
            }}
          >
            PROJECTS ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            style={{
              border: "2px solid #e0e0e0",
              padding: "12px 6px",
              fontSize: "13px",
              fontWeight: 800,
              color: activeTab === "saved" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "saved" ? "2px solid var(--text-primary)" : "2px solid transparent",
              borderRadius: "15px"
            }}
          >
            SAVED ({savedPosts.length})
          </button>
        </nav>

        <div className="stagger-3 slide-up" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {activeTab === "posts" ? (
            posts.length === 0 ? (
              <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO POSTS YET.</div>
            ) : (
              posts.map((p, i) => (
                <div key={p.id} style={{ position: "relative" }}>
                  <PostCard post={p} index={i} onUpdated={handleProfileUpdated} />
                  <button
                    onClick={() => handlePinPost(p.id)}
                    style={{
                      position: "absolute",
                      top: "5px",
                      left: "5px",
                      cursor: "pointer",
                      padding: "8px",
                      border: "1px solid var(--border-color)",
                      color: userProfile?.pinned_post_id === p.id ? "#f5f5f5" : "#f5f5f5",
                      backgroundColor: "var(--bg-card)"
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
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
                  Create Your First Project
                </button>
              </div>
            ) : (
              projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={() => fetchUserProjects()} />)
            )
          ) : (
            <div>
              {/* Sub-tabs for saved content */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "30px", borderBottom: "2px solid var(--border-color)" }}>
                <button
                  onClick={() => setSavedSubTab("posts")}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: savedSubTab === "posts" ? "var(--primary)" : "var(--text-secondary)",
                    borderBottom: savedSubTab === "posts" ? "2px solid var(--primary)" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  SAVED POSTS ({savedPosts.length})
                </button>
                <button
                  onClick={() => setSavedSubTab("projects")}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: savedSubTab === "projects" ? "var(--primary)" : "var(--text-secondary)",
                    borderBottom: savedSubTab === "projects" ? "2px solid var(--primary)" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  SAVED PROJECTS ({savedProjects.length})
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
