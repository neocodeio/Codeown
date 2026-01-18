import { useState, useEffect } from "react";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserPosts } from "../hooks/useUserPosts";
import PostCard from "../components/PostCard";
import EditProfileModal from "../components/EditProfileModal";
import api from "../api/axios";

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  username_changed_at: string | null;
}

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { signOut, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;
  const { posts, loading: postsLoading, fetchUserPosts } = useUserPosts(userId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (!userId) {
        if (isMounted) {
          setLoadingProfile(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoadingProfile(true);
        }
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (isMounted && res.data) {
          setUserProfile(res.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (isMounted) {
          setUserProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    if (userId) {
      fetchProfile();
    } else {
      setLoadingProfile(false);
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProfileUpdated = async () => {
    // Refresh profile and posts
    if (userId) {
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUserProfile(res.data);
        fetchUserPosts();
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to sign-in if not signed in
  if (isLoaded && !isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Show message if user data is not available yet
  if (!user || !userId) {
    return (
      <div style={{ 
        padding: "20px",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
      }}>
        <div>Please sign in to view your profile</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "32px 20px",
      backgroundColor: "#f5f7fa",
      minHeight: "calc(100vh - 80px)",
    }}>
      {/* Profile Header Card */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "40px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Sign Out Button - Top Left */}
        <button
          onClick={handleSignOut}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            padding: "8px 16px",
            backgroundColor: "#dc2626",
            border: "none",
            color: "#ffffff",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#b91c1c";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Sign Out
        </button>

        {/* Edit Button - Top Right */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "8px 16px",
            backgroundColor: "#000",
            border: "none",
            color: "#ffffff",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          Edit Profile
        </button>
        <img
          src={userProfile?.avatar_url || user.imageUrl || "https://ui-avatars.com/api/?name=User&background=317ff5&color=ffffff&size=128"}
          alt={userProfile?.name || user.fullName || "Profile"}
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            marginBottom: "20px",
            objectFit: "cover",
            border: "4px solid #f5f7fa",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        />
        <h1 style={{
          margin: "0 0 8px 0",
          fontSize: "28px",
          fontWeight: 700,
          color: "#1a1a1a",
        }}>
          {userProfile?.name || user.fullName || "User"}
        </h1>
        {(userProfile?.email || user.primaryEmailAddress) && (
          <p style={{
            color: "#64748b",
            margin: "0 0 12px 0",
            fontSize: "16px",
          }}>
            {userProfile?.email || user.primaryEmailAddress?.emailAddress}
          </p>
        )}
        {userProfile?.bio && (
          <p style={{
            color: "#1a1a1a",
            margin: "0 0 24px 0",
            fontSize: "15px",
            lineHeight: "1.6",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {userProfile.bio}
          </p>
        )}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "#f0f7ff",
            borderRadius: "12px",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: 600,
          }}>
            <span>{posts.length}</span>
            <span>{posts.length === 1 ? "Post" : "Posts"}</span>
          </div>
          {(userProfile?.username || user.username) && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#f5f7fa",
              borderRadius: "12px",
              color: "#000",
              fontSize: "14px",
              fontWeight: 600,
            }}>
              <span>@{userProfile?.username || user.username}</span>
            </div>
          )}
        </div>
        {user.createdAt && (
          <p style={{
            color: "#94a3b8",
            margin: 0,
            fontSize: "13px",
          }}>
            Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric"
            })}
          </p>
        )}
      </div>

      {/* Posts Section */}
      <div>
        <h2 style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "20px",
          paddingLeft: "4px",
        }}>
          My Posts
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
              borderTopColor: "#317ff5",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : !Array.isArray(posts) || posts.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
            backgroundColor: "#ffffff",
            borderRadius: "30px",
            border: "1px solid #e4e7eb",
          }}>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>No posts yet</p>
            <p style={{ fontSize: "14px" }}>Start sharing your thoughts with the community!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onUpdated={fetchUserPosts}
            />
          ))
        )}
      </div>

      {userProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleProfileUpdated}
          currentUser={userProfile}
        />
      )}
    </div>
  );
}
