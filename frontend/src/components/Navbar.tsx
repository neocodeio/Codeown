import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import CreatePostModal from "./CreatePostModal";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useClerkUser();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostCreated = () => {
    // Trigger refresh of posts
    window.dispatchEvent(new CustomEvent("postCreated"));
  };

  return (
    <nav style={{
      padding: "16px 24px",
      borderBottom: "1px solid #e4e7eb",
      display: "flex",
      borderRadius: "40px",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#000",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <Link to="/" style={{ textDecoration: "none"}}>
          <h2 style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: 600,
            color: "#fefefe",
            // fontFamily: "ubuntu",
          }}>
            Codeown
          </h2>
        </Link>
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
          {/* {isLoaded && isSignedIn && (
            <Link
              to="/profile"
              style={{
                textDecoration: "none",
                color: location.pathname === "/profile" ? "#000" : "#64748b",
                fontWeight: location.pathname === "/profile" ? 600 : 500,
                padding: "10px 16px",
                borderRadius: "8px",
                transition: "all 0.2s",
                backgroundColor: location.pathname === "/profile" ? "#f0f7ff" : "transparent",
              }}
            >
              Profile
            </Link>
          )} */}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isLoaded && isSignedIn && (
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
            <span style={{ fontSize: "18px", lineHeight: 1, }}>+</span>
            {/* <span>Post</span> */}
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
                  backgroundColor: "#000",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#000";
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
      </div>
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handlePostCreated}
      />
    </nav>
  );
}