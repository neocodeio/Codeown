import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"; //link
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
import Lightbox from "../components/Lightbox";
import { formatProfileJoinDate } from "../utils/date";
import api from "../api/axios";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import DeveloperIDCardModal from "../components/DeveloperIDCardModal";
// import StreakBadge from "../components/StreakBadge";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Pen01Icon,
  Logout01Icon,
  Key01Icon,
  Share01Icon,
  Calendar03Icon,
  Layers01Icon,
  Rocket01Icon,
  Bookmark01Icon,
  MoreVerticalIcon,
  PackageIcon as PushpinIcon,
  Camera01Icon,
  Location01Icon,
  Link02Icon,
  TwitterIcon,
  Linkedin01Icon,
  GithubIcon,
  ChartBarLineIcon,
  IdIcon,
} from '@hugeicons/core-free-icons';
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
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "saved">("posts");
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "projects">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  if (!isLoaded) return (
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

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=212121&color=fff&bold=true`;

  return (
  <main style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <SEO title="My Profile" description="Manage your Codeown profile and settings." />
      <style>{`
        @keyframes tabContentEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .tab-content-enter { animation: tabContentEnter 0.25s ease-out forwards; }
        .tabs-row { -ms-overflow-style: none; scrollbar-width: none; }
        .tabs-row::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{
        maxWidth: "1000px",
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
              background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
            }} />
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            title="Change banner"
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(255,255,255,0.9)",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <HugeiconsIcon icon={Camera01Icon} size={24} style={{ width: 24, height: 24, flexShrink: 0 }} />
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
              // No overflow:hidden so AvailabilityBadge briefcase icon can show
            }}
          >
            <AvailabilityBadge
              avatarUrl={avatarUrl}
              name={userProfile?.name || user?.fullName || "User"}
              size={isMobile ? 96 : 120}
              isOpenToOpportunities={userProfile?.is_pro === true && userProfile?.is_hirable === true}
              ringColor="#0f172a"
            />
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
                {(userProfile?.name || user?.fullName || "").toUpperCase()}
                <VerifiedBadge username={userProfile?.username || user?.username} isPro={userProfile?.is_pro} size={isMobile ? "18px" : "22px"} />
                {/* {userProfile && userProfile.streak_count > 0 && <StreakBadge count={userProfile.streak_count} />} */}
                {userProfile?.is_pro === true && (
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
              {/* {userProfile?.is_pro !== true && (
                <Link
                  to="/billing"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "30px",
                    fontSize: "14px",
                    fontWeight: 800,
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.backgroundColor = "#1e293b"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.backgroundColor = "#0f172a"; }}
                >
                  Upgrade to Pro
                </Link>
              )} */}
              <button
                onClick={() => setIsEditModalOpen(true)}
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
              >
                <HugeiconsIcon icon={Pen01Icon} size={16} />
                Edit Profile
              </button>
              {userProfile?.is_pro && (
                <button
                  onClick={() => navigate("/analytics")}
                  style={{
                    padding: "10px 18px",
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
                >
                  <HugeiconsIcon icon={ChartBarLineIcon} size={16} />
                  Analytics
                  <span style={{ fontSize: '9px', backgroundColor: '#000', color: '#fff', padding: '2px 5px', borderRadius: '4px', fontWeight: 900 }}>PRO</span>
                </button>
              )}
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
              >
                <HugeiconsIcon icon={IdIcon} size={20} />
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
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
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
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
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
                      backgroundColor: "#fff",
                      borderRadius: isMobile ? "16px 16px 0 0" : "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "none",
                          background: "none",
                          borderRadius: "8px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontWeight: 600,
                        }}
                        onClick={() => { setIsMenuOpen(false); navigate("/forgot-password"); }}
                      >
                        <HugeiconsIcon icon={Key01Icon} size={20} />
                        Reset Password
                      </button>
                      <button
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "none",
                          background: "none",
                          borderRadius: "8px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontWeight: 600,
                          color: "#dc2626",
                        }}
                        onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                      >
                        <HugeiconsIcon icon={Logout01Icon} size={20} />
                        Sign Out
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>

          <span style={{ fontSize: "15px", color: "#64748b", display: "block", marginBottom: "12px" }}>
            @{userProfile?.username || user?.username}
          </span>

          {userProfile?.bio && (
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#334155", margin: "0 0 12px 0" }}>
              <BioRenderer bio={userProfile.bio} />
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
            {userProfile?.location && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <HugeiconsIcon icon={Location01Icon} size={16} />
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
                  color: "#2563eb",
                  textDecoration: "underline",
                }}
              >
                <HugeiconsIcon icon={Link02Icon} size={16} />
                {userProfile.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {userProfile?.created_at && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                Joined {formatProfileJoinDate(userProfile.created_at)}
              </span>
            )}
          </div>

          {/* Tech Stacks */}
          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
            }}>
              {userProfile.skills.map((skill, index) => (
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
                {userProfile?.follower_count ?? 0} <span style={{ color: "#64748b", fontWeight: 500 }}>followers</span>
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
                {userProfile?.following_count ?? 0} <span style={{ color: "#64748b", fontWeight: 500 }}>following</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {userProfile?.twitter_url && (
                <a href={userProfile.twitter_url} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="Twitter">
                  <HugeiconsIcon icon={TwitterIcon} size={20} />
                </a>
              )}
              {userProfile?.linkedin_url && (
                <a href={userProfile.linkedin_url} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="LinkedIn">
                  <HugeiconsIcon icon={Linkedin01Icon} size={20} />
                </a>
              )}
              {userProfile?.github_url && (
                <a href={userProfile.github_url} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="GitHub">
                  <HugeiconsIcon icon={GithubIcon} size={20} />
                </a>
              )}
              {userProfile?.website_url && (
                <a href={userProfile.website_url.startsWith("http") ? userProfile.website_url : `https://${userProfile.website_url}`} target="_blank" rel="noreferrer" style={{ color: "#0f172a" }} aria-label="Website">
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
                minWidth: isMobile ? "0" : "100px",
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
                minWidth: isMobile ? "0" : "100px",
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
            <button
              onClick={() => setActiveTab("saved")}
              style={{
                flex: isMobile ? "1" : "none",
                minWidth: isMobile ? "0" : "100px",
                padding: "16px 20px",
                fontSize: "15px",
                fontWeight: activeTab === "saved" ? 700 : 600,
                color: activeTab === "saved" ? "#0f172a" : "#64748b",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { if (activeTab !== "saved") e.currentTarget.style.backgroundColor = "#f8fafc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Saved
              {activeTab === "saved" && (
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
            {activeTab === "posts" && (
              <div className="tab-content-enter">
                {posts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <HugeiconsIcon icon={Layers01Icon} size={48} style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "#64748b", fontWeight: 700 }}>Share your first post with the community.</p>
                  </div>
                ) : (
                  posts.map((p) => (
                    <div key={p.id} style={{ position: "relative" }}>
                      {userProfile?.pinned_post_id === p.id && (
                        <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px", fontWeight: 700 }}>
                          <HugeiconsIcon icon={PushpinIcon} size={14} />
                          Pinned Post
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
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <HugeiconsIcon icon={Rocket01Icon} size={48} style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "#64748b", fontWeight: 700 }}>Showcase your best projects.</p>
                    <button
                      onClick={() => setIsProjectModalOpen(true)}
                      style={{
                        margin: "16px auto",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Add Project
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

            {activeTab === "saved" && (
              <div className="tab-content-enter">
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  <button
                    onClick={() => setSavedSubTab("posts")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 800,
                      borderRadius: "100px",
                      border: "1px solid",
                      borderColor: savedSubTab === "posts" ? "#0f172a" : "#e2e8f0",
                      backgroundColor: savedSubTab === "posts" ? "#0f172a" : "white",
                      color: savedSubTab === "posts" ? "white" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Saved Posts
                  </button>
                  <button
                    onClick={() => setSavedSubTab("projects")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 800,
                      borderRadius: "100px",
                      border: "1px solid",
                      borderColor: savedSubTab === "projects" ? "#0f172a" : "#e2e8f0",
                      backgroundColor: savedSubTab === "projects" ? "#0f172a" : "white",
                      color: savedSubTab === "projects" ? "white" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Saved Projects
                  </button>
                </div>

                {savedSubTab === "posts" ? (
                  savedPosts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "64px" }}>
                      <HugeiconsIcon icon={Bookmark01Icon} size={40} style={{ opacity: 0.1, marginBottom: "16px" }} />
                      <p style={{ color: "#64748b", fontWeight: 600 }}>No saved posts yet.</p>
                    </div>
                  ) : (
                    savedPosts.map((p) => <PostCard key={p.id} post={p} onUpdated={fetchSavedPosts} />)
                  )
                ) : (
                  savedProjects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "64px" }}>
                      <HugeiconsIcon icon={Bookmark01Icon} size={40} style={{ opacity: 0.1, marginBottom: "16px" }} />
                      <p style={{ color: "#64748b", fontWeight: 600 }}>No saved projects yet.</p>
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

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageSrc={lightboxImage}
      />

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
            skills: userProfile.skills,
            is_pro: userProfile.is_pro
          }}
          projectsCount={projects.length}
        />
      )}
    </main>
  );
}
