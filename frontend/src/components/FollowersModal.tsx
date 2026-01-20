import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface User {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  followed_at: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  title: string;
}

export default function FollowersModal({ isOpen, onClose, userId, type, title }: FollowersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const endpoint = type === "followers" 
          ? `/follows/${userId}/followers`
          : `/follows/${userId}/following`;
        const res = await api.get(endpoint);
        setUsers(res.data || []);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=000&color=ffffff&size=128&bold=true&font-size=0.5`;
  };

  const handleUserClick = (targetUserId: string) => {
    onClose();
    navigate(`/user/${targetUserId}`);
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          animation: "modalFadeIn 0.15s ease-out",
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "420px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            animation: "modalSlideIn 0.2s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid #e4e7eb",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#1a1a1a" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                color: "#64748b",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f7fa";
                e.currentTarget.style.color = "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid #e4e7eb",
                    borderTopColor: "#000",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "16px" }}>
                  {type === "followers" ? "No followers yet" : "Not following anyone yet"}
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f7fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <img
                    src={user.avatar_url || getAvatarUrl(user.name)}
                    alt={user.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #e4e7eb",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.name}
                    </div>
                    {user.username && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        @{user.username}
                      </div>
                    )}
                    {user.bio && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#94a3b8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: "2px",
                        }}
                      >
                        {user.bio}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
