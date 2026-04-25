import { useState, useEffect, useRef } from "react";
import flameGif from "../assets/flame.gif";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useUserPosts } from "../hooks/useUserPosts";
import { useUserProjects } from "../hooks/useUserProjects";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FollowersModal from "../components/FollowersModal";
import { formatProfileJoinDate } from "../utils/date";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Rocket01Icon,
  Building02Icon,
  Grid02Icon,
  PinIcon,
  Location01Icon,
  Link01Icon,
  IdentityCardIcon,
  LicenseIcon,
  GithubIcon,
  NewTwitterIcon,
  Linkedin01Icon,
  InstagramIcon,
  Chat01Icon,
  Chart01Icon
} from "@hugeicons/core-free-icons";
import { socket } from "../lib/socket";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { SEO } from "../components/SEO";
import Lightbox from "../components/Lightbox";
import DeveloperIDCardModal from "../components/DeveloperIDCardModal";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { HeatMap } from "../components/HeatMap";
import { GitHubContributions } from "../components/GitHubContributions";
import { StartupCard } from "../components/StartupCard";
import { getStartups } from "../api/startups";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileSkeleton } from "../components/LoadingSkeleton";
import OfficialAccountBadge from "../components/OfficialAccountBadge";
import BioRenderer from "../components/BioRenderer";

