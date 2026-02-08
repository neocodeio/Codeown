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
  faRocket,
  faLayerGroup,
  faCalendarAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";

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
  banner_url: string | null;
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
  const { posts, fetchUserPosts } = useUserPosts(userId || null);
  const { projects, fetchUserProjects } = useUserProjects(userId || null);
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
          border-color: #444;
          color: white;
        }
        .profile-btn-following {
          background: transparent;
          color: #212121;
          border: 2px solid #212121;
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
          {user.banner_url ? (
            <img
              src={user.banner_url}
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
                {user.name}
                <VerifiedBadge username={user.username} size={isMobile ? "24px" : "32px"} />
              </h1>
              <div style={{
                fontSize: "18px",
                color: "#64748b",
                fontWeight: 500
              }}>
                @{user.username}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {isSignedIn && (
                <button
                  onClick={() => navigate(`/messages?userId=${userId}`)}
                  className="profile-btn"
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                  Message
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
            <div style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#334155",
              marginBottom: "20px",
              maxWidth: "600px"
            }}>
              <BioRenderer bio={user.bio} />
            </div>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "24px",
            flexWrap: "wrap"
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              Joined {formatJoinDate(user.created_at || "")}
            </span>
            <span
              onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
              style={{ cursor: "pointer", color: "#1e293b" }}
            >
              <strong style={{ fontWeight: 800 }}>{user.follower_count || 0}</strong> followers
            </span>
            <span
              onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
              style={{ cursor: "pointer", color: "#1e293b" }}
            >
              <strong style={{ fontWeight: 800 }}>{user.following_count || 0}</strong> following
            </span>
            <span style={{ color: "#1e293b" }}>
              <strong style={{ fontWeight: 800 }}>{user.total_likes || 0}</strong> likes
            </span>
          </div>

          {/* Social Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
            {user.github_url && (
              <a href={user.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGithub} />
              </a>
            )}
            {user.twitter_url && (
              <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            )}
            {user.linkedin_url && (
              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
            )}
            {user.website_url && (
              <a href={user.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
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

        {/* Tab Selection */}
        <div style={{
          display: "flex",
          gap: "32px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "32px",
          marginTop: "48px"
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
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {projects.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                  No projects launched yet.
                </div>
              ) : (
                projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onUpdated={fetchUserProjects} />)
              )}
            </div>
          )}
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
