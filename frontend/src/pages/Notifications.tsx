import { useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { NotificationSkeleton } from "../components/LoadingSkeleton";
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
import {
    Delete02Icon,
    Tick02Icon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import api from "../api/axios";
import { toast } from "sonner";

export default function NotificationsPage() {
    const { getToken, isSignedIn } = useClerkAuth();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [platformEnabled, setPlatformEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isFetchingSettings, setIsFetchingSettings] = useState(false);

    const fetchUserSettings = async () => {
        setIsFetchingSettings(true);
        try {
            // Priority 1: LocalStorage (Instant)
            const localPlatform = localStorage.getItem('notifications_platform');
            const localEmail = localStorage.getItem('notifications_email');

            if (localPlatform !== null) setPlatformEnabled(localPlatform === 'true');
            if (localEmail !== null) setEmailEnabled(localEmail === 'true');

            // Priority 2: Sync from Server (Secondary)
            const token = await getToken();
            const { data: user } = await api.get(`/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (user) {
                // Only update if local is not set or we want server to be source of truth eventually
                if (localPlatform === null) setPlatformEnabled(user.notifications_enabled !== false);
                if (localEmail === null) setEmailEnabled(user.email_notifications_enabled !== false);
            }
        } catch (error) {
            console.error("Failed to fetch notification settings:", error);
        } finally {
            setIsFetchingSettings(false);
        }
    };

    const renderCommentPreview = (content: string) => {
        if (!content) return null;

        const mediaRegex = /(https?:\/\/[^\s]+(?:\.gif|\.jpe?g|\.png|\.webp|\.bmp)|https?:\/\/media[0-9]*\.giphy\.com\/[^\s]+|https?:\/\/tenor\.com\/[^\s]+)/gi;

        const imageParts: string[] = [];
        let textDisplay = content;

        const matches = content.match(mediaRegex);
        if (matches) {
            matches.forEach(url => {
                imageParts.push(url);
                textDisplay = textDisplay.replace(url, '').trim();
            });
        }

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {textDisplay && <span style={{ display: "block", marginBottom: imageParts.length > 0 ? "4px" : 0 }}>"{textDisplay}"</span>}
                {imageParts.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                        {imageParts.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt="Media"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "180px",
                                    borderRadius: "12px",
                                    border: "0.5px solid var(--border-hairline)",
                                    objectFit: "cover",
                                    display: "block"
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            // Save to LocalStorage immediately
            localStorage.setItem('notifications_platform', platformEnabled.toString());
            localStorage.setItem('notifications_email', emailEnabled.toString());

            const token = await getToken();
            await api.post(`/users/notifications/settings`, {
                notifications_enabled: platformEnabled,
                email_notifications_enabled: emailEnabled
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Notification settings updated", {
                style: {
                    borderRadius: '12px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600
                }
            });
            setIsSettingsModalOpen(false);
        } catch (error) {
            // Still success if localStorage worked, but maybe warn if server failed
            setIsSettingsModalOpen(false);
            toast.success("Settings saved locally");
        } finally {
            setIsSavingSettings(false);
        }
    };
    const {
        notifications,
        unreadCount,
        markAsRead,
        loading,
        deleteNotification,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useNotifications();

    // Fixed duplicate isSignedIn
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const isDesktop = width >= 1200;
    const [activeTab, setActiveTab] = useState<"All" | "Mentions">("All");

    useEffect(() => {
        if (isSettingsModalOpen) {
            fetchUserSettings();
        }
    }, [isSettingsModalOpen]);

    const NotificationSettingsModal = () => (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }} onClick={() => setIsSettingsModalOpen(false)}>
            <div style={{
                width: "100%",
                maxWidth: "400px",
                backgroundColor: "var(--bg-page)",
                borderRadius: "24px",
                border: "0.5px solid var(--border-hairline)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Notification Settings</h2>
                    <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                        <HugeiconsIcon icon={Cancel01Icon} size={20} />
                    </button>
                </div>
                {/* Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px", width: "100%", opacity: isFetchingSettings ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <div style={{ maxWidth: "70%" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Platform Notifications</div>
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Direct alerts inside Codeown</div>
                        </div>
                        <button
                            onClick={() => setPlatformEnabled(!platformEnabled)}
                            disabled={isFetchingSettings}
                            style={{
                                width: "44px",
                                height: "24px",
                                minWidth: "44px",
                                borderRadius: "100px",
                                backgroundColor: platformEnabled ? "var(--text-primary)" : "var(--bg-hover)",
                                border: "none",
                                cursor: isFetchingSettings ? "not-allowed" : "pointer",
                                position: "relative",
                                transition: "all 0.3s ease"
                            }}
                        >
                            <div style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: platformEnabled ? "var(--bg-page)" : "var(--text-tertiary)",
                                position: "absolute",
                                top: "4px",
                                left: platformEnabled ? "24px" : "4px",
                                transition: "all 0.3s ease"
                            }} />
                        </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <div style={{ maxWidth: "70%" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Email Notifications</div>
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Get updates in your inbox</div>
                        </div>
                        <button
                            onClick={() => setEmailEnabled(!emailEnabled)}
                            disabled={isFetchingSettings}
                            style={{
                                width: "44px",
                                height: "24px",
                                minWidth: "44px",
                                borderRadius: "100px",
                                backgroundColor: emailEnabled ? "var(--text-primary)" : "var(--bg-hover)",
                                border: "none",
                                cursor: isFetchingSettings ? "not-allowed" : "pointer",
                                position: "relative",
                                transition: "all 0.3s ease"
                            }}
                        >
                            <div style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: emailEnabled ? "var(--bg-page)" : "var(--text-tertiary)",
                                position: "absolute",
                                top: "4px",
                                left: emailEnabled ? "24px" : "4px",
                                transition: "all 0.3s ease"
                            }} />
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "12px",
                            backgroundColor: "var(--text-primary)",
                            color: "var(--bg-page)",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            opacity: isSavingSettings ? 0.7 : 1
                        }}
                    >
                        {isSavingSettings ? "Saving..." : (
                            <>
                                <HugeiconsIcon icon={Tick02Icon} size={18} />
                                Save Preferences
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

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
                const postKey = n.comment_id ? `comment_${n.comment_id}` : n.post_id ? `post_${n.post_id}` : n.project_id ? `project_${n.project_id}` : null;
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
                        const currentPostId = n.comment_id || n.post_id || n.project_id;
                        if (!group.postIds) group.postIds = new Set([group.comment_id || group.post_id || group.project_id || 'unknown']);

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

    const observerTarget = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || isFetchingNextPage) return;
        if (observerTarget.current) observerTarget.current.disconnect();

        observerTarget.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observerTarget.current.observe(node);
    }, [loading, isFetchingNextPage, hasNextPage, fetchNextPage]);

    const handleNotificationClick = (notification: Notification & { groupIds?: number[] }) => {
        if (!notification.read) {
            if (notification.groupIds) {
                notification.groupIds.forEach(id => markAsRead(id));
            } else {
                markAsRead(notification.id);
            }
        }

        if (notification.comment_id) {
            navigate(`/comment/${notification.comment_id}`);
        } else if (notification.post_id) {
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
        const size = isMobile ? 22 : 26;
        switch (notification.type) {
            case "like":
                if (notification.project_id) {
                    return { icon: <HugeiconsIcon icon={ArrowUp01Icon} size={size} />, color: "#3b82f6" }; // Blue
                }
                return { icon: <HugeiconsIcon icon={FavouriteIcon} size={size} className="hugeicon-filled" />, color: "#f43f5e" }; // Rose/Red
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

        const getTargetLabel = (n: any) => {
            if (n.comment_id) return "comment";
            if (n.project_id) return "project";
            if (n.startup_id) return "startup";
            return "post";
        };

        switch (notification.type) {
            case "like":
                if (notification.isMultiActor && notification.groupCount && notification.groupCount > 1) {
                    const othersCount = notification.groupCount - 1;
                    return (
                        <>
                            {nameWrapper}{" "}and <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{othersCount} {othersCount === 1 ? "other" : "others"}</span> liked your {getTargetLabel(notification)}
                        </>
                    );
                }
                if (notification.isMultiPost && notification.groupCount && notification.groupCount > 1) {
                    const label = getTargetLabel(notification);
                    return (
                        <>
                            {nameWrapper}{" "}liked <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{notification.groupCount}</span> of your {label}s
                        </>
                    );
                }
                return <>{nameWrapper}{" "}liked your {getTargetLabel(notification)}</>;
            case "comment":
                return <>{nameWrapper}{" "}commented on your {notification.project_id ? "project" : "post"}</>;
            case "reply":
                return <>{nameWrapper}{" "}replied to your comment</>;
            case "follow":
                return <>{nameWrapper}{" "}started following you</>;
            case "mention":
                return <>{nameWrapper}{" "}mentioned you in a {getTargetLabel(notification)}</>;
            case "save":
                return <>{nameWrapper}{" "}saved your {getTargetLabel(notification)}</>;
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
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
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
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="var(--text-primary)" />
                                </button>

                                <div style={{ minWidth: 0 }}>
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
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", marginTop: "-14px", marginBottom: "-18px", width: "100%" }}>
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
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {[...Array(8)].map((_, i) => (
                                    <NotificationSkeleton key={i} />
                                ))}
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

                                                {notification.comment?.content && (
                                                    <div style={{
                                                        marginTop: "12px",
                                                        padding: "12px",
                                                        borderRadius: "16px",
                                                        border: "0.5px solid var(--border-hairline)",
                                                        backgroundColor: "rgba(var(--text-primary-rgb), 0.03)",
                                                        display: "flex",
                                                        gap: "12px"
                                                    }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, fontStyle: "italic", borderLeft: "2px solid var(--border-light)", paddingLeft: "8px" }}>
                                                                "{notification.comment.content}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {(notification.post || notification.project) && !notification.comment?.content && (
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
                                                width: isMobile ? "40px" : "48px",
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
                                                        {getNotificationMessage(notification)}
                                                    </p>

                                                    {notification.comment?.content && (
                                                        <div style={{
                                                            marginTop: "8px",
                                                            padding: "12px",
                                                            borderRadius: "16px",
                                                            border: "0.5px solid var(--border-hairline)",
                                                            backgroundColor: "rgba(var(--text-primary-rgb), 0.03)",
                                                            display: "flex",
                                                            gap: "12px"
                                                        }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, fontStyle: "italic", borderLeft: "2px solid var(--border-light)", paddingLeft: "8px" }}>
                                                                    {renderCommentPreview(notification.comment.content)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {notification.post && !notification.comment?.content && (
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

                    {/* Infinite Scroll Trigger */}
                    {hasNextPage && (
                        <div
                            ref={loadMoreRef}
                            style={{
                                padding: "40px 0",
                                display: "flex",
                                justifyContent: "center",
                                opacity: isFetchingNextPage ? 1 : 0,
                                transition: "opacity 0.2s"
                            }}
                        >
                            <div style={{
                                width: "24px",
                                height: "24px",
                                border: "2px solid var(--border-light)",
                                borderTopColor: "var(--text-primary)",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite"
                            }} />
                        </div>
                    )}
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

            {isSettingsModalOpen && <NotificationSettingsModal />}

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
