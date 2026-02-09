import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faCheck, faTags, faGlobeAmericas, faUserFriends, faLayerGroup, faRocket } from "@fortawesome/free-solid-svg-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserBlock01Icon } from "@hugeicons/core-free-icons";
import { SEO } from "../components/SEO";

const POPULAR_TAGS = ["React", "JavaScript", "TypeScript", "Node.js", "Python", "Next.js", "WebDev", "UI/UX", "Mobile", "AI"];

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state with URL params
  const feedType = (searchParams.get("type") as "posts" | "projects") || "posts";
  const feedFilter = (searchParams.get("filter") as FeedFilter) || "all";
  const selectedTag = searchParams.get("tag") || "";
  const selectedLang = (searchParams.get("lang") as "en" | "ar" | "") || "";
  const [page, setPage] = useState(1);

  // Helper to update search params
  const updateParams = (newParams: Record<string, string | null>) => {
    setSearchParams(prev => {
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "") prev.delete(key);
        else prev.set(key, value);
      });
      return prev;
    }, { replace: true });
    setPage(1); // Reset page on any filter change
  };

  const setFeedType = (type: "posts" | "projects") => updateParams({ type });
  const setFeedFilter = (filter: FeedFilter) => updateParams({ filter });
  const setSelectedTag = (tag: string) => updateParams({ tag });
  const setSelectedLang = (lang: "en" | "ar" | "") => updateParams({ lang });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const { getToken } = useClerkAuth();
  const { isSignedIn } = useClerkUser();

  // Hooks - only pagination for the active tab; inactive tab stays at page 1
  const postsPage = feedType === 'posts' ? page : 1;
  const projectsPage = feedType === 'projects' ? page : 1;

  const { posts, loading: postsLoading, fetchPosts, hasMore: postsHasMore } = usePosts(postsPage, 20, feedFilter, getToken, selectedTag, selectedLang || undefined);
  const { projects, loading: projectsLoading, fetchProjects, hasMore: projectsHasMore } = useProjects(projectsPage, 20, feedFilter, getToken, selectedTag);

  const loading = feedType === "posts" ? postsLoading : projectsLoading;
  const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

  useEffect(() => {
    if (!isSignedIn && feedFilter === "following") setFeedFilter("all");
  }, [isSignedIn, feedFilter]);

  // Handle click outside for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page when switching views or tags
  useEffect(() => {
    setPage(1);
    // Explicitly re-fetch if not triggered by the hook dependencies automatically (safety net)
    if (feedType === "posts") {
      // The hook dependency [selectedLang] will trigger the fetch, but we ensure page is 1 first
    }

    // If we switch to posts while on contributors filter, reset to all
    if (feedType === "posts" && feedFilter === "contributors") {
      setFeedFilter("all");
    }
  }, [feedType, feedFilter, selectedTag, selectedLang]);

  useEffect(() => {
    const handlePostCreated = () => {
      if (feedType === "posts") {
        setPage(1);
        fetchPosts(1, false);
      }
    };
    const handleProjectCreated = () => {
      if (feedType === "projects") {
        setPage(1);
        fetchProjects(1, false);
      }
    };
    window.addEventListener("postCreated", handlePostCreated);
    window.addEventListener("projectCreated", handleProjectCreated);
    return () => {
      window.removeEventListener("postCreated", handlePostCreated);
      window.removeEventListener("projectCreated", handleProjectCreated);
    };
  }, [fetchPosts, fetchProjects, feedType]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          setPage((prev) => prev + 1);
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
      <SEO
        title="Home"
        description="Share your projects, discover amazing code, and connect with developers worldwide on Codeown."
      />
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <header className="fade-in slide-up" style={{
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative"
        }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              {selectedTag ? `#${selectedTag}` : feedFilter === "following" ? "Following" : "Discover"}
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
              Explore the latest {feedType} {selectedTag ? `tagged with ${selectedTag}` : ""}
            </p>
          </div>

          <div ref={filterRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                backgroundColor: "#212121",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Filter
              <FontAwesomeIcon icon={faEllipsisV} style={{ fontSize: "14px" }} />
            </button>

            {isFilterOpen && (
              <div style={{
                position: "absolute",
                top: "120%",
                right: 0,
                width: "280px",
                backgroundColor: "#fff",
                borderRadius: "20px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                border: "1px solid #f1f5f9",
                padding: "20px",
                zIndex: 1000,
                animation: "filterSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Content Type</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setFeedType("posts")}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "12px",
                        border: feedType === "posts" ? "2px solid #212121" : "2px solid #f1f5f9",
                        backgroundColor: feedType === "posts" ? "#f8fafc" : "transparent",
                        color: "#212121",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: "12px" }} />
                      Posts
                    </button>
                    <button
                      onClick={() => setFeedType("projects")}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "12px",
                        border: feedType === "projects" ? "2px solid #212121" : "2px solid #f1f5f9",
                        backgroundColor: feedType === "projects" ? "#f8fafc" : "transparent",
                        color: "#212121",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <FontAwesomeIcon icon={faRocket} style={{ fontSize: "12px" }} />
                      Projects
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Feed Source</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button
                      onClick={() => handleFilterChange("all")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor: feedFilter === "all" ? "#f0f0f0" : "transparent",
                        color: feedFilter === "all" ? "#212121" : "#64748b",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FontAwesomeIcon icon={faGlobeAmericas} style={{ width: "16px" }} />
                        Latest
                      </div>
                      {feedFilter === "all" && <FontAwesomeIcon icon={faCheck} style={{ fontSize: "10px" }} />}
                    </button>
                    {isSignedIn && (
                      <button
                        onClick={() => handleFilterChange("following")}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "none",
                          backgroundColor: feedFilter === "following" ? "#f0f0f0" : "transparent",
                          color: feedFilter === "following" ? "#212121" : "#64748b",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FontAwesomeIcon icon={faUserFriends} style={{ width: "16px" }} />
                          Following
                        </div>
                        {feedFilter === "following" && <FontAwesomeIcon icon={faCheck} style={{ fontSize: "10px" }} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.05em" }}>Filter by Tags</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <button
                      onClick={() => setSelectedTag("")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        backgroundColor: selectedTag === "" ? "#212121" : "#f1f5f9",
                        color: selectedTag === "" ? "#fff" : "#64748b",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      All
                    </button>
                    {POPULAR_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag.toLowerCase())}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          backgroundColor: selectedTag === tag.toLowerCase() ? "#212121" : "#f1f5f9",
                          color: selectedTag === tag.toLowerCase() ? "#fff" : "#64748b",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <style>{`
            @keyframes filterSlideUp {
              from { opacity: 0; transform: translateY(10px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </header>

        {
          loading && (!currentItems || currentItems.length === 0) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {[...Array(3)].map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : !Array.isArray(currentItems) || currentItems.length === 0 ? (
            <div className="fade-in slide-up" style={{ padding: "80px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {feedFilter === "following" ? (
                <>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "24px",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "24px",
                    color: "#64748b",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                  }}>
                    <HugeiconsIcon icon={UserBlock01Icon} style={{ fontSize: "80%" }} />
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#1e293b" }}>
                    Follow creators to see their activity
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 32px" }}>
                    It looks like you haven't followed anyone yet. Discover amazing creators and start building your feed!
                  </p>
                  <button
                    onClick={() => { setFeedFilter("all"); }}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#212121",
                      color: "#fff",
                      border: "none",
                      borderRadius: "14px",
                      fontWeight: 700,
                      fontSize: "15px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(54, 65, 130, 0.2)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    Discover Creators
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "20px",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "24px",
                    color: "#94a3b8"
                  }}>
                    <FontAwesomeIcon icon={faTags} style={{ fontSize: "24px" }} />
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)" }}>NOTHING HERE.</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.6 }}>
                    We couldn't find any {feedType} matching your current filters. Try selecting different tags or check back later!
                  </p>
                  <button
                    onClick={() => { setSelectedTag(""); setFeedFilter("all"); setSelectedLang(""); }}
                    style={{
                      marginTop: "24px",
                      padding: "10px 20px",
                      backgroundColor: "transparent",
                      border: "2px solid #212121",
                      color: "#212121",
                      borderRadius: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="stagger-1" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {feedType === "posts" ? (
                // Items are Posts
                <>

                  {(currentItems as any[]).map((p, i) => (
                    <PostCard key={p.id} post={p} index={i} onUpdated={() => fetchPosts(page, false)} />
                  ))}
                </>
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
          )
        }
      </div >
    </main >
  );
}
