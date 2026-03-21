import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { socket } from "../lib/socket";
import { ChatTeardropText, X } from "phosphor-react";

interface IncomingMessage {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  image_url?: string;
  shared_post_id?: number;
  shared_project_id?: number;
  sender?: {
    name: string;
    username: string | null;
    avatar_url: string | null;
  };
}

interface ToastItem {
  id: string;
  message: IncomingMessage;
  timestamp: number;
}

export default function MessageNotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useClerkUser();

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const handleNewMessage = (msg: IncomingMessage) => {
      // Don't show toast if already on messages page
      if (location.pathname === "/messages") return;

      // Don't show toast for own messages
      if (msg.sender_id === currentUser.id) return;

      const toastId = `toast-${msg.id}-${Date.now()}`;

      setToasts((prev) => {
        // Prevent duplicates
        if (prev.some((t) => t.message.id === msg.id)) return prev;
        // Keep max 3 toasts
        const updated = [...prev, { id: toastId, message: msg, timestamp: Date.now() }];
        return updated.slice(-3);
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissToast(toastId);
      }, 5000);
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [currentUser?.id, location.pathname, dismissToast]);

  const handleToastClick = (toast: ToastItem) => {
    dismissToast(toast.id);
    navigate(`/messages?userId=${toast.message.sender_id}`);
  };

  if (toasts.length === 0) return null;

  const getPreviewText = (msg: IncomingMessage) => {
    if (msg.content) return msg.content;
    if (msg.image_url) return "📷 Sent an image";
    if (msg.shared_post_id) return "📄 Shared a post";
    if (msg.shared_project_id) return "🚀 Shared a project";
    return "New message";
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
          maxWidth: "380px",
          width: "100%"
        }}
      >
        {toasts.map((toast, idx) => (
          <div
            key={toast.id}
            onClick={() => handleToastClick(toast)}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 18px",
              backgroundColor: "var(--bg-page)",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "8px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              animationDelay: `${idx * 50}ms`,
              animationFillMode: "both",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateX(-4px)";
              e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: "2px",
                backgroundColor: "var(--text-primary)",
                animation: "toastProgress 5s linear forwards",
                borderRadius: "0 0 0 8px"
              }}
            />

            {/* Avatar */}
            {toast.message.sender?.avatar_url ? (
              <img
                src={toast.message.sender.avatar_url}
                alt=""
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "0.5px solid var(--border-hairline)",
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "0.5px solid var(--border-hairline)",
                  flexShrink: 0
                }}
              >
                <ChatTeardropText size={18} weight="fill" style={{ color: "var(--text-tertiary)" }} />
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}
                >
                  {toast.message.sender?.name || "New Message"}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase"
                  }}
                >
                  NOW
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.4
                }}
              >
                {getPreviewText(toast.message)}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: "4px",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
}
