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
  UserGroupIcon,
  Sun03Icon,
  Moon02Icon,
  DocumentCodeIcon,
  Building02Icon,
  MedalIcon,
  Chart01Icon,
  ArrowRight02Icon
} from "@hugeicons/core-free-icons";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/icon-removebg.png";
import logoWhite from "../assets/logo-white.png";
import StreakBadge from "./StreakBadge";

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
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPostSelectorOpen, setIsPostSelectorOpen] = useState(false);
  const { unreadCount, messageUnreadCount } = useNotifications();
  const [profile, setProfile] = useState<any>(null);
  const { getToken } = useClerkAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (isSignedIn && user?.id) {
        try {
          const token = await getToken();
          const res = await api.get(`/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfile(res.data);
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

  const postSelectorRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide if scrolling down more than 100px, show if scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    if (isMobile) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  const handleSilentNavigate = (path: string) => {
    const username = profile?.username || user?.username;
    const isTargetProfile = path === "/profile" || (username && path === `/${username}`);
    const isCurrentProfile = location.pathname === "/profile" || (username && location.pathname === `/${username}`);

    if (location.pathname === path || (isTargetProfile && isCurrentProfile)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
      fontWeight: isActive ? "800" : "400",
      fontSize: isUltraShort ? "14px" : "15px",
      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: isUltraShort ? "8px" : "4px",
      opacity: isActive ? 1 : 0.8,
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
        <div onClick={() => handleSilentNavigate("/")} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", cursor: "pointer" }}>
          <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "32px", width: "auto" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>Codeown.space</span>
          </div>
        </div>
      </div>

      <nav style={{ flexShrink: 0, marginTop: window.innerHeight < 850 ? "4px" : "0px" }}>
        <div onClick={() => handleSilentNavigate("/")} className="sidebar-nav-link" style={{ ...linkStyle("/"), cursor: "pointer" }}><HugeiconsIcon icon={Home01Icon} size={20} /><span>Home</span></div>
        <div onClick={() => handleSilentNavigate("/search")} className="sidebar-nav-link" style={{ ...linkStyle("/search"), cursor: "pointer" }}><HugeiconsIcon icon={Search01Icon} size={20} /><span>Search</span></div>
        <div onClick={() => handleSilentNavigate("/leaderboard")} className="sidebar-nav-link" style={{ ...linkStyle("/leaderboard"), cursor: "pointer" }}><HugeiconsIcon icon={UserGroupIcon} size={20} /><span>Builders</span></div>
        <div onClick={() => handleSilentNavigate("/ogs")} className="sidebar-nav-link" style={{ ...linkStyle("/ogs"), cursor: "pointer" }}><HugeiconsIcon icon={MedalIcon} size={20} /><span>Our OGs</span></div>
        <div onClick={() => handleSilentNavigate("/dashboard")} className="sidebar-nav-link" style={{ ...linkStyle("/dashboard"), cursor: "pointer" }}><HugeiconsIcon icon={Chart01Icon} size={20} /><span>Analytics</span></div>
        <div onClick={() => handleSilentNavigate("/startups")} className="sidebar-nav-link" style={{ ...linkStyle("/startups"), cursor: "pointer" }}><HugeiconsIcon icon={Building02Icon} size={20} /><span>Startups</span></div>
        <div onClick={() => handleSilentNavigate("/changelog")} className="sidebar-nav-link" style={{ ...linkStyle("/changelog"), cursor: "pointer" }}><HugeiconsIcon icon={DocumentCodeIcon} size={20} /><span>Changelog</span></div>

        {isSignedIn && (
          <div style={{ marginTop: "4px" }}>
            <div onClick={() => handleSilentNavigate("/messages")} className="sidebar-nav-link" style={{ ...linkStyle("/messages"), cursor: "pointer" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <HugeiconsIcon icon={Chat01Icon} size={20} />
                {messageUnreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: "16px", height: "16px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{messageUnreadCount}</span>}
              </div>
              <span>Messages</span>
            </div>
            <div
              style={{ position: "relative", marginBottom: "4px" }}
              ref={postSelectorRef}
            >
              <div
                onClick={() => setIsPostSelectorOpen(!isPostSelectorOpen)}
                className="sidebar-nav-link"
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
                  borderRadius: "var(--radius-md)",
                  padding: "6px",
                  zIndex: 2200,
                  animation: "reactionFadeUpSimple 0.15s ease-out"
                }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setIsPostSelectorOpen(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderRadius: "12px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", transition: "all var(--transition-fast)" }}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={16} /> <span style={{ color: "var(--text-primary)" }}>Add post</span>
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); setIsProjectModalOpen(true); setIsPostSelectorOpen(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderRadius: "12px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", transition: "all var(--transition-fast)" }}
                  >
                    <HugeiconsIcon icon={Rocket01Icon} size={16} /> <span style={{ color: "var(--text-primary)" }}>Launch project</span>
                  </div>
                </div>
              )}
            </div>
            <div
              onClick={() => {
                const username = profile?.username || user?.username;
                const path = username ? `/${username}` : "/profile";
                handleSilentNavigate(path);
              }}
              className="sidebar-nav-link"
              style={{ ...linkStyle("/profile"), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: window.innerHeight < 850 ? "10px" : "14px" }}>
                <img
                  src={userAvatarUrl}
                  alt=""
                  style={{
                    width: window.innerHeight < 850 ? "20px" : "24px",
                    height: window.innerHeight < 850 ? "20px" : "24px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "0.5px solid var(--border-hairline)"
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {profile?.name?.split(" ")[0] || user?.firstName || "Me"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "-1px" }}>
                    @{profile?.username || user?.username || "user"}
                  </span>
                </div>
              </div>
              <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
            </div>
          </div>
        )}
      </nav>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 4px" }}>
        {/* Sponsor Placement */}
        <div 
          onClick={() => navigate("/sponsorship")}
          style={{
            height: "180px",
            width: "100%",
            borderRadius: "var(--radius-lg)",
            border: "2px dashed var(--border-hairline)",
            backgroundColor: "rgba(var(--text-primary-rgb), 0.02)",
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            gap: "10px",
            marginTop: "12px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(var(--text-primary-rgb), 0.05)";
            e.currentTarget.style.borderColor = "var(--text-tertiary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(var(--text-primary-rgb), 0.02)";
            e.currentTarget.style.borderColor = "var(--border-hairline)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span style={{ 
              display: "block", 
              fontSize: "13px", 
              fontWeight: 800, 
              color: "var(--text-primary)",
              letterSpacing: "0.02em"
            }}>
              SPONSOR PLACE
            </span>
            <span style={{ 
              display: "block", 
              fontSize: "11px", 
              fontWeight: 500, 
              color: "var(--text-tertiary)",
              marginTop: "2px"
            }}>
              Click to learn more
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: window.innerHeight < 850 ? "12px 0" : "24px 0" }}>
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
            marginTop: "-5px",
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <span>© {new Date().getFullYear()} Codeown</span>
            <button
              onClick={toggleTheme}
              style={{
                background: "#e0e0e0",
                border: "1px solid var(--border-hairline)",
                cursor: "pointer",
                color: "#000",
                borderRadius: "35%",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                opacity: 0.8
              }}
            >
              {theme === 'light' ? <HugeiconsIcon icon={Moon02Icon} size={14} /> : <HugeiconsIcon icon={Sun03Icon} size={14} />}
            </button>
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
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "var(--bg-page)",
        borderBottom: "0.5px solid var(--border-hairline)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 2000,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isVisible ? "translateY(0)" : "translateY(-100%)"
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "24px", width: "auto" }} />
          <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Codeown</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "8px" }}>{theme === 'light' ? <HugeiconsIcon icon={Moon02Icon} size={20} /> : <HugeiconsIcon icon={Sun03Icon} size={20} />}</button>
          {isSignedIn && <div style={{ padding: "4px" }}><StreakBadge count={profile?.streak_count || 0} /></div>}
        </div>
      </div>

      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--bg-page)",
        borderTop: "0.5px solid var(--border-hairline)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0 8px env(safe-area-inset-bottom, 16px) 8px",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        zIndex: 2000,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isVisible ? "translateY(0)" : "translateY(100%)"
      }}>
        <div onClick={() => handleSilentNavigate("/")} style={{ flex: 1, display: "flex", justifyContent: "center", cursor: "pointer", color: location.pathname === "/" ? "var(--text-primary)" : "var(--text-tertiary)" }}><HugeiconsIcon icon={Home01Icon} size={22} /></div>
        <div onClick={() => handleSilentNavigate("/search")} style={{ flex: 1, display: "flex", justifyContent: "center", cursor: "pointer", color: location.pathname === "/search" ? "var(--text-primary)" : "var(--text-tertiary)" }}><HugeiconsIcon icon={Search01Icon} size={22} /></div>

        <div onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", color: isCreateMenuOpen ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <HugeiconsIcon icon={PlusSignIcon} size={26} style={{ transform: isCreateMenuOpen ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          {isCreateMenuOpen && (
            <div style={{ position: "absolute", bottom: "80px", left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--bg-page)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", padding: "10px", minWidth: "220px", zIndex: 2001, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
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

        <div onClick={() => handleSilentNavigate("/messages")} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", cursor: "pointer", color: location.pathname === "/messages" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <HugeiconsIcon icon={Chat01Icon} size={22} />
          {messageUnreadCount > 0 && <span style={{ position: "absolute", top: "14px", right: "15%", minWidth: "16px", height: "16px", backgroundColor: "#ef4444", color: "#fff", fontSize: "9px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{messageUnreadCount}</span>}
        </div>

        <div onClick={() => handleSilentNavigate("/notifications")} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", cursor: "pointer", color: location.pathname === "/notifications" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <HugeiconsIcon icon={Notification01Icon} size={22} />
          {unreadCount > 0 && <span style={{ position: "absolute", top: "14px", right: "15%", minWidth: "16px", height: "16px", backgroundColor: "#ef4444", color: "#fff", fontSize: "9px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</span>}
        </div>

        <div
          onClick={() => {
            const username = profile?.username || user?.username;
            const path = username ? `/${username}` : "/profile";
            handleSilentNavigate(path);
          }}
          style={{ flex: 1, display: "flex", justifyContent: "center", cursor: "pointer" }}
        >
          {userAvatarUrl ? <img src={userAvatarUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", border: location.pathname.includes('/profile') || (profile?.username && location.pathname.includes(profile.username)) ? "1.5px solid var(--text-primary)" : "1px solid var(--border-hairline)", objectFit: "cover" }} /> : <HugeiconsIcon icon={UserIcon} size={22} />}
        </div>
      </div>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => { }} />
    </>
  );
}
