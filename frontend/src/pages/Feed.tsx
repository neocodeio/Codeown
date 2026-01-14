import { useEffect } from "react";
import PostCard from "../components/PostCard";
import { usePosts } from "../hooks/usePosts";

export default function Feed() {
  const { posts, loading, fetchPosts } = usePosts();

  // Listen for post creation events
  useEffect(() => {
    const handlePostCreated = () => {
      fetchPosts();
    };

    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, [fetchPosts]);

  return (
    <div style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "32px 20px",
      minHeight: "calc(100vh - 80px)",
      // background: "#000"
    }}>
      {loading ? (
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
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#64748b",
        }}>
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>No posts yet</p>
          <p style={{ fontSize: "14px" }}>Be the first to share something!</p>
        </div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
