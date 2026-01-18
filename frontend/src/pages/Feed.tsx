import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { usePosts } from "../hooks/usePosts";
import { PostCardSkeleton } from "../components/LoadingSkeleton";

export default function Feed() {
  const [page, setPage] = useState(1);
  const { posts, loading, fetchPosts, hasMore } = usePosts(page, 20);

  // Listen for post creation events
  useEffect(() => {
    const handlePostCreated = () => {
      setPage(1);
      fetchPosts(1, false);
    };

    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          setPage((prev) => prev + 1);
          fetchPosts(page + 1, true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, page, fetchPosts]);

  return (
    <div style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "32px 20px",
      minHeight: "calc(100vh - 80px)",
      backgroundColor: "#f5f7fa",
    }}>
      {loading && posts.length === 0 ? (
        <>
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </>
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
        <>
          {posts.map(p => <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(page, false)} />)}
          {loading && posts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                border: "3px solid #e4e7eb",
                borderTopColor: "#000",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
