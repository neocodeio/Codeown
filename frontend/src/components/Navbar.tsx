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
    <nav style={{
      padding: isMobile ? "12px 16px" : "16px 40px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      backgroundColor: "var(--bg-page)",
      borderBottom: "1px solid var(--border-color)",
      transition: "all 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "60px", flex: 1 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            backgroundColor: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{ color: "var(--bg-page)", fontWeight: 800, fontSize: "18px" }}>C</span>
          </div>
          <span style={{ 
            fontSize: "20px", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.05em",
            textTransform: "uppercase"
          }}>
            Codeown
          </span>
        </Link>

        {!isMobile && (
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Feed
            </Link>
            {isLoaded && isSignedIn && (
              <div style={{ width: "240px" }}>
                <SearchBar />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {isLoaded && isSignedIn && (
          <>
            {!isMobile && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Create</span>
              </button>
            )}
            <NotificationDropdown />
          </>
        )}

        {isLoaded ? (
          isSignedIn ? (
            <Link to="/profile">
              <div style={{
                width: "36px",
                height: "36px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Profile
              </div>
            </Link>
          ) : (
            <Link to="/sign-in">
              <button className="primary">Login</button>
            </Link>
          )
        ) : null}

        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              padding: "4px",
              border: "none",
              background: "none",
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
          className="fade-in"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--border-color)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Link to="/" className="nav-link" style={{ fontSize: "16px" }}>Feed</Link>
          {isLoaded && isSignedIn && (
            <>
              <SearchBar />
              <button onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }} className="primary" style={{ width: "100%" }}>New Post</button>
              <Link to="/profile" className="nav-link" style={{ fontSize: "16px" }}>Profile</Link>
            </>
          )}
          {!isSignedIn && <Link to="/sign-in"><button className="primary" style={{ width: "100%" }}>Login</button></Link>}
        </div>
      )}

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handlePostCreated} />
    </nav>
  );
}
