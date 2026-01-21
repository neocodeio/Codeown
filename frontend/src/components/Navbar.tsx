import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import CreatePostModal from "./CreatePostModal";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../hooks/useTheme";

interface NavbarProps {
  onToggleTheme?: () => void;
}

export default function Navbar({ onToggleTheme }: NavbarProps) {
  const { isLoaded, isSignedIn } = useClerkUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handlePostCreated = () => {
    // Trigger refresh of posts
    window.dispatchEvent(new CustomEvent("postCreated"));
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <nav style={{
      padding: "-0px 24px",
      borderBottom: "1px solid #e4e7eb",
      display: "flex",
      borderRadius: "25px",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#000",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "32px", flex: 1 }}>
        <Link to="/" style={{ textDecoration: "none"}}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? "20px" : "24px",
            fontWeight: 600,
            color: "#fefefe",
            // fontFamily: "ubuntu",
          }}>
            <img src={"./src/assets/logo-removed.png"} alt="logo" style={{ width: "82px", height: "82px" }} />
          </h2>
        </Link>
        {!isMobile && (
          <>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/" ? "#000" : "#000",
                  fontWeight: location.pathname === "/" ? 600 : 500,
                  padding: "10px 20px",
                  borderRadius: "20px",
                  transition: "all 0.2s",
                  backgroundColor: location.pathname === "/" ? "#fff" : "#fff",
                }}
              >
                Home
              </Link>
            </div>
            {isLoaded && isSignedIn && (
              <div style={{ flex: 1, maxWidth: "500px", margin: "0 20px" }}>
                <SearchBar />
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: isMobile ? "8px" : "12px",
        flexShrink: 0,
        position: "relative",
      }}>
        {isMobile ? (
          <>
            {isLoaded && isSignedIn && (
              <>
                <NotificationDropdown />
                <button
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fefefe",
                    border: "none",
                    color: "#000",
                    borderRadius: "25px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                padding: "8px",
                backgroundColor: "transparent",
                border: "none",
                color: "#fefefe",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </>
        ) : (
          <>
            {isLoaded && isSignedIn && (
              <>
                <NotificationDropdown />
                <button
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#fefefe",
                    border: "none",
                    color: "#000",
                    borderRadius: "25px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 600,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#000";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fefefe";
                    e.currentTarget.style.color = "#000";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
                </button>
              </>
            )}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--nav-text)",
                  color: "var(--nav-text)",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                }}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                <FontAwesomeIcon icon={isDark ? faSun : faMoon} style={{ fontSize: "16px" }} />
              </button>
            )}
            {isLoaded ? (
              <>
                {isSignedIn ? (
                  <Link to="/profile">
                    <button style={{
                      padding: "10px 20px",
                      backgroundColor: location.pathname === "/profile" ? "#000" : "transparent",
                      border: "2px solid #fefefe",
                      color: location.pathname === "/profile" ? "#ffffff" : "#fefefe",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}>
                      Profile
                    </button>
                  </Link>
                ) : (
                  <Link to="/sign-in">
                    <button style={{
                      padding: "10px 24px",
                      backgroundColor: "#fff",
                      border: "none",
                      color: "#000",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#000";
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff";
                        e.currentTarget.style.color = "#000";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      Login
                    </button>
                  </Link>
                )}
              </>
            ) : (
              <Link to="/sign-in">
                <button style={{
                  padding: "10px 24px",
                  backgroundColor: "#000",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}>
                  Login
                </button>
              </Link>
            )}
          </>
        )}
      </div>
      
      {/* Mobile Menu */}
      {isMobile && isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#000",
            borderTop: "1px solid #333",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            borderRadius: "25px",
            marginTop: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            animation: "slideDown 0.2s ease-out",
          }}
        >
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              textDecoration: "none",
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: location.pathname === "/" ? "#333" : "transparent",
              color: "#fefefe",
              fontWeight: location.pathname === "/" ? 600 : 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== "/") {
                e.currentTarget.style.backgroundColor = "#333";
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== "/") {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            Home
          </Link>
          
          {isLoaded && isSignedIn && (
            <>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #333", marginTop: "4px" }}>
                <div style={{ fontSize: "12px", color: "#999", marginBottom: "8px", fontWeight: 600 }}>
                  SEARCH
                </div>
                <SearchBar />
              </div>
              
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  backgroundColor: location.pathname === "/profile" ? "#333" : "transparent",
                  color: "#fefefe",
                  fontWeight: location.pathname === "/profile" ? 600 : 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/profile") {
                    e.currentTarget.style.backgroundColor = "#333";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/profile") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                Profile
              </Link>
            </>
          )}
          
          {isLoaded && !isSignedIn && (
            <Link
              to="/sign-in"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                textDecoration: "none",
                padding: "12px 16px",
                borderRadius: "12px",
                backgroundColor: "#fff",
                color: "#000",
                fontWeight: 600,
                textAlign: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.color = "#000";
              }}
            >
              Login
            </Link>
          )}
        </div>
      )}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handlePostCreated}
      />
    </nav>
  );
}