import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import CreatePostModal from "./CreatePostModal";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faPlus, faUser, faEnvelope } from "@fortawesome/free-solid-svg-icons";



export default function Navbar() {
  const { isLoaded, isSignedIn, user } = useClerkUser();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      const clickedOutsideMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(target);
      const clickedOutsideHamburger = hamburgerRef.current && !hamburgerRef.current.contains(target);

      if (clickedOutsideMenu && clickedOutsideHamburger) {
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
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : isTablet ? "32px" : "60px", flex: 1 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{
            fontSize: "25px",
            textDecoration: "none",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: "#364182",
            borderRadius: "12px",
            padding: "6px 8px",
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
              style={{ color: "#fff", backgroundColor: "#364182", padding: "8px 12px", borderRadius: "12px", textDecoration: "none", fontSize: "20px", fontWeight: 600 }}
            >
              Feed
            </Link>
            {isLoaded && isSignedIn && (
              <div style={{ width: isTablet ? "180px" : "240px", border: "2px solid #d9d9daff", borderRadius: "12px", backgroundColor: "#fff" }}>
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
                  backgroundColor: "#364182",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  padding: "6px 12px",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon icon={faPlus} style={{ color: "#fff" }} />
                <span style={{ fontSize: "14px", backgroundColor: "#364182", padding: "6px 8px", borderRadius: "12px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Create Post</span>
              </button>
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
                padding: user?.imageUrl ? "0" : "9px",
                borderRadius: "18px",
                color: "#000",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 600,
                overflow: "hidden",
                width: user?.imageUrl ? "38px" : "auto",
                height: user?.imageUrl ? "38px" : "auto",

              }}>
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
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
              {/* Search Bar */}
              <div style={{
                padding: "4px 0",
              }}>
                <SearchBar />
              </div>

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
    </nav>
  );
}
