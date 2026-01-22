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
    <main style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "32px 16px",
      minHeight: "calc(100vh - 70px)",
      transition: "all 0.4s ease",
    }}>
      <header style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "32px", 
        padding: "4px",
        backgroundColor: "var(--gray-100)",
        borderRadius: "var(--radius-xl)",
        width: "fit-content",
      }}>
        <button
          onClick={() => handleFilterChange("all")}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-lg)",
            border: "none",
            fontWeight: 700,
            fontSize: "14px",
            backgroundColor: feedFilter === "all" ? "var(--bg-card)" : "transparent",
            color: feedFilter === "all" ? "var(--primary)" : "var(--text-secondary)",
            boxShadow: feedFilter === "all" ? "var(--shadow-sm)" : "none",
          }}
        >
          For you
        </button>
        {isSignedIn && (
          <button
            onClick={() => handleFilterChange("following")}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-lg)",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              backgroundColor: feedFilter === "following" ? "var(--bg-card)" : "transparent",
              color: feedFilter === "following" ? "var(--primary)" : "var(--text-secondary)",
              boxShadow: feedFilter === "following" ? "var(--shadow-sm)" : "none",
            }}
          >
            Following
          </button>
        )}
      </header>

      {loading && posts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : !Array.isArray(posts) || posts.length === 0 ? (
        <div className="fade-in" style={{ 
          textAlign: "center", 
          padding: "120px 20px", 
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-2xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 24px",
            backgroundColor: "var(--gray-50)",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
          }}>✨</div>
          <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "var(--text-primary)" }}>
            Your feed is empty
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto" }}>
            {feedFilter === "following" 
              ? "Follow some amazing creators to see their latest thoughts here." 
              : "Be the pioneer! Start the conversation by sharing your first post."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {posts.map(p => <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(page, false)} />)}
          {loading && Array.isArray(posts) && posts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                border: "3px solid var(--gray-200)",
                borderTopColor: "var(--primary)",
                borderRadius: "50%",
                animation: "spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite",
              }} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
