import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { PostCardSkeleton } from "../components/LoadingSkeleton";

export default function Feed() {
  const [page, setPage] = useState(1);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const { getToken } = useClerkAuth();
  const { isSignedIn } = useClerkUser();
  const { posts, loading, fetchPosts, hasMore } = usePosts(page, 20, feedFilter, getToken);

  useEffect(() => {
    if (!isSignedIn && feedFilter === "following") setFeedFilter("all");
  }, [isSignedIn, feedFilter]);

  useEffect(() => {
    const handlePostCreated = () => {
      setPage(1);
      fetchPosts(1, false);
    };
    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, [fetchPosts]);

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

  const handleFilterChange = (f: FeedFilter) => {
    setFeedFilter(f);
    setPage(1);
  };

  const emptyMessage = feedFilter === "following"
    ? "Follow users to see their posts here."
    : "No posts yet. Be the first to share something!";

  return (
    <div style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "32px 20px",
      minHeight: "calc(100vh - 80px)",
      backgroundColor: "#f6f6f6",
    }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => handleFilterChange("all")}
          style={{
            padding: "10px 20px",
            borderRadius: "20px",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: feedFilter === "all" ? "var(--accent)" : "var(--bg-elevated)",
            color: feedFilter === "all" ? "gray" : "#000",
          }}
        >
          For you
        </button>
        {isSignedIn && (
          <button
            onClick={() => handleFilterChange("following")}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: feedFilter === "following" ? "var(--accent)" : "var(--bg-elevated)",
              color: feedFilter === "following" ? "gray" : "#000",
            }}
          >
            Following
          </button>
        )}
      </div>

      {loading && posts.length === 0 ? (
        <>
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </>
      ) : !Array.isArray(posts) || posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>{feedFilter === "following" ? "No posts from people you follow" : "No posts yet"}</p>
          <p style={{ fontSize: "14px" }}>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {posts.map(p => <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(page, false)} />)}
          {loading && Array.isArray(posts) && posts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                border: "3px solid var(--border-color)",
                borderTopColor: "var(--accent)",
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
