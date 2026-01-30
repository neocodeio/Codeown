import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import CreatePostModal from "./CreatePostModal";
import ProjectModal from "./ProjectModal";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faPlus, faUser, faEnvelope, faRocket, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/icon-remove.png";



export default function Navbar() {
  const { isLoaded, isSignedIn, user } = useClerkUser();
  const { getToken } = useClerkAuth();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handlePostCreated = () => {
    window.dispatchEvent(new CustomEvent("postCreated"));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Handle mobile menu outside click
      const clickedOutsideMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(target);
      const clickedOutsideHamburger = hamburgerRef.current && !hamburgerRef.current.contains(target);
      if (clickedOutsideMenu && clickedOutsideHamburger) {
        setIsMobileMenuOpen(false);
      }

      // Handle create dropdown outside click
      const createBtn = document.getElementById("create-btn-container");
      if (createBtn && !createBtn.contains(target)) {
        setIsCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch user avatar from backend
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;
      try {
        const token = await getToken();
        const res = await api.get(`/users/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.avatar_url) {
          setUserAvatarUrl(res.data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
      }
    };

    if (isLoaded && isSignedIn && user?.id) {
      fetchUserAvatar();
    } else if (isLoaded && !isSignedIn) {
      setUserAvatarUrl(null);
    }
  }, [user?.id, isLoaded, isSignedIn, getToken]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (!user?.id) return;
      try {
        const token = await getToken();
        const res = await api.get(`/users/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.avatar_url) {
          setUserAvatarUrl(res.data.avatar_url);
        }
      } catch (error) {
        console.error("Error refreshing user avatar:", error);
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [user?.id, getToken]);

  return (
    <nav style={{
      padding: isMobile ? "12px 16px" : isTablet ? "14px 24px" : "16px 40px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      borderRadius: "20px",
      zIndex: 1000,
      backgroundColor: "#849bff",
      transition: "all 0.2s ease",
    }}>
      {/* Left Section */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : isTablet ? "32px" : "24px", flex: 1 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src={logo}
            alt="Codeown"
            style={{
              height: isMobile ? "32px" : "40px",
              width: "auto",
              backgroundColor: "#fff",
              borderRadius: "12px",
              objectFit: "contain",
              cursor: "pointer",
            }}
          />
        </Link>

        {!isMobile && (
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            style={{ color: "#fff", backgroundColor: "#364182", padding: "8px 12px", borderRadius: "12px", textDecoration: "none", fontSize: "20px", fontWeight: 600 }}
          >
            Feed
          </Link>
        )}
      </div>

      {/* Center Section - Search Bar */}
      {!isMobile && isLoaded && isSignedIn && (
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: isTablet ? "200px" : "320px",
          maxWidth: isTablet ? "200px" : "320px",
          border: "none",
          borderRadius: "12px",
          backgroundColor: "#fff",
          zIndex: 100
        }}>
          <SearchBar />
        </div>
      )}

      {/* Right Section */}

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {isLoaded && isSignedIn && (
          <>
            {!isMobile && (
              <div id="create-btn-container" style={{ position: "relative" }}>
                <button
                  onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                  className="primary"
                  style={{
                    display: "flex",
                    background: "#364182",
                    border: "none",
                    borderRadius: "14px",
                    fontSize: "14px",
                    padding: isTablet ? "10px" : "11px 16px",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(54, 65, 130, 0.3)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(54, 65, 130, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(54, 65, 130, 0.3)";
                  }}
                >
                  <FontAwesomeIcon icon={faPlusCircle} style={{ fontSize: isTablet ? "18px" : "14px" }} />
                  {!isTablet && <span>Create</span>}
                </button>

                {isCreateDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "120%",
                    right: 0,
                    backgroundColor: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    padding: "10px",
                    minWidth: "180px",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    border: "1px solid #f1f5f9",
                    animation: "slideUp 0.2s ease-out"
                  }}>
                    <button
                      onClick={() => { setIsModalOpen(true); setIsCreateDropdownOpen(false); }}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "transparent",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "#334155",
                        fontWeight: 600,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#364182" }}>
                        <FontAwesomeIcon icon={faPlus} />
                      </div>
                      Post
                    </button>
                    <button
                      onClick={() => { setIsProjectModalOpen(true); setIsCreateDropdownOpen(false); }}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "transparent",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "#334155",
                        fontWeight: 600,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                        <FontAwesomeIcon icon={faRocket} />
                      </div>
                      Project
                    </button>
                  </div>
                )}
              </div>
            )}
            <Link to="/messages" style={{
              border: "1px solid #fff",
              backgroundColor: "#fff",
              padding: "9px",
              borderRadius: "12px",
              color: "#000",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
            }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ color: "#364182" }} />
            </Link>
            <NotificationDropdown />
          </>
        )}

        {isLoaded ? (
          isSignedIn ? (
            <Link to="/profile">
              <div style={{
                border: "none",
                backgroundColor: "#fff",
                padding: (userAvatarUrl || user?.imageUrl) ? "0" : "9px",
                borderRadius: "18px",
                color: "#000",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 600,
                overflow: "hidden",
                width: (userAvatarUrl || user?.imageUrl) ? "38px" : "auto",
                height: (userAvatarUrl || user?.imageUrl) ? "38px" : "auto",

              }}>
                {(userAvatarUrl || user?.imageUrl) ? (
                  <img
                    src={userAvatarUrl || user?.imageUrl}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "0px",
                      border: "none",
                    }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} style={{ color: "#364182" }} />
                )}
              </div>
            </Link>
          ) : (
            <Link to="/sign-in">
              <button className="primary" style={{ backgroundColor: "#fff", color: "#000", fontSize: "18px", fontWeight: 600, borderRadius: "15px", border: "1px solid #fff", padding: "6px 12px" }}>Login</button>
            </Link>
          )
        ) : null}

        {isMobile && (
          <button
            ref={hamburgerRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              padding: "4px",
              border: "none",
              background: "none",
              fontSize: "20px",
            }}
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} style={{ color: "#364182" }} />
          </button>
        )}
      </div>

      {isMobile && isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fade-in"
          style={{
            position: "absolute",
            top: "110%",
            left: "12px",
            right: "12px",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Feed Link */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            style={{
              fontSize: "15px",
              color: "#364182",
              textDecoration: "none",
              padding: "12px 14px",
              borderRadius: "10px",
              backgroundColor: "#f9fafb",
              transition: "background-color 0.2s ease",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
          >
            Feed
          </Link>

          {isLoaded && isSignedIn && (
            <>
              {/* Profile Link */}
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                style={{
                  fontSize: "15px",
                  color: "#364182",
                  textDecoration: "none",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#f9fafb",
                  transition: "background-color 0.2s ease",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
              >
                Profile
              </Link>

              {/* Search Bar */}
              <div style={{
                padding: "4px 0",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
              }}>
                <SearchBar />
              </div>

              {/* Create Post Button */}
              <button
                onClick={() => { setIsModalOpen(true); closeMobileMenu(); }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "15px",
                  backgroundColor: "#364182",
                  color: "#fff",
                  border: "none",
                  transition: "background-color 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2d3568";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#364182";
                }}
              >
                Create Post
              </button>
            </>
          )}

          {/* Login Button for non-signed-in users */}
          {!isSignedIn && (
            <Link to="/sign-in" onClick={closeMobileMenu} style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "15px",
                  backgroundColor: "#364182",
                  color: "#fff",
                  border: "none",
                  transition: "background-color 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2d3568";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#364182";
                }}
              >
                Login
              </button>
            </Link>
          )}
        </div>
      )}

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handlePostCreated} />
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onUpdated={() => {
          window.dispatchEvent(new CustomEvent("projectCreated"));
        }}
      />

      {/* Mobile Floating Action Button */}
      {isMobile && isLoaded && isSignedIn && (
        <div id="create-btn-container" style={{ position: "fixed", bottom: "30px", right: "20px", zIndex: 999 }}>
          {isCreateDropdownOpen && (
            <div style={{
              position: "absolute",
              bottom: "70px",
              right: 0,
              backgroundColor: "#fff",
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              padding: "10px",
              minWidth: "200px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              border: "1px solid #e5e7eb",
              animation: "mobileSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}>
              <button
                onClick={() => { setIsModalOpen(true); setIsCreateDropdownOpen(false); }}
                style={{
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  border: "none",
                  borderRadius: "15px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  color: "#1e293b",
                  fontWeight: 700,
                  fontSize: "16px"
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#364182" }}>
                  <FontAwesomeIcon icon={faPlus} />
                </div>
                Create Post
              </button>
              <button
                onClick={() => { setIsProjectModalOpen(true); setIsCreateDropdownOpen(false); }}
                style={{
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  border: "none",
                  borderRadius: "15px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  color: "#1e293b",
                  fontWeight: 700,
                  fontSize: "16px"
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                Launch Project
              </button>
            </div>
          )}
          <button
            onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #364182 0%, #4a59b3 100%)",
              color: "#fff",
              border: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: isCreateDropdownOpen ? "rotate(45deg)" : "rotate(0deg)"
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>

          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes mobileSlideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.8); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </nav>
  );
}
