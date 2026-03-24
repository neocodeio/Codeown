import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { useWindowSize } from "../hooks/useWindowSize";
import { MagnifyingGlass, Users, Layout, Rocket, CaretDown, Clock, X } from "phosphor-react";
import type { Post } from "../hooks/usePosts";
import type { Project } from "../types/project";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  is_organization?: boolean;
  is_hirable?: boolean;
  is_pro?: boolean;
}

interface SearchPost {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  tags?: string[] | null;
  user?: { name: string; email: string | null; avatar_url: string | null; username?: string | null };
}

interface SearchProject {
  id: number;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  technologies_used: string[];
  status: string;
  user?: { name: string; email: string | null; avatar_url: string | null; username?: string | null };
}

type FilterType = "people" | "posts" | "projects";
type SortOption = "best" | "newest";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>("people");
  const [showOnlyCofounder, setShowOnlyCofounder] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useClerkUser();

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("best");

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync query state with URL
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Fetch Logic
  // 1. Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      // Allow empty query only if showOnlyCofounder is true and we're looking at projects
      if ((!query || query.trim().length < 1) && !showOnlyCofounder) {
        setUsers([]);
        setPosts([]);
        setProjects([]);
        return;
      }

      setLoading(true);
      let cancelled = false;

      try {
        // Save to history if query is significant
        if (query.trim().length >= 2) {
          const savedHistory = localStorage.getItem("codeown_search_history");
          let currentHistory: string[] = [];
          if (savedHistory) {
            try {
              currentHistory = JSON.parse(savedHistory);
            } catch (e) {
              console.error("Failed to parse search history");
            }
          }
          const newHistory = [query.trim(), ...currentHistory.filter((item) => item !== query.trim())].slice(0, 6);
          setHistory(newHistory);
          localStorage.setItem("codeown_search_history", JSON.stringify(newHistory));
        }

        // Re-use logic for search type
        const isTag = query.startsWith("#");
        const isMention = query.startsWith("@");
        const cleanQ = isTag || isMention ? query.slice(1) : query;

        let userPromise, postPromise, projectPromise;

        if (isMention) {
          userPromise = api.get(`/search/users?q=${encodeURIComponent(cleanQ)}`);
          postPromise = api.get(`/search/posts?q=${encodeURIComponent(query)}&limit=20`);
          projectPromise = api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20&cofounder=${showOnlyCofounder}`);
        } else if (isTag) {
          userPromise = Promise.resolve({ data: [] });
          postPromise = api.get(`/search/posts?q=${encodeURIComponent(query)}&limit=20`);
          projectPromise = api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20&cofounder=${showOnlyCofounder}`);
        } else {
          userPromise = api.get(`/search/users?q=${encodeURIComponent(query)}`);
          postPromise = api.get(`/search/posts?q=${encodeURIComponent(query)}&limit=20`);
          projectPromise = api.get(`/search/projects?q=${encodeURIComponent(query)}&limit=20&cofounder=${showOnlyCofounder}`);
        }

        const [uRes, pRes, prRes] = await Promise.all([userPromise, postPromise, projectPromise]);

        if (!cancelled) {
          setUsers(Array.isArray(uRes.data) ? uRes.data : []);
          setPosts(pRes.data?.posts || []);
          setProjects(prRes.data?.projects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => { cancelled = true; };
    };

    const timeoutId = setTimeout(fetchResults, 300);

    return () => clearTimeout(timeoutId);
  }, [query, getToken, showOnlyCofounder]);

  // 2. Fetch following list for current user and initialize history
  useEffect(() => {
    if (isLoaded && clerkUser?.id) {
      api.get(`/follows/${clerkUser.id}/following`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setCurrentUserFollowing(res.data.map((u: any) => u.id));
          }
        })
        .catch(console.error);
    }

    const savedHistory = localStorage.getItem("codeown_search_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history");
      }
    }
  }, [isLoaded, clerkUser?.id]);


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSearchParams(val ? { q: val } : {});
  };

  const removeFromHistory = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item !== q);
    setHistory(newHistory);
    localStorage.setItem("codeown_search_history", JSON.stringify(newHistory));
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    setSearchParams({ q });
  };

  const handleFollow = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in to follow");

      // Use the consistent toggle endpoint used in UserProfile
      const res = await api.post(`/follows/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const isNowFollowing = res.data.following;

      setCurrentUserFollowing(prev => {
        if (isNowFollowing) {
          return prev.includes(targetId) ? prev : [...prev, targetId];
        } else {
          return prev.filter(id => id !== targetId);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Derived, display-ready collections
  const peopleResults = [...users]
    .sort((a, b) => a.name.localeCompare(b.name));

  const postsSorted =
    sortOption === "newest"
      ? [...posts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : posts;

  const projectsSorted =
    sortOption === "newest"
      ? [...projects].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : projects;

  return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh", paddingBottom: "64px" }}>

      {/* Top Search Bar Configuration */}
      <div style={{
        position: "sticky",
        top: 0,
        backgroundColor: "var(--bg-page)",
        zIndex: 100,
        borderBottom: "0.5px solid var(--border-hairline)",
        padding: "24px 0"
      }}>
        <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "var(--bg-page)",
            border: "0.5px solid var(--border-hairline)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 8px 8px 16px",
            gap: "12px",
            height: "56px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <MagnifyingGlass size={20} weight="thin" style={{ color: "var(--text-tertiary)" }} />

            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={`SEARCH...`}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                background: "transparent",
                minWidth: 0,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase"
              }}
              autoFocus
            />

            {/* Quick Filter: Seeking Co-Founder */}
            {activeFilter === "projects" && (
              <button
                onClick={() => setShowOnlyCofounder(!showOnlyCofounder)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: showOnlyCofounder ? "var(--text-primary)" : "transparent",
                  color: showOnlyCofounder ? "var(--bg-page)" : "var(--text-tertiary)",
                  border: showOnlyCofounder ? "none" : "0.5px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                  fontSize: "10px",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  transition: "all 0.15s ease",
                  marginRight: "4px"
                }}
              >
                <Users size={14} weight={showOnlyCofounder ? "fill" : "regular"} />
                {!isMobile && "Seeking Co-Founder"}
              </button>
            )}

            {/* Filter Dropdown */}
            <div style={{ position: "relative" }} ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-page)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 16px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  transition: "opacity 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {activeFilter === "people" ? <Users size={16} /> : activeFilter === "posts" ? <Layout size={16} /> : <Rocket size={16} />}
                <span>{activeFilter}</span>
                <CaretDown size={12} weight="bold" />
              </button>

              {isFilterOpen && (
                <div style={{
                  position: "absolute",
                  top: "120%",
                  right: 0,
                  backgroundColor: "var(--bg-page)",
                  borderRadius: "var(--radius-sm)",
                  border: "0.5px solid var(--border-hairline)",
                  padding: "4px",
                  minWidth: "160px",
                  flexDirection: "column",
                  display: "flex",
                  zIndex: 200
                }}>
                  {[
                    { id: "people", icon: Users, label: "People" },
                    { id: "posts", icon: Layout, label: "Posts" },
                    { id: "projects", icon: Rocket, label: "Projects" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setActiveFilter(opt.id as FilterType); setIsFilterOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 14px",
                        border: "none",
                        background: activeFilter === opt.id ? "var(--bg-hover)" : "transparent",
                        color: "var(--text-primary)",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 700,
                        fontSize: "11px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase"
                      }}
                      onMouseEnter={(e) => { if (activeFilter !== opt.id) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { if (activeFilter !== opt.id) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <opt.icon size={16} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Results Area */}
      <div className="container" style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
        
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : (!query && !showOnlyCofounder) ? (
          <div className="fade-in">
            {history.length > 0 ? (
              <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", color: "var(--text-tertiary)" }}>
                  <Clock size={16} />
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>Recent Searches</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => handleHistoryClick(h)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        backgroundColor: "transparent",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        borderBottom: "0.5px solid var(--border-hairline)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <MagnifyingGlass size={16} weight="thin" style={{ color: "var(--text-tertiary)" }} />
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{h}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(e, h)}
                        style={{
                          border: "none",
                          background: "none",
                          padding: "8px",
                          cursor: "pointer",
                          color: "#cbd5e1",
                          borderRadius: "var(--radius-sm)",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#cbd5e1"}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-tertiary)" }}>
                <MagnifyingGlass size={64} weight="thin" style={{ opacity: 0.1, marginBottom: "24px" }} />
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Search Codeown</div>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-tertiary)" }}>Find people, posts, and projects from the community</p>
              </div>
            )}
          </div>
        ) : !loading && !users.length && !posts.length && !projects.length ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-tertiary)" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>No results found for "{query}"</div>
          </div>
        ) : (
          <div className="fade-in">
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                <span style={{ color: "var(--text-primary)" }}>Results for</span>{" "}
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-hover)",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  “{query}”
                </span>
                <span style={{ marginLeft: "12px" }}>
                  · {peopleResults.length} people · {posts.length} posts · {projects.length} projects
                </span>
              </div>

              {/* Secondary filter chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {[
                  { id: "people", label: "People" },
                  { id: "posts", label: "Posts" },
                  { id: "projects", label: "Projects" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveFilter(opt.id as FilterType)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "0.5px solid",
                      borderColor: activeFilter === opt.id ? "var(--text-primary)" : "var(--border-hairline)",
                      backgroundColor: activeFilter === opt.id ? "var(--text-primary)" : "transparent",
                      color: activeFilter === opt.id ? "var(--bg-page)" : "var(--text-tertiary)",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontFamily: "var(--font-mono)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}

                {activeFilter === "projects" && (
                  <button
                    onClick={() => setShowOnlyCofounder(!showOnlyCofounder)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "0.5px solid",
                      borderColor: showOnlyCofounder ? "var(--text-primary)" : "var(--border-hairline)",
                      backgroundColor: showOnlyCofounder ? "var(--text-primary)" : "transparent",
                      color: showOnlyCofounder ? "var(--bg-page)" : "var(--text-tertiary)",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontFamily: "var(--font-mono)",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <Users size={14} weight={showOnlyCofounder ? "fill" : "regular"} />
                    Looking for Co-Founder
                  </button>
                )}

                <div
                  style={{
                    display: "inline-flex",
                    borderRadius: "var(--radius-sm)",
                    border: "0.5px solid var(--border-hairline)",
                    overflow: "hidden",
                  }}
                >
                  {[
                    { id: "best", label: "Best match" },
                    { id: "newest", label: "Newest" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSortOption(opt.id as SortOption)}
                      style={{
                        padding: "6px 10px",
                        fontSize: "10px",
                        fontWeight: 700,
                        border: "none",
                        backgroundColor: sortOption === opt.id ? "var(--text-primary)" : "transparent",
                        color: sortOption === opt.id ? "var(--bg-page)" : "var(--text-tertiary)",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontFamily: "var(--font-mono)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFilter === "people" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px"
              }}>
                {peopleResults.map((user) => (
                  <div key={user.id}
                    onClick={() => navigate(user.username ? `/${user.username}` : `/user/${user.id}`)}
                    style={{
                      border: "0.5px solid var(--border-hairline)",
                      borderRadius: "var(--radius-sm)",
                      padding: "32px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      backgroundColor: "var(--bg-page)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-page)";
                    }}
                  >
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <AvailabilityBadge
                        avatarUrl={user.avatar_url}
                        name={user.name}
                        size={80}
                        isOpenToOpportunities={user.is_pro === true && user.is_hirable === true}
                      />
                    </div>

                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {user.name}
                      <VerifiedBadge username={user.username} size="14px" />
                    </h3>
                    <p style={{ margin: "0 0 24px", fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>@{user.username || "user"}</p>

                    <button
                      onClick={(e) => handleFollow(e, user.id)}
                      style={{
                        backgroundColor: currentUserFollowing.includes(user.id) ? "transparent" : "var(--text-primary)",
                        color: currentUserFollowing.includes(user.id) ? "var(--text-primary)" : "var(--bg-page)",
                        border: currentUserFollowing.includes(user.id) ? "0.5px solid var(--border-hairline)" : "none",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 24px",
                        fontWeight: 800,
                        fontSize: "11px",
                        cursor: "pointer",
                        width: "100%",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase"
                      }}
                    >
                      {currentUserFollowing.includes(user.id) ? "FOLLOWING" : "FOLLOW"}
                    </button>
                  </div>
                ))}
                {peopleResults.length === 0 && <EmptyState type="People" />}
              </div>
            )}

            {activeFilter === "posts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {postsSorted.map((post) => (
                  <PostCard key={post.id} post={post as Post} />
                ))}
                {postsSorted.length === 0 && <EmptyState type="Posts" />}
              </div>
            )}

            {activeFilter === "projects" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px"
              }}>
                {projectsSorted.map((project) => (
                  <ProjectCard key={project.id} project={project as Project} />
                ))}
                {projectsSorted.length === 0 && <EmptyState type="Projects" />}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div style={{
      gridColumn: "1 / -1",
      textAlign: "center",
      padding: "80px 40px",
      backgroundColor: "transparent",
      border: "0.5px solid var(--border-hairline)",
      borderRadius: "var(--radius-sm)",
      color: "var(--text-tertiary)"
    }}>
      <div style={{ 
        fontSize: "13px", 
        fontWeight: 800, 
        fontFamily: "var(--font-mono)", 
        textTransform: "uppercase", 
        color: "var(--text-primary)",
        letterSpacing: "0.05em",
        marginBottom: "8px"
      }}>
        NO {type.toUpperCase()} FOUND
      </div>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Try adjusting your search terms</p>
    </div>
  )
}
