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
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserAdd01Icon,
  UserCheck01Icon,
  Mail01Icon,
  Share01Icon,
  Calendar03Icon,
  Globe02Icon,
  Layers01Icon,
  Rocket01Icon,
  PackageIcon as PushpinIcon,
} from '@hugeicons/core-free-icons';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import Lightbox from "../components/Lightbox";

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
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Hooks depend on user ID. If we use username route, we need to wait for user fetch to get ID.
  // We pass user?.id which will update once user is fetched.
  const { posts, fetchUserPosts } = useUserPosts(user?.id || userId || null);
  const { projects, fetchUserProjects } = useUserProjects(user?.id || userId || null);

  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [activeTab, setActiveTab] = useState<"posts" | "projects">("posts");
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const isOwnProfile = currentUser?.id === (user?.id || userId);

  useEffect(() => {
    const fetchUser = async () => {
      const param = userId || username;
      if (!param) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getToken();
        // Assuming backend works with both ID and Username at this endpoint, 
        // or frontend needs to query different endpoints.
        // For now, let's try the generic endpoint.
        const userRes = await api.get(`/users/${param}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (userRes.data) {
          setUser(userRes.data);

          // If we accessed via ID but user has a username, update the URL
          if (userId && userRes.data.username) {
            const newPath = `/${userRes.data.username}`;
            window.history.replaceState(null, "", newPath);
          }
        } else {
          setUser(null);
        }

        if (isSignedIn && userRes.data && currentUser?.id !== userRes.data.id) {
          try {
            // Check follow status
            const followRes = await api.get(`/follows/${userRes.data.id}/status`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setIsFollowing(followRes.data.isFollowing || false);

            // Record profile view
            await api.post(`/users/${userRes.data.id}/view`, {}, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
          } catch (error) {
            console.error("Error in profile secondary actions:", error);
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
  }, [userId, username, isSignedIn, currentUser?.id, getToken]);

  const handleFollow = async () => {
    const targetId = user?.id || userId;
    if (!isSignedIn || !targetId) {
      navigate("/sign-in");
      return;
    }

    setFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.post(`/follows/${targetId}`, {}, {
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
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "40px 20px"
      }}>
        {/* Banner Skeleton */}
        <div style={{
          width: "100%",
          height: isMobile ? "200px" : "320px",
          borderRadius: "32px",
          backgroundColor: "#e2e8f0",
          position: "relative",
          marginBottom: isMobile ? "60px" : "80px",
          animation: "pulse 1.5s infinite ease-in-out"
        }}>
          {/* Avatar Skeleton */}
          <div style={{
            position: "absolute",
            bottom: isMobile ? "-40px" : "-60px",
            left: isMobile ? "50%" : "40px",
            transform: isMobile ? "translateX(-50%)" : "none",
            width: isMobile ? "100px" : "150px",
            height: isMobile ? "100px" : "150px",
            borderRadius: "100%",
            border: "4px solid white",
            backgroundColor: "#cbd5e1",
            zIndex: 10
          }} />
        </div>

        {/* User Info Skeleton */}
        <div style={{
          padding: isMobile ? "0 4px" : "0 10px",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          <div style={{
            display: "flex",
            alignItems: isMobile ? "center" : "flex-end",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: "20px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", alignItems: isMobile ? "center" : "flex-start" }}>
              <div style={{ width: "60%", height: "40px", backgroundColor: "#e2e8f0", borderRadius: "8px", animation: "pulse 1.5s infinite ease-in-out" }} />
              <div style={{ width: "30%", height: "24px", backgroundColor: "#f1f5f9", borderRadius: "6px", animation: "pulse 1.5s infinite ease-in-out" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "100px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
              <div style={{ width: "140px", height: "44px", borderRadius: "100px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "100px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
            </div>
          </div>

          <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "8px", alignItems: isMobile ? "center" : "flex-start" }}>
            <div style={{ width: "100%", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "90%", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "80%", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>

          <div style={{ display: "flex", gap: "24px", justifyContent: isMobile ? "center" : "flex-start" }}>
            <div style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>
        </div>

        {/* Content Skeleton (mimics tabs and posts) */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "32px", alignItems: isMobile ? "center" : "flex-start" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "100px", height: "40px", backgroundColor: "#e2e8f0", borderRadius: "12px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "100px", height: "40px", backgroundColor: "#f1f5f9", borderRadius: "12px", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>

          {/* Content Grid */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ width: "100%", height: "200px", backgroundColor: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "100%", height: "200px", backgroundColor: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.995); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );

  if (!user) return <div style={{ textAlign: "center", padding: "100px", fontWeight: 800 }}>USER NOT FOUND.</div>;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=212121&color=ffffff&bold=true`;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <SEO
        title={`${user.name} (@${user.username})`}
        description={user.bio || `Check out ${user.name}'s developer profile on Codeown.`}
        image={avatarUrl}
        url={user.username ? `${window.location.origin}/${user.username}` : window.location.href}
        type="profile"
        author={user.name}
        keywords={[user.name, user.username || "", "developer", "portfolio", "coding"]}
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": user.name,
          "description": user.bio,
          "image": avatarUrl,
          "url": window.location.href,
          "sameAs": [
            user.github_url,
            user.twitter_url,
            user.linkedin_url,
            user.website_url
          ].filter(Boolean)
        }}
      />
      <style>{`
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
          background: #fff;
          color: #1e293b;
          cursor: pointer;
        }
        .profile-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .profile-btn-primary {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }
        .profile-btn-primary:hover {
          background: #000;
          border-color: #000;
        }
        
        .tab-btn {
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: transparent;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 12px;
          position: relative;
        }
        .tab-btn:hover {
          color: #0f172a;
          background: rgba(15, 23, 42, 0.04);
        }
        .tab-btn.active {
          color: #0f172a;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        
        .sidebar-section {
          margin-bottom: 40px;
        }
        .sidebar-title {
          font-size: 11px;
          font-weight: 850;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 20px;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 24px;
        }
      `}</style>

      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: isMobile ? "0" : "0 20px"
      }}>
        {/* Banner Section */}
        <div style={{
          width: "100%",
          height: isMobile ? "180px" : "320px",
          backgroundColor: "#fff",
          position: "relative",
          overflow: "hidden",
          borderRadius: isMobile ? "0" : "32px",
          marginBottom: isMobile ? "0" : "20px"
        }}>
          {user.banner_url ? (
            <img
              src={user.banner_url}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, hsl(${(user?.username?.length || 5) * 40}, 80%, 96%) 0%, hsl(${(user?.username?.length || 5) * 40 + 40}, 80%, 96%) 100%)`,
            }} />
          )}
        </div>

        {/* Profile Header Info */}
        <div style={{
          padding: isMobile ? "0 16px" : "0 24px",
          position: "relative",
          marginTop: isMobile ? "-40px" : "-60px",
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {/* Avatar and Primary Actions Row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div
              onClick={() => { setLightboxImage(avatarUrl); setLightboxOpen(true); }}
              style={{
                width: isMobile ? "100px" : "140px",
                height: isMobile ? "100px" : "140px",
                borderRadius: "50%",
                border: "4px solid #fff",
                backgroundColor: "#fff",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                flexShrink: 0
              }}
            >
              <AvailabilityBadge
                avatarUrl={avatarUrl}
                name={user.name}
                size={isMobile ? 100 : 140}
                isOpenToOpportunities={user.is_hirable}
                ringColor="#0f172a"
              />
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              flexWrap: "wrap",
              justifyContent: isMobile ? "flex-start" : "flex-end"
            }}>
              {isSignedIn && (
                <button
                  onClick={() => navigate(`/messages?userId=${user.id}`)}
                  className="profile-btn"
                  title="Message"
                >
                  <HugeiconsIcon icon={Mail01Icon} size={20} />
                </button>
              )}
              {isSignedIn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`profile-btn ${isFollowing ? '' : 'profile-btn-primary'}`}
                  style={{ minWidth: "100px", justifyContent: "center" }}
                >
                  <HugeiconsIcon icon={isFollowing ? UserCheck01Icon : UserAdd01Icon} size={20} />
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  const shareUrl = user.username ? `${window.location.origin}/${user.username}` : window.location.href;
                  navigator.clipboard.writeText(shareUrl).then(() => toast.success("Copied!"));
                }}
                className="profile-btn"
                title="Share"
              >
                <HugeiconsIcon icon={Share01Icon} size={20} />
              </button>
            </div>
          </div>

          {/* Name and Handle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h1 style={{
              fontSize: isMobile ? "24px" : "32px",
              fontWeight: 850,
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              letterSpacing: "-0.02em"
            }}>
              {user.name}
              <VerifiedBadge username={user.username} size={isMobile ? "20px" : "24px"} />
            </h1>
            <span style={{ fontSize: "16px", color: "#64748b", fontWeight: 600 }}>@{user.username}</span>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: width >= 1024 ? "320px 1fr" : "1fr",
          gap: "48px",
          padding: isMobile ? "0 16px" : "0 24px"
        }}>
          {/* Sidebar */}
          <aside>
            {user.bio && (
              <div className="sidebar-section">
                <p style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#334155",
                  margin: 0
                }}>
                  <BioRenderer bio={user.bio} />
                </p>
              </div>
            )}

            <div className="sidebar-section" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                <HugeiconsIcon icon={Calendar03Icon} size={18} />
                Joined {formatJoinDate(user.created_at || "")}
              </div>
              {user.website_url && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6", fontSize: "14px", fontWeight: 600 }}>
                  <HugeiconsIcon icon={Globe02Icon} size={18} />
                  <a href={user.website_url.startsWith('http') ? user.website_url : `https://${user.website_url}`} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{user.website_url.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
            </div>

            <div className="sidebar-section" style={{ display: "flex", gap: "20px" }}>
              <div onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontSize: "15px", fontWeight: 750, color: "#0f172a" }}>{user.follower_count || 0}</span>
                <span style={{ fontSize: "15px", color: "#64748b", marginLeft: "4px" }}>Followers</span>
              </div>
              <div onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontSize: "15px", fontWeight: 750, color: "#0f172a" }}>{user.following_count || 0}</span>
                <span style={{ fontSize: "15px", color: "#64748b", marginLeft: "4px" }}>Following</span>
              </div>
            </div>

            {user.skills && user.skills.length > 0 && (
              <div className="sidebar-section">
                <h4 className="sidebar-title">Tech Stack</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {user.skills.map(skill => (
                    <span key={skill} style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#475569",
                      padding: "4px 10px",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "6px"
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <div>
            <div style={{
              display: "flex",
              backgroundColor: "rgba(241, 245, 249, 0.7)",
              backdropFilter: "blur(8px)",
              padding: "4px",
              borderRadius: "16px",
              marginBottom: "32px",
              gap: "4px",
              width: "fit-content",
              maxWidth: "100%",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch"
            }}>
              <button
                onClick={() => setActiveTab("posts")}
                className={`tab-btn ${activeTab === "posts" ? 'active' : ''}`}
                style={{ whiteSpace: "nowrap" }}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`tab-btn ${activeTab === "projects" ? 'active' : ''}`}
                style={{ whiteSpace: "nowrap" }}
              >
                Projects
              </button>
            </div>

            {activeTab === "posts" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {posts.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                    <HugeiconsIcon icon={Layers01Icon} size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
                    <p style={{ fontWeight: 600 }}>No posts yet</p>
                  </div>
                ) : (
                  posts.map(p => (
                    <div key={p.id} style={{ position: "relative" }}>
                      {user.pinned_post_id === p.id && (
                        <div style={{
                          padding: "12px 24px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#64748b",
                          fontSize: "13px",
                          fontWeight: 700
                        }}>
                          <HugeiconsIcon icon={PushpinIcon} size={14} />
                          Pinned Post
                        </div>
                      )}
                      <PostCard post={p} onUpdated={fetchUserPosts} />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {projects.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                    <HugeiconsIcon icon={Rocket01Icon} size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
                    <p style={{ fontWeight: 600 }}>No projects yet</p>
                  </div>
                ) : (
                  projects.map(p => <ProjectCard key={p.id} project={p} onUpdated={fetchUserProjects} />)
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: "100px" }} />

      {user.id && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={user.id}
          type={followersModalType}
          title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
        />
      )}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageSrc={lightboxImage}
      />
      <ToastContainer position="bottom-right" theme="dark" hideProgressBar />
    </main>
  );
}
