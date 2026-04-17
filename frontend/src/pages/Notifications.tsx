import { useEffect } from "react";
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

    // Automatically mark all as read when entering the page
    useEffect(() => {
        if (!loading && unreadCount > 0) {
            markAsRead("all");
        }
    }, [loading, unreadCount, markAsRead]);

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

    const getNotificationMessage = (notification: Notification) => {
        const actorName = notification.actor?.name || "Someone";
        const username = notification.actor?.username;

        const nameWrapper = (
            <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", color: "var(--text-primary)", marginRight: "4px", fontSize: "14px" }}>
                {actorName}
                <VerifiedBadge username={username} size="14px" />
            </span>
        );

        switch (notification.type) {
            case "message":
                return <>{nameWrapper} Sent you a message</>;
            case "like":
                if (notification.metadata?.startupName) {
                    return <>{nameWrapper} Upvoted <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{notification.metadata.startupName}</span></>;
                }
                if (notification.project_id) {
                    return <>{nameWrapper} Upvoted your project</>;
                }
                if (notification.comment_id) {
                    return <>{nameWrapper} Liked your comment</>;
                }
                return <>{nameWrapper} Liked your post</>;
            case "comment":
                return <>{nameWrapper} {notification.project_id ? "Commented on your project" : "Commented on your post"}</>;
            case "follow":
                return <>{nameWrapper} Started following you</>;
            case "mention":
                if (notification.comment_id && notification.project_id) {
                    return <>{nameWrapper} Mentioned you in a project comment</>;
                } else if (notification.comment_id) {
                    return <>{nameWrapper} Mentioned you in a comment</>;
                }
                return <>{nameWrapper} Mentioned you in a post</>;
            case "reply":
                return <>{nameWrapper} Replied to your comment</>;
            case "save":
                return <>{nameWrapper} Saved your project</>;
            case "profile_view":
            case "project_view":
                return <>{nameWrapper} {notification.project_id ? "Viewed your project" : "Viewed your profile"}</>;
            case "cofounder_request":
                return <>{nameWrapper} Requested to be a Co-Founder for your project</>;
            case "streak_warning":
                return <span style={{ color: "#f97316" }}>{notification.content || "Your streak is about to break!"}</span>;
            case "milestone":
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>Milestone achieved</span>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                            {notification.metadata?.milestone || "New record"}
                        </div>
                    </div>
                );
            case "startup_upvote":
                const startupName = notification.metadata?.startupName || "your startup";
                return <>{nameWrapper} Upvoted <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{startupName}</span></>;
            default:
                return null;
        }
    };

    const renderContentPreview = (notification: Notification) => {
        let previewText = "";

        if (["comment", "reply", "mention", "like"].includes(notification.type)) {
            // Priority given to the 'content' field, fallback to metadata for legacy entries
            previewText = notification.content || notification.metadata?.postContent || notification.metadata?.commentText || notification.metadata?.text || "";
        }

        if (!previewText) return null;

        return (
            <div style={{
                marginTop: "12px",
                padding: "12px 16px",
                backgroundColor: "var(--bg-card)",
                border: "0.5px solid var(--border-hairline)",
                borderRadius: "12px",
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
            }}>
                {previewText}
            </div>
        );
    };

    const isMobile = width < 768;
    const isDesktop = width >= 1200;

    if (!isSignedIn && !loading) {
        navigate("/sign-in");
        return null;
    }

    return (
        <main style={{
            display: "flex",
            backgroundColor: "var(--bg-page)",
            minHeight: "100vh",
            width: "100%",
        }}>
            <SEO
                title="Notifications"
                description="Stay updated with your latest interactions on Codeown."
            />

            <div style={{
                display: "flex",
                width: isDesktop ? "920px" : "100%",
                maxWidth: "920px",
                position: "relative",
            }}>
                {/* Main Notifications Column */}
                <div style={{
                    width: isDesktop ? "620px" : "100%",
                    maxWidth: isDesktop ? "620px" : "700px",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    margin: isDesktop ? "0" : "0 auto",
                    position: "relative",
                    flexShrink: 0
                }}>
                    {/* Header */}
                    <header style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-header)",
                        backdropFilter: "blur(20px)",
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
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                    e.currentTarget.style.borderColor = "var(--text-primary)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </header>

                    {/* Notifications List */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {loading && (
                            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-tertiary)", fontWeight: 600, fontSize: "13px" }}>
                                Syncing...
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
                                    borderRadius: "var(--radius-sm)",
                                    backgroundColor: "var(--bg-hover)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--text-tertiary)",
                                    border: "0.5px solid var(--border-hairline)"
                                }}>
                                    <HugeiconsIcon icon={Notification01Icon} size={32} style={{ opacity: 0.5 }} />
                                </div>
                                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Nothing yet</h2>
                                <p style={{ fontSize: "14px", color: "var(--text-tertiary)", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
                                    Interaction is the heartbeat of Codeown. Build, share, and connect to see updates here.
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
                                        padding: "20px 24px",
                                        display: "flex",
                                        gap: "20px",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        backgroundColor: notification.read ? "var(--bg-page)" : "var(--bg-hover)",
                                        borderBottom: "0.5px solid var(--border-hairline)",
                                        position: "relative"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? "var(--bg-page)" : "var(--bg-hover)"}
                                >
                                    {/* Status Dot for Unread */}
                                    {!notification.read && (
                                        <div style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: "2px",
                                            backgroundColor: "var(--text-primary)"
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
                                        {itemStyle.icon}
                                    </div>

                                    {notification.type === "milestone" ? (
                                        <div style={{
                                            flex: 1,
                                            background: "var(--bg-hover)",
                                            border: "0.5px solid var(--border-hairline)",
                                            borderRadius: "var(--radius-sm)",
                                            padding: "24px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "16px",
                                            position: "relative",
                                            overflow: "hidden"
                                        }}>
                                            <div style={{ position: "absolute", top: "-10px", right: "-10px", opacity: 0.1, pointerEvents: "none" }}>
                                                <HugeiconsIcon icon={StarIcon} size={80} {...({ variant: "solid" } as any)} style={{ color: "var(--text-primary)" }} />
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
                                                <div style={{ fontSize: "32px" }}>{notification.metadata?.emoji || "✨"}</div>
                                                <div style={{ borderLeft: "0.5px solid var(--border-hairline)", paddingLeft: "12px" }}>
                                                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600 }}>Record unlocked</div>
                                                    <div style={{ fontSize: "14.5px", color: "var(--text-primary)", fontWeight: 700 }}>{notification.metadata?.milestone}</div>
                                                </div>
                                            </div>

                                            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, zIndex: 1 }}>
                                                {notification.content}
                                            </p>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px", zIndex: 1 }}>
                                                <div style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 500 }}>Codeown notification</div>
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
                                                }}>
                                                    {getNotificationMessage(notification)}
                                                </p>
                                                {renderContentPreview(notification)}
                                                <p style={{
                                                    margin: "8px 0 0",
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
                {isDesktop && !isMobile && (
                    <aside style={{
                        width: "300px",
                        padding: "0",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                    }}>
                        <RecommendedUsersSidebar />
                    </aside>
                )}
            </div>
        </main>
    );
}
