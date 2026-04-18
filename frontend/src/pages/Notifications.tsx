import { useEffect, useMemo } from "react";
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
    ArrowUp01Icon,
    MailAtSign01Icon,
    Bookmark02Icon,
    Mail01Icon,
    UserGroupIcon,
    FireIcon,
    StarIcon,
    MedalIcon,
} from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, loading } = useNotifications();
    const { isSignedIn } = useClerkAuth();
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1200;

    // Grouping logic for "like" notifications
    const groupedNotifications = useMemo(() => {
        const grouped: (Notification & { groupCount?: number; groupIds?: number[]; actorIds?: Set<string> })[] = [];
        const likeMap = new Map<string, number>();

        notifications.forEach((n) => {
            if (n.type === "like") {
                const key = n.post_id ? `post_${n.post_id}` : n.project_id ? `project_${n.project_id}` : null;
                if (key) {
                    if (likeMap.has(key)) {
                        const idx = likeMap.get(key)!;
                        const group = grouped[idx];
                        if (!group.actorIds) group.actorIds = new Set([group.actor_id]);

                        // Only group if it's a NEW actor for this post/project
                        if (!group.actorIds.has(n.actor_id)) {
                            group.groupCount = (group.groupCount || 1) + 1;
                            if (!group.groupIds) group.groupIds = [group.id];
                            group.groupIds.push(n.id);
                            group.actorIds.add(n.actor_id);
                            // If any unread in group, mark group as unread
                            if (!n.read) group.read = false;
                            return;
                        }
                    }
                    // Reset or set the map pointer to the newest instance
                    likeMap.set(key, grouped.length);
                }
            }
            grouped.push({ ...n });
        });
        return grouped;
    }, [notifications]);

    // Automatically mark all as read when entering the page
    useEffect(() => {
        if (!loading && unreadCount > 0) {
            markAsRead("all");
        }
    }, [loading, unreadCount, markAsRead]);

    const handleNotificationClick = (notification: Notification & { groupIds?: number[] }) => {
        if (!notification.read) {
            if (notification.groupIds) {
                notification.groupIds.forEach(id => markAsRead(id));
            } else {
                markAsRead(notification.id);
            }
        }

        if (notification.post_id) {
            navigate(`/post/${notification.post_id}`);
        } else if (notification.project_id) {
            navigate(`/project/${notification.project_id}`);
        } else if (notification.type === "message") {
            navigate(`/messages?userId=${notification.actor_id}`);
        } else if (notification.startup_id) {
            navigate(`/startup/${notification.startup_id}`);
        } else if (notification.actor?.username) {
            navigate(`/${notification.actor.username}`);
        } else if (notification.actor_id) {
            navigate(`/user/${notification.actor_id}`);
        }
    };

    const getNotificationIcon = (notification: Notification) => {
        const size = 18;
        switch (notification.type) {
            case "like":
                if (notification.project_id) {
                    return { icon: <HugeiconsIcon icon={ArrowUp01Icon} size={size} />, color: "var(--text-primary)" };
                }
                return { icon: <HugeiconsIcon icon={FavouriteIcon} size={size} />, color: "var(--text-primary)" };
            case "comment":
            case "reply":
                return { icon: <HugeiconsIcon icon={Comment01Icon} size={size} />, color: "var(--text-primary)" };
            case "follow":
                return { icon: <HugeiconsIcon icon={UserAdd01Icon} size={size} />, color: "var(--text-primary)" };
            case "mention":
                return { icon: <HugeiconsIcon icon={MailAtSign01Icon} size={size} />, color: "var(--text-primary)" };
            case "save":
                return { icon: <HugeiconsIcon icon={Bookmark02Icon} size={size} />, color: "var(--text-primary)" };
            case "message":
                return { icon: <HugeiconsIcon icon={Mail01Icon} size={size} />, color: "var(--text-primary)" };
            case "profile_view":
            case "project_view":
                return { icon: <HugeiconsIcon icon={ViewIcon} size={size} />, color: "var(--text-primary)" };
            case "cofounder_request":
                return { icon: <HugeiconsIcon icon={UserGroupIcon} size={size} />, color: "var(--text-primary)" };
            case "streak_warning":
                return { icon: <HugeiconsIcon icon={FireIcon} size={size} />, color: "#f97316" };
            case "milestone":
                return { icon: <HugeiconsIcon icon={MedalIcon} size={size} />, color: "#fff" };
            case "startup_upvote":
                return { icon: <HugeiconsIcon icon={ArrowUp01Icon} size={size} />, color: "var(--text-primary)" };
            default:
                return { icon: <HugeiconsIcon icon={Notification01Icon} size={size} />, color: "var(--text-primary)" };
        }
    };

    const getNotificationMessage = (notification: Notification & { groupCount?: number }) => {
        const actorName = notification.actor?.name || "Someone";
        const username = notification.actor?.username;

        const nameWrapper = (
            <span
                style={{ fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(username ? `/${username}` : `/user/${notification.actor_id}`);
                }}
            >
                {actorName}
                <VerifiedBadge username={username} size="12px" />
            </span>
        );

        switch (notification.type) {
            case "like":
                if (notification.groupCount && notification.groupCount > 1) {
                    const othersCount = notification.groupCount - 1;
                    return (
                        <>
                            {nameWrapper} and <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{othersCount} {othersCount === 1 ? "other" : "others"}</span> liked your {notification.project_id ? "project" : "post"}
                        </>
                    );
                }
                return <>{nameWrapper} liked your {notification.project_id ? "project" : "post"}</>;
            case "comment":
                return <>{nameWrapper} commented on your post</>;
            case "reply":
                return <>{nameWrapper} replied to your comment</>;
            case "follow":
                return <>{nameWrapper} started following you</>;
            case "mention":
                return <>{nameWrapper} mentioned you in a post</>;
            case "save":
                return <>{nameWrapper} saved your post</>;
            case "message":
                return <>{nameWrapper} sent you a message</>;
            case "profile_view":
                return <>{nameWrapper} viewed your profile</>;
            case "project_view":
                return <>{nameWrapper} viewed your project</>;
            case "cofounder_request":
                return <>{nameWrapper} requested to join your project as a co-founder</>;
            case "streak_warning":
                return <>Your streak is about to expire! Post something to keep it alive. <HugeiconsIcon icon={FireIcon} size={14} style={{ display: "inline", verticalAlign: "middle" }} /></>;
            case "milestone":
                return <>Congratulations! You've reached a new milestone. <HugeiconsIcon icon={StarIcon} size={14} style={{ display: "inline", verticalAlign: "middle" }} /></>;
            case "startup_upvote":
                return <>{nameWrapper} upvoted your startup</>;
            default:
                return <>You have a new notification</>;
        }
    };

    if (!isSignedIn) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
                <p style={{ color: "var(--text-tertiary)" }}>Please sign in to view notifications.</p>
            </div>
        );
    }

    return (
        <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
            <SEO title="Notifications" description="Stay updated with your community." />

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: isDesktop ? "920px" : "100%",
                margin: "0 auto",
                padding: "0",
            }}>
                {/* Main Notifications Column */}
                <div style={{
                    width: isDesktop ? "var(--feed-width)" : "100%",
                    maxWidth: isDesktop ? "var(--feed-width)" : "600px",
                    margin: isDesktop ? "0" : "0 auto",
                    flexShrink: 0,
                    borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
                    minHeight: "100vh",
                    position: "relative",
                    backgroundColor: "var(--bg-page)",
                }}>
                    {/* Header */}
                    <header style={{
                        position: "sticky",
                        top: isMobile ? "64px" : "0",
                        backgroundColor: "var(--bg-header)",
                        backdropFilter: "blur(24px)",
                        zIndex: 100,
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        borderBottom: "0.5px solid var(--border-hairline)"
                    }}>
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "var(--radius-sm)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="var(--text-primary)" />
                        </button>

                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: 0
                            }}>
                                Notifications
                            </h1>
                            {unreadCount > 0 && <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>{unreadCount} unread</span>}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead("all")}
                                style={{
                                    background: "transparent",
                                    border: "0.5px solid var(--border-hairline)",
                                    color: "var(--text-secondary)",
                                    padding: "6px 14px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </header>

                    {/* Notifications List */}
                    <div style={{ minHeight: "100vh" }}>
                        {loading && notifications.length === 0 && (
                            <div style={{ padding: "60px", textAlign: "center", display: "flex", justifyContent: "center" }}>
                                <div style={{
                                    width: "20px", height: "20px",
                                    border: "2px solid var(--border-hairline)",
                                    borderTopColor: "var(--text-primary)",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite"
                                }} />
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div style={{ padding: "120px 24px", textAlign: "center" }}>
                                <div style={{ marginBottom: "20px", fontSize: "32px", opacity: 0.2 }}>🔔</div>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>No notifications yet</h3>
                                <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>When someone interacts with you, it'll show up here.</p>
                            </div>
                        )}

                        {groupedNotifications.map((notification) => {
                            const { icon, color } = getNotificationIcon(notification);
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    style={{
                                        padding: isMobile ? "16px" : "20px 24px",
                                        borderBottom: "0.5px solid var(--border-hairline)",
                                        backgroundColor: notification.read ? "transparent" : "rgba(var(--text-primary-rgb), 0.02)",
                                        cursor: "pointer",
                                        display: "flex",
                                        gap: "16px",
                                        transition: "all 0.15s ease",
                                        position: "relative"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = notification.read ? "transparent" : "rgba(var(--text-primary-rgb), 0.02)"}
                                >
                                    {!notification.read && (
                                        <div style={{
                                            position: "absolute",
                                            left: "4px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: "4px",
                                            height: "32px",
                                            backgroundColor: "var(--text-primary)",
                                            borderRadius: "0 4px 4px 0"
                                        }} />
                                    )}

                                    {/* Left: Icon */}
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        color: color,
                                    }}>
                                        {icon}
                                    </div>

                                    {notification.type === "streak_warning" || notification.type === "milestone" ? (
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: "14.5px",
                                                color: "var(--text-primary)",
                                                lineHeight: 1.5,
                                                fontWeight: notification.read ? 400 : 700,
                                            }}>
                                                {getNotificationMessage(notification)}
                                            </p>
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: "11px",
                                                    color: "var(--text-tertiary)",
                                                    fontWeight: 500
                                                }}>
                                                    {formatRelativeDate(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Left-Middle: Avatar */}
                                            <div style={{ flexShrink: 0 }}>
                                                <img
                                                    src={notification.actor?.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                                                    alt=""
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        borderRadius: "10px",
                                                        objectFit: "cover",
                                                        border: "0.5px solid var(--border-hairline)",
                                                        backgroundColor: "var(--bg-hover)"
                                                    }}
                                                />
                                            </div>

                                            {/* Middle: Text Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: "14.5px",
                                                    color: "var(--text-primary)",
                                                    lineHeight: 1.5,
                                                    fontWeight: notification.read ? 400 : 600,
                                                    wordBreak: "break-word"
                                                }}>
                                                    {getNotificationMessage(notification)}
                                                </p>
                                                <p style={{
                                                    margin: "6px 0 0",
                                                    fontSize: "12px",
                                                    color: "var(--text-tertiary)",
                                                    fontWeight: 500
                                                }}>
                                                    {formatRelativeDate(notification.created_at)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Sidebar - Desktop Only */}
                {isDesktop && (
                    <aside style={{
                        width: "300px",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        height: "100vh"
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}
