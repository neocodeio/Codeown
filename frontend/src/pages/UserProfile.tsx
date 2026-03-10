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
import { formatProfileJoinDate } from "../utils/date";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserAdd01Icon,
  UserCheck01Icon,
  Mail01Icon,
  Share01Icon,
  Calendar03Icon,
  Layers01Icon,
  Rocket01Icon,
  PackageIcon as PushpinIcon,
  Location01Icon,
  Link02Icon,
  TwitterIcon,
  Linkedin01Icon,
  GithubIcon,
  IdIcon,
} from '@hugeicons/core-free-icons';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import Lightbox from "../components/Lightbox";
import DeveloperIDCardModal from "../components/DeveloperIDCardModal";

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
  is_pro: boolean;
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
  const isTablet = width >= 768 && width < 1024;
  const containerPadding = isMobile ? "0" : isTablet ? "24px 16px" : "40px 20px";
  const innerPaddingX = isMobile ? 16 : isTablet ? 20 : 24;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

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
            await api.post(`/analytics/track`, {
              event_type: 'profile_view',
              target_user_id: userRes.data.id
            }, {
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
    <main style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "0" : "40px 20px"
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
    <main style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
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
        @keyframes tabContentEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .tab-content-enter { animation: tabContentEnter 0.25s ease-out forwards; }
        .tabs-row { -ms-overflow-style: none; scrollbar-width: none; }
        .tabs-row::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: containerPadding
      }}>
        {/* Banner Section */}
        <div style={{
          width: "100%",
          height: isMobile ? "160px" : "200px",
          backgroundColor: "#f1f5f9",
          position: "relative",
          overflow: "hidden",
          borderRadius: isMobile ? "0" : "12px",
          marginBottom: 0,
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
              background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
            }} />
          )}
        </div>

        {/* Profile Header - single column layout */}
        <div style={{
          padding: `0 ${innerPaddingX}px`,
          position: "relative",
          marginTop: isMobile ? "-48px" : "-56px",
          marginBottom: "32px",
        }}>
          {/* Avatar */}
          <div
            onClick={() => { setLightboxImage(avatarUrl); setLightboxOpen(true); }}
            style={{
              width: isMobile ? "96px" : "120px",
              height: isMobile ? "96px" : "120px",
              borderRadius: "50%",
              border: "4px solid #fff",
              backgroundColor: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              flexShrink: 0,
              marginBottom: "16px",
            }}
          >
            <AvailabilityBadge
              avatarUrl={avatarUrl}
              name={user.name}
              size={isMobile ? 96 : 120}
              isOpenToOpportunities={user.is_pro === true && user.is_hirable === true}
              ringColor="#0f172a"
            />
          </div>

          {/* Name + Actions row */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "4px",
            width: "100%",
          }}>
            <h1 style={{
              fontSize: isMobile ? "22px" : "28px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              lineHeight: 1.12,
            }}>
              {(user.name || "").toUpperCase()}
              <VerifiedBadge username={user.username} isPro={user.is_pro} size={isMobile ? "18px" : "22px"} />
              {user.is_pro === true && (
                <span style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: 6,
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  letterSpacing: "0.02em",
                }}>PRO</span>
              )}
            </h1>
            <div style={{
              display: "flex",
              gap: "8px",
              marginLeft: isMobile ? 0 : "auto",
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "flex-start" : "flex-end",
              flexWrap: "wrap",
            }}>
              {isSignedIn && (
                <button
                  onClick={() => navigate(`/messages?userId=${user.id}`)}
                  style={{
                  padding: "10px",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                  title="Message"
                >
                  <HugeiconsIcon icon={Mail01Icon} size={18} />
                </button>
              )}
              {isSignedIn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "30px",
                    fontSize: "14px",
                    fontWeight: 700,
                    border: isFollowing ? "1px solid #e2e8f0" : "none",
                    backgroundColor: isFollowing ? "#ffffff" : "#0f172a",
                    color: isFollowing ? "#1e293b" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    boxShadow: isFollowing ? "none" : "0 4px 12px rgba(15, 23, 42, 0.1)"
                  }}
                  onMouseEnter={(e) => {
                    if (isFollowing) e.currentTarget.style.backgroundColor = "#f8fafc";
                    else e.currentTarget.style.backgroundColor = "#1e293b";
                  }}
                  onMouseLeave={(e) => {
                    if (isFollowing) e.currentTarget.style.backgroundColor = "#ffffff";
                    else e.currentTarget.style.backgroundColor = "#0f172a";
                  }}
                >
                  <HugeiconsIcon icon={isFollowing ? UserCheck01Icon : UserAdd01Icon} size={16} />
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
              {user.is_pro && user.is_hirable && (
                <button
                  onClick={async () => {
                    const token = await getToken();
                    await api.post("/analytics/track", {
                      event_type: "opportunity_click",
                      target_user_id: user.id
                    }, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });
                    navigate(`/messages?userId=${user.id}&message=${encodeURIComponent("Hi! I saw you are open to opportunities and I'd like to chat.")}`);
                  }}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "30px",
                    fontSize: "14px",
                    fontWeight: 800,
                    border: "none",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
                >
                  <HugeiconsIcon icon={Rocket01Icon} size={16} />
                  Hire Me
                </button>
              )}
              <button
                onClick={() => {
                  const shareUrl = user.username ? `${window.location.origin}/${user.username}` : window.location.href;
                  navigator.clipboard.writeText(shareUrl).then(() => toast.success("Copied!"));
                }}
                style={{
                  padding: "10px",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                title="Share"
              >
                <HugeiconsIcon icon={Share01Icon} size={18} />
              </button>
              <button
                onClick={() => setIsIDCardModalOpen(true)}
                style={{
                  padding: "10px",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                title="Developer ID Card"
              >
                <HugeiconsIcon icon={IdIcon} size={18} />
              </button>
            </div>
          </div>

          <span style={{ fontSize: "15px", color: "#64748b", display: "block", marginBottom: "12px" }}>
            @{user.username}
          </span>

          {user.bio && (
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#334155", margin: "0 0 12px 0" }}>
              <BioRenderer bio={user.bio} />
            </p>
          )}

          {/* Meta row: location, link, join date */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px 24px",
            alignItems: "center",
            color: "#64748b",
            fontSize: "14px",
            marginBottom: "12px",
          }}>
            {user.location && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <HugeiconsIcon icon={Location01Icon} size={16} />
                {user.location}
              </span>
            )}
            {user.website_url && (
              <a
                href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#2563eb",
                  textDecoration: "underline",
                }}
              >
                <HugeiconsIcon icon={Link02Icon} size={16} />
                {user.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {user.created_at && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                Joined {formatProfileJoinDate(user.created_at)}
              </span>
            )}
          </div>

          {/* Tech Stacks */}
          {user.skills && user.skills.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
            }}>
              {user.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "6px 14px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    borderRadius: "100px",
                    border: "1px solid #e2e8f0",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                    e.currentTarget.style.color = "#475569";
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Followers + Social */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "20px",
          }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "15px",
                  color: "#0f172a",
                  fontWeight: 600,
                }}
              >
                {user.follower_count ?? 0} <span style={{ color: "#64748b", fontWeight: 500 }}>followers</span>
              </button>
              <button
                onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "15px",
                  color: "#0f172a",
                  fontWeight: 600,
                }}
              >
                {user.following_count ?? 0} <span style={{ color: "#64748b", fontWeight: 500 }}>following</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {user.twitter_url && (
                <a href={user.twitter_url} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="Twitter">
                  <HugeiconsIcon icon={TwitterIcon} size={20} />
                </a>
              )}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="LinkedIn">
                  <HugeiconsIcon icon={Linkedin01Icon} size={20} />
                </a>
              )}
              {user.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="GitHub">
                  <HugeiconsIcon icon={GithubIcon} size={20} />
                </a>
              )}
              {user.website_url && (
                <a href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="Website">
                  <HugeiconsIcon icon={Link02Icon} size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div style={{
          padding: `0 ${innerPaddingX}px`,
          borderTop: "1px solid #e2e8f0",
        }}>
          <div className="tabs-row" style={{
            display: "flex",
            gap: "0px",
            marginBottom: "0px",
            marginTop: "8px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            borderBottom: "1px solid #e2e8f0",
            position: "relative",
          }}>
            <button
              onClick={() => setActiveTab("posts")}
              style={{
                flex: isMobile ? "1" : "none",
                minWidth: isMobile ? "0" : "120px",
                padding: "16px 20px",
                fontSize: "15px",
                fontWeight: activeTab === "posts" ? 700 : 600,
                color: activeTab === "posts" ? "#0f172a" : "#64748b",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { if (activeTab !== "posts") e.currentTarget.style.backgroundColor = "#f8fafc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Posts
              {activeTab === "posts" && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: "25%",
                  right: "25%",
                  height: "3px",
                  backgroundColor: "#0f172a",
                  borderRadius: "2px 2px 0 0"
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              style={{
                flex: isMobile ? "1" : "none",
                minWidth: isMobile ? "0" : "120px",
                padding: "16px 20px",
                fontSize: "15px",
                fontWeight: activeTab === "projects" ? 700 : 600,
                color: activeTab === "projects" ? "#0f172a" : "#64748b",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { if (activeTab !== "projects") e.currentTarget.style.backgroundColor = "#f8fafc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Projects
              {activeTab === "projects" && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: "25%",
                  right: "25%",
                  height: "3px",
                  backgroundColor: "#0f172a",
                  borderRadius: "2px 2px 0 0"
                }} />
              )}
            </button>
          </div>

          <div className="tab-content" style={{ marginTop: "20px" }}>
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

      <div style={{ height: "60px" }} />

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
      {user && (
        <DeveloperIDCardModal
          isOpen={isIDCardModalOpen}
          onClose={() => setIsIDCardModalOpen(false)}
          user={{
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            skills: user.skills,
            is_pro: user.is_pro
          }}
          projectsCount={projects.length}
        />
      )}
    </main>
  );
}