const AnimatedCounter = ({ end, duration = 1500 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

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
  pinned_project_id: number | null;
  pinned_project: any | null;
  job_title: string | null;
  location: string | null;
  experience_level: string | null;
  skills: string[] | null;
  is_hirable: boolean;
  is_pro: boolean;
  is_og: boolean;
  is_organization: boolean;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  banner_url: string | null;
  created_at: string | null;
  streak_count: number;
  contribution_count: number;
  xp: number;
  level: number;
  is_online?: boolean;
}

export default function UserProfile() {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;

  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "startups" | "dashboard">("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);


  // 0. Immediate self-detection to avoid double-loading
  const param = userId || username;
  const isMe = (userId && currentUser?.id === userId) || (username && currentUser?.username === username);

  useEffect(() => {
    if (isMe) {
      navigate("/profile", { replace: true });
    }
  }, [isMe, navigate]);
  const { data: user, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["userProfile", param],
    queryFn: async () => {
      const token = await getToken();
      const userRes = await api.get(`/users/${param}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return userRes.data as User;
    },
    enabled: !!param && !isMe,
  });

  // 1a. Real-time XP sync for visitors
  useEffect(() => {
    if (!param || !user) return;

    const handleXPUpdate = (data: { newXP: number, newLevel: number }) => {
      queryClient.setQueryData(["userProfile", param], (old: any) => {
        if (!old) return old;
        return { ...old, xp: data.newXP, level: data.newLevel };
      });
    };

    socket.on("xp_gain", handleXPUpdate);

    return () => {
      socket.off("xp_gain", handleXPUpdate);
    };
  }, [param, user, queryClient]);

  const isOwnProfile = currentUser?.id === user?.id;

  // 2. Secondary Actions (Follow status, tracking)
  useEffect(() => {
    if (user && isSignedIn && !isOwnProfile) {
      const checkStatus = async () => {
        try {
          const token = await getToken();
          const followRes = await api.get(`/follows/${user.id}/status`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          setIsFollowing(followRes.data.isFollowing || false);

          await api.post(`/analytics/track`, {
            event_type: 'profile_view',
            target_user_id: user.id
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch (e) { console.error(e); }
      };
      checkStatus();
    }
  }, [user?.id, isSignedIn, isOwnProfile, getToken]);

  // 3. Tab Data Hooks
  const { posts, fetchUserPosts, loading: postsLoading } = useUserPosts(user?.id || null);
  const { projects, fetchUserProjects, loading: projectsLoading } = useUserProjects(user?.id || null);

  const { data: startups = [], isLoading: loadingStartups } = useQuery({
    queryKey: ["userStartups", user?.id],
    queryFn: async () => {
      const data = await getStartups(undefined, undefined, user!.id);
      return Array.isArray(data) ? data.filter(s => s.owner_id === user!.id) : [];
    },
    enabled: !!user?.id && activeTab === "startups",
    staleTime: 5 * 60 * 1000,
  });

  const handleFollow = async () => {
    if (!isSignedIn || !user?.id) { navigate("/sign-in"); return; }
    setFollowLoading(true);
    try {
      const token = await getToken();
      const res = await api.post(`/follows/${user.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFollowing(res.data.following);
      queryClient.invalidateQueries({ queryKey: ["userProfile", param] });
    } catch (e) { console.error(e); }
    finally { setFollowLoading(false); }
  };

  const handleMessage = () => {
    if (!isSignedIn) { navigate("/sign-in"); return; }
    if (user?.id) {
      navigate(`/messages?userId=${user.id}`);
    }
  };
  // 4. Redirect if it's the current user's own profile
  useEffect(() => {
    if (user && currentUser && user.id === currentUser.id) {
      navigate("/profile", { replace: true });
    }
  }, [user?.id, currentUser?.id, navigate]);

  if (isMe || profileLoading) return (
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
          <ProfileSkeleton />
        </div>
      </div>
    </main>
  );

  if (!user) {
    const isServerError = profileError && (profileError as any)?.response?.status >= 500;
    return (
      <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "24px", color: "var(--text-primary)" }}>{isServerError ? "Something went wrong" : "User not found"}</h2>
          {isServerError && <p style={{ fontSize: "14px", color: "var(--text-tertiary)", marginTop: "8px" }}>There was a server error loading this profile.</p>}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            {isServerError && (
              <button onClick={() => refetchProfile()} style={{ padding: "8px 16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Retry</button>
            )}
            <button onClick={() => navigate("/")} style={{ padding: "8px 16px", backgroundColor: isServerError ? "transparent" : "var(--text-primary)", color: isServerError ? "var(--text-primary)" : "var(--bg-page)", border: isServerError ? "1px solid var(--border-hairline)" : "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Back to Feed</button>
          </div>
        </div>
      </main>
    );
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=212121&color=ffffff&bold=true`;
  const seoDescription = user.bio ? (user.bio.length > 160 ? user.bio.substring(0, 157) + "..." : user.bio) : `${user.name} is a developer on Codeown.`;
  const [firstName, ...lastNameParts] = (user.name || "User").split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <>
      <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
        <SEO title={`${user.name} (@${user.username})`} description={seoDescription} image={avatarUrl} type="profile" author={user.name} username={user.username || undefined} firstName={firstName} lastName={lastName} keywords={[user.name, user.username || "", ...(user.skills || [])]} />
        <style>{`
          @keyframes tabContentEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .tab-content-enter { animation: tabContentEnter 0.25s ease-out forwards; }
          .tabs-row { -ms-overflow-style: none; scrollbar-width: none; }
          .tabs-row::-webkit-scrollbar { display: none; }
        `}</style>

        <div style={{ display: "flex", justifyContent: (isDesktop && !isMobile) ? "flex-start" : "center", width: isDesktop ? "1020px" : "100%", maxWidth: "1020px", margin: (isDesktop && !isMobile) ? "0" : "0 auto", padding: "0", position: "relative", }}>
          <div style={{ width: isDesktop ? "var(--feed-width)" : "100%", maxWidth: isDesktop ? "var(--feed-width)" : "700px", margin: isDesktop ? "0" : "0 auto", flexShrink: 0, borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)", borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", minHeight: "100vh", position: "relative", }}>
            <div style={{ width: "100%", height: isMobile ? "120px" : "240px", backgroundColor: "var(--bg-hover)", position: "relative", overflow: "hidden", borderBottom: "0.5px solid var(--border-hairline)", }}>
              {user.banner_url ? <img src={user.banner_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ width: "100%", height: "100%", backgroundColor: "var(--bg-hover)" }} />}
            </div>

            <div style={{
              padding: isMobile ? "0 16px" : "0 24px", position: "relative", marginTop: isMobile ? "-40px" : "-60px", marginBottom: "8px",
            }}>
              <div onClick={() => { setLightboxImage(avatarUrl); setLightboxOpen(true); }} style={{ width: isMobile ? "80px" : "100px", height: isMobile ? "80px" : "100px", borderRadius: "var(--radius-sm)", cursor: "pointer", marginBottom: "16px", position: "relative", }} >
                <AvailabilityBadge avatarUrl={avatarUrl} name={user.name} size={isMobile ? 80 : 100} isOpenToOpportunities={user.is_pro === true && user.is_hirable === true} isOG={user.is_og} isOnline={user.is_online} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: isMobile ? "-48px" : "-45px", marginBottom: isMobile ? "24px" : "16px", flexWrap: "wrap" }}>
                {isSignedIn && (
                  <button onClick={handleFollow} disabled={followLoading} style={{ padding: "8px 24px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600, border: isFollowing ? "1px solid var(--border-hairline)" : "none", backgroundColor: isFollowing ? "var(--bg-page)" : "var(--text-primary)", color: isFollowing ? "var(--text-primary)" : "var(--bg-page)", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => { if (isFollowing) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; else e.currentTarget.style.opacity = "0.9"; }} onMouseLeave={(e) => { if (isFollowing) e.currentTarget.style.backgroundColor = "var(--bg-page)"; else e.currentTarget.style.opacity = "1"; }} >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
                <button
                  onClick={handleMessage}
                  style={{
                    padding: "10px",
                    borderRadius: "100px",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "1px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-page)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
                >
                  <HugeiconsIcon icon={Chat01Icon} size={18} />
                </button>
                <button onClick={() => setIsIDCardModalOpen(true)} style={{ padding: "8px", borderRadius: "100px", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", color: "var(--text-primary)", cursor: "pointer" }} >
                  <HugeiconsIcon icon={IdentityCardIcon} size={20} />
                </button>
              </div>

              <div style={{ marginTop: "16px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  {user.name}
                  <VerifiedBadge username={user.username} isPro={user.is_pro} size="18px" />
                  <OfficialAccountBadge username={user.username} size="18px" />
                </h1>
                <p style={{ color: "var(--text-tertiary)", fontSize: "14px", marginBottom: "0" }}>@{user.username}</p>
                <div style={{ marginTop: "4px" }}>
                  {user.bio && <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 8px 0" }}><BioRenderer bio={user.bio} /></p>}
                </div>

                <div style={{ display: "flex", gap: "16px", color: "var(--text-tertiary)", fontSize: "14px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {user.location && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><HugeiconsIcon icon={Location01Icon} size={16} /> {user.location}</span>}
                  {user.website_url && (
                    <a
                      href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", textDecoration: "none" }}
                    >
                      <HugeiconsIcon icon={Link01Icon} size={16} />
                      {user.website_url.replace(/https?:\/\//, "")}
                    </a>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><HugeiconsIcon icon={Calendar03Icon} size={16} /> Joined {formatProfileJoinDate(user.created_at || "")}</span>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px" }}>
                  {user.github_url && <a href={user.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="GitHub"> <HugeiconsIcon icon={GithubIcon} size={20} /> </a>}
                  {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="LinkedIn"> <HugeiconsIcon icon={Linkedin01Icon} size={20} /> </a>}
                  {user.twitter_url && <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="Twitter"> <HugeiconsIcon icon={NewTwitterIcon} size={20} /> </a>}
                  {user.instagram_url && <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="Instagram"> <HugeiconsIcon icon={InstagramIcon} size={20} /> </a>}
                </div>

                {user.skills && user.skills.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px", }}>
                    {user.skills.map((skill, index) => (
                      <span key={index} style={{ fontSize: "12px", fontWeight: 600, padding: "6px 14px", backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }} >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" }}>
                  <button onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", color: "var(--text-primary)" }}> <span style={{ fontWeight: 700 }}>{user.follower_count || 0}</span> <span style={{ color: "var(--text-tertiary)" }}>Followers</span> </button>
                  <button onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", color: "var(--text-primary)" }}> <span style={{ fontWeight: 700 }}>{user.following_count || 0}</span> <span style={{ color: "var(--text-tertiary)" }}>Following</span> </button>
                  <div style={{ fontSize: "14px", color: "var(--text-primary)" }}> <span style={{ fontWeight: 700 }}>{user.contribution_count || 0}</span> <span style={{ color: "var(--text-tertiary)" }}>Contributions</span> </div>
                </div>

                {/* Performance Section */}
                {!profileLoading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0", marginTop: "0px" }}>
                    {/* GitHub Contributions Graph */}
                    {user?.github_url && (
                        <div style={{ marginTop: "16px" }}>
                            <GitHubContributions githubUrl={user.github_url} />
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            <div style={{ width: "100%", marginTop: "0px" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: "12px", padding: isMobile ? "0 16px" : "0 24px" }}>
                <div ref={tabsRef} className="tabs-row" style={{ display: "flex", overflowX: "auto", flex: 1, gap: "24px", padding: 0, msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                  <style>{`
                    .tabs-row::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {[{ id: "posts", icon: LicenseIcon, label: "Posts" }, { id: "projects", icon: Rocket01Icon, label: "Projects" }, { id: "dashboard", icon: Chart01Icon, label: "Dashboard" }, { id: "startups", icon: Building02Icon, label: "Startups" }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0", backgroundColor: "transparent", border: "none", color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)", fontSize: "13px", fontWeight: activeTab === tab.id ? 700 : 500, cursor: "pointer", transition: "all 0.15s ease", flexShrink: 0 }} >
                      <HugeiconsIcon icon={tab.icon} size={18} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ minHeight: "400px" }}>
                {activeTab === "posts" ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {postsLoading ? <div className="skeleton-pulse" style={{ height: "100px", borderRadius: "var(--radius-sm)" }} /> : posts.length === 0 ? (<div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}> <HugeiconsIcon icon={Rocket01Icon} size={40} style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} /> <p style={{ fontWeight: 500, fontSize: "14px" }}>No posts yet</p> </div>) : ([...posts].sort((a, b) => { if (user.pinned_post_id === a.id) return -1; if (user.pinned_post_id === b.id) return 1; return 0; }).map(p => (<div key={p.id} style={{ position: "relative" }}> {user.pinned_post_id === p.id && (<div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}> <HugeiconsIcon icon={PinIcon} size={14} /> Pinned post </div>)} <PostCard post={p} onUpdated={fetchUserPosts} /> </div>)))}
                  </div>
                ) : activeTab === "startups" ? (
                  <div className="tab-content-enter">
                    {loadingStartups ? <div className="skeleton-pulse" style={{ height: "140px", borderRadius: "var(--radius-sm)" }} /> : startups.length === 0 ? (<div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}> <HugeiconsIcon icon={Building02Icon} size={40} style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} /> <p style={{ fontWeight: 500, fontSize: "14px" }}>No startups yet</p> </div>) : (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}> {startups.map((s) => (<StartupCard key={s.id} startup={s} />))} </div>)}
                  </div>
                ) : activeTab === "dashboard" ? (
                  <div className="tab-content-enter">
                    <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: isMobile ? "0" : "12px" }}>
                      {/* Stats Grid */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                        gap: "1px",
                        backgroundColor: "#E5E7EB",
                        border: "0.5px solid #E5E7EB",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}>
                        <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", backgroundColor: "#F6F8F8", display: "flex", flexDirection: "column", gap: "4px", transition: "background-color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#EDEFF0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#F6F8F8"}>
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Level</span>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: "#111", letterSpacing: "-0.03em", lineHeight: 1 }}><AnimatedCounter end={user.level || 1} duration={1000} /></span>
                        </div>
                        <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", backgroundColor: "#F6F8F8", display: "flex", flexDirection: "column", gap: "4px", transition: "background-color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#EDEFF0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#F6F8F8"}>
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Total XP</span>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: "#111", letterSpacing: "-0.03em", lineHeight: 1 }}><AnimatedCounter end={user.xp || 0} duration={1200} /></span>
                        </div>
                        <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", backgroundColor: "#F6F8F8", display: "flex", flexDirection: "column", gap: "4px", transition: "background-color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#EDEFF0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#F6F8F8"}>
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Rank</span>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#111", lineHeight: 1.3 }}>{(user.level || 1) > 10 ? "Senior" : "Associate"}</span>
                        </div>
                        <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", backgroundColor: "#F6F8F8", display: "flex", flexDirection: "column", gap: "4px", transition: "background-color 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#EDEFF0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#F6F8F8"}>
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Streak</span>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: "#111", letterSpacing: "-0.03em", lineHeight: 1, display: "flex", alignItems: "center", gap: "4px" }}>{user.streak_count || 0}<img src={flameGif} alt="streak" style={{ width: "18px", height: "18px", objectFit: "contain" }} /></span>
                        </div>
                      </div>

                      {/* HeatMap */}
                      <div style={{ backgroundColor: "var(--bg-page)", borderRadius: "12px", border: "0.5px solid var(--border-hairline)", padding: "24px" }}>
                        <div style={{ marginBottom: "16px", borderBottom: "0.5px solid var(--border-hairline)", paddingBottom: "16px" }}>
                          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Activity Insight</h3>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-tertiary)" }}>Track consistency and contributions.</p>
                        </div>
                        <HeatMap userId={user.id} githubUrl={user.github_url} standalone />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {projectsLoading ? <div className="skeleton-pulse" style={{ height: "100px", borderRadius: "var(--radius-sm)" }} /> : projects.length === 0 ? (<div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}> <HugeiconsIcon icon={Grid02Icon} size={40} style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} /> <p style={{ fontWeight: 500, fontSize: "14px" }}>No projects yet</p> </div>) : ([...projects].sort((a, b) => { if (user.pinned_project_id === a.id) return -1; if (user.pinned_project_id === b.id) return 1; return 0; }).map(p => (<div key={p.id} style={{ position: "relative" }}> {user.pinned_project_id === p.id && (<div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}> <HugeiconsIcon icon={PinIcon} size={14} /> Pinned project </div>)} <ProjectCard project={p} onUpdated={fetchUserProjects} isPinned={user.pinned_project_id === p.id} /> </div>)))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isDesktop && (<aside style={{ width: "300px", position: "sticky", top: 0, height: "100vh", flexShrink: 0, zIndex: 1, display: "flex", flexDirection: "column" }}> <RecommendedUsersSidebar /> </aside>)}
        </div>

        {user?.id && (<FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={user.id} type={followersModalType} title={followersModalType === "followers" ? "Followers" : "Following"} />)}
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageSrc={lightboxImage}
          postUrl={user ? `${window.location.origin}/${user.username}` : undefined}
          author={user ? {
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url
          } : undefined}
        />
        <ToastContainer position="bottom-right" theme="dark" hideProgressBar />

        {user && (
          <DeveloperIDCardModal isOpen={isIDCardModalOpen} onClose={() => setIsIDCardModalOpen(false)} user={{ name: user.name, username: user.username, avatar_url: user.avatar_url, created_at: user.created_at, skills: user.skills || [], is_pro: user.is_pro || false, bio: user.bio || "" }} projectsCount={projects.length} />
        )}
        <style>{`
        @media (max-width: 768px) {
          main { padding-top: 64px !important; padding-bottom: 100px !important; }
        }
      `}</style>
      </main>
    </>
  );
}
