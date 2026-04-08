import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { MagnifyingGlass, Users, Layout, Rocket, Clock, X, Buildings, CheckCircle } from "phosphor-react";
import type { Post } from "../hooks/usePosts";
import type { Project } from "../types/project";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import VerifiedBadge from "../components/VerifiedBadge";
import AvailabilityBadge from "../components/AvailabilityBadge";
import { StartupCard } from "../components/StartupCard";
import type { Startup } from "../types/startup";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce";

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

type FilterType = "people" | "posts" | "projects" | "startups";
type SortOption = "best" | "newest";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>("people");
  const [showOnlyCofounder, setShowOnlyCofounder] = useState(false);
  const { getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useClerkUser();

  const [history, setHistory] = useState<string[]>([]);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("best");

  const debouncedQuery = useDebounce(query, 300);

  // 1. Optimized Tab-Aware Queries
  const { data: usersData = [], isLoading: usersLoading } = useQuery({
    queryKey: ["searchUsers", debouncedQuery],
    queryFn: async () => {
      const isMention = debouncedQuery.startsWith("@");
      const cleanQ = isMention ? debouncedQuery.slice(1) : debouncedQuery;
      const res = await api.get(`/search/users?q=${encodeURIComponent(cleanQ)}`);
      return (Array.isArray(res.data) ? res.data : []) as SearchUser[];
    },
    enabled: debouncedQuery.length >= 2 && activeFilter === "people",
    staleTime: 5 * 60 * 1000,
  });

  const { data: postsData = [], isLoading: postsLoading } = useQuery({
    queryKey: ["searchPosts", debouncedQuery],
    queryFn: async () => {
      const res = await api.get(`/search/posts?q=${encodeURIComponent(debouncedQuery)}&limit=20`);
      return (res.data?.posts || []) as SearchPost[];
    },
    enabled: debouncedQuery.length >= 2 && activeFilter === "posts",
    staleTime: 5 * 60 * 1000,
  });

  const { data: projectsData = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["searchProjects", debouncedQuery, showOnlyCofounder],
    queryFn: async () => {
      const isTag = debouncedQuery.startsWith("#");
      const isMention = debouncedQuery.startsWith("@");
      const cleanQ = (isTag || isMention) ? debouncedQuery.slice(1) : debouncedQuery;
      const res = await api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20&cofounder=${showOnlyCofounder}`);
      return (res.data?.projects || []) as SearchProject[];
    },
    enabled: (debouncedQuery.length >= 2 || (showOnlyCofounder && debouncedQuery.length === 0)) && activeFilter === "projects",
    staleTime: 5 * 60 * 1000,
  });

  const { data: startupsData = [], isLoading: startupsLoading } = useQuery({
    queryKey: ["searchStartups", debouncedQuery],
    queryFn: async () => {
      const isTag = debouncedQuery.startsWith("#");
      const isMention = debouncedQuery.startsWith("@");
      const cleanQ = (isTag || isMention) ? debouncedQuery.slice(1) : debouncedQuery;
      const res = await api.get(`/search/startups?q=${encodeURIComponent(cleanQ)}&limit=20`);
      return (res.data?.startups || []) as Startup[];
    },
    enabled: debouncedQuery.length >= 2 && activeFilter === "startups",
    staleTime: 5 * 60 * 1000,
  });

  const loading = usersLoading || postsLoading || projectsLoading || startupsLoading;

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

  // Update history logic
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      const savedHistory = localStorage.getItem("codeown_search_history");
      let currentHistory: string[] = [];
      if (savedHistory) {
        try { currentHistory = JSON.parse(savedHistory); } catch (e) {}
      }
      const newHistory = [debouncedQuery.trim(), ...currentHistory.filter((item) => item !== debouncedQuery.trim())].slice(0, 6);
      setHistory(newHistory);
      localStorage.setItem("codeown_search_history", JSON.stringify(newHistory));
    }
  }, [debouncedQuery]);


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
  const peopleResults = [...usersData]
    .sort((a, b) => a.name.localeCompare(b.name));

  const postsSorted =
    sortOption === "newest"
      ? [...postsData].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : postsData;

  const projectsSorted =
    sortOption === "newest"
      ? [...projectsData].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : projectsData;

  const startupsSorted =
    sortOption === "newest"
      ? [...startupsData].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : startupsData;

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
            <MagnifyingGlass size={20} weight="regular" style={{ color: "var(--text-tertiary)" }} />

            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={`Search workers, projects, startups...`}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--text-primary)",
                background: "transparent",
                minWidth: 0,
              }}
              autoFocus
            />

            {query && (
               <button 
                onClick={() => { setQuery(""); setSearchParams({}); }}
                style={{
                  border: "none",
                  background: "var(--bg-hover)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-tertiary)"
                }}
               >
                <X size={14} weight="bold" />
               </button>
            )}
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "var(--text-tertiary)" }}>
                  <Clock size={16} />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Recent Searches</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => handleHistoryClick(h)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        backgroundColor: "transparent",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <MagnifyingGlass size={16} weight="regular" style={{ color: "var(--text-tertiary)" }} />
                        <span style={{ fontSize: "14.5px", fontWeight: 500, color: "var(--text-primary)" }}>{h}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(e, h)}
                        style={{
                          border: "none",
                          background: "none",
                          padding: "8px",
                          cursor: "pointer",
                          color: "var(--text-tertiary)",
                          borderRadius: "var(--radius-sm)",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-tertiary)" }}>
                <MagnifyingGlass size={64} weight="regular" style={{ opacity: 0.1, marginBottom: "24px" }} />
                <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Search Codeown</div>
                <p style={{ margin: 0, fontSize: "15px", color: "var(--text-tertiary)" }}>Find people, posts, and projects from the community</p>
              </div>
            )}
          </div>
        ) : !loading && !usersData.length && !postsData.length && !projectsData.length && !startupsData.length ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-tertiary)" }}>
            <div style={{ fontSize: "15px", fontWeight: 600 }}>No results found for "{query}"</div>
          </div>
        ) : (
          <div className="fade-in">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                marginBottom: "40px",
                borderBottom: "0.5px solid var(--border-hairline)",
                paddingBottom: "24px"
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap"
              }}>
                <div style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{query}</span>
                  <span style={{ marginLeft: "8px", opacity: 0.6 }}>
                    · {peopleResults.length} people · {postsData.length} posts · {projectsData.length} projects · {startupsData.length} startups
                  </span>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    backgroundColor: "var(--bg-hover)",
                    padding: "4px",
                    borderRadius: "100px",
                    border: "0.5px solid var(--border-hairline)",
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
                        padding: "6px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "100px",
                        backgroundColor: sortOption === opt.id ? "var(--text-primary)" : "transparent",
                        color: sortOption === opt.id ? "var(--bg-page)" : "var(--text-tertiary)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  scrollbarWidth: "none"
                }}
              >
                {[
                  { id: "people", label: "People", icon: Users },
                  { id: "posts", label: "Posts", icon: Layout },
                  { id: "projects", label: "Projects", icon: Rocket },
                  { id: "startups", label: "Startups", icon: Buildings },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveFilter(opt.id as FilterType)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      borderRadius: "100px",
                      border: "0.5px solid",
                      borderColor: activeFilter === opt.id ? "var(--text-primary)" : "var(--border-hairline)",
                      backgroundColor: activeFilter === opt.id ? "var(--text-primary)" : "var(--bg-page)",
                      color: activeFilter === opt.id ? "var(--bg-page)" : "var(--text-secondary)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <opt.icon size={16} weight={activeFilter === opt.id ? "bold" : "regular"} />
                    {opt.label}
                  </button>
                ))}

                {activeFilter === "projects" && (
                  <button
                    onClick={() => setShowOnlyCofounder(!showOnlyCofounder)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "100px",
                      border: "1px dashed",
                      borderColor: showOnlyCofounder ? "var(--text-primary)" : "var(--border-hairline)",
                      backgroundColor: showOnlyCofounder ? "rgba(var(--text-primary-rgb), 0.1)" : "transparent",
                      color: showOnlyCofounder ? "var(--text-primary)" : "var(--text-tertiary)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginLeft: "auto"
                    }}
                  >
                    {showOnlyCofounder ? <CheckCircle size={16} weight="fill" /> : <Users size={16} />}
                    Seeking Co-Founder
                  </button>
                )}
              </div>
            </div>

            {activeFilter === "people" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                gap: "24px"
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

                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {user.name}
                      <VerifiedBadge username={user.username} size="14px" />
                    </h3>
                    <p style={{ margin: "0 0 24px", fontSize: "13.5px", color: "var(--text-tertiary)", fontWeight: 400 }}>@{user.username || "user"}</p>

                    <button
                      onClick={(e) => handleFollow(e, user.id)}
                      style={{
                        backgroundColor: currentUserFollowing.includes(user.id) ? "transparent" : "var(--text-primary)",
                        color: currentUserFollowing.includes(user.id) ? "var(--text-primary)" : "var(--bg-page)",
                        border: currentUserFollowing.includes(user.id) ? "0.5px solid var(--border-hairline)" : "none",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 24px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        width: "100%",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {currentUserFollowing.includes(user.id) ? "Following" : "Follow"}
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
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
                gap: "24px"
              }}>
                {projectsSorted.map((project) => (
                  <ProjectCard key={project.id} project={project as Project} />
                ))}
                {projectsSorted.length === 0 && <EmptyState type="Projects" />}
              </div>
            )}

            {activeFilter === "startups" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
                gap: "24px"
              }}>
                {startupsSorted.map((startup) => (
                  <StartupCard key={startup.id} startup={startup} />
                ))}
                {startupsSorted.length === 0 && <EmptyState type="Startups" />}
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
        fontSize: "14px", 
        fontWeight: 600, 
        color: "var(--text-primary)",
        marginBottom: "8px"
      }}>
        No {type.toLowerCase()} found
      </div>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Try adjusting your search terms</p>
    </div>
  )
}
