import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { formatRelativeDate } from "../utils/date";

interface NotificationDropdownProps {
  align?: "right" | "bottom";
  renderTrigger?: (onClick: () => void, unreadCount: number, isOpen: boolean) => React.ReactNode;
}

export default function NotificationDropdown(props: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { isSignedIn } = useClerkAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.project_id) {
      navigate(`/project/${notification.project_id}`);
    } else if (notification.type === "message") {
      navigate(`/messages?userId=${notification.actor_id}`);
    } else if (notification.actor_id) {
      navigate(`/user/${notification.actor_id}`);
    }
    setIsOpen(false);
  };

  const getNotificationMessage = (notification: Notification) => {
    const actorName = notification.actor?.name || "Someone";
    switch (notification.type) {
      case "message":
        return `${actorName} sent you a message`;
      case "like":
        return notification.project_id
          ? `${actorName} liked your project`
          : `${actorName} liked your post`;
      case "comment":
        return notification.project_id
          ? `${actorName} commented on your project`
          : `${actorName} commented on your post`;
      case "follow":
        return `${actorName} started following you`;
      case "mention":
        return `${actorName} mentioned you`;
      case "reply":
        return `${actorName} replied to your comment`;
      case "save":
        return `${actorName} saved your project`;
      default:
        return "New notification";
    }
  };


  if (!isSignedIn) return null;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {props.renderTrigger ? (
        props.renderTrigger(() => setIsOpen(!isOpen), unreadCount, isOpen)
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "relative",
            padding: "9px",
            backgroundColor: "#fff",
            border: "none",
            cursor: "pointer",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: "#364182",
          }}
        >
          <FontAwesomeIcon icon={faBell} style={{ fontSize: "20px", color: "#364182" }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: isMobile ? "fixed" : "absolute",
            top: isMobile ? "70px" : (props.align === "right" ? "0" : "100%"), // If right, align top
            left: isMobile ? "16px" : (props.align === "right" ? "100%" : "auto"), // If right, place to the right
            right: isMobile ? "16px" : (props.align === "right" ? "auto" : "0"),
            marginLeft: props.align === "right" ? "12px" : "0",
            marginTop: isMobile ? 0 : (props.align === "right" ? "0" : "8px"),
            width: isMobile ? "auto" : "360px",
            maxHeight: isMobile ? "calc(100vh - 100px)" : "500px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e4e7eb",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e4e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1a1a1a" }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead("all")}
                style={{
                  padding: "4px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid #e4e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f5f7fa",
                    cursor: "pointer",
                    backgroundColor: notification.read ? "transparent" : "#f0f7ff",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read ? "#f5f7fa" : "#e0f2fe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read ? "transparent" : "#f0f7ff";
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    <img
                      src={
                        notification.actor?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.actor?.name || "User")}&background=000&color=ffffff&size=64`
                      }
                      alt={notification.actor?.name}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", color: "#1a1a1a", marginBottom: "4px" }}>
                        {getNotificationMessage(notification)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {formatRelativeDate(notification.created_at)}
                      </div>
                    </div>
                    {!notification.read && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#2563eb",
                          marginTop: "16px",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
