import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { useAvatar } from "../hooks/useAvatar";
import CreatePostModal from "./CreatePostModal";
import ProjectModal from "./ProjectModal";
import { useNotifications } from "../hooks/useNotifications";
import { useFaviconNotification } from "../hooks/useFaviconNotification";
import api from "../api/axios";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  Search01Icon,
  BubbleChatIcon,
  Rocket01Icon,
  UserIcon,
  Notification01Icon,
  Add01Icon,
  Logout01Icon,
  MoreHorizontalIcon,
  Login01Icon,
  // faEllipsisH,
  // faSignOutAlt,
  // faPlus,
  // faBell
} from '@hugeicons/core-free-icons';
import logo from "../assets/icon-remove.png";
import VerifiedBadge from "./VerifiedBadge";

export default function Navbar() {
  const { isSignedIn, user } = useClerkUser();
  const { signOut } = useClerkAuth();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width < 768; // Mobile breakpoint



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
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

  const isPro = profile?.is_pro === true;

  useFaviconNotification(unreadCount);

  // Use the centralized avatar hook
  const { avatarUrl: userAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    user?.fullName || user?.username || "User"
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

  // Kill the active user count query - fetch only once on mount, no refetching
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchActiveCountOnce = async () => {
      if (!isSignedIn) return;
      try {
        const { data } = await api.get("/users/active/count");
        setActiveCount(data?.count || 0);
      } catch (e) {
        setActiveCount(0);
      }
    };

    fetchActiveCountOnce();
  }, []); // Empty dependency array - fetch only once on mount

  // Remove periodic ping - React Query handles active count efficiently
  // Only ping when user actively interacts, not on a timer

  // Styles
  const linkStyle = (path: string) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: location.pathname === path ? "#212121" : "#212121",
    backgroundColor: location.pathname === path ? "#f8f8f8" : "transparent",
    fontWeight: location.pathname === path ? 700 : 500,
    fontSize: "16px",
    transition: "all 0.2s ease",
    marginBottom: "4px"
  });

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 32px 20px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src={logo} alt="Codeown" style={{ height: "40px", width: "auto" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>
              Codeown
            </span>
            {isSignedIn && isPro && (
              <span style={{
                fontSize: "10px",
                fontWeight: 900,
                color: "#d4a853",
                border: "1px solid #d4a853",
                padding: "2px 6px",
                borderRadius: "4px",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                opacity: 0.9,
                marginTop: "2px"
              }}>
                PRO
              </span>
            )}
          </div>
        </Link>
      </div>



      {/* Nav Links */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <Link to="/" style={linkStyle("/")}>
          <HugeiconsIcon icon={Home01Icon} style={{ width: "20px" }} />
          Feed
        </Link>
        <Link to="/search" style={linkStyle("/search")}>
          <HugeiconsIcon icon={Search01Icon} style={{ width: "20px" }} />
          Search
        </Link>
        {isSignedIn && (
          <>
            <Link to="/messages" style={linkStyle("/messages")}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
                <HugeiconsIcon icon={BubbleChatIcon} style={{ width: "20px" }} />
                {messageUnreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -8,
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      borderRadius: "999px",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      border: "2px solid #fff",
                    }}
                  >
                    {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
                  </span>
                )}
              </div>
              Chat
            </Link>

            {/* Notification Item */}
            <Link
              to="/notifications"
              style={{
                ...linkStyle("/notifications"),
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== "/notifications") e.currentTarget.style.backgroundColor = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== "/notifications") e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <HugeiconsIcon icon={Notification01Icon} style={{ width: "20px" }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "14px",
                    height: "14px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    border: "2px solid #fff"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              Notifications
            </Link>

            <div
              onClick={() => setIsModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer", color: "#212121" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <HugeiconsIcon icon={Add01Icon} style={{ width: "20px" }} />
              Create Post
            </div>

            <div
              onClick={() => setIsProjectModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer", color: "#212121" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <HugeiconsIcon icon={Rocket01Icon} style={{ width: "20px" }} />
              Launch Project
            </div>

            <Link to="/profile" style={linkStyle("/profile")}>
              <HugeiconsIcon icon={UserIcon} style={{ width: "20px" }} />
              Profile
            </Link>





            {/* Real-time Status Badge */}
            <div style={{
              marginTop: "12px",
              padding: "10px 16px",
              alignItems: "center",
              gap: "10px",
              color: "#3b82f6",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              backgroundColor: "rgba(59, 130, 246, 0.05)",
              borderRadius: "12px",
              margin: "8px 16px",
              display: "none" // Hidden by request
            }}>
              <div style={{ color: "#3b82f6", fontWeight: 800 }}>
                {activeCount} {activeCount === 1 ? "DEVELOPER" : "DEVELOPERS"} ONLINE
              </div>

              <style>{`
                @keyframes pulseActive {
                  0% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(1.2); }
                  100% { opacity: 1; transform: scale(1); }
                }
              `}</style>
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Footer Links & Profile */}
      <div style={{ padding: "0 16px 20px 16px" }}>
        {/* Profile Card */}
        {isSignedIn && user ? (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "16px",
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
            }}>
              <img
                src={userAvatarUrl || user.imageUrl}
                alt="Profile"
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center" }}>
                  {user.fullName || user.username}
                  <VerifiedBadge username={user.username} isPro={isPro} size="14px" />
                </div>
                <div style={{ color: "#64748b", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  @{user.username}
                </div>
              </div>

              {/* 3 Dots Menu */}
              <div ref={logoutRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setIsLogoutOpen(!isLogoutOpen)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "8px" }}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} />
                </button>

                {isLogoutOpen && (
                  <div style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    marginBottom: "8px",
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    padding: "6px",
                    minWidth: "140px",
                    zIndex: 100
                  }}>
                    <button
                      onClick={() => signOut()}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        width: "100%", padding: "10px",
                        background: "none", border: "none",
                        color: "#ef4444", fontWeight: 600, fontSize: "14px",
                        cursor: "pointer", borderRadius: "8px",
                        textAlign: "left"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <HugeiconsIcon icon={Logout01Icon} />
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
              padding: "12px",
              backgroundColor: "#212121",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <HugeiconsIcon icon={Login01Icon} />
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
        <div style={{
          width: width < 1024 ? "240px" : "300px",
          height: "100vh",
          padding: "0 12px",
          position: "sticky",
          top: 0,
          borderRight: "1px solid #e2e8f0",
          backgroundColor: "#fff",
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
        backgroundColor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 2000,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src={logo} alt="Codeown" style={{ height: "32px", width: "auto" }} />
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>
              Codeown
            </span>
          </Link>
        </div>
        {isSignedIn && location.pathname !== "/messages" && null}
      </div>


      {/* Mobile Bottom Tab Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "12px 10px 24px 10px",
        zIndex: 2000,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box"
      }}>
        <Link to="/" style={{ flex: 1, height: "44px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/" ? "#212121" : "#94a3b8" }}>
          <HugeiconsIcon icon={Home01Icon} style={{ fontSize: "20px" }} />
        </Link>

        <Link to="/search" style={{ flex: 1, height: "44px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/search" ? "#212121" : "#94a3b8" }}>
          <HugeiconsIcon icon={Search01Icon} style={{ fontSize: "20px" }} />
        </Link>

        <Link
          to="/messages"
          style={{
            flex: 1,
            height: "44px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: location.pathname === "/messages" ? "#212121" : "#94a3b8",
            position: "relative",
          }}
        >
          <HugeiconsIcon icon={BubbleChatIcon} style={{ fontSize: "20px" }} />
          {messageUnreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: "calc(50% - 6px)",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                backgroundColor: "#ef4444",
                color: "#fff",
                borderRadius: "999px",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                border: "2px solid #fff",
              }}
            >
              {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
            </span>
          )}
        </Link>

        <div
          onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
          style={{
            flex: 1,
            height: "44px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            cursor: "pointer",
            color: isCreateMenuOpen ? "#212121" : "#94a3b8"
          }}
        >
          <HugeiconsIcon
            icon={Add01Icon}
            style={{
              fontSize: "20px",
              transform: isCreateMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.2s"
            }}
          />

          {/* Create Menu - Absolute positioned above button */}
          {isCreateMenuOpen && (
            <div style={{
              position: "absolute",
              bottom: "60px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "160px",
              zIndex: 2001
            }}>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", borderRadius: "8px", cursor: "pointer", color: "#1e293b", fontWeight: 600, fontSize: "14px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0f0f0", color: "#212121", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HugeiconsIcon icon={Add01Icon} />
                </div>
                Create Post
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsProjectModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", borderRadius: "8px", cursor: "pointer", color: "#1e293b", fontWeight: 600, fontSize: "14px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0f0f0", color: "#212121", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HugeiconsIcon icon={Rocket01Icon} />
                </div>
                Launch Project
              </div>
            </div>
          )}

        </div>

        <Link
          to="/notifications"
          style={{
            flex: 1,
            height: "44px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: location.pathname === "/notifications" ? "#212121" : "#94a3b8",
            position: "relative",
          }}
        >
          <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "20px" }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: "calc(50% - 6px)",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                backgroundColor: "#ef4444",
                color: "#fff",
                borderRadius: "999px",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                border: "2px solid #fff",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link to="/profile" style={{ flex: 1, height: "44px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", color: location.pathname === "/profile" ? "#212121" : "#94a3b8", position: "relative" }}>
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", border: location.pathname === "/profile" ? "2px solid #212121" : "none", objectFit: "cover" }} />
          ) : (
            <HugeiconsIcon icon={UserIcon} style={{ fontSize: "20px" }} />
          )}
          {isSignedIn && !isPro && (
            <span style={{
              position: "absolute",
              top: 8,
              right: "calc(50% - 14px)",
              width: "8px",
              height: "8px",
              backgroundColor: "#d4a853",
              borderRadius: "50%",
              border: "2px solid #fff"
            }} />
          )}
        </Link>
      </div >

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => { }} />


    </>
  );
}
