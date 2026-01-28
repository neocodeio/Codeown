import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useUserPosts } from "../hooks/useUserPosts";
import { useUserProjects } from "../hooks/useUserProjects";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FollowersModal from "../components/FollowersModal";
import BioRenderer from "../components/BioRenderer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faThumbtack, faUserCheck, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
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
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { posts, loading: postsLoading, fetchUserPosts } = useUserPosts(userId || null);
  const { projects, loading: projectsLoading, fetchUserProjects } = useUserProjects(userId || null);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [activeTab, setActiveTab] = useState<"posts" | "projects">("posts");
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getToken();
        const userRes = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (userRes.data) {
          setUser(userRes.data);
        } else {
          setUser(null);
        }

        if (isSignedIn && !isOwnProfile) {
          try {
            const followRes = await api.get(`/follows/${userId}/status`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setIsFollowing(followRes.data.isFollowing || false);
          } catch (error) {
            console.error("Error checking follow status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, isSignedIn, isOwnProfile, getToken]);

  const handleFollow = async () => {
    if (!isSignedIn || !userId) {
      navigate("/sign-in");
      return;
    }

    setFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.post(`/follows/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFollowing(res.data.following);

      if (user) {
        setUser({
          ...user,
          follower_count: res.data.followerCount ?? (res.data.following ? user.follower_count + 1 : Math.max(0, user.follower_count - 1)),
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!user) return <div style={{ textAlign: "center", padding: "100px", fontWeight: 800 }}>USER NOT FOUND.</div>;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=000000&color=ffffff&bold=true`;

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
          align-items: center;
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
        }
        .profile-btn-following {
          background: transparent;
          color: #0f172a;
          border: 2px solid #0f172a;
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
      `}</style>

      {/* Modern Banner */}
      <div style={{
        height: isMobile ? "180px" : "120px",
        background: "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.3,
          backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px"
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                <h1 style={{ fontSize: isMobile ? "32px" : "42px", fontWeight: 900, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.04em" }}>
                  {user.name}
                </h1>
                {user.is_hirable && (
                  <span style={{ padding: "4px 12px", background: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", border: "1px solid #bbf7d0" }}>
                    Available for hire
                  </span>
                )}
              </div>
              <p style={{ fontSize: "16px", color: "#64748b", fontWeight: 700, letterSpacing: "0.02em" }}>
                @{user.username || "user"} • {user.job_title || "Developer"}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "8px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
              {isSignedIn && (
                <button
                  onClick={() => navigate(`/messages?userId=${userId}`)}
                  className="profile-btn"
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Message</span>
                </button>
              )}
              {isSignedIn && user.is_hirable && (
                <button
                  onClick={() => navigate(`/messages?userId=${userId}&hiring=true`)}
                  className="profile-btn"
                  style={{ backgroundColor: "#6366f1", color: "white", borderColor: "#6366f1" }}
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Hire Me</span>
                </button>
              )}
              {isSignedIn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`profile-btn ${isFollowing ? 'profile-btn-following' : 'profile-btn-primary'}`}
                >
                  <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>
              )}
            </div>
          </div>

          {user.bio && (
            <div style={{ fontSize: "18px", lineHeight: "1.6", color: "#475569", marginBottom: "24px", maxWidth: "800px", margin: isMobile ? "0 auto 24px" : "0 0 24px" }}>
              <BioRenderer bio={user.bio} />
            </div>
          )}

          {user.skills && user.skills.length > 0 && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px", justifyContent: isMobile ? "center" : "flex-start" }}>
              {user.skills.map(skill => (
                <span key={skill} style={{ padding: "6px 14px", backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "10px", fontSize: "13px", fontWeight: 700 }}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Minimal Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
            gap: "16px",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "32px"
          }}>
            <div className="stat-card" onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{user.follower_count}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Followers</div>
            </div>
            <div className="stat-card" onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{user.following_count}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Following</div>
            </div>
            <div className="stat-card" style={{ cursor: "default" }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{user.total_likes}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Likes Recieved</div>
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
          </div>

          <div className="slide-up">
            {activeTab === "posts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {postsLoading ? (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : posts.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>No posts published yet.</div>
                ) : (
                  posts.map((p, i) => (
                    <div key={p.id} style={{ position: "relative" }}>
                      <PostCard post={p} index={i} onUpdated={fetchUserPosts} />
                      {user.pinned_post_id === p.id && (
                        <div style={{
                          position: "absolute",
                          top: "20px",
                          left: "20px",
                          background: "#0f172a",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          zIndex: 10
                        }}>
                          <FontAwesomeIcon icon={faThumbtack} />
                          Featured
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                {projectsLoading ? (
                  <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : projects.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>No projects launched yet.</div>
                ) : (
                  projects.map((project, i) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={i}
                      onUpdated={fetchUserProjects}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: "100px" }} />

      {userId && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={userId}
          type={followersModalType}
          title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
        />
      )}
    </main>
  );
}
