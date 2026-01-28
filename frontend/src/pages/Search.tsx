import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import type { Post } from "../hooks/usePosts";
import type { Project } from "../types/project";

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  job_title?: string | null;
  is_hirable?: boolean;
  skills?: string[] | null;
  location?: string | null;
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
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [developers, setDevelopers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "people" | "posts" | "projects" | "developers">("all");

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
          const [uRes, pRes, prRes, dRes] = await Promise.all([
            api.get(`/search/users?q=${encodeURIComponent(q)}`),
            api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`),
            api.get(`/search/projects?q=${encodeURIComponent(q)}&limit=20`),
            api.get(`/search/developers?q=${encodeURIComponent(q)}&limit=20`),
          ]);
          if (!cancelled) {
            setUsers(Array.isArray(uRes.data) ? uRes.data : []);
            setPosts(pRes.data?.posts || []);
            setProjects(prRes.data?.projects || []);
            setDevelopers(dRes.data?.developers || []);
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

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
      <header style={{ marginBottom: "60px", borderBottom: "4px solid var(--border-color)", paddingBottom: "40px" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Search</h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary)" }}>
          RESULTS FOR <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>"{q}"</span>
        </p>
      </header>

      <nav style={{ display: "flex", gap: "30px", marginBottom: "40px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", flexWrap: "wrap" }}>
        {["all", "people", "posts", "projects", "developers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "15px",
              backgroundColor: tab === "developers" ? "#6366f1" : "#849bff",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: activeTab === tab ? "white" : "#eee",
              borderBottom: activeTab === tab ? "3px solid white" : "3px solid transparent",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
          >
            {tab === "developers" ? "FIND TALENT 🚀" : tab.toUpperCase()}
          </button>
        ))}
      </nav>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          {(activeTab === "all" || activeTab === "people") && users.length > 0 && (
            <section>
              <h2 style={{ fontSize: "25px", fontWeight: 600, color: "#849bff", marginBottom: "24px" }}>People</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => navigate(`/user/${u.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "25px",
                      border: "2px solid #364182",
                      borderRadius: "15px",
                      cursor: "pointer",
                      backgroundColor: "#f5f5f5"
                    }}
                  >
                    <img
                      src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=000000&color=ffffff&bold=true`}
                      alt=""
                      style={{ width: "48px", height: "48px", border: "1px solid var(--border-color)", borderRadius: "50%" }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", }}>{u.name}</div>
                      {u.username && <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700 }}>@{u.username}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(activeTab === "all" || activeTab === "posts") && (
            <section>
              <h2 style={{ fontSize: "25px", fontWeight: 600, color: "#849bff", marginBottom: "24px" }}>Posts</h2>
              {posts.length === 0 ? (
                <div style={{ padding: "40px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO POSTS FOUND.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                  {posts.map((p, i) => <PostCard key={p.id} post={p as Post} index={i} onUpdated={() => setPosts(prev => prev.filter(x => x.id !== p.id))} />)}
                </div>
              )}
            </section>
          )}

          {(activeTab === "all" || activeTab === "projects") && (
            <section>
              <h2 style={{ fontSize: "25px", fontWeight: 600, color: "#849bff", marginBottom: "24px" }}>Projects</h2>
              {projects.length === 0 ? (
                <div style={{ padding: "40px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO PROJECTS FOUND.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                  {projects.map((p, i) => <ProjectCard key={p.id} project={p as Project} index={i} onUpdated={() => setProjects(prev => prev.filter(x => x.id !== p.id))} />)}
                </div>
              )}
            </section>
          )}

          {(activeTab === "all" || activeTab === "developers") && developers.length > 0 && (
            <section>
              <h2 style={{ fontSize: "25px", fontWeight: 800, color: "#6366f1", marginBottom: "24px" }}>Available Developers</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {developers.map((dev) => (
                  <div
                    key={dev.id}
                    onClick={() => navigate(`/user/${dev.id}`)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "20px",
                      padding: "30px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "20px",
                      cursor: "pointer",
                      backgroundColor: "white",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", width: "100%" }}>
                      <img
                        src={dev.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=000&color=fff&bold=true`}
                        alt=""
                        style={{ width: "80px", height: "80px", borderRadius: "24px", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <h3 style={{ fontSize: "20px", fontWeight: 900, margin: 0 }}>{dev.name}</h3>
                          {dev.is_hirable && <span style={{ fontSize: "12px", background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>HIRABLE</span>}
                        </div>
                        <p style={{ color: "#64748b", fontWeight: 700, marginBottom: "8px" }}>@{dev.username} • {dev.job_title || "Software Developer"}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {dev.skills?.slice(0, 8).map(skill => (
                        <span key={skill} style={{ padding: "4px 10px", background: "#f1f5f9", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "people" && users.length === 0 && (
            <div style={{ padding: "40px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO PEOPLE FOUND.</div>
          )}
          {activeTab === "posts" && posts.length === 0 && (
            <div style={{ padding: "40px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO POSTS FOUND.</div>
          )}
          {activeTab === "projects" && projects.length === 0 && (
            <div style={{ padding: "40px 0", color: "var(--text-tertiary)", fontWeight: 700 }}>NO PROJECTS FOUND.</div>
          )}
        </div>
      )}
    </main>
  );
}
