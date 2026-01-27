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
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .modal-backdrop { animation: modalFadeIn 0.3s ease; }
        .modal-dialog { animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .user-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
        }
        .user-row:hover {
          background: #f8fafc;
          border-left-color: #0f172a;
        }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
        onClick={onClose}
      >
        <div
          className="modal-dialog"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "32px",
            width: "100%",
            maxWidth: "440px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
                display: "flex"
              }}
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div style={{ width: "32px", height: "32px", border: "3px solid #f1f5f9", borderTopColor: "#0f172a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 32px", color: "#94a3b8" }}>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                  {type === "followers" ? "No followers yet" : "Not following anyone yet"}
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="user-row" onClick={() => handleUserClick(user.id)}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "2px solid #f1f5f9",
                    flexShrink: 0
                  }}>
                    <img src={user.avatar_url || getAvatarUrl(user.name)} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.name}
                    </div>
                    {user.username && (
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                        @{user.username}
                      </div>
                    )}
                    {user.bio && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
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
