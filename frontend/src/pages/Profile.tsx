import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWindowSize } from "../hooks/useWindowSize";
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
import BioRenderer from "../components/BioRenderer";
import Lightbox from "../components/Lightbox";
import { formatJoinDate } from "../utils/date";
import api from "../api/axios";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserEdit01Icon,
  Logout01Icon,
  Key01Icon,
  Share01Icon,
  Calendar03Icon,
  Globe02Icon,
  Layers01Icon,
  Rocket01Icon,
  Bookmark01Icon,
  MoreVerticalIcon,
  PackageIcon as PushpinIcon,
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
  is_organization: boolean;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  banner_url: string | null;
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

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


  if (!isLoaded) return (
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

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=212121&color=fff&bold=true`;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <SEO title="My Profile" description="Manage your Codeown profile and settings." />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpMobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes tabContentEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tab-content-enter { animation: tabContentEnter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .slide-up-mobile { animation: slideUpMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .menu-item {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border: none;
          background: none;
          color: #1e293b;
          font-weight: 700;
          cursor: pointer;
          border-radius: 16px;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }
        .menu-item:hover {
          background-color: #f8fafc;
        }
        .menu-item:active {
          transform: scale(0.98);
        }
        .menu-item-danger {
          color: #ef4444;
        }
        .menu-item-danger:hover {
          background-color: #fff1f2;
        }
        .menu-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
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
      `}</style>

      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "40px 20px"
      }}>
        {/* Banner Section */}
        <div style={{
          width: "100%",
          height: isMobile ? "200px" : "320px",
          backgroundColor: "#fff",
          position: "relative",
          overflow: "hidden",
          borderRadius: isMobile ? "0" : "32px",
          marginBottom: isMobile ? "0" : "20px"
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
              background: `linear-gradient(135deg, hsl(${(userProfile?.username?.length || 5) * 40}, 80%, 96%) 0%, hsl(${(userProfile?.username?.length || 5) * 40 + 40}, 80%, 96%) 100%)`,
            }} />
          )}
        </div>

        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageSrc={lightboxImage}
        />

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
                name={userProfile?.name || user?.fullName || "User"}
                size={isMobile ? 100 : 140}
                isOpenToOpportunities={userProfile?.is_hirable}
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
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="profile-btn profile-btn-primary"
              >
                <HugeiconsIcon icon={UserEdit01Icon} size={20} />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => {
                  const username = userProfile?.username || user?.username;
                  const shareUrl = username ? `${window.location.origin}/${username}` : `${window.location.origin}/user/${user?.id}`;
                  navigator.clipboard.writeText(shareUrl).then(() => toast.success("Copied!"));
                }}
                className="profile-btn"
                title="Share"
              >
                <HugeiconsIcon icon={Share01Icon} size={20} />
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  className="profile-btn"
                  style={{ padding: "10px" }}
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} size={20} />
                </button>
                {isMenuOpen && createPortal(
                  <>
                    <div
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                      style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                        backdropFilter: "blur(4px)",
                        zIndex: 10000,
                        cursor: "pointer"
                      }}
                    />
                    <div className="glass-card" style={{
                      position: "fixed",
                      bottom: isMobile ? "0" : "auto",
                      left: isMobile ? "0" : "auto",
                      right: isMobile ? "0" : "80px",
                      top: isMobile ? "auto" : "200px",
                      width: isMobile ? "100%" : "320px",
                      zIndex: 10001,
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      borderRadius: isMobile ? "32px 32px 0 0" : "24px",
                      animation: isMobile ? "slideUpMobile 0.4s ease-out" : "fadeIn 0.2s ease-out"
                    }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="menu-item"
                        onClick={() => { setIsMenuOpen(false); navigate("/forgot-password"); }}
                      >
                        <div className="menu-icon-box">
                          <HugeiconsIcon icon={Key01Icon} size={20} />
                        </div>
                        <span style={{ fontWeight: 800 }}>Reset Password</span>
                      </button>

                      <div style={{ height: "1px", backgroundColor: "rgba(15, 23, 42, 0.05)", margin: "8px" }} />

                      <button
                        className="menu-item menu-item-danger"
                        onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                      >
                        <div className="menu-icon-box" style={{ backgroundColor: "#fff1f2" }}>
                          <HugeiconsIcon icon={Logout01Icon} size={20} />
                        </div>
                        <span style={{ fontWeight: 800 }}>Sign Out</span>
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
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
              {userProfile?.name || user?.fullName}
              <VerifiedBadge username={userProfile?.username || user?.username} size={isMobile ? "20px" : "24px"} />
            </h1>
            <span style={{ fontSize: "16px", color: "#64748b", fontWeight: 600 }}>@{userProfile?.username || user?.username}</span>
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
            {userProfile?.bio && (
              <div className="sidebar-section">
                <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#334155", margin: 0 }}>
                  <BioRenderer bio={userProfile.bio} />
                </p>
              </div>
            )}

            <div className="sidebar-section" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                <HugeiconsIcon icon={Calendar03Icon} size={18} />
                Joined {formatJoinDate(userProfile?.created_at || "")}
              </div>
              {userProfile?.website_url && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6", fontSize: "14px", fontWeight: 600 }}>
                  <HugeiconsIcon icon={Globe02Icon} size={18} />
                  <a href={userProfile.website_url.startsWith('http') ? userProfile.website_url : `https://${userProfile.website_url}`} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{userProfile.website_url.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
            </div>

            <div className="sidebar-section" style={{ display: "flex", gap: "20px" }}>
              <div onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontSize: "15px", fontWeight: 750, color: "#0f172a" }}>{userProfile?.follower_count || 0}</span>
                <span style={{ fontSize: "15px", color: "#64748b", marginLeft: "4px" }}>Followers</span>
              </div>
              <div onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontSize: "15px", fontWeight: 750, color: "#0f172a" }}>{userProfile?.following_count || 0}</span>
                <span style={{ fontSize: "15px", color: "#64748b", marginLeft: "4px" }}>Following</span>
              </div>
            </div>

            {userProfile?.skills && userProfile.skills.length > 0 && (
              <div className="sidebar-section">
                <h4 className="sidebar-title">Tech Stack</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {userProfile.skills.map(skill => (
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
              backgroundColor: "rgba(241, 245, 249, 0.5)",
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
              <button
                onClick={() => setActiveTab("saved")}
                className={`tab-btn ${activeTab === "saved" ? 'active' : ''}`}
                style={{ whiteSpace: "nowrap" }}
              >
                Saved
              </button>
            </div>

            <div className="tab-content">
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
                      <button onClick={() => setIsProjectModalOpen(true)} className="profile-btn profile-btn-primary" style={{ margin: "16px auto" }}>Add Project</button>
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
      </div>

      {userProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={userProfile}
          onUpdated={handleProfileUpdated}
        />
      )}

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onUpdated={handleProfileUpdated}
      />

      {userProfile?.id && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={userProfile.id}
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
