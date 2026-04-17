import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { useAvatar } from "../hooks/useAvatar";
import CreatePostModal from "./CreatePostModal";
import ProjectModal from "./ProjectModal";
import { useNotifications } from "../hooks/useNotifications";
import { useFaviconNotification } from "../hooks/useFaviconNotification";
import api from "../api/axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Search01Icon,
  Chat01Icon,
  Rocket01Icon,
  UserIcon,
  Notification01Icon,
  PlusSignIcon,
  Logout03Icon,
  MoreHorizontalIcon,
  Login03Icon,
  UserGroupIcon,
  Sun01Icon,
  Moon02Icon,
  DocumentCodeIcon,
  Building02Icon,
  MedalIcon,
  Chart01Icon
} from "@hugeicons/core-free-icons";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/icon-removebg.png";
import logoWhite from "../assets/logo-white.png";
import DeveloperIDCardModal from "./DeveloperIDCardModal";
import StreakBadge from "./StreakBadge";
import AvailabilityBadge from "./AvailabilityBadge";

const StatusBadge = () => {
  const [activeCount, setActiveCount] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }));

  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const { data } = await api.get("/users/active/count");
        setActiveCount(data?.count || 1);
      } catch (e) {
        setActiveCount(1);
      }
    };

    fetchActiveCount();
    const countInterval = setInterval(fetchActiveCount, 30000);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    }, 1000);

    return () => {
      clearInterval(countInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", justifyContent: "center", flexWrap: "nowrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00BA7C", boxShadow: "0 0 8px rgba(0, 186, 124, 0.4)" }} />
        <span style={{ fontSize: "10px", fontWeight: 'bold', color: "var(--text-tertiary)", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          {activeCount} builders now
        </span>
      </div>
      <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
      <span style={{ fontSize: "10px", fontWeight: 'bold', color: "var(--text-tertiary)", opacity: 0.6, whiteSpace: "nowrap" }}>
        {currentTime}
      </span>
    </div>
  );
};

export default function Navbar() {
  const { isSignedIn, user } = useClerkUser();
  const { signOut } = useClerkAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPostSelectorOpen, setIsPostSelectorOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { unreadCount, messageUnreadCount } = useNotifications();
  const [profile, setProfile] = useState<any>(null);
  const [projectsCount, setProjectsCount] = useState(0);
  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const { getToken } = useClerkAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (isSignedIn && user?.id) {
        try {
          const token = await getToken();
          const [userRes, projectsRes] = await Promise.all([
            api.get(`/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            api.get(`/projects/user/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setProfile(userRes.data);
          setProjectsCount(projectsRes.data?.length || 0);
        } catch (err) {
          console.error("Navbar profile fetch failed", err);
        }
      }
    };
    fetchProfile();
  }, [isSignedIn, user?.id, getToken]);

  useFaviconNotification(unreadCount + messageUnreadCount, '/icon.png');

  const { avatarUrl: userAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    profile?.name || user?.fullName || "User"
  );

  const logoutRef = useRef<HTMLDivElement>(null);
  const postSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setIsLogoutOpen(false);
      }
      if (postSelectorRef.current && !postSelectorRef.current.contains(event.target as Node)) {
        setIsPostSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkStyle = (path: string) => {
    const isActive = location.pathname === path;
    const isUltraShort = !isMobile && window.innerHeight < 850;

    return {
      display: "flex",
      alignItems: "center",
      gap: isUltraShort ? "10px" : "14px",
      padding: isUltraShort ? "8px 14px" : "11px 18px",
      borderRadius: "14px",
      textDecoration: "none",
      color: "var(--text-primary)",
      backgroundColor: "transparent",
      fontWeight: "700",
      fontSize: isUltraShort ? "14px" : "15px",
      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: isUltraShort ? "2px" : "4px",
      opacity: isActive ? 1 : 0.65,
    };
  };

  const SidebarContent = () => (
    <div className="no-scrollbar" style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      padding: "0 16px",
      overflowY: "auto",
      overflowX: "hidden"
    }}>
      <div style={{ padding: window.innerHeight < 850 ? "16px 12px 12px" : "32px 12px 24px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "32px", width: "auto" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "19px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>Codeown.space</span>
          </div>
        </Link>
      </div>

      <nav style={{ flexShrink: 0, marginTop: window.innerHeight < 850 ? "4px" : "0px" }}>
        <Link to="/" style={linkStyle("/")}><HugeiconsIcon icon={Home01Icon} size={20} /><span>Home</span></Link>
        <Link to="/search" style={linkStyle("/search")}><HugeiconsIcon icon={Search01Icon} size={20} /><span>Search</span></Link>
        <Link to="/leaderboard" style={linkStyle("/leaderboard")}><HugeiconsIcon icon={UserGroupIcon} size={20} /><span>Builders</span></Link>
        <Link to="/ogs" style={linkStyle("/ogs")}><HugeiconsIcon icon={MedalIcon} size={20} /><span>Our OGs</span></Link>
        <Link to="/dashboard" style={linkStyle("/dashboard")}><HugeiconsIcon icon={Chart01Icon} size={20} /><span>Analytics</span></Link>
        <Link to="/startups" style={linkStyle("/startups")}><HugeiconsIcon icon={Building02Icon} size={20} /><span>Startups</span></Link>
        <Link to="/changelog" style={linkStyle("/changelog")}><HugeiconsIcon icon={DocumentCodeIcon} size={20} /><span>Changelog</span></Link>

        {isSignedIn && (
          <div style={{ marginTop: window.innerHeight < 850 ? "10px" : "20px", paddingTop: window.innerHeight < 850 ? "10px" : "20px", borderTop: "1px solid var(--border-hairline)" }}>
            <Link to="/messages" style={linkStyle("/messages")}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <HugeiconsIcon icon={Chat01Icon} size={20} />
                {messageUnreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: "16px", height: "16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", borderRadius: "50%", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{messageUnreadCount}</span>}
              </div>
              <span>Messages</span>
            </Link>
            <Link to="/notifications" style={linkStyle("/notifications")}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <HugeiconsIcon icon={Notification01Icon} size={20} />
                {unreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: "16px", height: "16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", borderRadius: "50%", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{unreadCount}</span>}
              </div>
              <span>Notifications</span>
            </Link>
            <div
              style={{ position: "relative", marginBottom: "4px" }}
              ref={postSelectorRef}
            >
              <div
                onClick={() => setIsPostSelectorOpen(!isPostSelectorOpen)}
                style={{ ...linkStyle(""), cursor: "pointer", marginBottom: 0 }}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={20} />
                <span>Post</span>
              </div>

              {isPostSelectorOpen && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  right: 0,
                  marginBottom: "8px",
                  backgroundColor: "var(--bg-page)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "18px",
                  padding: "6px",
                  zIndex: 2200,
                  animation: "reactionFadeUpSimple 0.15s ease-out"
                }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setIsPostSelectorOpen(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderRadius: "12px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", transition: "all 0.15s ease" }}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={16} /> <span style={{ color: "var(--text-primary)" }}>Add post</span>
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); setIsProjectModalOpen(true); setIsPostSelectorOpen(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderRadius: "12px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", transition: "all 0.15s ease" }}
                  >
                    <HugeiconsIcon icon={Rocket01Icon} size={16} /> <span style={{ color: "var(--text-primary)" }}>Launch project</span>
                  </div>
                </div>
              )}
            </div>
            <div onClick={() => { const username = profile?.username || user?.username; if (username) navigate(`/${username}`); }} style={{ ...linkStyle("/profile"), cursor: "pointer" }}><HugeiconsIcon icon={UserIcon} size={20} /><span>Your Profile</span></div>
          </div>
        )}
      </nav>

      <div style={{ flex: 1 }}></div>

      <div style={{ padding: window.innerHeight < 850 ? "12px 0" : "24px 0" }}>
        {isSignedIn && user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "20px", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-hairline)", cursor: "pointer" }} onClick={() => navigate(`/${profile?.username || user.username}`)}>
            <AvailabilityBadge avatarUrl={userAvatarUrl || user.imageUrl} name={profile?.name || user.fullName || "User"} size={38} isOpenToOpportunities={profile?.is_hirable === true} isOG={profile?.is_og} username={profile?.username || user?.username} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.name || user.fullName || "User"}</div>
              <div style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 600 }}>@{profile?.username || user.username}</div>
            </div>
            <div ref={logoutRef} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <button onClick={(e) => { e.stopPropagation(); toggleTheme(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "6px" }}>{theme === 'light' ? <HugeiconsIcon icon={Moon02Icon} size={18} /> : <HugeiconsIcon icon={Sun01Icon} size={18} />}</button>
              <div style={{ position: "relative" }}>
                <button onClick={(e) => { e.stopPropagation(); setIsLogoutOpen(!isLogoutOpen); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "6px" }}><HugeiconsIcon icon={MoreHorizontalIcon} size={18} /></button>
                {isLogoutOpen && (
                  <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: "12px", backgroundColor: "var(--bg-page)", border: "1px solid var(--border-hairline)", borderRadius: "16px", padding: "6px", minWidth: "160px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                    <button onClick={() => signOut()} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px", background: "none", border: "none", color: "#ef4444", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}><HugeiconsIcon icon={Logout03Icon} size={18} /> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/sign-in" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", padding: "16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", border: "none", borderRadius: "16px", fontWeight: 800, cursor: "pointer", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><HugeiconsIcon icon={Login03Icon} size={20} /> Sign In</button>
          </Link>
        )}

        {/* System Status */}
        <div style={{ padding: "0 10px", display: "flex", justifyContent: "center" }}>
          <StatusBadge />
        </div>

        {/* Footer Links */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          padding: "0 10px",
          textAlign: "center"
        }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            color: "var(--text-tertiary)",
            opacity: 0.6
          }}>
            <Link to="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
            <span>•</span>
            <Link to="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
            <span>•</span>
            <Link to="/about" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
            <span>•</span>
            <Link to="/founder-story" style={{ color: "inherit", textDecoration: "none" }}>Founder</Link>
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-tertiary)",
            opacity: 0.4,
            marginTop: "-9px",
            letterSpacing: "0.02em"
          }}>
            © {new Date().getFullYear()} Codeown
          </div>
        </div>

      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <>
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        <nav style={{ width: width < 1024 ? "240px" : "280px", height: "100vh", position: "sticky", top: 0, borderRight: "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)", zIndex: 1000 }}>
          <SidebarContent />
        </nav>
        <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
        <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => { }} />
      </>
    );
  }

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", backgroundColor: "var(--bg-page)", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 2000 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "24px", width: "auto" }} />
          <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Codeown</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "8px" }}>{theme === 'light' ? <HugeiconsIcon icon={Moon02Icon} size={20} /> : <HugeiconsIcon icon={Sun01Icon} size={20} />}</button>
          {isSignedIn && <div onClick={() => setIsIDCardOpen(true)} style={{ padding: "4px", cursor: "pointer" }}><StreakBadge count={profile?.streak_count || 0} /></div>}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--bg-page)", borderTop: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 8px env(safe-area-inset-bottom, 16px) 8px", height: "calc(64px + env(safe-area-inset-bottom, 0px))", zIndex: 2000 }}>
        <Link to="/" style={{ flex: 1, display: "flex", justifyContent: "center", color: location.pathname === "/" ? "var(--text-primary)" : "var(--text-tertiary)" }}><HugeiconsIcon icon={Home01Icon} size={22} /></Link>
        <Link to="/search" style={{ flex: 1, display: "flex", justifyContent: "center", color: location.pathname === "/search" ? "var(--text-primary)" : "var(--text-tertiary)" }}><HugeiconsIcon icon={Search01Icon} size={22} /></Link>

        <div onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", color: isCreateMenuOpen ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <HugeiconsIcon icon={PlusSignIcon} size={26} style={{ transform: isCreateMenuOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          {isCreateMenuOpen && (
            <div style={{ position: "absolute", bottom: "80px", left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--bg-page)", border: "1px solid var(--border-hairline)", borderRadius: "24px", padding: "10px", minWidth: "220px", zIndex: 2001, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
              <style>{`.mobile-menu-item { padding: 12px 16px; display: flex; alignItems: center; gap: 12px; cursor: pointer; color: var(--text-primary); font-weight: 700; font-size: 15px; border-radius: 16px; transition: all 0.2s; } .mobile-menu-item:active { background: var(--bg-hover); transform: scale(0.98); }`}</style>
              <div className="mobile-menu-item" onClick={() => { setIsCreateMenuOpen(false); setIsModalOpen(true); }}><HugeiconsIcon icon={PlusSignIcon} size={18} /> Add post</div>
              <div className="mobile-menu-item" onClick={() => { setIsCreateMenuOpen(false); setIsProjectModalOpen(true); }}><HugeiconsIcon icon={Rocket01Icon} size={18} /> Launch project</div>
              <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", margin: "8px 0" }} />
              <div className="mobile-menu-item" onClick={() => { setIsCreateMenuOpen(false); navigate("/startups"); }} style={{ fontSize: "14px" }}><HugeiconsIcon icon={Building02Icon} size={18} /> Startups Hub</div>
              <div className="mobile-menu-item" onClick={() => { setIsCreateMenuOpen(false); navigate("/dashboard"); }} style={{ fontSize: "14px" }}><HugeiconsIcon icon={Chart01Icon} size={18} /> Analytics</div>
              <div className="mobile-menu-item" onClick={() => { setIsCreateMenuOpen(false); navigate("/ogs"); }} style={{ fontSize: "14px" }}><HugeiconsIcon icon={MedalIcon} size={18} /> Our OGs</div>
              <div className="mobile-menu-item" onClick={() => { setIsCreateMenuOpen(false); navigate("/changelog"); }} style={{ fontSize: "14px" }}><HugeiconsIcon icon={DocumentCodeIcon} size={18} /> Changelog</div>
            </div>
          )}
        </div>

        <Link to="/messages" style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", color: location.pathname === "/messages" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <HugeiconsIcon icon={Chat01Icon} size={22} />
          {messageUnreadCount > 0 && <span style={{ position: "absolute", top: "14px", right: "15%", minWidth: "16px", height: "16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", fontSize: "9px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{messageUnreadCount}</span>}
        </Link>

        <Link to="/notifications" style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", color: location.pathname === "/notifications" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <HugeiconsIcon icon={Notification01Icon} size={22} />
          {unreadCount > 0 && <span style={{ position: "absolute", top: "14px", right: "15%", minWidth: "16px", height: "16px", backgroundColor: "var(--text-primary)", color: "var(--bg-page)", fontSize: "9px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{unreadCount}</span>}
        </Link>

        <Link to={(profile?.username || user?.username) ? `/${profile?.username || user?.username}` : "/profile"} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {userAvatarUrl ? <img src={userAvatarUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", border: location.pathname.includes('/profile') || (profile?.username && location.pathname.includes(profile.username)) ? "1.5px solid var(--text-primary)" : "1px solid var(--border-hairline)", objectFit: "cover" }} /> : <HugeiconsIcon icon={UserIcon} size={22} />}
        </Link>
      </div>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => { }} />
      {isSignedIn && profile && (
        <DeveloperIDCardModal
          isOpen={isIDCardOpen}
          onClose={() => setIsIDCardOpen(false)}
          user={{
            name: profile.name || user?.fullName || "Developer",
            username: profile.username || user?.username || null,
            avatar_url: profile.avatar_url || user?.imageUrl || null,
            created_at: profile.created_at || null,
            skills: profile.skills || [],
            is_pro: profile.is_pro || false,
            bio: profile.bio || null
          }}
          projectsCount={projectsCount}
        />
      )}
    </>
  );
}
