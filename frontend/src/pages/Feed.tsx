import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { PostCardSkeleton } from "../components/LoadingSkeleton";

export default function Feed() {
  const [feedType, setFeedType] = useState<"posts" | "projects">("posts");
  const [page, setPage] = useState(1);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const { getToken } = useClerkAuth();
  const { isSignedIn } = useClerkUser();

  // Hooks - only pagination for the active tab; inactive tab stays at page 1
  const postsPage = feedType === 'posts' ? page : 1;
  const projectsPage = feedType === 'projects' ? page : 1;

  const { posts, loading: postsLoading, fetchPosts, hasMore: postsHasMore } = usePosts(postsPage, 20, feedFilter, getToken);
  const { projects, loading: projectsLoading, fetchProjects, hasMore: projectsHasMore } = useProjects(projectsPage, 20, feedFilter, getToken);

  const loading = feedType === "posts" ? postsLoading : projectsLoading;
  const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

  useEffect(() => {
    if (!isSignedIn && feedFilter === "following") setFeedFilter("all");
  }, [isSignedIn, feedFilter]);

  // Reset page when switching views
  useEffect(() => {
    setPage(1);
  }, [feedType, feedFilter]);

  useEffect(() => {
    const handlePostCreated = () => {
      if (feedType === "posts") {
        setPage(1);
        fetchPosts(1, false);
      }
    };
    // Also listen for project created if we had that event
    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, [fetchPosts, feedType]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          setPage((prev) => prev + 1);
          // Fetch next page based on current type
          if (feedType === "posts") {
            fetchPosts(page + 1, true);
          } else {
            fetchProjects(page + 1, true);
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, page, fetchPosts, fetchProjects, feedType]);

  const handleFilterChange = (f: FeedFilter) => {
    setFeedFilter(f);
    setPage(1);
  };

  const currentItems = feedType === "posts" ? posts : projects;

  return (
    <main className="container" style={{ padding: "40px 20px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <header className="fade-in slide-up" style={{
          marginBottom: "60px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "48px", margin: 0 }}>Feed</h1>

            {/* Type Toggle */}
            <div style={{
              display: "flex",
              backgroundColor: "#f5f5f5",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)"
            }}>
              <button
                onClick={() => setFeedType("posts")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: feedType === "posts" ? "#fff" : "transparent",
                  color: feedType === "posts" ? "#000" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: feedType === "posts" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                POSTS
              </button>
              <button
                onClick={() => setFeedType("projects")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: feedType === "projects" ? "#fff" : "transparent",
                  color: feedType === "projects" ? "#000" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: feedType === "projects" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                PROJECTS
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleFilterChange("all")}
              style={{
                border: "2px solid #e0e0e0",
                padding: "6px 16px",
                fontSize: "12px",
                letterSpacing: "0.1em",
                fontWeight: 800,
                backgroundColor: feedFilter === "all" ? "#000" : "transparent",
                color: feedFilter === "all" ? "#fff" : "var(--text-secondary)",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              LATEST
            </button>
            {isSignedIn && (
              <button
                onClick={() => handleFilterChange("following")}
                style={{
                  border: "2px solid #e0e0e0",
                  padding: "6px 16px",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  fontWeight: 800,
                  backgroundColor: feedFilter === "following" ? "#000" : "transparent",
                  color: feedFilter === "following" ? "#fff" : "var(--text-secondary)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                FOLLOWING
              </button>
            )}
          </div>
        </header>

        {loading && (!currentItems || currentItems.length === 0) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {[...Array(3)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : !Array.isArray(currentItems) || currentItems.length === 0 ? (
          <div className="fade-in slide-up" style={{ padding: "80px 0", textAlign: "left" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>NOTHING HERE.</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
              The feed is currently empty. Start following people or create a {feedType === 'posts' ? 'post' : 'project'} to see content here.
            </p>
          </div>
        ) : (
          <div className="stagger-1" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {feedType === "posts" ? (
              // Items are Posts
              (currentItems as any[]).map((p, i) => (
                <PostCard key={p.id} post={p} index={i} onUpdated={() => fetchPosts(page, false)} />
              ))
            ) : (
              // Items are Projects
              (currentItems as any[]).map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} onUpdated={() => fetchProjects(page, false)} />
              ))
            )}

            {loading && (
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
