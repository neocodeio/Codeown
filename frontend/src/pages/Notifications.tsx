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
} from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, loading, deleteNotification } = useNotifications();
    const { isSignedIn } = useClerkAuth();
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1200;
    const [activeTab, setActiveTab] = useState<"All" | "Mentions">("All");

    // Grouping logic for "like" notifications
    const [initialPulseActive, setInitialPulseActive] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setInitialPulseActive(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const groupedNotifications = useMemo(() => {
        const TIME_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours
        const grouped: (Notification & {
            groupCount?: number;
            groupIds?: number[];
            actorIds?: Set<string>;
            actors?: any[];
            postIds?: Set<string | number>;
            isMultiActor?: boolean;
            isMultiPost?: boolean;
        })[] = [];

        const postLikeMap = new Map<string, number>();
        const actorLikeMap = new Map<string, number>();

        notifications.forEach((n) => {
            if (n.type === "like") {
                const postKey = n.post_id ? `post_${n.post_id}` : n.project_id ? `project_${n.project_id}` : null;
                const actorKey = n.actor_id;
                const notifTime = new Date(n.created_at).getTime();

                // 1. Priority: Group by POST (Many people liking the same post)
                if (postKey && postLikeMap.has(postKey)) {
                    const idx = postLikeMap.get(postKey)!;
                    const group = grouped[idx];
                    const groupTime = new Date(group.created_at).getTime();

                    if (Math.abs(groupTime - notifTime) < TIME_THRESHOLD) {
                        if (!group.actorIds) {
                            group.actorIds = new Set([group.actor_id]);
                            group.actors = [group.actor];
                        }

                        if (!group.actorIds.has(n.actor_id)) {
                            group.isMultiActor = true;
                            group.groupCount = (group.groupCount || 1) + 1;
                            if (!group.groupIds) group.groupIds = [group.id];
                            group.groupIds.push(n.id);
                            group.actorIds.add(n.actor_id);
                            group.actors?.push(n.actor);
                            if (!n.read) group.read = false;
                            return;
                        }
                    }
                }

                // 2. Secondary: Group by ACTOR (Same person liking multiple of your posts)
                if (actorKey && actorLikeMap.has(actorKey)) {
                    const idx = actorLikeMap.get(actorKey)!;
                    const group = grouped[idx];
                    const groupTime = new Date(group.created_at).getTime();

                    if (Math.abs(groupTime - notifTime) < TIME_THRESHOLD && !group.isMultiActor) {
                        const currentPostId = n.post_id || n.project_id;
                        if (!group.postIds) group.postIds = new Set([group.post_id || group.project_id || 'unknown']);

                        if (currentPostId && !group.postIds.has(currentPostId)) {
                            group.isMultiPost = true;
                            group.groupCount = (group.groupCount || 1) + 1;
                            if (!group.groupIds) group.groupIds = [group.id];
                            group.groupIds.push(n.id);
                            group.postIds.add(currentPostId);
                            if (!n.read) group.read = false;
                            return;
                        }
                    }
                }

                const newIdx = grouped.length;
                if (postKey) postLikeMap.set(postKey, newIdx);
                actorLikeMap.set(actorKey, newIdx);
            }
            grouped.push({ ...n });
        });

        if (activeTab === "Mentions") {
            return grouped.filter(n => n.type === "mention" || n.type === "reply" || n.type === "comment");
        }
        return grouped;
    }, [notifications, activeTab]);

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
                    return { icon: <HugeiconsIcon icon={ArrowUp01Icon} size={size} />, color: "#3b82f6" }; // Blue
                }
                return { icon: <HugeiconsIcon icon={FavouriteIcon} size={size} />, color: "#f43f5e" }; // Rose/Red
            case "comment":
            case "reply":
                return { icon: <HugeiconsIcon icon={Comment01Icon} size={size} />, color: "#1d9bf0" }; // Twitter Blue
            case "follow":
                return { icon: <HugeiconsIcon icon={UserAdd01Icon} size={size} />, color: "#10b981" }; // Emerald Green
            case "mention":
                return { icon: <HugeiconsIcon icon={MailAtSign01Icon} size={size} />, color: "#8b5cf6" }; // Violet
            case "save":
                return { icon: <HugeiconsIcon icon={Bookmark02Icon} size={size} />, color: "#f59e0b" }; // Amber
            case "message":
                return { icon: <HugeiconsIcon icon={Mail01Icon} size={size} />, color: "#14b8a6" }; // Teal
            case "profile_view":
            case "project_view":
                return { icon: <HugeiconsIcon icon={ViewIcon} size={size} />, color: "#64748b" }; // Slate
            case "cofounder_request":
                return { icon: <HugeiconsIcon icon={UserGroupIcon} size={size} />, color: "#ec4899" }; // Pink
            case "streak_warning":
                return { icon: <HugeiconsIcon icon={FireIcon} size={size} />, color: "#f97316" }; // Orange
            case "milestone":
                return { icon: <HugeiconsIcon icon={StarIcon} size={size} />, color: "#fbbf24" }; // Gold
            case "startup_upvote":
                return { icon: <HugeiconsIcon icon={ArrowUp01Icon} size={size} />, color: "#3b82f6" }; // Blue
            default:
                return { icon: <HugeiconsIcon icon={Notification01Icon} size={size} />, color: "var(--text-secondary)" };
        }
    };

    const getNotificationMessage = (notification: Notification & {
        groupCount?: number;
        isMultiActor?: boolean;
        isMultiPost?: boolean
    }) => {
        const actorName = notification.actor?.name || "Someone";
        const username = notification.actor?.username;

        const nameWrapper = (
            <span
                style={{
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    verticalAlign: "top"
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(username ? `/${username}` : `/user/${notification.actor_id}`);
                }}
            >
                {actorName}
                <VerifiedBadge username={username} size="14px" />
            </span>
        );

        switch (notification.type) {
            case "like":
                if (notification.isMultiActor && notification.groupCount && notification.groupCount > 1) {
                    const othersCount = notification.groupCount - 1;
                    return (
                        <>
                            {nameWrapper}{" "}and <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{othersCount} {othersCount === 1 ? "other" : "others"}</span> liked your {notification.project_id ? "project" : "post"}
                        </>
                    );
                }
                if (notification.isMultiPost && notification.groupCount && notification.groupCount > 1) {
                    return (
                        <>
                            {nameWrapper}{" "}liked <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{notification.groupCount}</span> of your post
                        </>
                    );
                }
                return <>{nameWrapper}{" "}liked your {notification.project_id ? "project" : "post"}</>;
            case "comment":
                return <>{nameWrapper}{" "}commented on your post</>;
            case "reply":
                return <>{nameWrapper}{" "}replied to your comment</>;
            case "follow":
                return <>{nameWrapper}{" "}started following you</>;
            case "mention":
                return <>{nameWrapper}{" "}mentioned you in a post</>;
            case "save":
                return <>{nameWrapper}{" "}saved your post</>;
            case "message":
                return <>{nameWrapper}{" "}sent you a message</>;
            case "profile_view":
                return <>{nameWrapper}{" "}viewed your profile</>;
            case "project_view":
                return <>{nameWrapper}{" "}viewed your project</>;
            case "cofounder_request":
                return <>{nameWrapper}{" "}requested to join your project as a co-founder</>;
            case "streak_warning":
                return <>Your streak is about to expire! Post something to keep it alive. <HugeiconsIcon icon={FireIcon} size={14} style={{ display: "inline", verticalAlign: "middle" }} /></>;
            case "milestone":
                return <>Congratulations! You've reached a new milestone. <HugeiconsIcon icon={StarIcon} size={14} style={{ display: "inline", verticalAlign: "middle" }} /></>;
            case "startup_upvote":
                return <>{nameWrapper}{" "}upvoted your startup</>;
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
                        gap: "24px",
                        borderBottom: "0.5px solid var(--border-hairline)",
                        flexDirection: "column",
                        alignItems: "flex-start"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
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
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", marginTop: "12px", marginBottom: "-18px", width: "100%" }}>
                            {["All", "Mentions"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    style={{
                                        flex: 1,
                                        background: "none",
                                        border: "none",
                                        padding: "16px 0",
                                        fontSize: "15px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        color: activeTab === tab ? "var(--text-primary)" : "var(--text-tertiary)",
                                        position: "relative",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "0" // 0 border radius
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <span style={{ position: "relative" }}>
                                        {tab}
                                        {activeTab === tab && (
                                            <div style={{
                                                position: "absolute",
                                                bottom: "-16px",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                width: "32px",
                                                height: "4px",
                                                backgroundColor: "var(--text-primary)",
                                                borderRadius: "0", // 0 border radius for line too if preferred, or stick to bar
                                                zIndex: 1
                                            }} />
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
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
                                    className="notification-row"
                                    style={{
                                        padding: isMobile ? "16px" : "20px 24px",
                                        borderBottom: "0.5px solid var(--border-hairline)",
                                        backgroundColor: notification.read ? "transparent" : "rgba(var(--text-primary-rgb), 0.02)",
                                        cursor: "pointer",
                                        display: "flex",
                                        gap: "16px",
                                        transition: "all 0.15s ease",
                                        position: "relative",
                                        animation: (!notification.read && initialPulseActive) ? "pulse-bg 1.5s ease-in-out infinite" : "none"
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

                                    {notification.type === "mention" || notification.type === "reply" || notification.type === "comment" ? (
                                        <>
                                            {/* Twitter-like Content Style */}
                                            <div style={{ flexShrink: 0 }}>
                                                <img
                                                    src={notification.actor?.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                                                    alt=""
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        border: "0.5px solid var(--border-hairline)"
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>{notification.actor?.name || "User"}</span>
                                                        {(notification.actor as any)?.is_verified && <VerifiedBadge size="14px" />}
                                                        <span style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
                                                            @{notification.actor?.username} · {formatRelativeDate(notification.created_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {notification.type === "reply" && (
                                                    <div style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "4px" }}>
                                                        Replying to <span style={{ color: "#1d9bf0", cursor: "pointer" }}>@you</span>
                                                    </div>
                                                )}

                                                <p style={{
                                                    margin: 0,
                                                    fontSize: "15px",
                                                    color: "var(--text-primary)",
                                                    lineHeight: 1.5,
                                                    fontWeight: 400,
                                                    wordBreak: "break-word"
                                                }}>
                                                    {getNotificationMessage(notification)}
                                                </p>

                                                {(notification.post || notification.project) && (
                                                    <div style={{
                                                        marginTop: "12px",
                                                        padding: "12px",
                                                        borderRadius: "16px",
                                                        border: "0.5px solid var(--border-hairline)",
                                                        backgroundColor: "rgba(var(--text-primary-rgb), 0.03)",
                                                        display: "flex",
                                                        gap: "12px"
                                                    }}>
                                                        {(notification.post?.image || notification.project?.image) && (
                                                            <img
                                                                src={(notification.post?.image || notification.project?.image) ?? undefined}
                                                                style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "cover" }}
                                                            />
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                                                                {notification.post?.title || notification.project?.name}
                                                            </p>
                                                            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: "4px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                                {notification.post?.content || "View full discussion"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Awareness/Interaction Style */}
                                            <div style={{
                                                width: "40px",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-end",
                                                flexShrink: 0,
                                            }}>
                                                <div style={{ transform: "translateY(4px)", color: color }}>{icon}</div>
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    {notification.isMultiActor && notification.actors && notification.actors.length > 1 ? (
                                                        <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", alignItems: "center" }}>
                                                            {notification.actors.slice(0, 6).map((actor, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={actor?.avatar_url ?? "https://images.clerk.dev/static/avatar.png"}
                                                                    alt=""
                                                                    style={{
                                                                        width: "32px",
                                                                        height: "32px",
                                                                        borderRadius: "50%",
                                                                        objectFit: "cover",
                                                                        border: "2px solid var(--bg-page)",
                                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                                                    }}
                                                                />
                                                            ))}
                                                            {notification.actors.length > 6 && (
                                                                <div style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "50%",
                                                                    backgroundColor: "var(--bg-hover)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontSize: "10px",
                                                                    color: "var(--text-tertiary)",
                                                                    border: "1px solid var(--border-hairline)",
                                                                    fontWeight: 700
                                                                }}>
                                                                    +{notification.actors.length - 6}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={notification.actor?.avatar_url || "https://images.clerk.dev/static/avatar.png"}
                                                            alt=""
                                                            style={{
                                                                width: "32px",
                                                                height: "32px",
                                                                borderRadius: "50%",
                                                                objectFit: "cover",
                                                                border: "0.5px solid var(--border-hairline)"
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: "15px",
                                                        color: "var(--text-primary)",
                                                        lineHeight: 1.4,
                                                        fontWeight: 400,
                                                        wordBreak: "break-word"
                                                    }}>
                                                        <span style={{ fontWeight: 700 }}>{notification.actor?.name || "User"}</span>
                                                        {notification.groupCount && notification.groupCount > 1 ? ` and ${notification.groupCount - 1} others` : ""}
                                                        {" "}{notification.type === "like" ? "liked your post" : notification.type === "follow" ? "followed you" : "interacted with you"}
                                                    </p>

                                                    {notification.post && (
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: "15px",
                                                            color: "var(--text-tertiary)",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden"
                                                        }}>
                                                            {notification.post.title || notification.post.content}
                                                        </p>
                                                    )}

                                                    <p style={{
                                                        marginTop: "2px",
                                                        fontSize: "13px",
                                                        color: "var(--text-tertiary)",
                                                        fontWeight: 400
                                                    }}>
                                                        {formatRelativeDate(notification.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Action Button (Delete) on Hover */}
                                    <div className="notification-actions" style={{ marginLeft: "auto", flexShrink: 0, position: "absolute", top: "12px", right: "12px" }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (notification.id) deleteNotification(notification.id);
                                            }}
                                            className="delete-btn"
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "8px",
                                                borderRadius: "var(--radius-pill)",
                                                color: "var(--text-tertiary)",
                                                opacity: 0,
                                                transition: "all 0.2s ease"
                                            }}
                                        >
                                            <HugeiconsIcon icon={Delete02Icon} size={18} />
                                        </button>
                                    </div>
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
                @keyframes pulse-bg {
                    0% { background-color: rgba(var(--text-primary-rgb), 0.02); }
                    50% { background-color: rgba(var(--text-primary-rgb), 0.06); }
                    100% { background-color: rgba(var(--text-primary-rgb), 0.02); }
                }
                .unread-pulse {
                    animation: pulse-bg 2s ease-in-out infinite;
                }
                .notification-row:hover .delete-btn {
                    opacity: 1 !important;
                }
                .delete-btn:hover {
                    background-color: rgba(255, 77, 79, 0.1);
                }
            `}</style>
        </main >
    );
}
