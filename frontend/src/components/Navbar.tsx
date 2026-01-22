import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import CreatePostModal from "./CreatePostModal";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faPlus, faUser } from "@fortawesome/free-solid-svg-icons";

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
      borderRadius: "20px",
      zIndex: 1000,
      backgroundColor: "#000",
      transition: "all 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "60px", flex: 1 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ 
            fontSize: "25px", 
            textDecoration: "none",
            fontWeight: 600, 
            color: "#FFF", 
            letterSpacing: "-0.05em",
          }}>
            Codeown
          </span>
        </Link>

        {!isMobile && (
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
              style={{ color: "#000", backgroundColor: "#fff", padding: "8px 12px", borderRadius: "12px", textDecoration: "none", fontSize: "20px", fontWeight: 600 }}
            >
              Feed
            </Link>
            {isLoaded && isSignedIn && (
              <div style={{ width: "240px", border: "2px solid #d9d9daff", borderRadius: "12px", backgroundColor: "#fff" }}>
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
                  backgroundColor: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  padding: "6px 12px",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span style={{ fontSize: "14px", backgroundColor: "#fff", padding: "4px 8px", borderRadius: "12px", color: "#000", fontWeight: 700 }}>Create Post</span>
              </button>
            )}
            <NotificationDropdown />
          </>
        )}

        {isLoaded ? (
          isSignedIn ? (
            <Link to="/profile">
              <div style={{
                border: "1px solid #fff",
                backgroundColor: "#fff",
                padding: "6px",
                borderRadius: "12px",
                color: "#000",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 700,
              }}>
                <FontAwesomeIcon icon={faUser} /> 
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
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} style={{ color: "#ffffff" }} />
          </button>
        )}
      </div>

      {isMobile && isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fade-in"
          style={{
            position: "absolute",
            top: "120%",
            left: 0,
            right: 0,
            borderRadius: "15px",
            backgroundColor: "#000",
            borderBottom: "1px solid var(--border-color)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Link to="/" className="nav-link" style={{ fontSize: "16px", color: "#ffffff", textDecoration: "none" }}>Feed</Link>
          {isLoaded && isSignedIn && (
            <>
              <SearchBar />
              <button onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }} className="primary" style={{ width: "100%", padding: "6px", borderRadius: "12px", fontWeight: "bold" }}>Create New Post +</button>
              <Link to="/profile" className="nav-link" style={{ fontSize: "16px", color: "#ffffff", textDecoration: "none" }}>Profile</Link>
            </>
          )}
          {!isSignedIn && <Link to="/sign-in"><button className="primary" style={{ width: "100%", padding: "12px" }}>Login</button></Link>}
        </div>
      )}

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handlePostCreated} />
    </nav>
  );
}
