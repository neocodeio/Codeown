import { useEffect, useState, useRef } from "react";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faCheck, faTags, faGlobeAmericas, faUserFriends, faLayerGroup, faRocket } from "@fortawesome/free-solid-svg-icons";

const POPULAR_TAGS = ["React", "JavaScript", "TypeScript", "Node.js", "Python", "Next.js", "WebDev", "UI/UX", "Mobile", "AI"];

export default function Feed() {
  const [feedType, setFeedType] = useState<"posts" | "projects">("posts");
  const [page, setPage] = useState(1);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<"en" | "ar" | "">("");
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
                backgroundColor: "#849bff",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 12px rgba(132, 155, 255, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(132, 155, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(132, 155, 255, 0.2)";
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
                        border: feedType === "posts" ? "2px solid #364182" : "2px solid #f1f5f9",
                        backgroundColor: feedType === "posts" ? "#f8fafc" : "transparent",
                        color: "#364182",
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
                        border: feedType === "projects" ? "2px solid #364182" : "2px solid #f1f5f9",
                        backgroundColor: feedType === "projects" ? "#f8fafc" : "transparent",
                        color: "#364182",
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
                        backgroundColor: feedFilter === "all" ? "#eef2ff" : "transparent",
                        color: feedFilter === "all" ? "#364182" : "#64748b",
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
                          backgroundColor: feedFilter === "following" ? "#eef2ff" : "transparent",
                          color: feedFilter === "following" ? "#364182" : "#64748b",
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
                        backgroundColor: selectedTag === "" ? "#364182" : "#f1f5f9",
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
                          backgroundColor: selectedTag === tag.toLowerCase() ? "#364182" : "#f1f5f9",
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
            <div className="fade-in slide-up" style={{ padding: "80px 0", textAlign: "left" }}>
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
                  border: "2px solid #364182",
                  color: "#364182",
                  borderRadius: "12px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Clear all filters
              </button>
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
