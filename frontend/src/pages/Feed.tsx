import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";

export default function Feed() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state with URL params
  const feedType = (searchParams.get("type") as "posts" | "projects") || "posts";
  const feedFilter = (searchParams.get("filter") as FeedFilter) || "all";
  const selectedTag = searchParams.get("tag") || "";
  const selectedLang = (searchParams.get("lang") as "en" | "ar" | "") || "";

  // Helper to update search params
  const updateParams = (newParams: Record<string, string | null>) => {
    setSearchParams(prev => {
      // If switching type, clear potential incompatible filters
      if (newParams.type && newParams.type !== feedType) {
        prev.delete("tag");
        prev.delete("lang");
      }

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "") prev.delete(key);
        else prev.set(key, value);
      });
      return prev;
    }, { replace: true });
  };

  const setFeedFilter = (filter: FeedFilter) => updateParams({ filter });

  const { getToken } = useClerkAuth();
  const { isSignedIn } = useClerkUser();

  // Hooks using TanStack Query
  const {
    posts,
    loading: postsLoading,
    fetchPosts,
    hasMore: postsHasMore
  } = usePosts(20, feedFilter, getToken, selectedTag, selectedLang || undefined);

  const {
    projects,
    loading: projectsLoading,
    fetchProjects,
    hasMore: projectsHasMore
  } = useProjects(20, feedFilter, getToken, selectedTag);

  const loading = feedType === "posts" ? postsLoading : projectsLoading;
  const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

  useEffect(() => {
    if (!isSignedIn && feedFilter === "following") setFeedFilter("all");
  }, [isSignedIn, feedFilter]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          if (feedType === "posts") {
            fetchPosts(undefined, true);
          } else {
            fetchProjects(undefined, true);
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, fetchPosts, fetchProjects, feedType]);

  const handleFilterChange = (f: FeedFilter) => {
    setFeedFilter(f);
  };

  const currentItems = feedType === "posts" ? posts : projects;

  const handlePostCreated = useCallback(() => {
    fetchPosts(undefined, false);
  }, [fetchPosts]);

  useEffect(() => {
    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, [handlePostCreated]);

  const isInitialLoading = (feedType === "posts" && postsLoading && posts.length === 0) ||
    (feedType === "projects" && projectsLoading && projects.length === 0);

  return (
    <main style={{ padding: 0, minHeight: "100vh", backgroundColor: "#fff" }}>
      <SEO
        title="Home"
        description="Share your projects, discover amazing code, and connect with developers worldwide on Codeown."
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Codeown",
          "url": window.location.origin,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }}
      />

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: width >= 1280 ? "64px" : "0",
        maxWidth: width >= 1400 ? "1400px" : "100%",
        margin: "0 auto",
        width: "100%",
        padding: width >= 1024 && width < 1400 ? "0 24px" : "0"
      }}>
        {/* Main Feed Column */}
        <div style={{
          maxWidth: width >= 1024 ? "600px" : "100%",
          width: "100%",
          marginLeft: width >= 1280 ? "200px" : width >= 1024 ? "100px" : "0",
          backgroundColor: "#fff",
          borderLeft: width >= 1024 ? "1px solid #eff3f4" : "none",
          borderRight: width >= 1024 ? "1px solid #eff3f4" : "none",
          minHeight: "100vh"
        }}>
          {/* Top Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid #eff3f4",
            position: "sticky",
            top: isMobile ? "64px" : 0,
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 10
          }}>
            <div
              onClick={() => handleFilterChange("all")}
              style={{
                flex: 1,
                padding: "16px",
                textAlign: "center",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: feedFilter === "all" ? 700 : 500,
                color: feedFilter === "all" ? "#0f172a" : "#64748b",
                position: "relative",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              For You
              {feedFilter === "all" && (
                <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "56px", height: "4px", backgroundColor: "#212121", borderRadius: "0px" }} />
              )}
            </div>
            <div
              onClick={() => handleFilterChange("following")}
              style={{
                flex: 1,
                padding: "16px",
                textAlign: "center",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: feedFilter === "following" ? 700 : 500,
                color: feedFilter === "following" ? "#0f172a" : "#64748b",
                position: "relative",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              Following
              {feedFilter === "following" && (
                <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "70px", height: "4px", backgroundColor: "#212121", borderRadius: "0px" }} />
              )}
            </div>
          </div>

          {/* Popular Users - Mobile/Tablet Only - Hidden by request */}
          {/* {width < 1024 && <PopularUsersHorizontal />} */}

          {/* Content Type Selector */}
          <div style={{
            display: "flex",
            gap: "8px",
            padding: "12px 16px",
            borderBottom: "1px solid #eff3f4",
            backgroundColor: "#fff"
          }}>
            <button
              onClick={() => updateParams({ type: "posts" })}
              style={{
                padding: "6px 14px",
                borderRadius: "12px",
                border: "1px solid #eff3f4",
                backgroundColor: feedType === "posts" ? "#212121" : "#fff",
                color: feedType === "posts" ? "#fff" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Posts
            </button>
            <button
              onClick={() => updateParams({ type: "projects" })}
              style={{
                padding: "6px 14px",
                borderRadius: "12px",
                border: "1px solid #eff3f4",
                backgroundColor: feedType === "projects" ? "#212121" : "#fff",
                color: feedType === "projects" ? "#fff" : "#64748b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Projects
            </button>
          </div>

          {/* Composer */}
          {feedType === "posts" && (
            <FeedPostComposer onCreated={handlePostCreated} />
          )}

          {
            isInitialLoading ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ padding: "20px", borderBottom: "1px solid #eff3f4" }}>
                    <PostCardSkeleton />
                  </div>
                ))}
              </div>
            ) : currentItems.length === 0 && !loading ? (
              <div className="fade-in" style={{ padding: "80px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {feedFilter === "following" ? (
                  <>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>
                      Follow creators to see their activity
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 32px" }}>
                      It looks like you haven't followed anyone yet. Discover amazing creators and start building your feed!
                    </p>
                    <button
                      onClick={() => handleFilterChange("all")}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#212121",
                        color: "#fff",
                        border: "none",
                        borderRadius: "100px",
                        fontWeight: 700,
                        fontSize: "15px",
                        cursor: "pointer",
                      }}
                    >
                      Explore
                    </button>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>
                      Nothing here yet
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6 }}>
                      Check back later for new {feedType}!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="feed-stream" style={{ display: "flex", flexDirection: "column" }}>
                {feedType === "posts" ? (
                  // Items are Posts
                  (currentItems as any[]).map((p) => (
                    <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(undefined, false)} />
                  ))
                ) : (
                  // Items are Projects
                  (currentItems as any[]).map((p) => (
                    <ProjectCard key={p.id} project={p} onUpdated={() => fetchProjects(undefined, false)} />
                  ))
                )}

                {loading && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                    <div className="spinner" />
                  </div>
                )}
              </div>
            )
          }
        </div>

        {/* Sidebar - Only visible on desktop */}
        <RecommendedUsersSidebar />
      </div>
    </main>
  );
}
