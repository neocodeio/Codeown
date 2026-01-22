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

  return (
    <main className="container" style={{ padding: "40px 20px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <header style={{ 
          marginBottom: "60px", 
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "20px"
        }}>
          <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Feed</h1>
          <div style={{ display: "flex", gap: "32px" }}>
            <button
              onClick={() => handleFilterChange("all")}
              style={{
                border: "1px solid #333",
                padding: "5px 15px",
                fontSize: "13px",
                letterSpacing: "0.1em",
                fontWeight: 800,
                color: feedFilter === "all" ? "gray" : "#333",
                borderRadius: "5px",
              }}
            >
              LATEST
            </button>
            {isSignedIn && (
              <button
                onClick={() => handleFilterChange("following")}
                style={{
                 border: "1px solid #333",
                padding: "5px 15px",
                fontSize: "13px",
                letterSpacing: "0.1em",
                fontWeight: 800,
                color: feedFilter === "following" ? "gray" : "#333",
                borderRadius: "5px",
                }}
              >
                FOLLOWING
              </button>
            )}
          </div>
        </header>

        {loading && posts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {[...Array(3)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : !Array.isArray(posts) || posts.length === 0 ? (
          <div className="fade-in" style={{ padding: "80px 0", textAlign: "left" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>NOTHING HERE.</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
              The feed is currently empty. Start following people or create a post to see content here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {posts.map(p => <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(page, false)} />)}
            {loading && Array.isArray(posts) && posts.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  border: "2px solid var(--text-tertiary)",
                  borderTopColor: "var(--text-primary)",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
