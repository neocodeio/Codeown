import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  ViewIcon,
  FavouriteIcon,
  Comment01Icon,
  UserAdd01Icon,
  AtIcon,
  Bookmark01Icon,
  Mail01Icon,
  Tick01Icon
} from "@hugeicons/core-free-icons";
import { formatCompactRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";

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
    } else if (notification.actor?.username) {
      navigate(`/${notification.actor.username}`);
    } else if (notification.actor_id) {
      navigate(`/user/${notification.actor_id}`);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return { icon: FavouriteIcon, color: "#ef4444", bg: "#fee2e2" };
      case "comment":
      case "reply":
        return { icon: Comment01Icon, color: "#3b82f6", bg: "#dbeafe" };
      case "follow":
        return { icon: UserAdd01Icon, color: "#8b5cf6", bg: "#ede9fe" };
      case "mention":
        return { icon: AtIcon, color: "#06b6d4", bg: "#cffafe" };
      case "save":
        return { icon: Bookmark01Icon, color: "#f59e0b", bg: "#fef3c7" };
      case "message":
        return { icon: Mail01Icon, color: "#10b981", bg: "#d1fae5" };
      case "profile_view":
        return { icon: ViewIcon, color: "#6366f1", bg: "#e0e7ff" };
      default:
        return { icon: Notification01Icon, color: "#64748b", bg: "#f1f5f9" };
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const actorName = notification.actor?.name || "Someone";
    const username = notification.actor?.username;

    const nameWrapper = (
      <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", color: "#0f172a" }}>
        {username ? `@${username}` : actorName}
        <VerifiedBadge username={username} size="14px" />
      </span>
    );

    switch (notification.type) {
      case "message":
        return <span>{nameWrapper} sent you a message</span>;
      case "like":
        return <span>{nameWrapper} {notification.project_id ? "liked your project" : "liked your post"}</span>;
      case "comment":
        return <span>{nameWrapper} {notification.project_id ? "commented on your project" : "commented on your post"}</span>;
      case "follow":
        return <span>{nameWrapper} started following you</span>;
      case "mention":
        return <span>{nameWrapper} mentioned you</span>;
      case "reply":
        return <span>{nameWrapper} replied to your comment</span>;
      case "save":
        return <span>{nameWrapper} saved your project</span>;
      case "profile_view":
        return <span>{nameWrapper} viewed your profile</span>;
      default:
        return <span>New notification</span>;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {props.renderTrigger ? (
        props.renderTrigger(
          () => setIsOpen(!isOpen),
          unreadCount || 0,
          isOpen
        )
      ) : (
        isSignedIn && (
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
              color: "#212121",
            }}
          >
            <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "20px" }} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "#212121",
                  color: "#fff",
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
        )
      )}

      {isOpen && (
        <>
          <style>{`
            @keyframes dropdownShow {
              from { opacity: 0; transform: translateY(10px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .notification-item:hover {
              background-color: #f8fafc !important;
            }
            .notification-dropdown {
              animation: dropdownShow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
          `}</style>
          <div
            className="notification-dropdown"
            style={{
              position: isMobile ? "fixed" : "absolute",
              top: isMobile ? "0" : (props.align === "bottom" ? "calc(100% + 12px)" : "0"),
              bottom: isMobile ? "0" : "auto",
              left: isMobile ? "0" : (props.align === "right" ? "100%" : "0"),
              right: isMobile ? "0" : "auto",
              marginLeft: (!isMobile && props.align === "right") ? "12px" : "0",
              width: isMobile ? "100%" : "380px",
              height: isMobile ? "100%" : "auto",
              maxHeight: isMobile ? "100vh" : "min(600px, 85vh)",
              backgroundColor: "#ffffff",
              borderRadius: isMobile ? "0" : "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.12)",
              border: isMobile ? "none" : "1px solid rgba(226, 232, 240, 0.8)",
              zIndex: 9999,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff",
              position: "sticky",
              top: 0,
              zIndex: 10
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>Notifications</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                  You have {unreadCount} unread
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead("all");
                    }}
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "none",
                      color: "#10b981",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)"}
                  >
                    <HugeiconsIcon icon={Tick01Icon} style={{ fontSize: "14px" }} />
                    Mark all
                  </button>
                )}
                {isMobile && (
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: "#f1f5f9", border: "none", padding: "8px 12px", borderRadius: "10px", fontWeight: 700, fontSize: "12px" }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Content List */}
            <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "20px",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    color: "#94a3b8"
                  }}>
                    <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "32px", opacity: 0.5 }} />
                  </div>
                  <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>All quiet for now</h4>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                    When you get notifications, they'll show up here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const itemIcon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: "16px",
                        margin: "4px 0",
                        borderRadius: "16px",
                        cursor: "pointer",
                        backgroundColor: notification.read ? "#fff" : "#f0f7ff",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        gap: "14px",
                        alignItems: "flex-start",
                        position: "relative",
                        border: notification.read ? "1px solid transparent" : "1px solid #e0f2fe"
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={notification.actor?.avatar_url || "https://via.placeholder.com/44"}
                          alt=""
                          style={{ width: "44px", height: "44px", borderRadius: "14px", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        />
                        <div style={{
                          position: "absolute",
                          bottom: "-6px",
                          right: "-6px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "8px",
                          backgroundColor: itemIcon.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #fff",
                          color: itemIcon.color,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}>
                          <HugeiconsIcon icon={itemIcon.icon} style={{ fontSize: "12px" }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: "0 0 4px",
                          fontSize: "14px",
                          color: "#1e293b",
                          lineHeight: "1.5",
                          fontWeight: notification.read ? 500 : 600
                        }}>
                          {getNotificationMessage(notification)}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "#cbd5e1" }} />
                          {formatCompactRelativeDate(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#3b82f6",
                          marginTop: "6px",
                          boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)"
                        }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
