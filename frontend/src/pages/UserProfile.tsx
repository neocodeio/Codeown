import { useState, useEffect } from "react";
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
import {
  Calendar,
  Rocket,
  Buildings,
  SquaresFour,
  PushPin,
  MapPin,
  Link,
  IdentificationCard,
  FileText,
  GithubLogo,
  TwitterLogo,
  LinkedinLogo,
  InstagramLogo
} from "phosphor-react";
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
import { StartupCard } from "../components/StartupCard";
import { getStartups } from "../api/startups";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "startups">("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

  // 1. Core Profile Query
  const param = userId || username;
  const { data: user, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", param],
    queryFn: async () => {
      const token = await getToken();
      const userRes = await api.get(`/users/${param}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return userRes.data as User;
    },
    enabled: !!param,
    staleTime: 5 * 60 * 1000,
  });

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

  if (profileLoading) return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="skeleton-pulse" style={{ width: "100%", height: "200px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)" }} />
        <style>{`
          .skeleton-pulse { background-color: var(--bg-hover); opacity: 0.6; animation: skeleton-pulse-anim 2s infinite ease-in-out; }
          @keyframes skeleton-pulse-anim { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
        `}</style>
      </div>
    </main>
  );

  if (!user) return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", color: "var(--text-primary)" }}>User not found</h2>
        <button onClick={() => navigate("/feed")} style={{ marginTop: "16px", padding: "8px 16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>Back to Feed</button>
      </div>
    </main>
  );

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
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
          <div style={{ width: isDesktop ? "var(--feed-width)" : "100%", maxWidth: isDesktop ? "var(--feed-width)" : "700px", margin: isDesktop ? "0" : "0 auto", flexShrink: 0, borderLeft: (isMobile || !isDesktop) ? "none" : "0.5px solid var(--border-hairline)", borderRight: (isDesktop && !isMobile) ? "0.5px solid var(--border-hairline)" : "none", backgroundColor: "var(--bg-page)", minHeight: "100vh", position: "relative", }}>
            <div style={{ width: "100%", height: isMobile ? "120px" : "240px", backgroundColor: "var(--bg-hover)", position: "relative", overflow: "hidden", borderBottom: "0.5px solid var(--border-hairline)", }}>
              {user.banner_url ? <img src={user.banner_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ width: "100%", height: "100%", backgroundColor: "var(--bg-hover)" }} />}
            </div>

            <div style={{ padding: isMobile ? "0 16px" : "0 24px", position: "relative", marginTop: isMobile ? "-40px" : "-50px", marginBottom: "24px", }}>
              <div onClick={() => { setLightboxImage(avatarUrl); setLightboxOpen(true); }} style={{ width: isMobile ? "80px" : "100px", height: isMobile ? "80px" : "100px", borderRadius: "var(--radius-sm)", cursor: "pointer", marginBottom: "16px", position: "relative", }} >
                <AvailabilityBadge avatarUrl={avatarUrl} name={user.name} size={isMobile ? 80 : 100} isOpenToOpportunities={user.is_pro === true && user.is_hirable === true} isOG={user.is_og} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: isMobile ? "-48px" : "-56px", marginBottom: isMobile ? "24px" : "16px", flexWrap: "wrap" }}>
              {isSignedIn && (
                <button onClick={handleFollow} disabled={followLoading} style={{ padding: "8px 24px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600, border: isFollowing ? "1px solid var(--border-hairline)" : "none", backgroundColor: isFollowing ? "var(--bg-page)" : "var(--text-primary)", color: isFollowing ? "var(--text-primary)" : "var(--bg-page)", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => { if (isFollowing) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; else e.currentTarget.style.opacity = "0.9"; }} onMouseLeave={(e) => { if (isFollowing) e.currentTarget.style.backgroundColor = "var(--bg-page)"; else e.currentTarget.style.opacity = "1"; }} >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
              <button onClick={() => setIsIDCardModalOpen(true)} style={{ padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", color: "var(--text-primary)", cursor: "pointer" }} >
                <IdentificationCard size={20} />
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                {user.name}
                <VerifiedBadge username={user.username} isPro={user.is_pro} size="18px" />
              </h1>
              <p style={{ color: "var(--text-tertiary)", fontSize: "14px", marginBottom: "12px" }}>@{user.username}</p>
              {user.bio && <p style={{ fontSize: "15px", lineHeight: 1.5, marginBottom: "16px" }}>{user.bio}</p>}
              
              <div style={{ display: "flex", gap: "16px", color: "var(--text-tertiary)", fontSize: "13px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
                {user.location && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={16} /> {user.location}</span>}
                {user.website_url && (
                  <a 
                    href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", textDecoration: "none" }}
                  >
                    <Link size={16} /> 
                    {user.website_url.replace(/https?:\/\//, "")}
                  </a>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={16} /> Joined {formatProfileJoinDate(user.created_at || "")}</span>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
                {user.github_url && <a href={user.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="GitHub"> <GithubLogo size={20} weight="thin" /> </a>}
                {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="LinkedIn"> <LinkedinLogo size={20} weight="thin" /> </a>}
                {user.twitter_url && <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="Twitter"> <TwitterLogo size={20} weight="thin" /> </a>}
                {user.instagram_url && <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"} aria-label="Instagram"> <InstagramLogo size={20} weight="thin" /> </a>}
              </div>

              {user.skills && user.skills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px", }}>
                  {user.skills.map((skill, index) => (
                    <span key={index} style={{ fontSize: "12px", fontWeight: 600, padding: "6px 14px", backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }} >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", color: "var(--text-primary)" }}> <span style={{ fontWeight: 700 }}>{user.follower_count || 0}</span> <span style={{ color: "var(--text-tertiary)" }}>Followers</span> </button>
                <button onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", color: "var(--text-primary)" }}> <span style={{ fontWeight: 700 }}>{user.following_count || 0}</span> <span style={{ color: "var(--text-tertiary)" }}>Following</span> </button>
                <div style={{ fontSize: "14px", color: "var(--text-primary)" }}> <span style={{ fontWeight: 700 }}>{user.contribution_count || 0}</span> <span style={{ color: "var(--text-tertiary)" }}>Contributions</span> </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "32px", marginBottom: "40px" }}>
            <HeatMap userId={user.id} githubUrl={user.github_url} />
          </div>

          <div className="tabs-row" style={{ display: "flex", overflowX: "auto", borderBottom: "0.5px solid var(--border-hairline)", marginBottom: "32px", gap: "24px", padding: isMobile ? "0 16px" : "0 24px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {[ { id: "posts", icon: FileText, label: "Posts" }, { id: "projects", icon: SquaresFour, label: "Projects" }, { id: "startups", icon: Buildings, label: "Startups" } ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0", backgroundColor: "transparent", border: "none", color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)", fontSize: "13px", fontWeight: activeTab === tab.id ? 700 : 500, cursor: "pointer", transition: "all 0.15s ease", flexShrink: 0 }} >
                <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "thin"} />
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ minHeight: "400px" }}>
            {activeTab === "posts" ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {postsLoading ? <div className="skeleton-pulse" style={{ height: "100px", borderRadius: "var(--radius-sm)" }} /> : posts.length === 0 ? ( <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}> <Rocket size={40} weight="thin" style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} /> <p style={{ fontWeight: 500, fontSize: "14px" }}>No posts yet</p> </div> ) : ( [...posts].sort((a, b) => { if (user.pinned_post_id === a.id) return -1; if (user.pinned_post_id === b.id) return 1; return 0; }).map(p => ( <div key={p.id} style={{ position: "relative" }}> {user.pinned_post_id === p.id && ( <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}> <PushPin size={14} weight="regular" /> Pinned post </div> )} <PostCard post={p} onUpdated={fetchUserPosts} /> </div> )) )}
              </div>
            ) : activeTab === "startups" ? (
              <div className="tab-content-enter">
                {loadingStartups ? <div className="skeleton-pulse" style={{ height: "140px", borderRadius: "var(--radius-sm)" }} /> : startups.length === 0 ? ( <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}> <Buildings size={40} weight="thin" style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} /> <p style={{ fontWeight: 500, fontSize: "14px" }}>No startups yet</p> </div> ) : ( <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}> {startups.map((s) => ( <StartupCard key={s.id} startup={s} /> ))} </div> )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {projectsLoading ? <div className="skeleton-pulse" style={{ height: "100px", borderRadius: "var(--radius-sm)" }} /> : projects.length === 0 ? ( <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-tertiary)" }}> <SquaresFour size={40} weight="thin" style={{ opacity: 0.1, marginBottom: "16px", display: "block", margin: "0 auto" }} /> <p style={{ fontWeight: 500, fontSize: "14px" }}>No projects yet</p> </div> ) : ( [...projects].sort((a, b) => { if (user.pinned_project_id === a.id) return -1; if (user.pinned_project_id === b.id) return 1; return 0; }).map(p => ( <div key={p.id} style={{ position: "relative" }}> {user.pinned_project_id === p.id && ( <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}> <PushPin size={14} weight="regular" /> Pinned project </div> )} <ProjectCard project={p} onUpdated={fetchUserProjects} /> </div> )) )}
              </div>
            )}
          </div>
        </div>

        {isDesktop && !isMobile && ( <aside style={{ width: "340px", position: "sticky", top: 0, height: "100vh", flexShrink: 0, zIndex: 1, overflowY: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}> <RecommendedUsersSidebar /> </aside> )}
      </div>

      {user?.id && ( <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={user.id} type={followersModalType} title={followersModalType === "followers" ? "Followers" : "Following"} /> )}
      <Lightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} imageSrc={lightboxImage} />
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
