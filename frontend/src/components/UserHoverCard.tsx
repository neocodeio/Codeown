import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useFollow } from "../hooks/useFollow";
import VerifiedBadge from "./VerifiedBadge";
import { Chat01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserHoverCardSkeleton } from "./LoadingSkeleton";
import OfficialAccountBadge from "./OfficialAccountBadge";

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count?: number;
  following_count?: number;
  is_pro: boolean;
  streak_count?: number;
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
  const [hasLoadedUser, setHasLoadedUser] = useState<boolean>(
    !!initialUser && initialUser.streak_count !== undefined
  );
  const [hasLoadedFollow, setHasLoadedFollow] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user: clerkUser } = useClerkUser();
  const isOwnProfile = clerkUser?.id === userId;

  const { isFollowing, followerCount, loading: followLoading, toggleFollow, fetchFollowStatus } = useFollow(show ? userId : null);

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
        backgroundColor: "var(--bg-page)",
        borderRadius: "var(--radius-md)",
        boxShadow: "none",
        border: "0.5px solid var(--border-hairline)",
        overflow: "hidden",
        zIndex: 9999,
        animation: "userHoverFadeIn 0.15s ease-out",
      }}
    >
      <style>{`
        @keyframes userHoverFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {loading ? (
        <UserHoverCardSkeleton />
      ) : user ? (
        <>
          <div style={{ padding: "20px" }}>
            {/* Header: Avatar and Actions */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px"
            }}>
              <div
                onClick={handleProfileClick}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=000&color=fff&bold=true`}
                  alt=""
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "0.5px solid var(--border-hairline)"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {!isOwnProfile && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/messages?userId=${user.id}`); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: "0.5px solid var(--border-hairline)",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <HugeiconsIcon
                        icon={Chat01Icon}
                        size={24}
                        style={{ minWidth: 20, minHeight: 20 }}
                      />
                    </button>
                    <button
                      onClick={handleFollowClick}
                      disabled={followLoading}
                      style={{
                        padding: "0 18px",
                        height: "36px",
                        borderRadius: "100px",
                        border: isFollowing ? "0.5px solid var(--border-hairline)" : "none",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: followLoading ? "wait" : "pointer",
                        backgroundColor: isFollowing ? "transparent" : "var(--text-primary)",
                        color: isFollowing ? "var(--text-primary)" : "var(--bg-page)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div
                onClick={handleProfileClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
              >
                <h3 style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0
                }}>
                  {user.name}
                </h3>
                <VerifiedBadge username={user.username} isPro={user.is_pro} size="14px" />
                <OfficialAccountBadge username={user.username} size="14px" />
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13.5px",
                color: "var(--text-tertiary)",
                fontWeight: 500
              }}>
                <span>@{user.username || "user"}</span>
                <span>•</span>
                <span>
                  <strong style={{ color: "var(--text-secondary)" }}>{followerCount ?? user.follower_count ?? 0}</strong> followers
                </span>
              </div>

              {user.bio && (
                <p style={{
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                  margin: "10px 0 0",
                  fontWeight: 400
                }}>
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
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
