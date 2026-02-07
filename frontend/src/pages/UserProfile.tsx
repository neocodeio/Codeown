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
import { formatJoinDate } from "../utils/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faThumbtack,
  faUserCheck,
  faEnvelope,
  faUsers,
  faUserFriends,
  faRocket,
  faLayerGroup,
  faHeart,
  faCalendarAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";
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
  is_organization: boolean;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string | null;
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
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!user) return <div style={{ textAlign: "center", padding: "100px", fontWeight: 800 }}>USER NOT FOUND.</div>;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=212121&color=ffffff&bold=true`;

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
        }
        .profile-btn-following {
          background: transparent;
          color: #212121;
          border: 2px solid #212121;
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

      {/* Dynamic Banner */}
      <div style={{
        height: isMobile ? "200px" : "150px",
        background: "linear-gradient(135deg, #212121 0%, #444 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
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
          {/* Redesigned Profile Header */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "24px",
            textAlign: "left"
          }}>
            {/* Top Row: Avatar and Actions */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "12px",
              position: "relative",
              height: "60px" // Reserve space for avatar overlap
            }}>
              {/* Avatar Wrapper */}
              <div style={{
                position: "absolute",
                top: isMobile ? "-70px" : "-90px", // Pull up into banner
                left: 0,
                width: isMobile ? "110px" : "150px",
                height: isMobile ? "110px" : "150px",
                borderRadius: isMobile ? "32px" : "42px",
                border: "6px solid white",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                backgroundColor: "#f8fafc",
                overflow: "hidden",
                zIndex: 10
              }}>
                <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
              </div>

              {/* Spacer for Avatar */}
              <div style={{ width: isMobile ? "120px" : "160px" }} />

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", paddingBottom: "10px" }}>
                {isSignedIn && (
                  <button
                    onClick={() => navigate(`/messages?userId=${userId}`)}
                    className="profile-btn"
                    style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span style={{ display: isMobile ? "none" : "inline" }}>Message</span>
                  </button>
                )}
                {isSignedIn && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`profile-btn ${isFollowing ? 'profile-btn-following' : 'profile-btn-primary'}`}
                    style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}
                  >
                    <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div>
              <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 900, color: "#1e293b", marginBottom: "4px", letterSpacing: "-0.03em", lineHeight: "1.2" }}>
                {user.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "#64748b" }}>
                <span style={{ fontWeight: 800, color: "#212121", fontSize: "15px" }}>@{user.username || "user"}</span>
                {user.created_at && (
                  <>
                    <span style={{ color: "#cbd5e1" }}>•</span>
                    <span style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: "12px" }} />
                      Joined {formatJoinDate(user.created_at)}
                    </span>
                  </>
                )}
              </div>

              {user.bio && (
                <div style={{ fontSize: "16px", lineHeight: "1.6", color: "#475569", marginBottom: "24px", maxWidth: "700px", wordBreak: "break-word" }}>
                  <BioRenderer bio={user.bio} />
                </div>
              )}

              {/* Social Links */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {user.github_url && (
                  <a href={user.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#334155", fontSize: "20px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#000"} onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
                    <FontAwesomeIcon icon={faGithub} />
                  </a>
                )}
                {user.twitter_url && (
                  <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "#334155", fontSize: "20px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#1da1f2"} onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
                    <FontAwesomeIcon icon={faInstagram} />
                  </a>
                )}
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#334155", fontSize: "20px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#0a66c2"} onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
                    <FontAwesomeIcon icon={faLinkedin} />
                  </a>
                )}
                {user.website_url && (
                  <a href={user.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#334155", fontSize: "20px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#212121"} onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
                    <FontAwesomeIcon icon={faGlobe} />
                  </a>
                )}
              </div>

              {/* Tech Stack / Skills */}
              {user.skills && user.skills.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Tech Stack</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {user.skills.map((skill) => (
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
          </div>

          {/* Stats Section */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
            gap: isMobile ? "12px" : "16px",
            borderTop: "1px solid #f1f5f9",
            paddingTop: isMobile ? "24px" : "32px",
          }}>
            <div className="stat-card" onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ padding: isMobile ? "16px" : "20px" }}>
              <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
              <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: 900, color: "#1e293b" }}>{user.follower_count}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Followers</div>
            </div>
            <div className="stat-card" onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ padding: isMobile ? "16px" : "20px" }}>
              <div className="stat-icon"><FontAwesomeIcon icon={faUserFriends} /></div>
              <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: 900, color: "#1e293b" }}>{user.following_count}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>Following</div>
            </div>
            <div className="stat-card" style={{ cursor: "default", padding: isMobile ? "16px" : "20px" }}>
              <div className="stat-icon"><FontAwesomeIcon icon={faHeart} /></div>
              <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: 900, color: "#1e293b" }}>{user.total_likes}</div>
            </div>
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
                whiteSpace: "nowrap",
                justifyContent: "center",
                padding: isMobile ? "12px 8px" : "16px 24px",
                borderRadius: "14px",
                backgroundColor: activeTab === "posts" ? "#f1f5f9" : "transparent"
              }}
            >
              <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: isMobile ? "12px" : "14px" }} />
              <span style={{ fontSize: isMobile ? "12px" : "14px" }}>Posts</span>
              <span style={{ fontSize: "10px", opacity: 0.6, background: activeTab === "posts" ? "#212121" : "#94a3b8", color: "white", padding: "1px 5px", borderRadius: "6px" }}>{posts.length}</span>
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
              <span style={{ fontSize: "10px", opacity: 0.6, background: activeTab === "projects" ? "#212121" : "#94a3b8", color: "white", padding: "1px 5px", borderRadius: "6px" }}>{projects.length}</span>
            </button>
          </div>

          <div className="slide-up">
            {activeTab === "posts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {postsLoading ? (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                ) : posts.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faLayerGroup} /></div>
                    No posts published yet.
                  </div>
                ) : (
                  posts.map((p, i) => (
                    <div key={p.id} style={{ position: "relative" }}>
                      <PostCard post={p} index={i} onUpdated={fetchUserPosts} />
                      {user.pinned_post_id === p.id && (
                        <div style={{
                          position: "absolute",
                          top: "20px",
                          left: "20px",
                          background: "#212121",
                          color: "white",
                          padding: "6px 14px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          zIndex: 10,
                          boxShadow: "0 4px 15px rgba(33, 33, 33, 0.3)"
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
                  <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                    No projects launched yet.
                  </div>
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

      {
        userId && (
          <FollowersModal
            isOpen={followersModalOpen}
            onClose={() => setFollowersModalOpen(false)}
            userId={userId}
            type={followersModalType}
            title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
          />
        )
      }
    </main >
  );
}
