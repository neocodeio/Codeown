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
import { faSignOutAlt, faThumbtack } from "@fortawesome/free-solid-svg-icons";

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
      const token = await getToken();
      if (!token) return;
      const endpoint = userProfile?.pinned_post_id === postId ? "/users/pin/unpin" : `/users/pin/${postId}`;
      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      const res = await api.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUserProfile(res.data);
    } catch (error) {
      console.error("Error pinning post:", error);
    }
  };

  if (!isLoaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <section className="fade-in" style={{ marginBottom: "60px", borderBottom: "4px solid var(--border-color)", paddingBottom: "60px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
            <div style={{ width: "160px", height: "160px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
              <img
                src={userProfile?.avatar_url || user.imageUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=000000&color=fff&bold=true`}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <button onClick={() => setIsEditModalOpen(true)} className="primary">EDIT PROFILE</button>
              <button onClick={handleSignOut} style={{ border: "1px solid var(--border-color)", padding: "8px 16px" }}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          </div>

          <header style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "48px", marginBottom: "8px" }}>{userProfile?.name || user.fullName}</h1>
            <p style={{ color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>
              @{userProfile?.username || user.username}
            </p>
            {userProfile?.bio && (
              <p style={{ fontSize: "18px", lineHeight: "1.6", maxWidth: "600px", color: "var(--text-secondary)" }}>
                {userProfile.bio}
              </p>
            )}
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid var(--border-color)", textAlign: "center" }}>
            <div 
              onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }} 
              style={{ padding: "24px", borderRight: "1px solid var(--border-color)", cursor: "pointer" }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile?.follower_count || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>FOLLOWERS</div>
            </div>
            <div 
              onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }} 
              style={{ padding: "24px", borderRight: "1px solid var(--border-color)", cursor: "pointer" }}
            >
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile?.following_count || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>FOLLOWING</div>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile?.total_likes || 0}</div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>LIKES</div>
            </div>
          </div>
        </section>

        <nav style={{ display: "flex", gap: "40px", marginBottom: "40px", borderBottom: "1px solid var(--border-light)" }}>
          <button
            onClick={() => setActiveTab("posts")}
            style={{ 
              border: "none", 
              padding: "12px 0", 
              fontSize: "13px", 
              fontWeight: 800, 
              color: activeTab === "posts" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "posts" ? "2px solid var(--text-primary)" : "2px solid transparent",
              borderRadius: 0
            }}
          >
            POSTS ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            style={{ 
              border: "none", 
              padding: "12px 0", 
              fontSize: "13px", 
              fontWeight: 800, 
              color: activeTab === "saved" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "saved" ? "2px solid var(--text-primary)" : "2px solid transparent",
              borderRadius: 0
            }}
          >
            SAVED ({savedPosts.length})
          </button>
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {activeTab === "posts" ? (
            posts.length === 0 ? (
              <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO POSTS YET.</div>
            ) : (
              posts.map(p => (
                <div key={p.id} style={{ position: "relative" }}>
                  <PostCard post={p} onUpdated={handleProfileUpdated} />
                  <button
                    onClick={() => handlePinPost(p.id)}
                    style={{ 
                      position: "absolute", 
                      top: "24px", 
                      right: "24px", 
                      padding: "8px", 
                      border: "1px solid var(--border-color)",
                      color: userProfile?.pinned_post_id === p.id ? "var(--accent)" : "var(--text-tertiary)",
                      backgroundColor: "var(--bg-card)"
                    }}
                  >
                    <FontAwesomeIcon icon={faThumbtack} />
                  </button>
                </div>
              ))
            )
          ) : (
            savedPosts.length === 0 ? (
              <div style={{ padding: "60px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO SAVED POSTS.</div>
            ) : (
              savedPosts.map(p => <PostCard key={p.id} post={p} onUpdated={handleProfileUpdated} />)
            )
          )}
        </div>
      </div>

      {userProfile && (
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />
      )}
      {userId && (
        <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"} />
      )}
    </main>
  );
}
