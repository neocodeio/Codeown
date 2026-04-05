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
  Moon,
  Scroll,
  Buildings,
  Medal,
  ChartBar,
  Trophy
} from "phosphor-react";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/icon-removebg.png";
import logoWhite from "../assets/logo-white.png";
import DeveloperIDCardModal from "./DeveloperIDCardModal";
import StreakBadge from "./StreakBadge";
import AvailabilityBadge from "./AvailabilityBadge";



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



  useFaviconNotification(unreadCount + messageUnreadCount);

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
      const countInterval = setInterval(fetchActiveCount, 30000); // 30s
      
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
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        marginTop: "2px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}>
          <div style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            flexShrink: 0
          }} />
          <span style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            fontWeight: 600,
            whiteSpace: "nowrap"
          }}>
            {activeCount} builders online
          </span>
        </div>
        <span style={{
            fontSize: "10px",
            color: "var(--text-tertiary)",
            fontWeight: 500,
            paddingLeft: "8px",
            letterSpacing: "0.02em"
        }}>
            {currentTime}
        </span>
      </div>
    );
  };

  // Remove periodic ping - React Query handles active count efficiently
  // Only ping when user actively interacts, not on a timer

  // Styles
  const linkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "10px 16px",
      borderRadius: "12px",
      textDecoration: "none",
      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
      backgroundColor: isActive ? "transparent" : "transparent",
      fontWeight: isActive ? "bold" : "500",
      fontSize: "14px",
      transition: "all 0.15s ease",
      marginBottom: "2px",
      border: isActive ? "0.5px solid transparent" : "0.5px solid transparent",
    };
  };
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", padding: "0 12px" }}>
      {/* Logo */}
      <div style={{ padding: "32px 20px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }} aria-label="Codeown Home">
            <img src={theme === "dark" ? logoWhite : logo} alt="Codeown" style={{ height: "36px", width: "auto" }} />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                  Codeown
                </span>
              </h2>
              <StatusBadge />
            </div>
          </Link>
          
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} weight="regular" /> : <Sun size={20} weight="regular" />}
          </button>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, marginTop: "16px" }} aria-label="Main Navigation">
        <Link to="/" style={linkStyle("/")} aria-label="Home Feed">
          <House size={20} weight={location.pathname === "/" ? "bold" : "regular"} />
          Feed
        </Link>
        <Link to="/search" style={linkStyle("/search")} aria-label="Search and Discover">
          <MagnifyingGlass size={20} weight={location.pathname === "/search" ? "bold" : "regular"} />
          Search
        </Link>
        <Link to="/leaderboard" style={linkStyle("/leaderboard")} aria-label="Leaderboard">
          <UsersThree size={20} weight={location.pathname === "/leaderboard" ? "bold" : "regular"} />
          Leaderboard
        </Link>
        <Link to="/ship" style={linkStyle("/ship")} aria-label="Ship Week Competition">
          <Trophy size={20} weight={location.pathname === "/ship" ? "bold" : "regular"} />
          Ship Week
        </Link>
        <Link to="/ogs" style={linkStyle("/ogs")} aria-label="Founding OGs">
          <Medal size={20} weight={location.pathname === "/ogs" ? "bold" : "regular"} />
          Our OGs
        </Link>
        <Link to="/dashboard" style={linkStyle("/dashboard")} aria-label="Creator Dashboard">
          <ChartBar size={20} weight={location.pathname === "/dashboard" ? "bold" : "regular"} />
          Analytics
        </Link>
        <Link to="/startups" style={linkStyle("/startups")} aria-label="Startup Hub">
          <Buildings size={20} weight={location.pathname === "/startups" ? "bold" : "regular"} />
          Startups Hub
        </Link>
        <Link to="/changelog" style={linkStyle("/changelog")} aria-label="View Changelog">
          <Scroll size={20} weight={location.pathname === "/changelog" ? "bold" : "regular"} />
          Changelog
        </Link>
        {isSignedIn && (
          <>
            <Link to="/messages" style={linkStyle("/messages")} aria-label={`Messages, ${messageUnreadCount} unread`}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
                <ChatCircle size={20} weight={location.pathname === "/messages" ? "bold" : "regular"} />
                {messageUnreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -8,
                      minWidth: "16px",
                      height: "16px",
                      padding: "0 4px",
                      backgroundColor: "var(--text-primary)",
                      color: "var(--bg-page)",
                      borderRadius: "100px",
                      fontSize: "10px",
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
              Chat
            </Link>

            <Link
              to="/notifications"
              style={linkStyle("/notifications")}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} weight={location.pathname === "/notifications" ? "bold" : "regular"} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-8px",
                    backgroundColor: "var(--text-primary)",
                    color: "var(--bg-page)",
                    minWidth: "16px",
                    height: "16px",
                    fontSize: "10px",
                    borderRadius: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              Notifications
            </Link>

            <div
              onClick={() => setIsModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer" }}
              aria-label="Create new post"
              role="button"
            >
              <Plus size={20} weight="regular" />
              Post
            </div>

            <div
              onClick={() => setIsProjectModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer" }}
              aria-label="Launch new project"
              role="button"
            >
              <Rocket size={20} weight="regular" />
              Launch
            </div>

            <div
              onClick={() => {
                const username = profile?.username || user?.username;
                if (username) navigate(`/${username}`);
                else navigate("/profile");
              }}
              style={{ ...linkStyle("/profile"), cursor: "pointer" }}
              aria-label="View your profile"
              role="link"
            >
              <UserIcon size={20} weight={location.pathname.includes('/profile') || (profile?.username && location.pathname.includes(profile.username)) ? "bold" : "regular"} />
              Profile
            </div>
          </>
        )}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Footer Links & Profile */}
      <div style={{ padding: "0 16px 20px 16px" }}>

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
                border: "1px solid var(--border-hairline)",
                borderRadius: "10px",
                gap: "12px",
                padding: "12px 12px",
                marginTop: "8px",
                backgroundColor: "transparent",
                position: "relative",
                cursor: "pointer",
              }}
              aria-label="User Profile Quick Access"
            >
              <AvailabilityBadge
                avatarUrl={userAvatarUrl || user.imageUrl}
                name={profile?.name || user.fullName || "User"}
                size={36}
                isOpenToOpportunities={profile?.is_hirable === true && profile?.is_pro === true}
                isOG={profile?.is_og}
                username={profile?.username || user?.username}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                  {profile?.name || user.fullName || "User"}
                </div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 400 }}>
                  @{profile?.username || user.username || "user"}
                </div>
              </div>

              {/* 3 Dots Menu */}
              <div ref={logoutRef} style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsLogoutOpen(!isLogoutOpen); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "4px" }}
                  aria-label="More options"
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
                    borderRadius: "var(--radius-sm)",
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
                        color: "#ef4444", fontWeight: 600, fontSize: "13px",
                        cursor: "pointer",
                      }}
                      aria-label="Logout"
                    >
                      <SignOut size={18} weight="regular" />
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
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "14px",
            }}
              aria-label="Sign In"
            >
              <SignIn size={20} weight="regular" />
              Sign In
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
        <nav style={{
          width: width < 1024 ? "240px" : "300px",
          height: "100vh",
          position: "sticky",
          top: 0,
          borderRight: "0.5px solid var(--border-hairline)",
          backgroundColor: "var(--bg-page)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column"
        }}>
          <SidebarContent />
        </nav>

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
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}>
              Codeown
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
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} weight="thin" /> : <Sun size={20} weight="thin" />}
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
          <House size={22} weight={location.pathname === "/" ? "bold" : "regular"} />
        </Link>

        <Link to="/search" style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/search" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <MagnifyingGlass size={22} weight={location.pathname === "/search" ? "bold" : "regular"} />
        </Link>

        <Link to="/leaderboard" style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/leaderboard" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          <UsersThree size={22} weight={location.pathname === "/leaderboard" ? "bold" : "regular"} />
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
            weight="regular"
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
              borderRadius: "var(--radius-sm)",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              minWidth: "160px",
              zIndex: 2001,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
            }}>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}
              >
                <Plus size={18} weight="regular" />
                Post
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); navigate("/ship"); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}
              >
                <Trophy size={18} weight="regular" />
                Ship Week
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsProjectModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}
              >
                <Rocket size={18} weight="regular" />
                Launch
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); navigate("/startups"); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px", borderTop: "0.5px solid var(--border-hairline)" }}
              >
                <Buildings size={18} weight="regular" />
                Startups Hub
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); navigate("/dashboard"); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px", borderTop: "0.5px solid var(--border-hairline)" }}
              >
                <ChartBar size={18} weight="regular" />
                Dashboard
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); navigate("/ogs"); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px", borderTop: "0.5px solid var(--border-hairline)" }}
              >
                <Medal size={18} weight="regular" />
                Our OGs
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
          <ChatCircle size={22} weight={location.pathname === "/messages" ? "bold" : "regular"} />
          {messageUnreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "12px",
                right: "calc(50% - 16px)",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                borderRadius: "100px",
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
          <Bell size={22} weight={location.pathname === "/notifications" ? "bold" : "regular"} />
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                borderRadius: "var(--radius-xs)",
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
            <img src={userAvatarUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", border: location.pathname.includes('/profile') || (profile?.username && location.pathname.includes(profile.username)) ? "1.5px solid var(--text-primary)" : "0.5px solid var(--border-hairline)", objectFit: "cover" }} />
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
