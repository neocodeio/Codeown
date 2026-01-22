import { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserPosts } from "../hooks/useUserPosts";
import { useSavedPosts } from "../hooks/useSavedPosts";
import PostCard from "../components/PostCard";
import EditProfileModal from "../components/EditProfileModal";
import FollowersModal from "../components/FollowersModal";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faUsers, faSignOutAlt, faThumbtack } from "@fortawesome/free-solid-svg-icons";

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  username_changed_at: string | null;
  follower_count: number;
  following_count: number;
  total_likes: number;
  pinned_post_id: number | null;
  pinned_post: any | null;
}

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { signOut, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;
  const { posts, loading: postsLoading, fetchUserPosts } = useUserPosts(userId);
  const { savedPosts, loading: savedPostsLoading, fetchSavedPosts } = useSavedPosts();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [pinningPostId, setPinningPostId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data) setUserProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    if (userId) fetchProfile();
  }, [userId, getToken]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfileUpdated = async () => {
    if (userId) {
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUserProfile(res.data);
        fetchUserPosts();
        fetchSavedPosts();
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  const handlePinPost = async (postId: number) => {
    try {
      setPinningPostId(postId);
      const token = await getToken();
      if (!token) return;
      const endpoint = userProfile?.pinned_post_id === postId ? "/users/pin/unpin" : `/users/pin/${postId}`;
      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      const res = await api.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUserProfile(res.data);
    } catch (error) {
      console.error("Error pinning post:", error);
    } finally {
      setPinningPostId(null);
    }
  };

  if (!isLoaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", position: "absolute", top: "24px", right: "24px" }}>
          <button
            onClick={handleSignOut}
            style={{ padding: "8px 16px", backgroundColor: "transparent", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Sign Out</span>
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            style={{ padding: "8px 16px", backgroundColor: "var(--primary)", border: "none", color: "white", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600 }}
          >
            Edit Profile
          </button>
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <img
              src={userProfile?.avatar_url || user.imageUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=5046e5&color=fff`}
              alt="Avatar"
              style={{ width: "120px", height: "120px", borderRadius: "30px", objectFit: "cover", border: "4px solid var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "32px", marginBottom: "4px" }}>{userProfile?.name || user.fullName}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "16px" }}>@{userProfile?.username || user.username}</p>
            {userProfile?.bio && <p style={{ color: "var(--text-primary)", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px", maxWidth: "500px" }}>{userProfile.bio}</p>}
            
            <div style={{ display: "flex", gap: "24px" }}>
              <div onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{userProfile?.follower_count || 0}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>Followers</span>
              </div>
              <div onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} style={{ cursor: "pointer" }}>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{userProfile?.following_count || 0}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>Following</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{userProfile?.total_likes || 0}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>Likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "32px" }}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{ padding: "12px 24px", background: "none", border: "none", borderBottom: activeTab === "posts" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "posts" ? "var(--primary)" : "var(--text-secondary)", fontWeight: 700, fontSize: "15px" }}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          style={{ padding: "12px 24px", background: "none", border: "none", borderBottom: activeTab === "saved" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "saved" ? "var(--primary)" : "var(--text-secondary)", fontWeight: 700, fontSize: "15px" }}
        >
          Saved ({savedPosts.length})
        </button>
      </div>

      <div>
        {activeTab === "posts" ? (
          posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-tertiary)" }}>No posts yet.</div>
          ) : (
            posts.map(p => (
              <div key={p.id} style={{ position: "relative" }}>
                <PostCard post={p} onUpdated={handleProfileUpdated} />
                <button
                  onClick={() => handlePinPost(p.id)}
                  style={{ position: "absolute", top: "24px", right: "24px", padding: "8px", background: "var(--bg-hover)", border: "none", borderRadius: "8px", color: userProfile?.pinned_post_id === p.id ? "var(--primary)" : "var(--text-tertiary)" }}
                >
                  <FontAwesomeIcon icon={faThumbtack} />
                </button>
              </div>
            ))
          )
        ) : (
          savedPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-tertiary)" }}>No saved posts.</div>
          ) : (
            savedPosts.map(p => <PostCard key={p.id} post={p} onUpdated={handleProfileUpdated} />)
          )
        )}
      </div>

      {userProfile && (
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />
      )}
      {userId && (
        <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "Followers" : "Following"} />
      )}
    </main>
  );
}
