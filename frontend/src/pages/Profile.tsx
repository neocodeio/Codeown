import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
import { formatProfileJoinDate } from "../utils/date";
import api from "../api/axios";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import DeveloperIDCardModal from "../components/DeveloperIDCardModal";
import ProfileStrength from "../components/ProfileStrength";
import {
  PencilSimple,
  SignOut,
  Key,
  ShareNetwork,
  CalendarBlank,
  SquaresFour,
  Rocket,
  BookmarkSimple,
  DotsThreeVertical,
  PushPin,
  Camera,
  MapPin,
  Link as LinkIcon,
  TwitterLogo,
  LinkedinLogo,
  GithubLogo,
  ChartBar,
  IdentificationCard,
  Plus,
  Handshake
} from "phosphor-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  is_pro: boolean;
  is_organization: boolean;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  banner_url: string | null;
  created_at: string | null;
  // streak_count: number;
  onboarding_completed: boolean;
}

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const containerPadding = isMobile ? "0" : isTablet ? "24px 16px" : "40px 20px";
  const innerPaddingX = isMobile ? 16 : isTablet ? 20 : 24;
  const { signOut, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;
  const { posts, fetchUserPosts } = useUserPosts(userId);
  const { savedPosts, fetchSavedPosts } = useSavedPosts();
  const { projects, fetchUserProjects } = useUserProjects(userId);
  const { projects: savedProjects, fetchUserSavedProjects } = useUserSavedProjects(userId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "saved" | "applications">("posts");
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "projects">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const handleProfileUpdated = useCallback(async (updatedUser?: Record<string, unknown>) => {
    if (userId) {
      // Merge PUT response immediately so badge (e.g. is_hirable) appears without waiting for GET
      if (updatedUser && Object.keys(updatedUser).length > 0) {
        setUserProfile((prev) => (prev ? { ...prev, ...updatedUser } : prev));
      }
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data) setUserProfile(res.data);
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
    if (searchParams.get("checkout_completed") === "true") {
      toast.success("Welcome to Pro! Your account has been upgraded.", {
        position: "top-center",
        autoClose: 5000,
      });
      // Remove the param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout_completed");
      setSearchParams(newParams, { replace: true });

      // Refetch profile with a small delay to ensure webhook processed
      const timer = setTimeout(() => {
        void handleProfileUpdated();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, handleProfileUpdated]);

  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    const onProfileUpdated = () => {
      void handleProfileUpdated();
    };

    window.addEventListener("profileUpdated", onProfileUpdated);
    window.addEventListener("projectCreated", fetchUserProjects);

    return () => {
      window.removeEventListener("profileUpdated", onProfileUpdated);
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

  useEffect(() => {
    const fetchApplications = async () => {
      if (!userId || activeTab !== "applications") return;
      try {
        setLoadingApps(true);
        const token = await getToken();
        const res = await api.get("/projects/my/cofounder-applications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoadingApps(false);
      }
    };
    fetchApplications();
  }, [userId, getToken, activeTab]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  if (!isLoaded) return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "0" : "40px 20px"
      }}>
        {/* Banner Skeleton */}
        <div className="skeleton-pulse" style={{
          width: "100%",
          height: isMobile ? "200px" : "320px",
          borderRadius: "0",
          backgroundColor: "var(--bg-hover)",
          position: "relative",
          marginBottom: isMobile ? "60px" : "80px",
        }}>
          {/* Avatar Skeleton */}
          <div className="skeleton-pulse" style={{
            position: "absolute",
            bottom: isMobile ? "-40px" : "-60px",
            left: isMobile ? "50%" : "40px",
            transform: isMobile ? "translateX(-50%)" : "none",
            width: isMobile ? "100px" : "150px",
            height: isMobile ? "100px" : "150px",
            borderRadius: "2px",
            border: "4px solid var(--bg-page)",
            backgroundColor: "var(--bg-page)",
            zIndex: 10
          }} />
        </div>

        {/* User Info Skeleton */}
        <div style={{
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: "32px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: "24px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div className="skeleton-pulse" style={{ width: "40%", height: "32px" }} />
              <div className="skeleton-pulse" style={{ width: "20%", height: "20px" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div className="skeleton-pulse" style={{ width: "44px", height: "44px" }} />
              <div className="skeleton-pulse" style={{ width: "120px", height: "44px" }} />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .skeleton-pulse {
          background-color: var(--bg-hover);
          border-radius: 2px;
          animation: skeleton-pulse-anim 2s infinite ease-in-out;
        }
        @keyframes skeleton-pulse-anim {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </main>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=212121&color=fff&bold=true`;

  return (
  <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <SEO title="My Profile" description="Manage your Codeown profile and settings." />
      <style>{`
        @keyframes tabContentEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .tab-content-enter { animation: tabContentEnter 0.25s ease-out forwards; }
        .tabs-row { -ms-overflow-style: none; scrollbar-width: none; }
        .tabs-row::-webkit-scrollbar { display: none; }
        .app-card:hover { border-color: var(--text-primary) !important; background-color: var(--bg-hover) !important; }
      `}</style>

      <div style={{
        maxWidth: "1000px",
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
          marginBottom: 0
        }}>
          {userProfile?.banner_url ? (
            <img
              src={userProfile.banner_url}
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
          <button
            onClick={() => setIsEditModalOpen(true)}
            title="Change banner"
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1.5px solid rgba(255, 255, 255, 0.4)",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.6)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Camera size={22} weight="bold" />
          </button>
        </div>

        {/* Profile Header - single column layout */}
        <div style={{
          padding: `0 ${innerPaddingX}px`,
          position: "relative",
          marginTop: isMobile ? "-48px" : "-56px",
          marginBottom: "32px",
        }}>
          {/* Avatar - overlapping banner */}
          <div
            onClick={() => setIsEditModalOpen(true)}
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
              overflow: "visible",
            }}
          >
            <AvailabilityBadge
              avatarUrl={avatarUrl}
              name={userProfile?.name || user?.fullName || "User"}
              size={isMobile ? 96 : 120}
              isOpenToOpportunities={userProfile?.is_pro === true && userProfile?.is_hirable === true}
            />
            {/* Camera Overlay for Avatar */}
            <div style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              width: "32px",
              height: "32px",
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-page)",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Camera size={18} weight="bold" />
            </div>
          </div>

          {/* Name + Edit Profile row */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "4px",
            width: "100%",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              width: isMobile ? "100%" : "auto",
            }}>
              <h1 style={{
                fontSize: isMobile ? "22px" : "28px",
                fontWeight: 700,
                color: "var(--text-primary)",
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
                {(userProfile?.name || user?.fullName || "").toUpperCase()}
                <VerifiedBadge username={userProfile?.username || user?.username} isPro={userProfile?.is_pro} size={isMobile ? "18px" : "22px"} />
                {/* {userProfile && userProfile.streak_count > 0 && <StreakBadge count={userProfile.streak_count} />} */}
                {userProfile?.is_pro === true && (
                  <span style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: "1px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-mono)"
                  }}>PRO</span>
                )}
              </h1>
              {/* {userProfile?.is_pro !== true && (
                <Link
                  to="/billing"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "30px",
                    fontSize: "14px",
                    fontWeight: 800,
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.backgroundColor = "#1e293b"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.backgroundColor = "var(--text-primary)"; }}
                >
                  Upgrade to Pro
                </Link>
              )} */}
                <button
                  onClick={() => {
                    const u = userProfile?.username || user?.username;
                    if (u) navigate(`/portfolio/${u}`);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "2px",
                    fontSize: "12px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    border: "none",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <Rocket size={16} weight="fill" />
                  GENERATE PORTFOLIO
                </button>
                <button
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-page)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
              >
                <PencilSimple size={16} weight="thin" />
                EDIT PROFILE
              </button>
              {userProfile?.is_pro && (
                <button
                  onClick={() => navigate("/analytics")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "2px",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <ChartBar size={16} weight="thin" />
                  ANALYTICS
                  <span style={{ fontSize: '9px', backgroundColor: 'var(--text-primary)', color: 'var(--bg-page)', padding: '2px 4px', borderRadius: '1px', fontWeight: 700 }}>PRO</span>
                </button>
              )}
              <button
                onClick={() => setIsIDCardModalOpen(true)}
                style={{
                  padding: "8px",
                  borderRadius: "2px",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-page)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
                title="View ID card"
              >
                <IdentificationCard size={18} weight="thin" />
              </button>
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              marginLeft: isMobile ? 0 : "auto",
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "flex-start" : "flex-end",
              flexWrap: "wrap",
            }}>
              <button
                onClick={() => {
                  const u = userProfile?.username || user?.username;
                  const shareUrl = u ? `${window.location.origin}/${u}` : `${window.location.origin}/user/${user?.id}`;
                  navigator.clipboard.writeText(shareUrl).then(() => toast.success("Copied!"));
                }}
                style={{
                  padding: "8px",
                  borderRadius: "2px",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-page)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
                title="Share profile"
              >
                <ShareNetwork size={18} weight="thin" />
              </button>
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  style={{
                    padding: "8px",
                    borderRadius: "2px",
                    border: "0.5px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-page)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
                  title="More options"
                >
                  <DotsThreeVertical size={18} weight="thin" />
                </button>
                {isMenuOpen && createPortal(
                  <>
                    <div
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                      style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        zIndex: 10000,
                        cursor: "pointer",
                      }}
                    />
                    <div style={{
                      position: "fixed",
                      bottom: isMobile ? "0" : "auto",
                      left: isMobile ? "0" : "auto",
                      right: isMobile ? "0" : "80px",
                      top: isMobile ? "auto" : "120px",
                      width: isMobile ? "100%" : "280px",
                      zIndex: 10001,
                      padding: "12px",
                      backgroundColor: "var(--bg-page)",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      boxShadow: "none",
                    }} onClick={(e) => e.stopPropagation()}>
                       <button
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "none",
                          borderRadius: "2px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "var(--text-primary)",
                        }}
                        onClick={() => { setIsMenuOpen(false); navigate("/forgot-password"); }}
                      >
                        <Key size={18} weight="thin" />
                        Reset Password
                      </button>
                      <button
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "none",
                          borderRadius: "2px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "#ef4444",
                        }}
                        onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                      >
                        <SignOut size={18} weight="thin" />
                        Sign Out
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>

          <span style={{ fontSize: "14px", color: "var(--text-tertiary)", display: "block", marginBottom: "16px", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase" }}>
            @{userProfile?.username || user?.username}
          </span>

          {userProfile?.bio && (
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 24px 0" }}>
              <BioRenderer bio={userProfile.bio} />
            </p>
          )}

          {/* Meta row: location, link, join date */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            alignItems: "center",
            color: "var(--text-tertiary)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            marginBottom: "20px",
            textTransform: "uppercase"
          }}>
            {userProfile?.location && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} weight="thin" />
                {userProfile.location}
              </span>
            )}
            {userProfile?.website_url && (
              <a
                href={userProfile.website_url.startsWith("http") ? userProfile.website_url : `https://${userProfile.website_url}`}
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
                <LinkIcon size={14} weight="thin" />
                {userProfile.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {userProfile?.created_at && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CalendarBlank size={14} weight="thin" />
                JOINED {formatProfileJoinDate(userProfile.created_at).toUpperCase()}
              </span>
            )}
          </div>

          {/* Tech Stacks */}
          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "32px",
            }}>
              {userProfile.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    padding: "6px 14px",
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    borderRadius: "2px",
                    border: "0.5px solid var(--border-hairline)",
                    transition: "all 0.15s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
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
            <div style={{ display: "flex", gap: "24px" }}>
              <button
                onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                {userProfile?.follower_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>FOLLOWERS</span>
              </button>
              <button
                onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                {userProfile?.following_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>FOLLOWING</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {userProfile?.twitter_url && (
                <a href={userProfile.twitter_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }} aria-label="Twitter">
                  <TwitterLogo size={20} weight="thin" />
                </a>
              )}
              {userProfile?.linkedin_url && (
                <a href={userProfile.linkedin_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }} aria-label="LinkedIn">
                  <LinkedinLogo size={20} weight="thin" />
                </a>
              )}
              {userProfile?.github_url && (
                <a href={userProfile.github_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }} aria-label="GitHub">
                  <GithubLogo size={20} weight="thin" />
                </a>
              )}
               {userProfile?.website_url && (
                <a href={userProfile.website_url.startsWith("http") ? userProfile.website_url : `https://${userProfile.website_url}`} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)" }} aria-label="Website">
                  <LinkIcon size={20} weight="thin" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Profile Strength */}
        <div style={{ padding: `0 ${innerPaddingX}px` }}>
          <ProfileStrength 
            user={userProfile} 
            projectsCount={projects?.length || 0} 
          />
        </div>

        {/* Tabs + Content */}
        <div style={{
          padding: `0 ${innerPaddingX}px`,
          borderTop: "0.5px solid var(--border-hairline)",
        }}>
          <div className="tabs-row" style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: "0.5px solid var(--border-hairline)",
            marginBottom: "32px",
            gap: "24px",
            padding: isMobile ? "0 16px" : "0"
          }}>
            {[
              { id: "posts", icon: Rocket, label: "POSTS" },
              { id: "projects", icon: SquaresFour, label: "PROJECTS" },
              { id: "applications", icon: Handshake, label: "APPLICATIONS" },
              { id: "saved", icon: BookmarkSimple, label: "SAVED" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "16px 0",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "1.5px solid var(--text-primary)" : "1.5px solid transparent",
                  color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontSize: "12px",
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                  flexShrink: 0
                }}
              >
                <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "thin"} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content" style={{ marginTop: "20px" }}>
            {activeTab === "posts" && (
              <div className="tab-content-enter">
                {posts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <SquaresFour size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>No posts yet.</p>
                  </div>
                ) : (
                  posts.map((p) => (
                    <div key={p.id} style={{ position: "relative" }}>
                      {userProfile?.pinned_post_id === p.id && (
                        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)", fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                          <PushPin size={12} weight="fill" />
                          PINNED
                        </div>
                      )}
                      <PostCard post={p} onUpdated={fetchUserPosts} />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="tab-content-enter">
                {projects.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <Rocket size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px", marginBottom: "24px" }}>No projects added yet.</p>
                    <button
                      onClick={() => setIsProjectModalOpen(true)}
                      style={{
                        margin: "0 auto",
                        padding: "10px 24px",
                        borderRadius: "2px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-page)",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase"
                      }}
                    >
                      <Plus size={14} weight="bold" style={{ marginRight: '8px' }} />
                      NEW PROJECT
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {projects.map((p) => <ProjectCard key={p.id} project={p} onUpdated={fetchUserProjects} />)}
                  </div>
                )
                }
              </div>
            )}

            {activeTab === "applications" && (
            <div className="tab-content-enter">
              {loadingApps ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                   {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton-pulse" style={{ height: "140px", width: "100%", borderRadius: "2px" }} />
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <div style={{
                  padding: "60px 24px",
                  textAlign: "center",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "0.5px solid var(--border-hairline)",
                  borderRadius: "2px"
                }}>
                  <Handshake size={32} weight="thin" style={{ color: "var(--text-tertiary)", marginBottom: "16px" }} />
                  <p style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "12px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>NO APPLICATIONS</p>
                  <p style={{ color: "var(--text-tertiary)", fontSize: "14px", marginTop: "8px" }}>You haven't applied to join any projects as a co-founder yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {applications.map(app => (
                    <div 
                      key={app.id} 
                      className="app-card"
                      onClick={() => navigate(`/project/${app.project_id}`)}
                      style={{
                        padding: "24px",
                        border: "0.5px solid var(--border-hairline)",
                        borderRadius: "2px",
                        backgroundColor: "var(--bg-page)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: "24px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                         <div style={{ width: "48px", height: "48px", flexShrink: 0, borderRadius: "2px", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                            <img src={app.project.cover_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.project.title)}&background=212121&color=ffffff&bold=true`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                         </div>
                         <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "var(--text-primary)", textTransform: "uppercase" }}>{app.project.title}</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                               <img src={app.project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.project.user?.name || "U")}&background=212121&color=ffffff&bold=true`} style={{ width: "16px", height: "16px", borderRadius: "2px" }} />
                               <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>@{app.project.user?.username}</span>
                            </div>
                         </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{
                          padding: "4px 10px",
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                          color: "#22c55e",
                          border: "0.5px solid rgba(34, 197, 94, 0.2)",
                          fontSize: "10px",
                          fontWeight: 800,
                          borderRadius: "2px",
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase"
                        }}>
                          Applied
                        </div>
                        <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                          {new Date(app.created_at).toLocaleDateString().toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

            {activeTab === "saved" && (
              <div className="tab-content-enter">
                <div style={{ display: "flex", gap: "8px", marginBottom: "32px", marginTop: "12px" }}>
                  <button
                    onClick={() => setSavedSubTab("posts")}
                    style={{
                      padding: "6px 14px",
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      backgroundColor: savedSubTab === "posts" ? "var(--text-primary)" : "transparent",
                      color: savedSubTab === "posts" ? "var(--bg-page)" : "var(--text-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textTransform: "uppercase"
                    }}
                  >
                    POSTS
                  </button>
                  <button
                    onClick={() => setSavedSubTab("projects")}
                    style={{
                      padding: "6px 14px",
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      borderRadius: "2px",
                      border: "0.5px solid var(--border-hairline)",
                      backgroundColor: savedSubTab === "projects" ? "var(--text-primary)" : "transparent",
                      color: savedSubTab === "projects" ? "var(--bg-page)" : "var(--text-tertiary)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textTransform: "uppercase"
                    }}
                  >
                    PROJECTS
                  </button>
                </div>

                {savedSubTab === "posts" ? (
                  savedPosts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                      <BookmarkSimple size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                      <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>No saved posts.</p>
                    </div>
                  ) : (
                    savedPosts.map((p) => <PostCard key={p.id} post={p} onUpdated={fetchSavedPosts} />)
                  )
                ) : (
                  savedProjects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                      <BookmarkSimple size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                      <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>No saved projects.</p>
                    </div>
                  ) : (
                    savedProjects.map((p) => <ProjectCard key={p.id} project={p} onUpdated={fetchUserSavedProjects} />)
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {
        userProfile && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            currentUser={userProfile}
            onUpdated={handleProfileUpdated}
            projectCount={projects.length}
          />
        )
      }

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onUpdated={handleProfileUpdated}
      />

      {
        userProfile?.id && (
          <FollowersModal
            isOpen={followersModalOpen}
            onClose={() => setFollowersModalOpen(false)}
            userId={userProfile.id}
            type={followersModalType}
            title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
          />
        )
      }


      <ToastContainer position="bottom-right" theme="dark" hideProgressBar />
      {userProfile && (
        <DeveloperIDCardModal
          isOpen={isIDCardModalOpen}
          onClose={() => setIsIDCardModalOpen(false)}
          user={{
            name: userProfile.name,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url,
            created_at: userProfile.created_at,
            skills: userProfile.skills || [],
            is_pro: userProfile.is_pro || false,
            bio: userProfile.bio || ""
          }}
          projectsCount={projects.length}
        />
      )}
    </main>
  );
}
