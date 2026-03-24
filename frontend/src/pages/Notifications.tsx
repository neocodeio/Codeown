import { useNavigate } from "react-router-dom";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { 
  CaretLeft,
  Bell,
  Eye,
  Heart,
  ChatTeardropText,
  UserPlus,
  ArrowUp,
  At,
  BookmarkSimple,
  EnvelopeSimple,
  Handshake,
  Flame,
  Star,
  Trophy,
} from "phosphor-react";
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
        const size = 18;
        const weight = "thin";
        switch (notification.type) {
            case "like":
                if (notification.project_id) {
                    return { icon: <ArrowUp size={size} weight={weight} />, color: "var(--text-primary)" };
                }
                return { icon: <Heart size={size} weight={weight} />, color: "var(--text-primary)" };
            case "comment":
            case "reply":
                return { icon: <ChatTeardropText size={size} weight={weight} />, color: "var(--text-primary)" };
            case "follow":
                return { icon: <UserPlus size={size} weight={weight} />, color: "var(--text-primary)" };
            case "mention":
                return { icon: <At size={size} weight={weight} />, color: "var(--text-primary)" };
            case "save":
                return { icon: <BookmarkSimple size={size} weight={weight} />, color: "var(--text-primary)" };
            case "message":
                return { icon: <EnvelopeSimple size={size} weight={weight} />, color: "var(--text-primary)" };
            case "profile_view":
            case "project_view":
                return { icon: <Eye size={size} weight={weight} />, color: "var(--text-primary)" };
            case "cofounder_request":
                return { icon: <Handshake size={size} weight={weight} />, color: "var(--text-primary)" };
            case "streak_warning":
                return { icon: <Flame size={size} weight={weight} />, color: "#f97316" }; // Orange color for fire
            case "milestone":
                return { icon: <Trophy size={size} weight={weight} />, color: "#fff" };
            default:
                return { icon: <Bell size={size} weight={weight} />, color: "var(--text-primary)" };
        }
    };

    const getNotificationMessage = (notification: Notification) => {
        const actorName = notification.actor?.name || "Someone";
        const username = notification.actor?.username;

        const nameWrapper = (
            <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", color: "var(--text-primary)", marginRight: "4px", textTransform: "uppercase", fontSize: "14px" }}>
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
                        <span style={{ fontSize: "12px", color: "#fff", fontWeight: 800, fontFamily: "var(--font-mono)", textTransform: "uppercase", opacity: 0.6 }}>Milestone_Station</span>
                        <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                            {notification.metadata?.milestone || "A NEW RECORD"}
                        </div>
                    </div>
                );
            default:
                return <>{notification.content || "New notification"}</>;
        }
    };

    if (!isSignedIn && !loading) {
        navigate("/sign-in");
        return null;
    }

    return (
        <main style={{ padding: 0, backgroundColor: "var(--bg-page)", width: "100%" }}>
            <SEO
                title="NOTIFICATIONS"
                description="Stay updated with your latest interactions on Codeown."
            />

            <div style={{
                display: "grid",
                gridTemplateColumns: width >= 1400 ? "1fr 600px 1fr" : width >= 1280 ? "100px 600px 1fr" : "1fr",
                width: "100%",
                backgroundColor: "var(--bg-page)",
            }}>
                {/* Left Balance Spacer (only desktop) */}
                {width >= 1280 && <div />}
                {/* Main Notifications Column */}
                <div style={{
                    maxWidth: width >= 1024 ? "600px" : "100%",
                    width: "100%",
                    backgroundColor: "var(--bg-page)",
                    borderLeft: width >= 1024 ? "0.5px solid var(--border-hairline)" : "none",
                    borderRight: width >= 1024 ? "0.5px solid var(--border-hairline)" : "none",
                    minHeight: "100vh",
                    margin: width >= 1280 ? "0" : "0 auto"
                }}>
                    {/* Header */}
                    <header style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-page)",
                        zIndex: 100,
                        padding: "20px 24px",
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
                            <CaretLeft size={20} weight="thin" color="var(--text-primary)" />
                        </button>

                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: 0,
                                letterSpacing: "0.05em",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase"
                            }}>
                                NOTIFICATIONS
                            </h1>
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
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
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
                            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-tertiary)", fontWeight: 600, fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                                SYNCING...
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
                                    <Bell size={32} weight="thin" style={{ opacity: 0.5 }} />
                                </div>
                                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Nothing yet</h2>
                                <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
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
                                        padding: "24px",
                                        display: "flex",
                                        gap: "24px",
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
                                            background: "rgba(23, 23, 23, 1)",
                                            border: "0.5px solid rgba(255,255,255,0.1)",
                                            borderRadius: "var(--radius-md)",
                                            padding: "24px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "16px",
                                            position: "relative",
                                            overflow: "hidden",
                                            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)"
                                        }}>
                                            <div style={{ position: "absolute", top: "-10px", right: "-10px", opacity: 0.1, pointerEvents: "none" }}>
                                                 <Star size={80} weight="fill" color="#fff" />
                                            </div>
                                            
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
                                                <div style={{ fontSize: "32px" }}>{notification.metadata?.emoji || "✨"}</div>
                                                <div style={{ borderLeft: "0.5px solid rgba(255,255,255,0.2)", paddingLeft: "12px" }}>
                                                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 900, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Record Unlocked</div>
                                                    <div style={{ fontSize: "13px", color: "#fff", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{notification.metadata?.milestone?.toUpperCase()}</div>
                                                </div>
                                            </div>

                                            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, zIndex: 1 }}>
                                                {notification.content}
                                            </p>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px", zIndex: 1 }}>
                                                <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.1)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>SYNC_ID_CORE_{Math.floor(1000 + (notification.id % 9000))}</div>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: "10px",
                                                    color: "rgba(255,255,255,0.3)",
                                                    fontWeight: 700,
                                                    fontFamily: "var(--font-mono)",
                                                    textTransform: "uppercase"
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
                                                borderRadius: "var(--radius-sm)",
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
                                            fontSize: "14px",
                                            color: "var(--text-primary)",
                                            lineHeight: 1.5,
                                            fontWeight: notification.read ? 400 : 700,
                                        }}>
                                            {getNotificationMessage(notification)}
                                        </p>
                                        <p style={{
                                            margin: "6px 0 0",
                                            fontSize: "11px",
                                            color: "var(--text-tertiary)",
                                            fontWeight: 700,
                                            fontFamily: "var(--font-mono)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em"
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

                {/* Right Balance Spacer (only desktop) */}
                {width >= 1280 && <div />}
            </div>
        </main>
    );
}
