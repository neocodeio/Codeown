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
      maxWidth: "720px",
      margin: "0 auto",
      padding: "24px 16px",
      minHeight: "calc(100vh - 80px)",
      backgroundColor: "transparent",
    }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button
          onClick={() => handleFilterChange("all")}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-lg)",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "15px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundColor: feedFilter === "all" ? "var(--primary)" : "var(--bg-card)",
            color: feedFilter === "all" ? "gray" : "#000",
            boxShadow: feedFilter === "all" ? "var(--shadow-md)" : "var(--shadow-sm)",
          }}
          onMouseEnter={(e) => {
            if (feedFilter !== "all") {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (feedFilter !== "all") {
              e.currentTarget.style.backgroundColor = "var(--bg-card)";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          For you
        </button>
        {isSignedIn && (
          <button
            onClick={() => handleFilterChange("following")}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-lg)",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "15px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              backgroundColor: feedFilter === "following" ? "var(--primary)" : "var(--bg-card)",
              color: feedFilter === "following" ? "gray" : "#000",
              boxShadow: feedFilter === "following" ? "var(--shadow-md)" : "var(--shadow-sm)",
            }}
            onMouseEnter={(e) => {
              if (feedFilter !== "following") {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (feedFilter !== "following") {
                e.currentTarget.style.backgroundColor = "var(--bg-card)";
                e.currentTarget.style.transform = "translateY(0)";
              }
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
        <div style={{ 
          textAlign: "center", 
          padding: "80px 20px", 
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 24px",
            backgroundColor: "var(--bg-hover)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
          }}>📝</div>
          <p style={{ fontSize: "20px", marginBottom: "8px", fontWeight: 600, color: "var(--text-primary)" }}>
            {feedFilter === "following" ? "No posts from people you follow" : "No posts yet"}
          </p>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {posts.map(p => <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(page, false)} />)}
          {loading && Array.isArray(posts) && posts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid var(--border-color)",
                borderTopColor: "var(--primary)",
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
