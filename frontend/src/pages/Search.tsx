import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import type { Post } from "../hooks/usePosts";

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

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "people" | "posts">("all");

  useEffect(() => {
    if (!q || q.length < 2) {
      setUsers([]);
      setPosts([]);
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
          const [uRes, pRes] = await Promise.all([
            api.get(`/search/users?q=${encodeURIComponent(cleanQ)}`),
            api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`),
          ]);
          if (!cancelled) {
            setUsers(Array.isArray(uRes.data) ? uRes.data : []);
            setPosts(pRes.data?.posts || []);
          }
        } else if (isTag) {
          const pRes = await api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`);
          if (!cancelled) {
            setUsers([]);
            setPosts(pRes.data?.posts || []);
          }
        } else {
          const [uRes, pRes] = await Promise.all([
            api.get(`/search/users?q=${encodeURIComponent(q)}`),
            api.get(`/search/posts?q=${encodeURIComponent(q)}&limit=20`),
          ]);
          if (!cancelled) {
            setUsers(Array.isArray(uRes.data) ? uRes.data : []);
            setPosts(pRes.data?.posts || []);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [q]);

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=5046e5&color=ffffff&size=64&bold=true`;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px", color: "var(--text-primary)" }}>
        Results for <span style={{ color: "var(--primary)" }}>"{q}"</span>
      </h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "40px", padding: "4px", backgroundColor: "var(--gray-100)", borderRadius: "var(--radius-xl)", width: "fit-content" }}>
        {["all", "people", "posts"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-lg)",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              textTransform: "capitalize",
              backgroundColor: activeTab === tab ? "var(--bg-card)" : "transparent",
              color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
              boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {(activeTab === "all" || activeTab === "people") && users.length > 0 && (
            <section>
              <h2 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>People</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => navigate(`/user/${u.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "var(--radius-xl)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", cursor: "pointer", transition: "all 0.3s ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                  >
                    <img src={u.avatar_url || getAvatarUrl(u.name)} alt="" style={{ width: "48px", height: "48px", borderRadius: "14px", objectFit: "cover" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                      {u.username && <div style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>@{u.username}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(activeTab === "all" || activeTab === "posts") && (
            <section>
              <h2 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Posts</h2>
              {posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>No posts found matching your search.</div>
              ) : (
                posts.map((p) => <PostCard key={p.id} post={p as Post} onUpdated={() => setPosts(prev => prev.filter(x => x.id !== p.id))} />)
              )}
            </section>
          )}

          {activeTab === "people" && users.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>No people found matching your search.</div>
          )}
        </div>
      )}
    </main>
  );
}
