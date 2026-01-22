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
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "var(--nav-bg)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--nav-border)",
      boxShadow: "var(--shadow-sm)",
      transition: "all 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "32px", flex: 1 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px"}}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? "20px" : "24px",
            fontWeight: 700,
            color: "var(--nav-text)",
            letterSpacing: "-0.02em",
          }}>
            <img src={"./src/assets/logo-removed.png"} alt="logo" style={{ width: isMobile ? "50px" : "56px", height: isMobile ? "50px" : "56px", borderRadius: "12px" }} />
          </h2>
        </Link>
        {!isMobile && (
          <>
            <div style={{ display: "flex", gap: "4px" }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: location.pathname === "/" ? "var(--primary)" : "var(--nav-text-muted)",
                  fontWeight: location.pathname === "/" ? 600 : 500,
                  padding: "8px 16px",
                  borderRadius: "var(--radius-lg)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: location.pathname === "/" ? "var(--bg-hover)" : "transparent",
                  fontSize: "20px",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/") {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--nav-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== "/") {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--nav-text-muted)";
                  }
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
                    padding: "10px 14px",
                    backgroundColor: "var(--primary)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: 600,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-dark)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                padding: "8px",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--nav-text)",
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
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#000",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    fontSize: "20px",
                    fontWeight: 600,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-dark)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
                  <span>New Post</span>
                </button>
              </>
            )}
            {isLoaded ? (
              <>
                {isSignedIn ? (
                  <Link to="/profile">
                    <button style={{
                      padding: "6px 15px",
                      backgroundColor: location.pathname === "/profile" ? "var(--bg-hover)" : "transparent",
                      border: "2px solid #000",
                      color: location.pathname === "/profile" ? "#000" : "#000",
                      borderRadius: "30px",
                      cursor: "pointer",
                      fontSize: "20px",
                      fontWeight: 600,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== "/profile") {
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== "/profile") {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                    >
                      Profile
                    </button>
                  </Link>
                ) : (
                  <Link to="/sign-in">
                    <button style={{
                      padding: "10px 24px",
                      backgroundColor: "var(--primary)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "var(--radius-lg)",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 600,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--primary-dark)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--primary)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
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
                  backgroundColor: "var(--primary)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "var(--radius-lg)",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: 600,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "var(--shadow-sm)",
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
            left: "16px",
            right: "16px",
            backgroundColor: "var(--nav-bg)",
            borderTop: "1px solid var(--nav-border)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 1000,
            borderRadius: "var(--radius-xl)",
            marginTop: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
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
              borderRadius: "var(--radius-md)",
              backgroundColor: location.pathname === "/" ? "var(--bg-hover)" : "transparent",
              color: location.pathname === "/" ? "var(--primary)" : "var(--nav-text)",
              fontWeight: location.pathname === "/" ? 600 : 500,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              fontSize: "15px",
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== "/") {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
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
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-light)", marginTop: "4px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.05em" }}>
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
                  borderRadius: "var(--radius-md)",
                  backgroundColor: location.pathname === "/profile" ? "var(--bg-hover)" : "transparent",
                  color: location.pathname === "/profile" ? "var(--primary)" : "var(--nav-text)",
                  fontWeight: location.pathname === "/profile" ? 600 : 500,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  fontSize: "15px",
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== "/profile") {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
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
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary)",
                color: "#fff",
                fontWeight: 600,
                textAlign: "center",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                fontSize: "15px",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-dark)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
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