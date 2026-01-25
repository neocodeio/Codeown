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

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
      <header style={{ marginBottom: "60px", borderBottom: "4px solid var(--border-color)", paddingBottom: "40px" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Search</h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary)" }}>
          RESULTS FOR <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>"{q}"</span>
        </p>
      </header>

      <nav style={{ display: "flex", gap: "30px", marginBottom: "40px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
        {["all", "people", "posts", "projects"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "15px",
              backgroundColor: "#849bff",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: activeTab === tab ? "#364182" : "#fff",
              borderBottom: activeTab === tab ? "2px solid var(--text-primary)" : "2px solid transparent",
            }}
          >
            {tab}
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
