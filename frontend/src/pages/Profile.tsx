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
      maxWidth: "900px",
      margin: "0 auto",
      padding: "40px 24px",
      backgroundColor: "transparent",
      minHeight: "calc(100vh - 80px)",
    }}>
      {/* Profile Header - Minimalist Design */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "25px",
        padding: "38px",
        marginBottom: "60px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e5e7eb",
      }}>
        {/* Action Buttons */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginBottom: "32px",
        }}>
          <button
            onClick={handleSignOut}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid #e5e7eb",
              color: "#6b7280",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            Sign Out
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#2563EB",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2563EB";
            }}
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Info - Clean Layout */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "32px", flexWrap: "wrap" }}>
          {/* Avatar */}
          <img
            src={userProfile?.avatar_url || user.imageUrl || "https://ui-avatars.com/api/?name=User&background=2563EB&color=ffffff&size=120"}
            alt={userProfile?.name || user.fullName || "Profile"}
            style={{
              width: "120px",
              height: "120px",
              padding: "8px",
              borderRadius: "25px",
              objectFit: "cover",
              border: "1px solid #e5e7eb",
              flexShrink: 0,
            }}
          />

          {/* User Details */}
          <div style={{ flex: 1, minWidth: "250px" }}>
            <h1 style={{
              margin: "0 0 8px 0",
              fontSize: "28px",
              fontWeight: 600,
              color: "#111827",
              letterSpacing: "-0.01em",
            }}>
              {userProfile?.name || user.fullName || "User"}
            </h1>
            
            {(userProfile?.username || user.username) && (
              <p style={{
                color: "#6b7280",
                margin: "0 0 16px 0",
                fontSize: "15px",
              }}>
                @{userProfile?.username || user.username}
              </p>
            )}

            {userProfile?.bio && (
              <p style={{
                color: "#374151",
                margin: "0 0 20px 0",
                fontSize: "15px",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}>
                {userProfile.bio}
              </p>
            )}

            {/* Stats - Horizontal */}
            <div style={{
              display: "flex",
              gap: "32px",
              flexWrap: "wrap",
            }}>
              <div
                onClick={() => openFollowersModal("followers")}
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
                  {userProfile?.follower_count || 0}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Followers
                </div>
              </div>

              <div
                onClick={() => openFollowersModal("following")}
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
                  {userProfile?.following_count || 0}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Following
                </div>
              </div>

              <div>
                <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
                  {userProfile?.total_likes || 0}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Likes
                </div>
              </div>

              <div>
                <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
                  {posts.length}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Posts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Post */}
      {userProfile?.pinned_post && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            marginBottom: "16px",
          }}>
            Pinned Post
          </h2>
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
                top: "8px",
                right: "27px",
                padding: "5px 9px",
                backgroundColor: "#2563EB",
                border: "none",
                color: "#fff",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                zIndex: 10,
                opacity: pinningPostId === userProfile.pinned_post.id ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (pinningPostId !== userProfile.pinned_post.id) {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.color = "#2563EB";
                }
              }}
              onMouseLeave={(e) => {
                if (pinningPostId !== userProfile.pinned_post.id) {
                  e.currentTarget.style.backgroundColor = "#2563EB";
                  e.currentTarget.style.color = "#fff";
                }
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
        gap: "24px",
        marginBottom: "24px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "12px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "posts" ? "2px solid #2563EB" : "2px solid transparent",
            color: activeTab === "posts" ? "#111827" : "#6b7280",
            fontSize: "15px",
            fontWeight: activeTab === "posts" ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-1px",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "posts") {
              e.currentTarget.style.color = "#111827";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "posts") {
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          style={{
            padding: "12px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "saved" ? "2px solid #2563EB" : "2px solid transparent",
            color: activeTab === "saved" ? "#111827" : "#6b7280",
            fontSize: "15px",
            fontWeight: activeTab === "saved" ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-1px",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "saved") {
              e.currentTarget.style.color = "#111827";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "saved") {
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >
          Saved ({savedPosts.length})
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
                padding: "80px 20px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#2563EB",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }} />
              </div>
            ) : !Array.isArray(posts) || posts.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "80px 20px",
                color: "#9ca3af",
              }}>
                <p style={{ fontSize: "15px", margin: 0 }}>No posts yet</p>
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
                        top: "8px",
                        right: "27px",
                        padding: "5px 9px",
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        color: "#2563EB",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        zIndex: 10,
                        opacity: pinningPostId === post.id ? 0.6 : 1,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (pinningPostId !== post.id) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pinningPostId !== post.id) {
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
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
                padding: "80px 20px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#2563EB",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }} />
              </div>
            ) : !Array.isArray(savedPosts) || savedPosts.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "80px 20px",
                color: "#9ca3af",
              }}>
                <p style={{ fontSize: "15px", margin: 0 }}>No saved posts yet</p>
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
