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
import {
  EnvelopeSimple,
  ShareNetwork,
  Calendar,
  Layout,
  Rocket,
  PushPin,
  MapPin,
  Link,
  TwitterLogo,
  LinkedinLogo,
  GithubLogo,
  IdentificationCard,
  Plus,
  Check
} from "phosphor-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import EarlyAdopterBadge from "../components/EarlyAdopterBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import Lightbox from "../components/Lightbox";
import DeveloperIDCardModal from "../components/DeveloperIDCardModal";
// import StreakBadge from "../components/StreakBadge";

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
  // streak_count: number;
  created_at: string | null;
  is_early_adopter?: boolean;
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
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "0" : "40px 20px"
      }}>
        {/* Banner Skeleton */}
        <div style={{
          width: "100%",
          height: isMobile ? "200px" : "320px",
          borderRadius: "2px",
          backgroundColor: "var(--bg-hover)",
          position: "relative",
          marginBottom: isMobile ? "60px" : "80px",
          border: "0.5px solid var(--border-hairline)"
        }}>
          {/* Avatar Skeleton */}
          <div style={{
            position: "absolute",
            bottom: isMobile ? "-40px" : "-60px",
            left: isMobile ? "50%" : "40px",
            transform: isMobile ? "translateX(-50%)" : "none",
            width: isMobile ? "100px" : "150px",
            height: isMobile ? "100px" : "150px",
            borderRadius: "50%",
            border: "2px solid var(--bg-page)",
            backgroundColor: "var(--border-hairline)",
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
              <div style={{ width: "60%", height: "40px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
              <div style={{ width: "30%", height: "24px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "2px", backgroundColor: "var(--bg-hover)" }} />
              <div style={{ width: "140px", height: "44px", borderRadius: "2px", backgroundColor: "var(--bg-hover)" }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "2px", backgroundColor: "var(--bg-hover)" }} />
            </div>
          </div>

          <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "8px", alignItems: isMobile ? "center" : "flex-start" }}>
            <div style={{ width: "100%", height: "16px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
            <div style={{ width: "90%", height: "16px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
            <div style={{ width: "80%", height: "16px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
          </div>

          <div style={{ display: "flex", gap: "24px", justifyContent: isMobile ? "center" : "flex-start" }}>
            <div style={{ width: "80px", height: "20px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
            <div style={{ width: "80px", height: "20px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
            <div style={{ width: "80px", height: "20px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
          </div>
        </div>

        {/* Content Skeleton (mimics tabs and posts) */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "32px", alignItems: isMobile ? "center" : "flex-start" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "100px", height: "40px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
            <div style={{ width: "100px", height: "40px", backgroundColor: "var(--bg-hover)", borderRadius: "2px" }} />
          </div>

          {/* Content Grid */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ width: "100%", height: "200px", backgroundColor: "transparent", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }} />
            <div style={{ width: "100%", height: "200px", backgroundColor: "transparent", borderRadius: "2px", border: "0.5px solid var(--border-hairline)" }} />
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

  const seoDescription = user.bio
    ? (user.bio.length > 160 ? user.bio.substring(0, 157) + "..." : user.bio)
    : `${user.name} is a developer on Codeown${user.job_title ? ` specializing in ${user.job_title}` : ""}. ${user.skills?.length ? `Expertise: ${user.skills.slice(0, 5).join(", ")}.` : ""}`;

  const [firstName, ...lastNameParts] = (user.name || "User").split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", paddingBottom: "64px" }}>
      <SEO
        title={`${user.name} (@${user.username})`}
        description={seoDescription}
        image={avatarUrl}
        url={user.username ? `${window.location.origin}/${user.username}` : window.location.href}
        type="profile"
        author={user.name}
        username={user.username || undefined}
        firstName={firstName}
        lastName={lastName}
        keywords={[user.name, user.username || "", "developer", "portfolio", "coding", ...(user.skills || [])]}
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": user.name,
          "jobTitle": user.job_title,
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
          height: isMobile ? "160px" : "240px",
          backgroundColor: "#fcfcfc",
          position: "relative",
          overflow: "hidden",
          borderRadius: "0",
          borderBottom: "0.5px solid var(--border-hairline)",
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
              backgroundColor: "var(--bg-hover)",
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
              borderRadius: "2px",
              border: "4px solid var(--bg-page)",
              backgroundColor: "var(--bg-page)",
              cursor: "pointer",
              flexShrink: 0,
              marginBottom: "20px",
              position: "relative",
              zIndex: 10
            }}
          >
            <AvailabilityBadge
              avatarUrl={avatarUrl}
              name={user.name}
              size={isMobile ? 96 : 120}
              isOpenToOpportunities={user.is_pro === true && user.is_hirable === true}
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
              color: "var(--text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              lineHeight: 1.12,
              textTransform: "uppercase"
            }}>
              {user.name}
              <VerifiedBadge username={user.username} isPro={user.is_pro} size={isMobile ? "18px" : "22px"} />
              <EarlyAdopterBadge isEarlyAdopter={user.is_early_adopter} size={isMobile ? "16px" : "20px"} />
              {user.is_pro === true && (
                <span style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: "1px",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  letterSpacing: "0.1em",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase"
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
                    borderRadius: "2px",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--border-hairline)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  title="Message"
                >
                  <EnvelopeSimple size={20} weight="thin" />
                </button>
              )}
              {isSignedIn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "2px",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: isFollowing ? "0.5px solid var(--border-hairline)" : "none",
                    backgroundColor: isFollowing ? "transparent" : "var(--text-primary)",
                    color: isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                  onMouseEnter={(e) => {
                    if (isFollowing) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    else e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    if (isFollowing) e.currentTarget.style.backgroundColor = "transparent";
                    else e.currentTarget.style.opacity = "1";
                  }}
                >
                  {isFollowing ? <Check size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
                  {isFollowing ? "FOLLOWING" : "FOLLOW"}
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
                    padding: "10px 24px",
                    borderRadius: "2px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--border-hairline)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Rocket size={16} weight="bold" />
                  HIRE ME
                </button>
              )}
              <button
                onClick={() => {
                  const shareUrl = user.username ? `${window.location.origin}/${user.username}` : window.location.href;
                  navigator.clipboard.writeText(shareUrl).then(() => toast.success("Copied!"));
                }}
                style={{
                  padding: "10px",
                  borderRadius: "2px",
                  backgroundColor: "transparent",
                  color: "var(--text-primary)",
                  border: "0.5px solid var(--border-hairline)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                title="Share"
              >
                <ShareNetwork size={20} weight="thin" />
              </button>
              <button
                onClick={() => setIsIDCardModalOpen(true)}
                style={{
                  padding: "10px",
                  borderRadius: "2px",
                  backgroundColor: "transparent",
                  color: "var(--text-primary)",
                  border: "0.5px solid var(--border-hairline)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                title="Developer ID Card"
              >
                <IdentificationCard size={20} weight="thin" />
              </button>
            </div>
          </div>

          <span style={{ fontSize: "14px", color: "var(--text-tertiary)", display: "block", marginBottom: "16px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            @{user.username}
          </span>

          {user.bio && (
            <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 24px 0", maxWidth: "800px" }}>
              <BioRenderer bio={user.bio} />
            </div>
          )}

          {/* Meta row: location, link, join date */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            alignItems: "center",
            color: "var(--text-tertiary)",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "24px",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase"
          }}>
            {user.location && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} weight="thin" />
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
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                <Link size={16} weight="thin" />
                {user.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {user.created_at && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} weight="thin" />
                JOINED {formatProfileJoinDate(user.created_at).toUpperCase()}
              </span>
            )}
          </div>

          {/* Tech Stacks */}
          {user.skills && user.skills.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "32px",
            }}>
              {user.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    borderRadius: "2px",
                    border: "0.5px solid var(--border-hairline)",
                    transition: "all 0.15s ease",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
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
            gap: "32px",
          }}>
            <div style={{ display: "flex", gap: "24px" }}>
              <button
                onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase"
                }}
              >
                {user.follower_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>FOLLOWERS</span>
              </button>
              <button
                onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase"
                }}
              >
                {user.following_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>FOLLOWING</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {user.twitter_url && (
                <a href={user.twitter_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-tertiary)", transition: "color 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"} aria-label="Twitter">
                  <TwitterLogo size={20} weight="thin" />
                </a>
              )}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-tertiary)", transition: "color 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"} aria-label="LinkedIn">
                  <LinkedinLogo size={20} weight="thin" />
                </a>
              )}
              {user.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-tertiary)", transition: "color 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"} aria-label="GitHub">
                  <GithubLogo size={20} weight="thin" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{
          padding: `0 ${innerPaddingX}px`,
          marginTop: "48px",
          borderTop: "0.5px solid var(--border-hairline)",
        }}>
          <div className="tabs-row" style={{
            display: "flex",
            gap: "0px",
            marginBottom: "0px",
            marginTop: "0px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            position: "relative",
          }}>
            <button
              onClick={() => setActiveTab("posts")}
              style={{
                flex: isMobile ? "1" : "none",
                minWidth: isMobile ? "0" : "140px",
                padding: "20px 24px",
                fontSize: "12px",
                fontWeight: 800,
                color: activeTab === "posts" ? "var(--text-primary)" : "var(--text-tertiary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}
              onMouseEnter={(e) => { if (activeTab !== "posts") e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              POSTS
              {activeTab === "posts" && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  backgroundColor: "var(--text-primary)",
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              style={{
                flex: isMobile ? "1" : "none",
                minWidth: isMobile ? "0" : "140px",
                padding: "20px 24px",
                fontSize: "12px",
                fontWeight: 800,
                color: activeTab === "projects" ? "var(--text-primary)" : "var(--text-tertiary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}
              onMouseEnter={(e) => { if (activeTab !== "projects") e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              PROJECTS
              {activeTab === "projects" && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  backgroundColor: "var(--text-primary)",
                }} />
              )}
            </button>
          </div>

          <div className="tab-content" style={{ marginTop: "20px" }}>
            {activeTab === "posts" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {posts.length === 0 ? (
                  <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                    <Layout size={40} weight="thin" style={{ opacity: 0.5, marginBottom: "16px" }} />
                    <p style={{ fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>No posts yet</p>
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
                          color: "var(--text-tertiary)",
                          fontSize: "11px",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          <PushPin size={14} weight="thin" />
                          PINNED POST
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
                  <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                    <Rocket size={40} weight="thin" style={{ opacity: 0.5, marginBottom: "16px" }} />
                    <p style={{ fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>No projects yet</p>
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

      {user?.id && (
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
            is_pro: user.is_pro,
            is_early_adopter: user.is_early_adopter,
            bio: user.bio
          }}
          projectsCount={projects.length}
        />
      )}
    </main>
  );
}
