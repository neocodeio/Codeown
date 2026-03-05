import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useFollow } from "../hooks/useFollow";
import VerifiedBadge from "./VerifiedBadge";

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  is_pro: boolean;
}

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
  /** Optional pre-fetched user data to avoid extra request */
  user?: UserProfile | null;
}

const HOVER_DELAY_MS = 350;
const HIDE_DELAY_MS = 150;
const CARD_WIDTH = 320;
const CARD_OFFSET = 12;

export default function UserHoverCard({ userId, children, user: initialUser }: UserHoverCardProps) {
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const [show, setShow] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(initialUser ?? null);
  const [hasLoadedUser, setHasLoadedUser] = useState<boolean>(!!initialUser);
  const [hasLoadedFollow, setHasLoadedFollow] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user: clerkUser } = useClerkUser();
  const isOwnProfile = clerkUser?.id === userId;

  const { isFollowing, followerCount, followingCount, loading: followLoading, toggleFollow, fetchFollowStatus } = useFollow(show ? userId : null);

  const fetchUser = useCallback(async () => {
    if (!userId || hasLoadedUser) return;

    if (initialUser && !user) {
      setUser(initialUser);
      setHasLoadedUser(true);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await api.get(`/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUser(res.data);
      setHasLoadedUser(true);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId, initialUser, getToken, hasLoadedUser, user]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const above = spaceBelow < 260 && spaceAbove > spaceBelow;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - CARD_WIDTH / 2, window.innerWidth - CARD_WIDTH - 12));
    if (above) {
      setPosition({ bottom: window.innerHeight - rect.top + CARD_OFFSET, left });
    } else {
      setPosition({ top: rect.bottom + CARD_OFFSET, left });
    }
  }, []);

  const handleShow = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }

    showTimeout.current = setTimeout(() => {
      setShow(true);

      if (!hasLoadedUser) {
        fetchUser();
      }

      if (!hasLoadedFollow) {
        fetchFollowStatus();
        setHasLoadedFollow(true);
      }
    }, HOVER_DELAY_MS);
  }, [fetchUser, fetchFollowStatus, hasLoadedUser, hasLoadedFollow]);

  const handleHide = useCallback(() => {
    if (showTimeout.current) {
      clearTimeout(showTimeout.current);
      showTimeout.current = null;
    }
    hideTimeout.current = setTimeout(() => setShow(false), HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    if (show) updatePosition();
  }, [show, user, updatePosition]);

  useEffect(() => {
    return () => {
      if (showTimeout.current) clearTimeout(showTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.username) navigate(`/${user.username}`);
    else navigate(`/user/${userId}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow();
  };

  const cardContent = show && (
    <div
      ref={cardRef}
      role="tooltip"
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      style={{
        position: "fixed",
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: CARD_WIDTH,
        maxWidth: "calc(100vw - 24px)",
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        zIndex: 9999,
        animation: "userHoverFadeIn 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes userHoverFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {loading ? (
        <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
          Loading...
        </div>
      ) : user ? (
        <>
          <div style={{ padding: "20px 20px 16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=56`}
                alt=""
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  onClick={handleProfileClick}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    {user.name}
                  </span>
                  <VerifiedBadge username={user.username} isPro={user.is_pro} size="14px" />
                  {user.is_pro && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      letterSpacing: "0.02em",
                    }}>PRO</span>
                  )}
                </div>
                <span style={{ fontSize: "14px", color: "#64748b" }}>
                  @{user.username || "user"}
                </span>
              </div>
            </div>
            {user.bio && (
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "#64748b",
                  margin: "12px 0 0",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {user.bio}
              </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "12px 20px 16px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              <strong style={{ color: "#0f172a" }}>{followerCount ?? user.follower_count ?? 0}</strong> followers
            </span>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              <strong style={{ color: "#0f172a" }}>{followingCount ?? user.following_count ?? 0}</strong> following
            </span>
          </div>
          {!isOwnProfile && (
            <div style={{ padding: "0 20px 20px" }}>
              <button
                onClick={handleFollowClick}
                disabled={followLoading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: followLoading ? "wait" : "pointer",
                  backgroundColor: isFollowing ? "#f1f5f9" : "#0f172a",
                  color: isFollowing ? "#475569" : "#fff",
                  transition: "all 0.2s ease",
                }}
              >
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
          User not found
        </div>
      )}
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        {children}
      </span>
      {show && createPortal(cardContent, document.body)}
    </>
  );
}
