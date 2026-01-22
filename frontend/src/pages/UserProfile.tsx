import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useUserPosts } from "../hooks/useUserPosts";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import PostCard from "../components/PostCard";
import FollowersModal from "../components/FollowersModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faUsers, faUserPlus, faThumbtack, faUserCheck } from "@fortawesome/free-solid-svg-icons";

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

  const getAvatarUrl = (name: string, email: string | null) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=5046e5&color=ffffff&size=128&bold=true`;
  };

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
      <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!user) return <div style={{ textAlign: "center", padding: "100px" }}>User not found</div>;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  const avatarUrl = user.avatar_url || getAvatarUrl(user.name || "User", user.email);

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <div style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "var(--radius-2xl)",
        padding: "40px",
        marginBottom: "32px",
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--border-color)",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", position: "absolute", top: "24px", right: "24px" }}>
          {isSignedIn && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                padding: "10px 24px",
                backgroundColor: isFollowing ? "var(--bg-hover)" : "var(--primary)",
                border: "none",
                color: isFollowing ? "var(--text-primary)" : "white",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
              }}
            >
              <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
              <span>{isFollowing ? "Following" : "Follow"}</span>
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
          <img
            src={avatarUrl}
            alt={user.name}
            style={{ width: "120px", height: "120px", borderRadius: "30px", objectFit: "cover", border: "4px solid var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "32px", marginBottom: "4px" }}>{user.name}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "16px" }}>@{user.username || "user"}</p>
            {user.bio && <p style={{ color: "var(--text-primary)", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px", maxWidth: "500px" }}>{user.bio}</p>}
            
            <div style={{ display: "flex", gap: "24px" }}>
              <div onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{user.follower_count}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>Followers</span>
              </div>
              <div onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{user.following_count}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>Following</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{user.total_likes}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>Likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "var(--text-primary)" }}>Posts</h2>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-tertiary)" }}>No posts yet.</div>
        ) : (
          posts.map(p => (
            <div key={p.id} style={{ position: "relative" }}>
              <PostCard post={p} onUpdated={fetchUserPosts} />
              {user.pinned_post_id === p.id && (
                <div style={{ position: "absolute", top: "24px", right: "24px", color: "var(--primary)" }}>
                  <FontAwesomeIcon icon={faThumbtack} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {userId && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={userId}
          type={followersModalType}
          title={followersModalType === "followers" ? "Followers" : "Following"}
        />
      )}
    </main>
  );
}
