import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { MagnifyingGlass, Users, Layout, Rocket, Clock, Buildings, CheckCircle } from "phosphor-react";
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
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import BackToTop from "../components/BackToTop";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

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
        try { currentHistory = JSON.parse(savedHistory); } catch (e) { }
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

  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;

  return (
    <main style={{ padding: 0, backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <SEO title="Search" description="Search for builders, projects, and startups on Codeown." />

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: isDesktop ? "920px" : "100%",
        margin: "0 auto",
        padding: "0",
      }}>
        {/* ── Main Search Column ── */}
        <div style={{
          width: isDesktop ? "var(--feed-width)" : "100%",
          maxWidth: isDesktop ? "var(--feed-width)" : "600px",
          margin: isDesktop ? "0" : "0 auto",
          flexShrink: 0,
          borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
          borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
          minHeight: "100vh",
          position: "relative",
          backgroundColor: "var(--bg-page)",
        }}>
          {/* ── Sticky Search Header ── */}
          <div style={{
            position: "sticky",
            top: isMobile ? "64px" : "0",
            zIndex: 100,
            backgroundColor: "var(--bg-page)",
            borderBottom: "0.5px solid var(--border-hairline)",
            padding: "12px 16px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--bg-hover)",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "14px",
              padding: "0 12px 0 16px",
              gap: "12px",
              height: "48px",
              width: "100%",
              boxSizing: "border-box",
              transition: "all 0.2s ease"
            }}>
              <MagnifyingGlass size={18} weight="regular" style={{ color: "var(--text-tertiary)" }} />

              <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder={`Search workers, projects, startups...`}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "14.5px",
                  fontWeight: 600,
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
                    background: "var(--bg-page)",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    padding: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: "var(--text-primary)" }} />
                </button>
              )}
            </div>
          </div>

          {/* ── Results Area ── */}
          <div style={{ padding: "24px 16px" }}>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
              </div>
            ) : (!query && !showOnlyCofounder) ? (
              <div className="fade-in">
                {history.length > 0 ? (
                  <div style={{ maxWidth: "100%", margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--text-tertiary)" }}>
                      <Clock size={16} />
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>Recent Searches</span>
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
                            padding: "12px 14px",
                            backgroundColor: "transparent",
                            borderRadius: "12px",
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
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <MagnifyingGlass size={16} weight="regular" style={{ color: "var(--text-tertiary)" }} />
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{h}</span>
                          </div>
                          <button
                            onClick={(e) => removeFromHistory(e, h)}
                            style={{
                              border: "none",
                              background: "none",
                              padding: "6px",
                              cursor: "pointer",
                              color: "var(--text-tertiary)",
                              borderRadius: "8px",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-tertiary)" }}>
                    <MagnifyingGlass size={48} weight="regular" style={{ opacity: 0.1, marginBottom: "20px" }} />
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>Search Codeown</div>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-tertiary)" }}>Find people, posts, and projects from the community</p>
                  </div>
                )}
              </div>
            ) : !loading && !usersData.length && !postsData.length && !projectsData.length && !startupsData.length ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-tertiary)" }}>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>No results found for "{query}"</div>
              </div>
            ) : (
              <div className="fade-in">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    marginBottom: "32px",
                    borderBottom: "0.5px solid var(--border-hairline)",
                    paddingBottom: "20px"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap"
                  }}>
                    <div style={{ fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                      <span style={{ color: "var(--text-primary)" }}>{query}</span>
                      <span style={{ marginLeft: "6px", opacity: 0.5 }}>
                        · {peopleResults.length} people · {postsData.length} posts
                      </span>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        backgroundColor: "var(--bg-hover)",
                        padding: "3px",
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
                            padding: "5px 12px",
                            fontSize: "11px",
                            fontWeight: 700,
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
                      gap: "8px",
                      overflowX: "auto",
                      paddingBottom: "4px",
                      scrollbarWidth: "none"
                    }}
                    className="no-scrollbar"
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
                          padding: "8px 16px",
                          borderRadius: "100px",
                          border: "0.5px solid",
                          borderColor: activeFilter === opt.id ? "var(--text-primary)" : "var(--border-hairline)",
                          backgroundColor: activeFilter === opt.id ? "var(--text-primary)" : "var(--bg-page)",
                          color: activeFilter === opt.id ? "var(--bg-page)" : "var(--text-secondary)",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <opt.icon size={14} weight={activeFilter === opt.id ? "bold" : "regular"} />
                        {opt.label}
                      </button>
                    ))}

                    {activeFilter === "projects" && (
                      <button
                        onClick={() => setShowOnlyCofounder(!showOnlyCofounder)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "100px",
                          border: "1px dashed",
                          borderColor: showOnlyCofounder ? "var(--text-primary)" : "var(--border-hairline)",
                          backgroundColor: showOnlyCofounder ? "rgba(var(--text-primary-rgb), 0.1)" : "transparent",
                          color: showOnlyCofounder ? "var(--text-primary)" : "var(--text-tertiary)",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginLeft: "auto"
                        }}
                      >
                        {showOnlyCofounder ? <CheckCircle size={14} weight="fill" /> : <Users size={14} />}
                        Co-Founder
                      </button>
                    )}
                  </div>
                </div>

                {activeFilter === "people" && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
                    gap: "16px"
                  }}>
                    {peopleResults.map((user) => (
                      <div key={user.id}
                        onClick={() => navigate(user.username ? `/${user.username}` : `/user/${user.id}`)}
                        style={{
                          border: "0.5px solid var(--border-hairline)",
                          borderRadius: "20px",
                          padding: "24px 20px",
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
                        <div style={{ position: "relative", marginBottom: "14px" }}>
                          <AvailabilityBadge
                            avatarUrl={user.avatar_url}
                            name={user.name}
                            size={70}
                            isOpenToOpportunities={user.is_pro === true && user.is_hirable === true}
                          />
                        </div>

                        <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                          {user.name}
                          <VerifiedBadge username={user.username} size="14px" />
                        </h3>
                        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 500 }}>@{user.username || "user"}</p>

                        <button
                          onClick={(e) => handleFollow(e, user.id)}
                          style={{
                            backgroundColor: currentUserFollowing.includes(user.id) ? "transparent" : "var(--text-primary)",
                            color: currentUserFollowing.includes(user.id) ? "var(--text-primary)" : "var(--bg-page)",
                            border: currentUserFollowing.includes(user.id) ? "0.5px solid var(--border-hairline)" : "none",
                            borderRadius: "12px",
                            padding: "8px 20px",
                            fontWeight: 700,
                            fontSize: "12px",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {postsSorted.map((post) => (
                      <div key={post.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                        <PostCard post={post as Post} />
                      </div>
                    ))}
                    {postsSorted.length === 0 && <EmptyState type="Posts" />}
                  </div>
                )}

                {activeFilter === "projects" && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "0"
                  }}>
                    {projectsSorted.map((project) => (
                      <div key={project.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                        <ProjectCard project={project as Project} />
                      </div>
                    ))}
                    {projectsSorted.length === 0 && <EmptyState type="Projects" />}
                  </div>
                )}

                {activeFilter === "startups" && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                    gap: "16px"
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
        </div>

        {/* ── Right Sidebar ── */}
        {isDesktop && (
          <aside style={{
            width: "300px",
            position: "sticky",
            top: 0,
            alignSelf: "flex-start",
            flexShrink: 0,
            zIndex: 1,
          }}>
            <RecommendedUsersSidebar />
          </aside>
        )}
      </div>

      <BackToTop />
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
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
