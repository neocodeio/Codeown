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
import { 
  House, 
  MagnifyingGlass, 
  ChatCircle, 
  Rocket, 
  User as UserIcon, 
  Bell, 
  Plus, 
  SignOut, 
  DotsThreeOutline, 
  SignIn, 
  UsersThree,
  Sun,
  Moon
} from "phosphor-react";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/icon-removebg.png";
import logoWhite from "../assets/logo-white.png";
import DeveloperIDCardModal from "./DeveloperIDCardModal";
import StreakBadge from "./StreakBadge";



export default function Navbar() {
  const { isSignedIn, user } = useClerkUser();
  const { signOut } = useClerkAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768; // Mobile breakpoint



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
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



  useFaviconNotification(unreadCount);

  // Use the centralized avatar hook
  const { avatarUrl: userAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    profile?.name || user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "User"
  );

  const logoutRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setIsLogoutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Streak update logic (no longer rendered here, but kept for potential future use)

  // Active user tracking and polling
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const { data } = await api.get("/users/active/count");
        setActiveCount(data?.count || 1);
      } catch (e) {
        setActiveCount(1);
      }
    };

    const pingActiveSession = async () => {
      try {
        const token = await getToken();
        await api.post("/users/active/ping", {}, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } catch (e) {
        // Silently fail pings
      }
    };

    // Initial calls
    fetchActiveCount();
    pingActiveSession();

    // Set up intervals
    const countInterval = setInterval(fetchActiveCount, 30000); // 30s
    const pingInterval = setInterval(pingActiveSession, 45000); // 45s

    return () => {
      clearInterval(countInterval);
      clearInterval(pingInterval);
    };
  }, [getToken]);

  // Remove periodic ping - React Query handles active count efficiently
  // Only ping when user actively interacts, not on a timer

  // Styles
  const linkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "12px 16px",
      borderRadius: "2px",
      textDecoration: "none",
      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
      backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
      fontWeight: 800,
      fontSize: "13px",
      transition: "all 0.15s ease",
      marginBottom: "2px",
      border: isActive ? "0.5px solid var(--border-hairline)" : "0.5px solid transparent",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontFamily: "var(--font-mono)"
    };
  };
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "40px 20px 48px 24px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "36px", width: "auto" }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", textTransform: "uppercase" }}>
                Codeown
              </span>
            </div>
            {/* Online Status */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              marginTop: "2px" 
            }}>
              <div style={{ 
                width: "4px", 
                height: "4px", 
                borderRadius: "1px", 
                backgroundColor: "#22c55e",
              }} />
              <span style={{ 
                fontSize: "10px", 
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                fontWeight: 700,
                letterSpacing: "0.05em"
              }}>
                {activeCount.toString().padStart(2, '0')} BUILDERS ONLINE
              </span>
            </div>
          </div>
        </Link>
      </div>



      {/* Nav Links */}
      <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
        <Link to="/" style={linkStyle("/")}>
          <House size={20} weight={location.pathname === "/" ? "bold" : "thin"} />
          FEED
        </Link>
        <Link to="/search" style={linkStyle("/search")}>
          <MagnifyingGlass size={20} weight={location.pathname === "/search" ? "bold" : "thin"} />
          SEARCH
        </Link>
        <Link to="/leaderboard" style={linkStyle("/leaderboard")}>
          <UsersThree size={20} weight={location.pathname === "/leaderboard" ? "bold" : "thin"} />
          PULSE
        </Link>
        {isSignedIn && (
          <>
            <Link to="/messages" style={linkStyle("/messages")}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
                <ChatCircle size={20} weight={location.pathname === "/messages" ? "bold" : "thin"} />
                {messageUnreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -6,
                      minWidth: "14px",
                      height: "14px",
                      padding: "0 2px",
                      backgroundColor: "var(--text-primary)",
                      color: "var(--bg-page)",
                      borderRadius: "0",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {messageUnreadCount}
                  </span>
                )}
              </div>
              CHAT
            </Link>

            <Link
              to="/notifications"
              style={linkStyle("/notifications")}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} weight={location.pathname === "/notifications" ? "bold" : "thin"} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-6px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    minWidth: "14px",
                    height: "14px",
                    fontSize: "9px",
                    fontFamily: "var(--font-mono)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              NOTIFICATIONS
            </Link>

            <div
              onClick={() => setIsModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer" }}
            >
              <Plus size={20} weight="thin" />
              POST
            </div>

            <div
              onClick={() => setIsProjectModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer" }}
            >
              <Rocket size={20} weight="thin" />
              LAUNCH
            </div>

            <div
              onClick={() => {
                const username = profile?.username || user?.username;
                if (username) navigate(`/${username}`);
                else navigate("/profile");
              }}
              style={{ ...linkStyle("/profile"), cursor: "pointer" }}
            >
              <UserIcon size={20} weight={location.pathname.includes('/profile') || (profile?.username && location.pathname.includes(profile.username)) ? "bold" : "thin"} />
              PROFILE
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Footer Links & Profile */}
      <div style={{ padding: "0 16px 20px 16px", borderTop: "0.5px solid var(--border-hairline)" }}>
        {/* Theme Toggle */}
        <div
          onClick={toggleTheme}
          style={{ ...linkStyle(""), cursor: "pointer", marginTop: "16px", marginBottom: "16px" }}
        >
          {theme === 'light' ? <Moon size={20} weight="thin" /> : <Sun size={20} weight="thin" />}
          {theme === 'light' ? 'DARK MODE' : 'LIGHT MODE'}
        </div>

        {/* Profile Card */}
        {isSignedIn && user ? (
          <>
            <div
              onClick={() => {
                const username = profile?.username || user?.username;
                if (username) navigate(`/${username}`);
                else navigate("/profile");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "20px 12px",
                marginTop: "12px",
                backgroundColor: "transparent",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <img
                src={userAvatarUrl || user.imageUrl}
                alt="Profile"
                style={{ width: "36px", height: "36px", borderRadius: "2px", objectFit: "cover", border: "0.5px solid var(--border-hairline)" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                  {profile?.name || user.fullName || "User"}
                </div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase" }}>
                  @{profile?.username || user.username || "user"}
                </div>
              </div>

              {/* 3 Dots Menu */}
              <div ref={logoutRef} style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsLogoutOpen(!isLogoutOpen); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "4px" }}
                >
                  <DotsThreeOutline size={20} weight="thin" />
                </button>

                {isLogoutOpen && (
                  <div style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    marginBottom: "12px",
                    backgroundColor: "var(--bg-page)",
                    border: "0.5px solid var(--border-hairline)",
                    borderRadius: "2px",
                    padding: "4px",
                    minWidth: "160px",
                    zIndex: 100
                  }}>
                    <button
                      onClick={() => signOut()}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        width: "100%", padding: "12px",
                        background: "none", border: "none",
                        color: "#ef4444", fontWeight: 800, fontSize: "11px",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase"
                      }}
                    >
                      <SignOut size={18} weight="thin" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Links */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "12px",
              marginTop: "16px",
              padding: "0 10px",
              textAlign: "center",
              lineHeight: "1.5"
            }}>
              <Link to="/privacy" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#64748b"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>Privacy</Link>
              <span style={{ color: "#e2e8f0" }}>•</span>
              <Link to="/terms" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#64748b"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>Terms</Link>
              <span style={{ color: "#e2e8f0" }}>•</span>
              <Link to="/about" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#64748b"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>About</Link>
              <span style={{ color: "#e2e8f0" }}>•</span>
              <Link to="/founder-story" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#64748b"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>Founder</Link>
            </div>

            <div style={{ fontSize: "11px", color: "#cbd5e1", textAlign: "center", fontWeight: 500 }}>
              © 2026 Codeown.
            </div>
          </>
        ) : (
          <Link to="/sign-in" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              border: "none",
              borderRadius: "2px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em"
            }}>
              <SignIn size={20} weight="thin" />
              SIGN IN
            </button>
          </Link>
        )}
      </div>
    </div>
  );

  // Desktop Render
  if (!isMobile) {
    return (
      <>
        <div style={{
          width: width < 1024 ? "240px" : "300px",
          height: "100vh",
          padding: "0 12px",
          position: "sticky",
          top: 0,
          borderRight: "0.5px solid var(--border-hairline)",
          backgroundColor: "var(--bg-page)",
          zIndex: 50
        }}>
          <SidebarContent />
        </div>

        {/* Modals */}
        <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
        <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => { }} />
      </>
    );
  }

  // Mobile/Tablet Render
  return (
    <>
      {/* Mobile/Tablet Top Header */}
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
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "24px", width: "auto" }} />
            <span style={{ 
              fontSize: "14px", 
              fontWeight: 800, 
              color: "var(--text-primary)", 
              letterSpacing: "0.05em",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase" 
            }}>
              CODEOWN
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px"
            }}
          >
            {theme === 'light' ? <Moon size={22} weight="thin" /> : <Sun size={22} weight="thin" />}
          </button>

          {isSignedIn && (
            <div
              onClick={() => setIsIDCardOpen(true)}
              style={{
                padding: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
            >
              <StreakBadge count={profile?.streak_count || 0} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--bg-page)",
        borderTop: "0.5px solid var(--border-hairline)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0 10px env(safe-area-inset-bottom, 24px) 10px",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        zIndex: 2000,
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box"
      }}>
        <Link to="/" style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <House size={22} weight={location.pathname === "/" ? "bold" : "thin"} />
        </Link>

        <Link to="/search" style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/search" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <MagnifyingGlass size={22} weight={location.pathname === "/search" ? "bold" : "thin"} />
        </Link>

        <Link to="/leaderboard" style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/leaderboard" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <UsersThree size={22} weight={location.pathname === "/leaderboard" ? "bold" : "thin"} />
        </Link>

        <div
          onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            cursor: "pointer",
            color: isCreateMenuOpen ? "var(--text-primary)" : "var(--text-tertiary)"
          }}
        >
          <Plus
            size={24}
            weight={isCreateMenuOpen ? "bold" : "thin"}
            style={{
              transform: isCreateMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.15s"
            }}
          />

          {/* Mobile Menu Popover */}
          {isCreateMenuOpen && (
            <div style={{
              position: "absolute",
              bottom: "70px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "var(--bg-page)",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "2px",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              minWidth: "160px",
              zIndex: 2001,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
            }}>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 800, fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
              >
                <Plus size={16} weight="thin" />
                POST
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsProjectModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 800, fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
              >
                <Rocket size={16} weight="thin" />
                LAUNCH
              </div>
            </div>
          )}
        </div>

        <Link
          to="/messages"
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: location.pathname === "/messages" ? "var(--text-primary)" : "var(--text-tertiary)",
            position: "relative",
          }}
        >
          <ChatCircle size={22} weight={location.pathname === "/messages" ? "bold" : "thin"} />
          {messageUnreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "12px",
                right: "calc(50% - 16px)",
                minWidth: "14px",
                height: "14px",
                padding: "0 2px",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                borderRadius: "1px",
                letterSpacing: "0.05em"
              }}
            >
              {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/notifications"
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: location.pathname === "/notifications" ? "var(--text-primary)" : "var(--text-tertiary)",
            position: "relative",
          }}
        >
          <Bell size={22} weight={location.pathname === "/notifications" ? "bold" : "thin"} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "12px",
                right: "calc(50% - 16px)",
                minWidth: "14px",
                height: "14px",
                padding: "0 2px",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                borderRadius: "1px",
                letterSpacing: "0.05em"
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link
          to={(profile?.username || user?.username) ? `/${profile?.username || user?.username}` : "/profile"}
          style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: (location.pathname === "/profile" || (profile?.username && location.pathname === `/${profile.username}`)) ? "var(--text-primary)" : "var(--text-tertiary)", position: "relative" }}
        >
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "2px", border: location.pathname.includes('/profile') || (profile?.username && location.pathname.includes(profile.username)) ? "1.5px solid var(--text-primary)" : "0.5px solid var(--border-hairline)", objectFit: "cover" }} />
          ) : (
            <UserIcon size={20} weight="thin" />
          )}
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
