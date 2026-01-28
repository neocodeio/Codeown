import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUsers,
  faLayerGroup,
  faRocket,
  faChevronRight,
  faCompass,
} from "@fortawesome/free-solid-svg-icons";
import type { Post } from "../hooks/usePosts";
import type { Project } from "../types/project";

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  is_organization?: boolean;
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

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "people" | "posts" | "projects">("all");

  useEffect(() => {
    if (!q || q.length < 2) {
      setUsers([]);
      setPosts([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        const isTag = q.startsWith("#");
        const isMention = q.startsWith("@");
        const cleanQ = isTag || isMention ? q.slice(1) : q;

        if (isMention) {
          const [uRes, pRes, prRes] = await Promise.all([
            api.get(`/search/users?q=${encodeURIComponent(cleanQ)}`),
            api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`),
            api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20`),
          ]);
          if (!cancelled) {
            setUsers(Array.isArray(uRes.data) ? uRes.data : []);
            setPosts(pRes.data?.posts || []);
            setProjects(prRes.data?.projects || []);
          }
        } else if (isTag) {
          const [pRes, prRes] = await Promise.all([
            api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`),
            api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20`),
          ]);
          if (!cancelled) {
            setUsers([]);
            setPosts(pRes.data?.posts || []);
            setProjects(prRes.data?.projects || []);
          }
        } else {
          const [uRes, pRes, prRes] = await Promise.all([
            api.get(`/search/users?q=${encodeURIComponent(q)}`),
            api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`),
            api.get(`/search/projects?q=${encodeURIComponent(q)}&limit=20`),
          ]);
          if (!cancelled) {
            setUsers(Array.isArray(uRes.data) ? uRes.data : []);
            setPosts(pRes.data?.posts || []);
            setProjects(prRes.data?.projects || []);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setPosts([]);
          setProjects([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [q]);

  const tabs = [
    { id: "all", label: "All results", icon: faCompass },
    { id: "people", label: "People", icon: faUsers },
    { id: "posts", label: "Posts", icon: faLayerGroup },
    { id: "projects", label: "Projects", icon: faRocket },
  ];

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Header Section */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #f1f5f9",
        padding: isMobile ? "40px 0 24px" : "60px 0 40px",
      }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px", opacity: 0.8 }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#364182"
            }}>
              <FontAwesomeIcon icon={faSearch} style={{ fontSize: "14px" }} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Search Results</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? "28px" : "42px",
            fontWeight: 900,
            color: "#1e293b",
            margin: "0 0 16px",
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            Results for <span style={{
              color: "#364182",
              padding: "4px 16px",
              backgroundColor: "#f1f5f9",
              borderRadius: "16px",
              fontSize: "0.8em"
            }}>"{q}"</span>
          </h1>
        </div>
      </div>

      <div className="container" style={{ marginTop: "40px" }}>
        {/* Navigation Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "40px",
          backgroundColor: "white",
          padding: "6px",
          borderRadius: "20px",
          width: isMobile ? "100%" : "fit-content",
          boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
          border: "1px solid #f1f5f9",
          overflowX: "auto",
          scrollbarWidth: "none",
        }} className="fade-in">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                flex: isMobile ? 1 : "initial",
                justifyContent: "center",
                padding: isMobile ? "12px 14px" : "12px 24px",
                borderRadius: "16px",
                backgroundColor: activeTab === tab.id ? "#f1f5f9" : "transparent",
                border: "none",
                color: activeTab === tab.id ? "#364182" : "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <FontAwesomeIcon icon={tab.icon} style={{ fontSize: "14px" }} />
              <span style={{ fontSize: "14px", fontWeight: 700 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <PostCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
            {/* People Section */}
            {(activeTab === "all" || activeTab === "people") && users.length > 0 && (
              <section className="fade-in">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>People</h2>
                  <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>{users.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                  {users.map((u, i) => (
                    <div
                      key={u.id}
                      onClick={() => navigate(`/user/${u.id}`)}
                      className="slide-up"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "20px",
                        backgroundColor: "white",
                        borderRadius: "24px",
                        cursor: "pointer",
                        border: "1px solid #f1f5f9",
                        transition: "all 0.3s ease",
                        animationDelay: `${i * 0.05}s`,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "#f1f5f9";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.02)";
                      }}
                    >
                      <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "20px",
                        overflow: "hidden",
                        border: "1px solid #f1f5f9",
                        flexShrink: 0
                      }}>
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=364182&color=fff&bold=true`}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                          <h3 style={{ fontWeight: 800, fontSize: "16px", color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</h3>
                          <span style={{
                            padding: "2px 6px",
                            background: u.is_organization ? "#eef2ff" : "#f1f5f9",
                            color: u.is_organization ? "#364182" : "#64748b",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 800,
                            textTransform: "uppercase"
                          }}>{u.is_organization ? "Org" : "Dev"}</span>
                        </div>
                        {u.username && <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>@{u.username}</div>}
                      </div>
                      <div style={{ color: "#cbd5e1" }}>
                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: "12px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Posts Section */}
            {(activeTab === "all" || activeTab === "posts") && (
              <section className="fade-in">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Posts</h2>
                  <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>{posts.length}</span>
                </div>
                {posts.length === 0 ? (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8", backgroundColor: "white", borderRadius: "32px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faLayerGroup} /></div>
                    <div style={{ fontWeight: 700 }}>No posts found matching your search.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {posts.map((p, i) => (
                      <PostCard
                        key={p.id}
                        post={p as Post}
                        index={i}
                        onUpdated={() => setPosts(prev => prev.filter(x => x.id !== p.id))}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Projects Section */}
            {(activeTab === "all" || activeTab === "projects") && (
              <section className="fade-in">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Projects</h2>
                  <span style={{ backgroundColor: "#f1f5f9", color: "#64748b", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>{projects.length}</span>
                </div>
                {projects.length === 0 ? (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8", backgroundColor: "white", borderRadius: "32px", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                    <div style={{ fontWeight: 700 }}>No projects found matching your search.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
                    {projects.map((p, i) => (
                      <ProjectCard
                        key={p.id}
                        project={p as Project}
                        index={i}
                        onUpdated={() => setProjects(prev => prev.filter(x => x.id !== p.id))}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* No Results at all or for specific tab */}
            {activeTab !== "all" && (activeTab === "people" ? users.length === 0 : (activeTab === "posts" ? posts.length === 0 : projects.length === 0)) && (
              <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", backgroundColor: "white", borderRadius: "32px", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "60px", marginBottom: "24px", opacity: 0.15 }}><FontAwesomeIcon icon={faCompass} /></div>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "#1e293b" }}>Nothing here!</div>
                <div style={{ fontWeight: 600, marginTop: "8px" }}>Try searching for something else.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

