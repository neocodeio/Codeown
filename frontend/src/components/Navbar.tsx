import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import CreatePostModal from "./CreatePostModal";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";

interface NavbarProps {
  onToggleTheme?: () => void;
}

export default function Navbar({ onToggleTheme }: NavbarProps) {
  const { isLoaded, isSignedIn } = useClerkUser();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handlePostCreated = () => {
    window.dispatchEvent(new CustomEvent("postCreated"));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="glass" style={{
      padding: isMobile ? "12px 16px" : "14px 40px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      borderBottom: "1px solid var(--nav-border)",
      boxShadow: "var(--shadow-sm)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "48px", flex: 1 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", transition: "transform 0.3s ease" }}>
          <div style={{
            width: isMobile ? "36px" : "42px",
            height: isMobile ? "36px" : "42px",
            borderRadius: "10px",
            backgroundColor: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(80, 70, 229, 0.2)"
          }}>
            <img 
              src={"/src/assets/logo-removed.png"} 
              alt="logo" 
              style={{ width: "80%", height: "80%", objectFit: "contain" }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span style="color: white; font-weight: 800; font-size: 20px;">C</span>';
              }}
            />
          </div>
          <span style={{ 
            fontSize: isMobile ? "18px" : "22px", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.03em",
            fontFamily: "Outfit, sans-serif"
          }}>
            Codeown
          </span>
        </Link>

        {!isMobile && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: location.pathname === "/" ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                transition: "all 0.3s ease",
                backgroundColor: location.pathname === "/" ? "var(--bg-hover)" : "transparent",
                fontSize: "15px",
              }}
            >
              Home
            </Link>
            {isLoaded && isSignedIn && (
              <div style={{ width: "300px", marginLeft: "24px" }}>
                <SearchBar />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isLoaded && isSignedIn && (
          <>
            {!isMobile && (
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--primary)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>New Post</span>
              </button>
            )}
            <NotificationDropdown />
          </>
        )}

        {isLoaded ? (
          isSignedIn ? (
            <Link to="/profile">
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-full)",
                border: "2px solid var(--border-color)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: "2px"
              }}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--gray-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-secondary)"
                }}>
                  Me
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/sign-in">
              <button style={{
                padding: "10px 24px",
                backgroundColor: "var(--primary)",
                border: "none",
                color: "#fff",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 600,
                boxShadow: "var(--shadow-sm)",
              }}>
                Login
              </button>
            </Link>
          )
        ) : null}

        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              padding: "8px",
              backgroundColor: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "20px",
            }}
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
          </button>
        )}
      </div>

      {isMobile && isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="glass fade-in"
          style={{
            position: "absolute",
            top: "100%",
            left: "12px",
            right: "12px",
            borderRadius: "var(--radius-lg)",
            marginTop: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <Link to="/" style={{ padding: "12px", borderRadius: "var(--radius-md)", backgroundColor: location.pathname === "/" ? "var(--bg-hover)" : "transparent", color: location.pathname === "/" ? "var(--primary)" : "var(--text-primary)", fontWeight: 600 }}>Home</Link>
          {isLoaded && isSignedIn && (
            <>
              <SearchBar />
              <button onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }} style={{ padding: "12px", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary)", color: "white", border: "none", fontWeight: 600 }}>New Post</button>
              <Link to="/profile" style={{ padding: "12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontWeight: 600 }}>Profile</Link>
            </>
          )}
          {!isSignedIn && <Link to="/sign-in" style={{ padding: "12px", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary)", color: "white", textAlign: "center", fontWeight: 600 }}>Login</Link>}
        </div>
      )}

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handlePostCreated} />
    </nav>
  );
}
