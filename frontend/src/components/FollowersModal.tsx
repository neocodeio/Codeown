import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import VerifiedBadge from "./VerifiedBadge";
import { useWindowSize } from "../hooks/useWindowSize";
import { X } from "phosphor-react";

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
  const { width } = useWindowSize();
  const isMobile = width < 768;

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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=212121&color=ffffff&size=128&bold=true&font-size=0.5`;
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
        @keyframes modalSlideIn { from { opacity: 0; transform: ${isMobile ? 'translateY(20px)' : 'scale(0.98)'}; } to { opacity: 1; transform: ${isMobile ? 'translateY(0)' : 'scale(1)'}; } }
        .modal-backdrop { animation: modalFadeIn 0.2s ease; }
        .modal-dialog { animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .user-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-left: 2px solid transparent;
        }
        .user-row:hover {
          background: var(--bg-hover);
          border-left-color: var(--text-primary);
        }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 10000,
          display: "flex",
          justifyContent: "center",
          alignItems: isMobile ? "flex-end" : "center",
          padding: isMobile ? "0" : "20px",
        }}
        onClick={onClose}
      >
        <div
          className="modal-dialog"
          style={{
            backgroundColor: "var(--bg-page)",
            borderRadius: isMobile ? "2px 2px 0 0" : "2px",
            border: "0.5px solid var(--border-hairline)",
            width: "100%",
            maxWidth: isMobile ? "100%" : "440px",
            maxHeight: isMobile ? "92vh" : "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.2)",
            paddingBottom: isMobile ? "env(safe-area-inset-bottom)" : "0"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ 
            padding: "24px 32px", 
            borderBottom: "0.5px solid var(--border-hairline)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: "14px", 
              fontWeight: 800, 
              color: "var(--text-primary)", 
              textTransform: "uppercase", 
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em" 
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} weight="thin" />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <div style={{ width: "24px", height: "24px", border: "1px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 32px", color: "var(--text-tertiary)" }}>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  {type === "followers" ? "NO FOLLOWERS DATA" : "NOT FOLLOWING ANYONE"}
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="user-row" onClick={() => handleUserClick(user.id)}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "2px",
                    overflow: "hidden",
                    border: "0.5px solid var(--border-hairline)",
                    flexShrink: 0
                  }}>
                    <img src={user.avatar_url || getAvatarUrl(user.name)} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "6px" }}>
                      {user.name}
                      <VerifiedBadge username={user.username} size="14px" />
                    </div>
                    {user.username && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                        @{user.username}
                      </div>
                    )}
                    {user.bio && (
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "4px" }}>
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
