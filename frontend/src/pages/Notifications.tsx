import { useNavigate } from "react-router-dom";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Notification01Icon,
    ViewIcon,
    FavouriteIcon,
    Comment01Icon,
    UserAdd01Icon,
    AtIcon,
    Bookmark01Icon,
    Mail01Icon,
    CircleArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, loading } = useNotifications();
    const { isSignedIn } = useClerkAuth();
    const navigate = useNavigate();
    const { width } = useWindowSize();


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
    };

    const getNotificationIcon = (notification: Notification) => {
        switch (notification.type) {
            case "like":
                // Use arrow-up icon for project upvotes, heart for post likes
                if (notification.project_id) {
                    return { icon: CircleArrowUp01Icon, color: "#0f766e" };
                }
                return { icon: FavouriteIcon, color: "#f91880" };
            case "comment":
            case "reply":
                return { icon: Comment01Icon, color: "#3b82f6" };
            case "follow":
                return { icon: UserAdd01Icon, color: "#8b5cf6" };
            case "mention":
                return { icon: AtIcon, color: "#06b6d4" };
            case "save":
                return { icon: Bookmark01Icon, color: "#f59e0b" };
            case "message":
                return { icon: Mail01Icon, color: "#00ba7c" };
            case "profile_view":
                return { icon: ViewIcon, color: "#6366f1" };
            default:
                return { icon: Notification01Icon, color: "#94a3b8" };
        }
    };

    const getNotificationMessage = (notification: Notification) => {
        const actorName = notification.actor?.name || "Someone";
        const username = notification.actor?.username;

        const nameWrapper = (
            <span style={{ fontWeight: 800, display: "inline-flex", alignItems: "center", color: "#0f172a", marginRight: "4px" }}>
                {actorName}
                <VerifiedBadge username={username} size="14px" />
            </span>
        );

        switch (notification.type) {
            case "message":
                return <>{nameWrapper} Sent you a message</>;
            case "like":
                return <>{nameWrapper} {notification.project_id ? "Upvoted your project" : "Liked your post"}</>;
            case "comment":
                return <>{nameWrapper} {notification.project_id ? "Commented on your project" : "Commented on your post"}</>;
            case "follow":
                return <>{nameWrapper} Started following you</>;
            case "mention":
                return <>{nameWrapper} Mentioned you</>;
            case "reply":
                return <>{nameWrapper} Replied to your comment</>;
            case "save":
                return <>{nameWrapper} Saved your project</>;
            case "profile_view":
                return <>{nameWrapper} Viewed your profile</>;
            default:
                return <>New notification</>;
        }
    };

    if (!isSignedIn && !loading) {
        navigate("/sign-in");
        return null;
    }

    return (
        <main style={{ padding: 0, backgroundColor: "#fff", width: "100%" }}>
            <SEO
                title="Notifications - Codeown"
                description="Stay updated with your latest interactions on Codeown."
            />

            <div style={{
                display: "grid",
                gridTemplateColumns: width >= 1400 ? "1fr 600px 1fr" : width >= 1280 ? "100px 600px 1fr" : "1fr",
                width: "100%",
                backgroundColor: "#fff",
            }}>
                {/* Left Balance Spacer (only desktop) */}
                {width >= 1280 && <div />}
                {/* Main Notifications Column */}
                <div style={{
                    maxWidth: width >= 1024 ? "600px" : "100%",
                    width: "100%",
                    backgroundColor: "#fff",
                    borderLeft: width >= 1024 ? "1px solid #eff3f4" : "none",
                    borderRight: width >= 1024 ? "1px solid #eff3f4" : "none",
                    minHeight: "100vh",
                    margin: width >= 1280 ? "0" : "0 auto"
                }}>
                    {/* Header */}
                    <header style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(12px)",
                        zIndex: 100,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.04)"
                    }}>
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#eff3f4"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <HugeiconsIcon icon={ArrowLeft01Icon} style={{ fontSize: "20px", color: "#0f172a" }} />
                        </button>

                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                fontSize: "20px",
                                fontWeight: 800,
                                color: "#0f172a",
                                margin: 0,
                                letterSpacing: "-0.02em"
                            }}>
                                Notifications
                            </h1>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead("all")}
                                style={{
                                    background: "none",
                                    border: "1px solid #e2e8f0",
                                    color: "#64748b",
                                    padding: "8px 16px",
                                    borderRadius: "12px",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                    e.currentTarget.style.color = "#0f172a";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#64748b";
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </header>

                    {/* Notifications List */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {loading && (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontWeight: 500 }}>
                                Searching for updates...
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div style={{
                                padding: "100px 40px",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "16px"
                            }}>
                                <div style={{
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "20px",
                                    backgroundColor: "#f8fafc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#94a3b8"
                                }}>
                                    <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "32px", opacity: 0.5 }} />
                                </div>
                                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Nothing yet</h2>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
                                    Interaction is the heartbeat of Codeown. Build, share, and connect to see updates here!
                                </p>
                            </div>
                        )}

                        {notifications.map((notification) => {
                            const itemStyle = getNotificationIcon(notification);
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    style={{
                                        padding: "16px 20px",
                                        display: "flex",
                                        gap: "16px",
                                        cursor: "pointer",
                                        transition: "background-color 0.2s",
                                        backgroundColor: notification.read ? "#fff" : "rgba(59, 130, 246, 0.02)",
                                        borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                                        position: "relative"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notification.read ? "#fcfcfc" : "rgba(59, 130, 246, 0.04)"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? "#fff" : "rgba(59, 130, 246, 0.02)"}
                                >
                                    {/* Status Dot for Unread */}
                                    {!notification.read && (
                                        <div style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: "3px",
                                            backgroundColor: "#3b82f6"
                                        }} />
                                    )}

                                    {/* Left: Action Icon */}
                                    <div style={{
                                        width: "24px",
                                        display: "flex",
                                        justifyContent: "center",
                                        paddingTop: "4px",
                                        flexShrink: 0
                                    }}>
                                        <HugeiconsIcon icon={itemStyle.icon} style={{ fontSize: "18px", color: itemStyle.color }} />
                                    </div>

                                    {/* Left-Middle: Avatar */}
                                    <div style={{ flexShrink: 0 }}>
                                        <img
                                            src={notification.actor?.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                                            alt=""
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "10px",
                                                objectFit: "cover",
                                                backgroundColor: "#f1f5f9"
                                            }}
                                        />
                                    </div>

                                    {/* Middle: Text Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "15px",
                                            color: "#1e293b",
                                            lineHeight: 1.5,
                                            fontWeight: notification.read ? 500 : 700,
                                            letterSpacing: "-0.01em"
                                        }}>
                                            {getNotificationMessage(notification)}
                                        </p>
                                        <p style={{
                                            margin: "4px 0 0",
                                            fontSize: "13px",
                                            color: "#94a3b8",
                                            fontWeight: 500
                                        }}>
                                            {formatRelativeDate(notification.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Balance Spacer (only desktop) */}
                {width >= 1280 && <div />}
            </div>
        </main>
    );
}
