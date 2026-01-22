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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=000&color=ffffff&size=128&bold=true&font-size=0.5`;
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
          setUser({
            id: userId,
            name: userRes.data.name || "User",
            email: userRes.data.email || null,
            avatar_url: userRes.data.avatar_url || null,
            bio: userRes.data.bio || null,
            username: userRes.data.username || null,
            follower_count: userRes.data.follower_count || 0,
            following_count: userRes.data.following_count || 0,
            total_likes: userRes.data.total_likes || 0,
            pinned_post_id: userRes.data.pinned_post_id || null,
            pinned_post: userRes.data.pinned_post || null,
          });
        } else {
          setUser(null);
        }

        // Check follow status
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
      if (!token) {
        alert("Please sign in to follow users");
        return;
      }

      const res = await api.post(`/follows/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFollowing(res.data.following);
      
      // Update follower count
      if (user) {
        setUser({
          ...user,
          follower_count: res.data.followerCount ?? (res.data.following ? user.follower_count + 1 : Math.max(0, user.follower_count - 1)),
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to follow/unfollow user");
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowersModal = (type: "followers" | "following") => {
    setFollowersModalType(type);
    setFollowersModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "32px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 80px)",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #e4e7eb",
          borderTopColor: "#000",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || !user.name || user.name === "Unknown User") {
    return (
      <div style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "32px 20px",
        textAlign: "center",
      }}>
        <h2 style={{ marginBottom: "16px", color: "#1a1a1a" }}>User not found</h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          The user you're looking for doesn't exist or couldn't be loaded.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#000",
            border: "none",
            color: "#ffffff",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          Go to Feed
        </button>
      </div>
    );
  }

  // Redirect to own profile if viewing own user page
  if (isOwnProfile) {
    return (
      <div style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "32px 20px",
        textAlign: "center",
      }}>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Redirecting to your profile...</p>
        <button
          onClick={() => navigate("/profile")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#000",
            border: "none",
            color: "#ffffff",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 600,
          }}
        >
          Go to My Profile
        </button>
      </div>
    );
  }

  const avatarUrl = user.avatar_url || getAvatarUrl(user.name || "User", user.email);

  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "24px 16px",
      backgroundColor: "transparent",
      minHeight: "calc(100vh - 80px)",
    }}>
      {/* Profile Header Card - Modern Design */}
      <div style={{
        backgroundColor: "#f5f5f5",
        borderRadius: "30px",
        padding: "0",
        marginBottom: "24px",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
      }}>
        {/* Cover gradient */}
        <div style={{
          height: "65px",
          background: "#000",
          position: "relative",
          marginBottom: "80px",
        }}>
          {/* Follow Button */}
          {isSignedIn && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                padding: "10px 15px",
                backgroundColor: isFollowing ? "rgba(255, 255, 255, 0.95)" : "var(--primary)",
                border: isFollowing ? "1px solid var(--border-color)" : "none",
                color: isFollowing ? "var(--text-primary)" : "#ffffff",
                borderRadius: "25px",
                cursor: followLoading ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: 600,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: followLoading ? 0.7 : 1,
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                if (!followLoading) {
                  if (isFollowing) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                    e.currentTarget.style.borderColor = "var(--error)";
                    e.currentTarget.style.color = "var(--error)";
                  } else {
                    e.currentTarget.style.backgroundColor = "var(--primary-dark)";
                  }
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!followLoading) {
                  if (isFollowing) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  } else {
                    e.currentTarget.style.backgroundColor = "var(--primary)";
                  }
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Profile content */}
        <div style={{ padding: "0 32px 32px", marginTop: "-50px", textAlign: "center" }}>
          {/* Avatar */}
          <img
            src={avatarUrl}
            alt={user.name}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "5px solid var(--bg-card)",
              boxShadow: "var(--shadow-lg)",
            }}
          />

          {/* Name and username */}
          <h1 style={{
            margin: "20px 0 4px 0",
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}>
            {user.name || "User"}
          </h1>
          
          {user.username && (
            <p style={{
              color: "var(--text-secondary)",
              margin: "0 0 8px 0",
              fontSize: "16px",
            }}>
              @{user.username}
            </p>
          )}

          {/* Bio */}
          {user.bio && (
            <p style={{
              color: "var(--text-secondary)",
              margin: "16px auto 0",
              fontSize: "15px",
              lineHeight: 1.6,
              maxWidth: "500px",
            }}>
              {user.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            backgroundColor: "var(--bg-hover)",
            borderRadius: "var(--radius-xl)",
            padding: "16px",
            gap: "32px",
            marginTop: "28px",
            flexWrap: "wrap",
            border: "1px solid var(--border-light)",
          }}>
            <div
              onClick={() => openFollowersModal("followers")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                padding: "12px 20px",
                borderRadius: "16px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#64748b";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.color = "#1a1a1a";
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a" }}>
                {user.follower_count}
              </span>
              <span style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: "4px" }} />
                Followers
              </span>
            </div>

            <div
              onClick={() => openFollowersModal("following")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                padding: "12px 20px",
                borderRadius: "16px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#64748b";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.color = "#1a1a1a";
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a" }}>
                {user.following_count}
              </span>
              <span style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: "4px" }} />
                Following
              </span>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "12px 20px",
              borderRadius: "16px",
            }}>
              <span style={{ fontSize: "24px", fontWeight: 700, color: "#dc2626" }}>
                {user.total_likes}
              </span>
              <span style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                <FontAwesomeIcon icon={faHeart} style={{ marginRight: "4px", color: "#dc2626" }} />
                Total Likes
              </span>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "12px 20px",
              borderRadius: "16px",
            }}>
              <span style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a" }}>
                {posts.length}
              </span>
              <span style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                Posts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Post */}
      {user.pinned_post && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            paddingLeft: "4px",
          }}>
            <FontAwesomeIcon icon={faThumbtack} style={{ color: "#2563eb" }} />
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a" }}>
              Pinned Post
            </span>
          </div>
          <PostCard post={user.pinned_post} onUpdated={fetchUserPosts} />
        </div>
      )}

      {/* Posts Section */}
      <div>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "20px",
          paddingLeft: "4px",
        }}>
          {posts.length === 0 ? "No Posts Yet" : "Posts"}
        </h2>

        {postsLoading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px 20px",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e4e7eb",
              borderTopColor: "#000",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : !Array.isArray(posts) || posts.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e4e7eb",
          }}>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>No posts yet</p>
            <p style={{ fontSize: "14px" }}>This user hasn't shared anything yet.</p>
          </div>
        ) : (
          posts
            .filter(post => post.id !== user.pinned_post_id)
            .map(post => (
              <PostCard key={post.id} post={post} onUpdated={fetchUserPosts} />
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
    </div>
  );
}
