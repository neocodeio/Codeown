import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useUserPosts } from "../hooks/useUserPosts";
import PostCard from "../components/PostCard";

interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { posts, loading: postsLoading } = useUserPosts(userId || null);

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
        // Fetch user profile from API
        const userRes = await api.get(`/users/${userId}`);
        if (userRes.data) {
          // Ensure we have valid user data with proper fallbacks
          const userData = {
            id: userId,
            name: userRes.data.name || "User",
            email: userRes.data.email || null,
            avatar_url: userRes.data.avatar_url || null,
            bio: userRes.data.bio || null,
            username: userRes.data.username || null,
          };
          
          // Don't set user if name is "Unknown User" - treat as error
          if (userData.name && userData.name !== "Unknown User") {
            setUser(userData);
          } else {
            console.error("Invalid user data received:", userRes.data);
            setUser(null);
          }
        } else {
          console.error("No user data received from API");
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { data?: unknown } };
          console.error("Error details:", axiosError.response?.data);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div style={{
        maxWidth: "680px",
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
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user || !user.name || user.name === "Unknown User") {
    return (
      <div style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "32px 20px",
        textAlign: "center",
      }}>
        <h2 style={{ marginBottom: "16px", color: "#1a1a1a" }}>User not found</h2>
        <p style={{ color: "#64748b" }}>The user you're looking for doesn't exist or couldn't be loaded.</p>
      </div>
    );
  }

  const avatarUrl = user.avatar_url || getAvatarUrl(user.name || "User", user.email);

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
      }}>
        <img
          src={avatarUrl}
          alt={user.name}
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
          {user.name || "User"}
        </h1>
        {user.email && (
          <p style={{
            color: "#64748b",
            margin: "0 0 12px 0",
            fontSize: "16px",
          }}>
            {user.email}
          </p>
        )}
        {user.bio && (
          <p style={{
            color: "#1a1a1a",
            margin: "0 0 24px 0",
            fontSize: "15px",
            lineHeight: "1.6",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {user.bio}
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
            borderRadius: "20px",
            color: "#000",
            fontSize: "14px",
            fontWeight: 600,
          }}>
            <span>{posts.length}</span>
            <span>{posts.length === 1 ? "Post" : "Posts"}</span>
          </div>
          {user.username && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#f5f7fa",
              borderRadius: "20px",
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 600,
            }}>
              <span>@{user.username}</span>
            </div>
          )}
        </div>
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
            borderRadius: "30px",
            border: "1px solid #e4e7eb",
          }}>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>No posts yet</p>
            <p style={{ fontSize: "14px" }}>This user hasn't shared anything yet.</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

