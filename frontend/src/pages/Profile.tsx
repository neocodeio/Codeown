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
import { faHeart, faUsers, faUserPlus, faThumbtack } from "@fortawesome/free-solid-svg-icons";

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
  const [, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [pinningPostId, setPinningPostId] = useState<number | null>(null);

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

      const endpoint = userProfile?.pinned_post_id === postId 
        ? "/users/pin/unpin" 
        : `/users/pin/${postId}`;
      
      await api.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh profile
      const res = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(res.data);
    } catch (error) {
      console.error("Error pinning post:", error);
    } finally {
      setPinningPostId(null);
    }
  };

  const openFollowersModal = (type: "followers" | "following") => {
    setFollowersModalType(type);
    setFollowersModalOpen(true);
  };

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

  if (isLoaded && !isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

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
      maxWidth: "720px",
      margin: "0 auto",
      padding: "32px 20px",
      backgroundColor: "#f5f7fa",
      minHeight: "calc(100vh - 80px)",
    }}>
      {/* Profile Header Card - Modern Design */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "32px",
        padding: "0",
        marginBottom: "24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
        overflow: "hidden",
      }}>
        {/* Cover gradient */}
        <div style={{
          height: "65px",
          background: "linear-gradient(135deg, #000 0%, #000 100%)",
          position: "relative",
          marginBottom: "80px",
        }}>
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              padding: "8px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "none",
              color: "#dc2626",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              e.currentTarget.style.color = "#dc2626";
            }}
          >
            Sign Out
          </button>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "none",
              color: "#000",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#bfff70";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
            }}
          >
            Edit Profile
          </button>
        </div>

        {/* Profile content */}
        <div style={{ padding: "0 32px 32px", marginTop: "-50px", textAlign: "center" }}>
          {/* Avatar */}
          <img
            src={userProfile?.avatar_url || user.imageUrl || "https://ui-avatars.com/api/?name=User&background=317ff5&color=ffffff&size=128"}
            alt={userProfile?.name || user.fullName || "Profile"}
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          />

          {/* Name and username */}
          <h1 style={{
            margin: "16px 0 4px 0",
            fontSize: "24px",
            fontWeight: 700,
            color: "#1a1a1a",
          }}>
            {userProfile?.name || user.fullName || "User"}
          </h1>
          
          {(userProfile?.username || user.username) && (
            <p style={{
              color: "#64748b",
              margin: "0 0 8px 0",
              fontSize: "15px",
            }}>
              @{userProfile?.username || user.username}
            </p>
          )}

          {/* Bio */}
          {userProfile?.bio && (
            <p style={{
              color: "#475569",
              margin: "12px auto 0",
              fontSize: "15px",
              lineHeight: 1.6,
              maxWidth: "400px",
            }}>
              {userProfile.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "16px",
            padding: "5px",
            gap: "24px",
            marginTop: "24px",
            flexWrap: "wrap",
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
                {userProfile?.follower_count || 0}
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
                {userProfile?.following_count || 0}
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
                {userProfile?.total_likes || 0}
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

          {/* Member since */}
          {user.createdAt && (
            <p style={{
              color: "#94a3b8",
              margin: "20px 0 0 0",
              fontSize: "13px",
            }}>
              Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
              })}
            </p>
          )}
        </div>
      </div>

      {/* Pinned Post */}
      {userProfile?.pinned_post && (
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
          <div style={{ position: "relative" }}>
            <PostCard 
              post={userProfile.pinned_post} 
              onUpdated={() => {
                fetchUserPosts();
                handleProfileUpdated();
              }}
            />
            <button
              onClick={() => handlePinPost(userProfile.pinned_post.id)}
              disabled={pinningPostId === userProfile.pinned_post.id}
              style={{
                position: "absolute",
                top: "12px",
                right: "30px",
                padding: "10px",
                marginBottom: "20px",
                backgroundColor: "#2563eb",
                border: "none",
                color: "#ffffff",
                borderRadius: "50px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                zIndex: 10,
              }}
            >
              <FontAwesomeIcon icon={faThumbtack} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        borderBottom: "2px solid #e4e7eb",
        paddingBottom: "0",
      }}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "posts" ? "3px solid #000" : "3px solid transparent",
            color: activeTab === "posts" ? "#000" : "#64748b",
            fontSize: "16px",
            fontWeight: activeTab === "posts" ? 600 : 500,
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: "-2px",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "posts") {
              e.currentTarget.style.color = "#000";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "posts") {
              e.currentTarget.style.color = "#64748b";
            }
          }}
        >
          My Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          style={{
            padding: "12px 24px",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "saved" ? "3px solid #000" : "3px solid transparent",
            color: activeTab === "saved" ? "#000" : "#64748b",
            fontSize: "16px",
            fontWeight: activeTab === "saved" ? 600 : 500,
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: "-2px",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "saved") {
              e.currentTarget.style.color = "#000";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "saved") {
              e.currentTarget.style.color = "#64748b";
            }
          }}
        >
          Saved Posts ({savedPosts.length})
        </button>
      </div>

      {/* Posts Section */}
      <div>
        {activeTab === "posts" ? (
          <>
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
                <p style={{ fontSize: "14px" }}>Start sharing your thoughts with the community!</p>
              </div>
            ) : (
              posts
                .filter(post => post.id !== userProfile?.pinned_post_id)
                .map(post => (
                  <div key={post.id} style={{ position: "relative" }}>
                    <PostCard 
                      post={post} 
                      onUpdated={() => {
                        fetchUserPosts();
                        fetchSavedPosts();
                        handleProfileUpdated();
                      }}
                    />
                    {/* Pin button for each post */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinPost(post.id);
                      }}
                      disabled={pinningPostId === post.id}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "35px",
                        marginBottom: "20px",
                        padding: "6px",
                        backgroundColor: userProfile?.pinned_post_id === post.id ? "#2563eb" : "#f0f7ff",
                        border: "1px solid #2563eb",
                        color: userProfile?.pinned_post_id === post.id ? "#ffffff" : "#2563eb",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        zIndex: 10,
                        opacity: pinningPostId === post.id ? 0.6 : 1,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (userProfile?.pinned_post_id !== post.id) {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                          e.currentTarget.style.color = "#ffffff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (userProfile?.pinned_post_id !== post.id) {
                          e.currentTarget.style.backgroundColor = "#f0f7ff";
                          e.currentTarget.style.color = "#2563eb";
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faThumbtack} />
                    </button>
                  </div>
                ))
            )}
          </>
        ) : (
          <>
            {savedPostsLoading ? (
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
            ) : !Array.isArray(savedPosts) || savedPosts.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#64748b",
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px solid #e4e7eb",
              }}>
                <p style={{ fontSize: "18px", marginBottom: "8px" }}>No saved posts yet</p>
                <p style={{ fontSize: "14px" }}>Save posts you like to find them easily later!</p>
              </div>
            ) : (
              savedPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onUpdated={() => {
                    fetchUserPosts();
                    fetchSavedPosts();
                  }}
                />
              ))
            )}
          </>
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
