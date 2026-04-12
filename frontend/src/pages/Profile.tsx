import { useState, useEffect, useCallback } from "react";
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
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import ProfileStrength from "../components/ProfileStrength";
import { HeatMap } from "../components/HeatMap";
import { StartupCard } from "../components/StartupCard";
import { getStartups } from "../api/startups";
import XPInfo from "../components/XPInfo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PencilSimple, SignOut, Key, ShareNetwork, CalendarBlank, SquaresFour,
  Rocket, Buildings, BookmarkSimple, DotsThreeVertical, PushPin, Camera,
  MapPin, Link as LinkIcon, TwitterLogo, LinkedinLogo, GithubLogo, 
  ChartBar, IdentificationCard, Plus, Handshake, FileText, InstagramLogo
} from "phosphor-react";
import { socket } from "../lib/socket";
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
  pinned_project_id: number | null;
  pinned_project: any | null;
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
  instagram_url: string | null;
  website_url: string | null;
  banner_url: string | null;
  created_at: string | null;
  onboarding_completed: boolean;
  streak_count: number;
  contribution_count: number;
  xp: number;
  level: number;
}

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const { signOut, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "startups" | "saved" | "applications">("posts");
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "projects">("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

  // 1. Optimized Combined Hook Data (React Query handles caching)
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // 1a. Listen for real-time XP gains specifically for this profile
  useEffect(() => {
    if (!userId || !userProfile) return;

    const handleXPUpdate = (data: { newXP: number, newLevel: number }) => {
      // Targeted update for THIS profile (instant, no refetch needed)
      queryClient.setQueryData(["profile", userId], (old: any) => {
        if (!old) return old;
        return { ...old, xp: data.newXP, level: data.newLevel };
      });
    };

    socket.on("xp_gain", handleXPUpdate);

    return () => {
      socket.off("xp_gain", handleXPUpdate);
    };
  }, [userId, userProfile, queryClient]);

  const { posts, fetchUserPosts, loading: postsLoading } = useUserPosts(userId, true);
  const { projects, fetchUserProjects, loading: projectsLoading } = useUserProjects(userId, true);
  const { savedPosts, fetchSavedPosts, loading: savedPostsLoading } = useSavedPosts(activeTab === "saved");
  const { projects: savedProjects, fetchUserSavedProjects, loading: savedProjectsLoading } = useUserSavedProjects(userId, activeTab === "saved");

  // 2. Fetch applications on demand
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ["myApplications", userId],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get("/projects/my/cofounder-applications", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!userId && activeTab === "applications",
    staleTime: 1 * 60 * 1000,
  });

  // 3. Fetch startups on demand
  const { data: startups = [], isLoading: loadingStartups } = useQuery({
    queryKey: ["myStartups", userId],
    queryFn: async () => {
      const data = await getStartups(undefined, undefined, userId!);
      return Array.isArray(data) ? data.filter(s => s.owner_id === userId) : [];
    },
    enabled: !!userId && activeTab === "startups",
    staleTime: 5 * 60 * 1000,
  });

  const handleProfileUpdated = useCallback(async () => {
    if (userId) {
       await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
       fetchUserPosts();
       fetchSavedPosts();
       fetchUserProjects();
       fetchUserSavedProjects();
    }
  }, [userId, queryClient, fetchUserPosts, fetchSavedPosts, fetchUserProjects, fetchUserSavedProjects]);

  useEffect(() => {
    if (searchParams.get("checkout_completed") === "true") {
      toast.success("Welcome to Pro! Your account has been upgraded.", {
        position: "top-center",
        autoClose: 5000,
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout_completed");
      setSearchParams(newParams, { replace: true });
      setTimeout(() => void handleProfileUpdated(), 1500);
    }
  }, [searchParams, setSearchParams, handleProfileUpdated]);

  useEffect(() => {
    if (searchParams.get("action") === "new-project") {
      setIsProjectModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    const onProfileUpdated = () => { void handleProfileUpdated(); };
    window.addEventListener("profileUpdated", onProfileUpdated);
    window.addEventListener("projectCreated", fetchUserProjects);
    return () => {
      window.removeEventListener("profileUpdated", onProfileUpdated);
      window.removeEventListener("projectCreated", fetchUserProjects);
    };
  }, [handleProfileUpdated, fetchUserProjects]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isLoaded || profileLoading) return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "1020px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "row"
      }}>
        <div style={{
          width: isDesktop ? "var(--feed-width)" : "100%",
          maxWidth: isDesktop ? "var(--feed-width)" : "700px",
          borderLeft: "0.5px solid var(--border-hairline)",
          borderRight: "0.5px solid var(--border-hairline)",
          minHeight: "100vh"
        }}>
          <div className="skeleton-pulse" style={{ width: "100%", height: isMobile ? "120px" : "240px", backgroundColor: "var(--bg-hover)" }} />
          <div style={{ padding: "0 24px", position: "relative", marginTop: "-50px" }}>
             <div className="skeleton-pulse" style={{ width: "120px", height: "120px", borderRadius: "var(--radius-sm)", border: "4px solid var(--bg-page)" }} />
             <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
               <div className="skeleton-pulse" style={{ width: "240px", height: "32px", borderRadius: "16px" }} />
               <div className="skeleton-pulse" style={{ width: "120px", height: "18px", borderRadius: "9px" }} />
               <div className="skeleton-pulse" style={{ width: "100%", height: "60px", borderRadius: "12px", marginTop: "12px" }} />
               <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                 <div className="skeleton-pulse" style={{ width: "80px", height: "20px", borderRadius: "10px" }} />
                 <div className="skeleton-pulse" style={{ width: "80px", height: "20px", borderRadius: "10px" }} />
                 <div className="skeleton-pulse" style={{ width: "80px", height: "20px", borderRadius: "10px" }} />
               </div>
             </div>
          </div>
          <div style={{ padding: "0 24px", marginTop: "40px" }}>
            <div className="skeleton-pulse" style={{ width: "100%", height: "400px", borderRadius: "var(--radius-md)" }} />
          </div>
        </div>
      </div>
      <style>{`
        .skeleton-pulse { 
          background: linear-gradient(-90deg, var(--bg-hover) 0%, var(--border-light) 50%, var(--bg-hover) 100%);
          background-size: 400% 400%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </main>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=212121&color=fff&bold=true`;

  return (
    <>
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
          display: "flex",
          justifyContent: (isDesktop && !isMobile) ? "flex-start" : "center",
          width: isDesktop ? "1020px" : "100%",
          maxWidth: "1020px",
          margin: (isDesktop && !isMobile) ? "0" : "0 auto",
          padding: "0",
          position: "relative",
        }}>
        <div style={{
          width: isDesktop ? "var(--feed-width)" : "100%",
          maxWidth: isDesktop ? "var(--feed-width)" : "700px",
          margin: isDesktop ? "0" : "0 auto",
          flexShrink: 0,
          borderLeft: (isMobile || !isDesktop) ? "none" : "0.5px solid var(--border-hairline)",
          borderRight: (isDesktop && !isMobile) ? "0.5px solid var(--border-hairline)" : "none",
          backgroundColor: "var(--bg-page)",
          minHeight: "100vh",
          position: "relative",
        }}>

        <div style={{
          width: "100%",
          height: isMobile ? "120px" : "240px",
          backgroundColor: "var(--bg-hover)",
          position: "relative",
          overflow: "hidden",
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
            <div style={{ width: "100%", height: "100%", backgroundColor: "var(--bg-hover)" }} />
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            title="Change banner"
            style={{
              position: "absolute", top: "20px", right: "20px", width: "44px", height: "44px", borderRadius: "50%",
              border: "1.5px solid rgba(255, 255, 255, 0.4)", backgroundColor: "rgba(15, 23, 42, 0.6)",
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)", transition: "all 0.2s ease", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", zIndex: 10
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.8)"; e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.6)"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Camera size={22} weight="bold" />
          </button>
        </div>

        <div style={{
          padding: isMobile ? "0 16px" : "0 24px", position: "relative", marginTop: isMobile ? "-48px" : "-56px", marginBottom: "32px",
        }}>
          <div
            onClick={() => setIsEditModalOpen(true)}
            style={{ width: isMobile ? "80px" : "120px", height: isMobile ? "80px" : "120px", borderRadius: "var(--radius-sm)", cursor: "pointer", flexShrink: 0, marginBottom: "16px", position: "relative", overflow: "visible", }}
          >
            <AvailabilityBadge avatarUrl={avatarUrl} name={userProfile?.name || user?.fullName || "User"} size={isMobile ? 80 : 120} isOpenToOpportunities={userProfile?.is_pro === true && userProfile?.is_hirable === true} />
            <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "24px", height: "24px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-page)", zIndex: 20, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", transition: "transform 0.2s ease" }} >
              <Camera size={12} weight="bold" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px", width: "100%", }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", width: isMobile ? "100%" : "auto", }}>
              <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "6px", maxWidth: "100%", overflowWrap: "anywhere", lineHeight: 1.12, }}>
                {userProfile?.name || user?.fullName || ""}
                <VerifiedBadge username={userProfile?.username || user?.username} size={isMobile ? "18px" : "22px"} />
                {userProfile?.is_pro === true && <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, padding: "4px 8px", borderRadius: "var(--radius-xs)", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", }}>PRO</span>}
              </h1>
                <button onClick={() => { const u = userProfile?.username || user?.username; if (u) navigate(`/portfolio/${u}`); }} style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 600, border: "none", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"} >
                  Portfolio
                </button>
                <button onClick={() => setIsEditModalOpen(true)} style={{ padding: "8px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, border: "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"} >
                <PencilSimple size={16} weight="regular" />
              </button>
              {userProfile?.is_pro && (
                <button onClick={() => navigate("/analytics")} style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 600, border: "0.5px solid var(--border-hairline)", backgroundColor: "transparent", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"} >
                  <ChartBar size={16} weight="regular" />
                  Analytics
                  <span style={{ fontSize: '9px', backgroundColor: 'var(--text-primary)', color: 'var(--bg-page)', padding: '2px 4px', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>PRO</span>
                </button>
              )}
              <button onClick={() => setIsIDCardModalOpen(true)} style={{ padding: "8px", borderRadius: "100px", border: "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease", }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"} title="View ID card" >
                <IdentificationCard size={18} weight="regular" />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginLeft: isMobile ? 0 : "auto", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-start" : "flex-end", flexWrap: "wrap", }}>
              <button onClick={() => { const u = userProfile?.username || user?.username; const shareUrl = u ? `${window.location.origin}/${u}` : `${window.location.origin}/user/${user?.id}`; navigator.clipboard.writeText(shareUrl).then(() => toast.success("Copied!")); }} style={{ padding: "6px 8px", borderRadius: "100px", border: "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", color: "var(--text-primary)", cursor: "pointer", transition: "all 0.15s ease", }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"} title="Share profile" >
                <ShareNetwork size={18} weight="thin" style={{ verticalAlign: "middle" }} />
              </button>
              <div style={{ position: "relative" }}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} style={{ padding: "6px 8px", borderRadius: "100px", border: "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", color: "var(--text-primary)", cursor: "pointer", transition: "all 0.15s ease", }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"} title="More options" >
                  <DotsThreeVertical size={18} weight="thin" style={{ verticalAlign: "middle" }} />
                </button>
                {isMenuOpen && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", width: "200px", zIndex: 100, backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", overflow: "hidden", animation: "tabContentEnter 0.2s ease-out" }}>
                    <button style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", transition: "background-color 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"} onClick={() => { setIsMenuOpen(false); navigate("/forgot-password"); }} >
                      <Key size={18} weight="thin" />
                      Reset Password
                    </button>
                    <button style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontWeight: 600, fontSize: "13px", color: "#ef4444", borderTop: "0.5px solid var(--border-hairline)", transition: "background-color 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"} onClick={() => { setIsMenuOpen(false); handleSignOut(); }} >
                      <SignOut size={18} weight="thin" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <span style={{ fontSize: "14.5px", color: "var(--text-tertiary)", display: "block", marginBottom: "16px", fontWeight: 500 }}>
            @{userProfile?.username || user?.username}
          </span>

          {userProfile?.bio && <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 24px 0" }}> <BioRenderer bio={userProfile.bio} /> </p>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", color: "var(--text-tertiary)", fontSize: "13px", marginBottom: "20px", fontWeight: 500 }}>
            {userProfile?.location && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}> <MapPin size={14} weight="regular" /> {userProfile.location} </span>}
            {userProfile?.website_url && (
              <a 
                href={userProfile.website_url.startsWith("http") ? userProfile.website_url : `https://${userProfile.website_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", textDecoration: "none" }} 
              > 
                <LinkIcon size={14} weight="regular" /> 
                {userProfile.website_url.replace(/^https?:\/\//, "")} 
              </a>
            )}
            {userProfile?.created_at && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}> <CalendarBlank size={14} weight="regular" /> Joined {formatProfileJoinDate(userProfile.created_at)} </span>}
          </div>

          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px", }}>
              {userProfile.skills.map((skill, index) => (
                <span key={index} style={{ fontSize: "12px", fontWeight: 600, padding: "6px 14px", backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }} >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              <button onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }} >
                {userProfile?.follower_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>Followers</span>
              </button>
              <button onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }} >
                {userProfile?.following_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>Following</span>
              </button>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>
                {userProfile?.contribution_count ?? 0} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>Contributions</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {userProfile?.github_url && <a href={userProfile.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="GitHub"> <GithubLogo size={20} weight="thin" /> </a>}
              {userProfile?.linkedin_url && <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="LinkedIn"> <LinkedinLogo size={20} weight="thin" /> </a>}
              {userProfile?.twitter_url && <a href={userProfile.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="Twitter"> <TwitterLogo size={20} weight="thin" /> </a>}
              {userProfile?.instagram_url && <a href={userProfile.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="Instagram"> <InstagramLogo size={20} weight="thin" /> </a>}
            </div>
          </div>

          {/* Unified Performance Dashboard */}
          <div style={{ 
            marginBottom: "40px",
            padding: "24px",
            background: "linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-page) 100%)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-hairline)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Subtle background glow */}
            <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "radial-gradient(circle, var(--text-primary) 0%, transparent 70%)", opacity: 0.03, pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* Top Row: Level HUD & Identity Strength */}
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "32px", borderBottom: "0.5px solid var(--border-hairline)", paddingBottom: "32px" }}>
                {/* Level HUD (60%) */}
                <div style={{ flex: isMobile ? "none" : 1.6, position: "relative" }}>
                  <div style={{ position: "absolute", top: "0", right: "0" }}>
                    <XPInfo />
                  </div>
                  {profileLoading ? (
                    <div className="skeleton-pulse" style={{ height: "60px", width: "100%", borderRadius: "var(--radius-sm)" }} />
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                              Experience Level
                            </span>
                            <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--text-tertiary)" }} />
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
                              Rank: {userProfile?.level && userProfile.level > 10 ? "Senior" : "Associate"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                            <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>
                              {userProfile?.level || 1}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-tertiary)" }}>
                              / 100
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
                            {userProfile?.xp?.toLocaleString() || 0} XP
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                            {Math.pow((userProfile?.level || 1), 2) * 50 - (userProfile?.xp || 0)} XP next
                          </div>
                        </div>
                      </div>

                      {/* Minimalist Multi-segment Bar */}
                      <div style={{ position: "relative", height: "6px", width: "100%", backgroundColor: "var(--border-hairline)", borderRadius: "100px", overflow: "hidden" }}>
                        <div style={{ 
                          width: `${Math.min(100, Math.max(0, ((userProfile?.xp || 0) - Math.pow((userProfile?.level || 1) - 1, 2) * 50) / (Math.pow(userProfile?.level || 1, 2) * 50 - Math.pow((userProfile?.level || 1) - 1, 2) * 50) * 100))}%`, 
                          height: "100%", 
                          background: "var(--text-primary)",
                          borderRadius: "100px",
                          transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: "0 0 12px rgba(255, 255, 255, 0.1)"
                        }} />
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                           {[1, 2, 3, 4, 5].map((i) => (
                             <div key={i} style={{ width: "12px", height: "2px", borderRadius: "1px", backgroundColor: i <= ((userProfile?.level || 1) % 5) ? "var(--text-primary)" : "var(--border-hairline)" }} />
                           ))}
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          System Efficiency: {Math.min(100, Math.round(((userProfile?.xp || 0) / (Math.pow(userProfile?.level || 1, 2) * 50)) * 100))}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile Strength (40%) */}
                <div style={{ flex: isMobile ? "none" : 1, display: "flex", borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)", paddingLeft: isMobile ? 0 : "32px", paddingTop: isMobile ? "32px" : 0, borderTop: isMobile ? "0.5px solid var(--border-hairline)" : "none" }}>
                  <ProfileStrength user={userProfile} projectsCount={projects?.length || 0} standalone />
                </div>
              </div>

              {/* Bottom Row: Contributions Heatmap */}
              <div>
                <HeatMap userId={userId!} githubUrl={userProfile?.github_url} standalone />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? "0 16px" : "0 24px", }}>
          <div className="tabs-row" style={{ display: "flex", overflowX: "auto", borderBottom: "0.5px solid var(--border-hairline)", marginBottom: "32px", gap: "24px", padding: isMobile ? "0 16px" : "0" }}>
            {[
              { id: "posts", icon: FileText, label: "Posts" },
              { id: "projects", icon: SquaresFour, label: "Projects" },
              { id: "startups", icon: Buildings, label: "Startups" },
              { id: "applications", icon: Handshake, label: "Applications" },
              { id: "saved", icon: BookmarkSimple, label: "Saved" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0", backgroundColor: "transparent", border: "none", color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)", fontSize: "13px", fontWeight: activeTab === tab.id ? 700 : 500, cursor: "pointer", transition: "all 0.15s ease", flexShrink: 0 }} >
                <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "thin"} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content" style={{ marginTop: "20px" }}>
            {activeTab === "posts" && (
              <div className="tab-content-enter">
                {postsLoading ? <div className="skeleton-pulse" style={{ height: "200px" }} /> : posts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <SquaresFour size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>No posts yet.</p>
                  </div>
                ) : (
                  [...posts].sort((a, b) => {
                    if (userProfile?.pinned_post_id === a.id) return -1;
                    if (userProfile?.pinned_post_id === b.id) return 1;
                    return 0;
                  }).map((p) => (
                    <div key={p.id} style={{ position: "relative" }}>
                      {userProfile?.pinned_post_id === p.id && ( <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 700 }}> <PushPin size={12} weight="fill" /> Pinned </div> )}
                      <PostCard post={p} onUpdated={fetchUserPosts} isPinned={userProfile?.pinned_post_id === p.id} />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="tab-content-enter">
                {projectsLoading ? <div className="skeleton-pulse" style={{ height: "200px" }} /> : projects.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <Rocket size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px", marginBottom: "24px" }}>No projects added yet.</p>
                    <button onClick={() => setIsProjectModalOpen(true)} style={{ margin: "0 auto", padding: "10px 24px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 600, backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", cursor: "pointer", }} > <Plus size={14} weight="bold" style={{ marginRight: '8px' }} /> New project </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {[...projects].sort((a, b) => {
                      if (userProfile?.pinned_project_id === a.id) return -1;
                      if (userProfile?.pinned_project_id === b.id) return 1;
                      return 0;
                    }).map((p) => (
                      <div key={p.id} style={{ position: "relative" }}>
                        {userProfile?.pinned_project_id === p.id && ( <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 700 }}> <PushPin size={12} weight="fill" /> Pinned </div> )}
                        <ProjectCard project={p} onUpdated={fetchUserProjects} isPinned={userProfile?.pinned_project_id === p.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "startups" && (
              <div className="tab-content-enter">
                {loadingStartups ? <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}> {[...Array(2)].map((_, i) => ( <div key={i} className="skeleton-pulse" style={{ height: "160px", width: "100%", borderRadius: "var(--radius-sm)" }} /> ))} </div> : startups.length === 0 ? (
                   <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <Buildings size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                    <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px", marginBottom: "24px" }}>No startups founded yet.</p>
                    <button onClick={() => navigate("/startup/new")} style={{ margin: "0 auto", padding: "10px 24px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 600, backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", cursor: "pointer", }} > Launch a Startup </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                    {startups.map((s) => ( <StartupCard key={s.id} startup={s} /> ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "applications" && (
            <div className="tab-content-enter">
              {loadingApps ? <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}> {[...Array(3)].map((_, i) => ( <div key={i} className="skeleton-pulse" style={{ height: "140px", width: "100%", borderRadius: "var(--radius-sm)" }} /> ))} </div> : applications.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", backgroundColor: "rgba(255,255,255,0.02)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)" }}>
                  <Handshake size={32} weight="thin" style={{ color: "var(--text-tertiary)", marginBottom: "16px" }} />
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>No applications</p>
                  <p style={{ color: "var(--text-tertiary)", fontSize: "14px", marginTop: "8px" }}>You haven't applied to join any projects as a co-founder yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {applications.map(app => (
                    <div key={app.id} className="app-card" onClick={() => navigate(`/project/${app.project_id}`)} style={{ padding: "24px", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-page)", cursor: "pointer", transition: "all 0.15s ease", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: "24px" }} >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                         <div style={{ width: "48px", height: "48px", flexShrink: 0, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}> <img src={app.project.cover_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.project.title)}&background=212121&color=ffffff&bold=true`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> </div>
                         <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{app.project.title}</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}> <img src={app.project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.project.user?.name || "U")}&background=212121&color=ffffff&bold=true`} style={{ width: "16px", height: "16px", borderRadius: "var(--radius-sm)" }} /> <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>@{app.project.user?.username}</span> </div>
                         </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}> <div style={{ padding: "4px 10px", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e", border: "0.5px solid rgba(34, 197, 94, 0.2)", fontSize: "11px", fontWeight: 600, borderRadius: "var(--radius-sm)", }}> Applied </div> <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}> {new Date(app.created_at).toLocaleDateString()} </span> </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

            {activeTab === "saved" && (
              <div className="tab-content-enter">
                <div style={{ display: "flex", gap: "8px", marginBottom: "32px", marginTop: "12px" }}>
                     <button onClick={() => setSavedSubTab("posts")} style={{ padding: "6px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", backgroundColor: savedSubTab === "posts" ? "var(--text-primary)" : "transparent", color: savedSubTab === "posts" ? "var(--bg-page)" : "var(--text-tertiary)", cursor: "pointer", transition: "all 0.2s", }} > Posts </button>
                  <button onClick={() => setSavedSubTab("projects")} style={{ padding: "6px 14px", fontSize: "11px", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", backgroundColor: savedSubTab === "projects" ? "var(--text-primary)" : "transparent", color: savedSubTab === "projects" ? "var(--bg-page)" : "var(--text-tertiary)", cursor: "pointer", transition: "all 0.2s", }} > Projects </button>
                </div>
                {savedSubTab === "posts" ? (
                  savedPostsLoading ? <div className="skeleton-pulse" style={{ height: "200px" }} /> : savedPosts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                      <BookmarkSimple size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                      <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>No saved posts.</p>
                    </div>
                  ) : ( savedPosts.map((p) => <PostCard key={p.id} post={p} onUpdated={fetchSavedPosts} />) )
                ) : (
                  savedProjectsLoading ? <div className="skeleton-pulse" style={{ height: "200px" }} /> : savedProjects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                      <BookmarkSimple size={48} weight="thin" style={{ opacity: 0.1, marginBottom: "20px", display: "block", margin: "0 auto" }} />
                      <p style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: "14px" }}>No saved projects.</p>
                    </div>
                  ) : ( savedProjects.map((p) => <ProjectCard key={p.id} project={p} onUpdated={fetchUserSavedProjects} />) )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {userProfile && ( <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} currentUser={userProfile} onUpdated={handleProfileUpdated} projectCount={projects.length} /> )}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={handleProfileUpdated} />
      {userProfile?.id && ( <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userProfile.id} type={followersModalType} title={followersModalType === "followers" ? "Followers" : "Following"} /> )}
      <ToastContainer position="bottom-right" theme="dark" hideProgressBar />
      {userProfile && (
        <DeveloperIDCardModal isOpen={isIDCardModalOpen} onClose={() => setIsIDCardModalOpen(false)} user={{ name: userProfile.name, username: userProfile.username, avatar_url: userProfile.avatar_url, created_at: userProfile.created_at, skills: userProfile.skills || [], is_pro: userProfile.is_pro || false, bio: userProfile.bio || "" }} projectsCount={projects.length} />
      )}
        {isDesktop && !isMobile && ( <aside style={{ width: "340px", padding: "0 0 24px 12px", position: "sticky", top: 0, alignSelf: "flex-start", flexShrink: 0 }}> <RecommendedUsersSidebar /> </aside> )}
        </div>
        <style>{`
          @media (max-width: 768px) {
            main { padding-top: 64px !important; padding-bottom: 100px !important; }
          }
        `}</style>
      </main>
    </>
  );
}
