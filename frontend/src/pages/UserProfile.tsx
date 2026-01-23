import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useUserPosts } from "../hooks/useUserPosts";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import PostCard from "../components/PostCard";
import FollowersModal from "../components/FollowersModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faThumbtack, faUserCheck } from "@fortawesome/free-solid-svg-icons";

interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
  follower_count: number;
  following_count: number;
  total_likes: number;
  pinned_post_id: number | null;
  pinned_post: any | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { posts, loading: postsLoading, fetchUserPosts } = useUserPosts(userId || null);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getToken();
        const userRes = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (userRes.data) {
          setUser(userRes.data);
        } else {
          setUser(null);
        }

        if (isSignedIn && !isOwnProfile) {
          try {
            const followRes = await api.get(`/follows/${userId}/status`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setIsFollowing(followRes.data.isFollowing || false);
          } catch (error) {
            console.error("Error checking follow status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, isSignedIn, isOwnProfile, getToken]);

  const handleFollow = async () => {
    if (!isSignedIn || !userId) {
      alert("Please sign in to follow users");
      return;
    }

    setFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.post(`/follows/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFollowing(res.data.following);
      
      if (user) {
        setUser({
          ...user,
          follower_count: res.data.followerCount ?? (res.data.following ? user.follower_count + 1 : Math.max(0, user.follower_count - 1)),
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!user) return <div style={{ textAlign: "center", padding: "100px" }}>USER NOT FOUND.</div>;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=000000&color=ffffff&bold=true`;

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <section className="fade-in" style={{ marginBottom: "60px", borderBottom: "4px solid var(--border-color)", paddingBottom: "60px", backgroundColor: "#f5f5f5", padding: "30px", borderRadius: "25px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
            <div style={{ width: "160px", height: "160px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
              <img
                src={avatarUrl}
                alt={user.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {isSignedIn && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={isFollowing ? "" : "primary"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                  background: "transparent",
                }}
              >
                <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                <span style={{ fontWeight: 600, backgroundColor: isFollowing ? "#2563eb" : "#000", color: "white", padding: "8px 16px", borderRadius: "25px", border: "none" }}>{isFollowing ? "FOLLOWING" : "FOLLOW"}</span>
              </button>
            )}
          </div>

          <header style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "48px", marginBottom: "8px" }}>{user.name}</h1>
            <p style={{ color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>
              @{user.username || "user"}
            </p>
            {user.bio && (
              <p style={{ fontSize: "18px", lineHeight: "1.6", maxWidth: "600px", color: "var(--text-secondary)" }}>
                {user.bio}
              </p>
            )}
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid var(--border-color)", textAlign: "center" }}>
            <div 
              onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} 
              style={{ padding: "24px", borderRight: "1px solid var(--border-color)", cursor: "pointer" }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{user.follower_count}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>FOLLOWERS</div>
            </div>
            <div 
              onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} 
              style={{ padding: "24px", borderRight: "1px solid var(--border-color)", cursor: "pointer" }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{user.following_count}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>FOLLOWING</div>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{user.total_likes}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>LIKES</div>
            </div>
          </div>
        </section>

        <h2 style={{ fontSize: "20px", marginBottom: "40px", letterSpacing: "0.1em" }}>POSTS</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {posts.length === 0 ? (
            <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO POSTS YET.</div>
          ) : (
            posts.map(p => (
              <div key={p.id} style={{ position: "relative" }}>
                <PostCard post={p} onUpdated={fetchUserPosts} />
                {user.pinned_post_id === p.id && (
                  <div style={{ position: "absolute", top: "24px", right: "24px", color: "var(--accent)" }}>
                    <FontAwesomeIcon icon={faThumbtack} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {userId && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={userId}
          type={followersModalType}
          title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
        />
      )}
    </main>
  );
}
