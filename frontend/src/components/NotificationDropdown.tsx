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
  Tick01Icon,
  CircleArrowUp01Icon,
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

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        // Use arrow-up icon for project upvotes, heart for post likes
        if (notification.project_id) {
          return {
            icon: CircleArrowUp01Icon,
            color: "#0f766e",
            bg: "rgba(15, 118, 110, 0.06)",
          };
        }
        return {
          icon: FavouriteIcon,
          color: "#f91880",
          bg: "rgba(249, 24, 128, 0.05)",
        };
      case "comment":
      case "reply":
        return { icon: Comment01Icon, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.05)" };
      case "follow":
        return { icon: UserAdd01Icon, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.05)" };
      case "mention":
        return { icon: AtIcon, color: "#06b6d4", bg: "rgba(6, 182, 212, 0.05)" };
      case "save":
        return { icon: Bookmark01Icon, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.05)" };
      case "message":
        return { icon: Mail01Icon, color: "#00ba7c", bg: "rgba(0, 186, 124, 0.05)" };
      case "profile_view":
      case "project_view":
        return { icon: ViewIcon, color: "#6366f1", bg: "rgba(99, 102, 241, 0.05)" };
      default:
        return { icon: Notification01Icon, color: "#94a3b8", bg: "#f8fafc" };
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const actorName = notification.actor?.name || "Someone";
    const username = notification.actor?.username;

    const nameWrapper = (
      <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", color: "var(--text-primary)", fontSize: "14px" }}>
        {username ? `@${username}` : actorName}
        <VerifiedBadge username={username} size="14px" />
      </span>
    );

    switch (notification.type) {
      case "message":
        return <span>{nameWrapper} sent you a message</span>;
      case "like":
        return (
          <span>
            {nameWrapper}{" "}
            {notification.project_id ? "upvoted your project" : "liked your post"}
          </span>
        );
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
      case "project_view":
        return <span>{nameWrapper} {notification.project_id ? "viewed your project" : "viewed your profile"}</span>;
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
              backgroundColor: "var(--bg-page)",
              border: "0.5px solid var(--border-hairline)",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "var(--text-primary)",
            }}
          >
            <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "20px" }} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  borderRadius: "var(--radius-sm)",
                  width: "16px",
                  height: "16px",
                  fontSize: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
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
              background-color: var(--bg-hover) !important;
            }
            .notification-dropdown {
              animation: dropdownShow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .notification-dropdown-list::-webkit-scrollbar {
              width: 5px;
            }
            .notification-dropdown-list::-webkit-scrollbar-track {
              background: transparent;
            }
            .notification-dropdown-list::-webkit-scrollbar-thumb {
              background: var(--text-tertiary);
              borderRadius: 2px;
              opacity: 0.3;
            }
            .notification-dropdown-list::-webkit-scrollbar-thumb:hover {
              background: var(--text-secondary);
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
              width: isMobile ? "100%" : "400px",
              height: isMobile ? "100%" : "auto",
              maxHeight: isMobile ? "100vh" : "600px",
              backgroundColor: "var(--bg-page)",
              borderRadius: "0",
              boxShadow: "none",
              border: "0.5px solid var(--border-hairline)",
              zIndex: 9999,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "24px",
              borderBottom: "0.5px solid var(--border-hairline)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-page)",
              position: "sticky",
              top: 0,
              zIndex: 10
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>Notifications</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-tertiary)", fontWeight: "500" }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "Everything is up to date"}
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
                      background: "none",
                      border: "0.5px solid var(--border-hairline)",
                      color: "var(--text-primary)",
                      padding: "8px 14px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <HugeiconsIcon icon={Tick01Icon} style={{ fontSize: "14px" }} />
                    Mark all
                  </button>
                )}
                {isMobile && (
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: "var(--text-primary)", border: "none", color: "var(--bg-page)", padding: "8px 14px", borderRadius: "var(--radius-sm)", fontWeight: "600", fontSize: "12px" }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Content List */}
            <div className="notification-dropdown-list" style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    color: "var(--text-tertiary)",
                    border: "0.5px solid var(--border-hairline)"
                  }}>
                    <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "24px" }} />
                  </div>
                  <h4 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>All quiet</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-tertiary)", lineHeight: "1.5", fontWeight: 500 }}>
                    No new notifications yet.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const itemIcon = getNotificationIcon(notification);
                  return (
                    <div
                      key={notification.id}
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: "16px 20px",
                        margin: "2px 0",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        backgroundColor: notification.read ? "var(--bg-page)" : "var(--bg-hover)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                        position: "relative",
                        borderBottom: "0.5px solid var(--border-hairline)"
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={notification.actor?.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                          alt=""
                          style={{ width: "42px", height: "42px", borderRadius: "var(--radius-xs)", objectFit: "cover", backgroundColor: "var(--bg-hover)", border: "0.5px solid var(--border-hairline)" }}
                        />
                        <div style={{
                          position: "absolute",
                          bottom: "-4px",
                          right: "-4px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-page)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "0.5px solid var(--border-hairline)",
                          color: itemIcon.color,
                          boxShadow: "none"
                        }}>
                          <HugeiconsIcon icon={itemIcon.icon} style={{ fontSize: "11px" }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: "0 0 4px",
                          fontSize: "13px",
                          color: "var(--text-primary)",
                          lineHeight: "1.5",
                          fontWeight: notification.read ? 600 : 800,
                          letterSpacing: "-0.01em"
                        }}>
                          {getNotificationMessage(notification)}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)", fontWeight: "500" }}>
                          {formatCompactRelativeDate(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "var(--text-primary)",
                          flexShrink: 0
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
