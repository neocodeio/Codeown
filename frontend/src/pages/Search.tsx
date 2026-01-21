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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=000&color=ffffff&size=64`;

  const displayUsers = activeTab === "posts" ? [] : users;
  const displayPosts = activeTab === "people" ? [] : posts;
  const showAll = activeTab === "all";

  return (
    <div className="search-page" style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "32px 20px",
      minHeight: "calc(100vh - 80px)",
    }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px", color: "var(--text-primary)" }}>
        Search {q ? `"${q}"` : ""}
      </h1>

      {q.length < 2 ? (
        <p style={{ color: "var(--text-secondary)" }}>Enter at least 2 characters to search.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
            {["all", "people", "posts"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "all" | "people" | "posts")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize" as const,
                  backgroundColor: activeTab === tab ? "var(--accent)" : "var(--bg-elevated)",
                  color: activeTab === tab ? "var(--bg-page)" : "var(--text-secondary)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <>
              {(showAll || activeTab === "people") && (
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>PEOPLE</h2>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ padding: "12px", borderRadius: "12px", backgroundColor: "var(--bg-elevated)", marginBottom: "8px", height: "64px" }} />
                  ))}
                </div>
              )}
              {(showAll || activeTab === "posts") && (
                <div>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>POSTS</h2>
                  {[...Array(2)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {(showAll || activeTab === "people") && (
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>PEOPLE</h2>
                  {displayUsers.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", padding: "16px 0" }}>No people found.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {displayUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => navigate(`/user/${u.id}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            borderRadius: "12px",
                            backgroundColor: "var(--bg-elevated)",
                            cursor: "pointer",
                          }}
                        >
                          <img src={u.avatar_url || getAvatarUrl(u.name)} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                            {u.username && <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>@{u.username}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(showAll || activeTab === "posts") && (
                <div>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>POSTS</h2>
                  {displayPosts.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", padding: "16px 0" }}>No posts found.</p>
                  ) : (
                    displayPosts.map((p) => (
                      <PostCard
                        key={p.id}
                        post={p as Post}
                        onUpdated={() => {
                          setPosts((prev) => prev.filter((x) => x.id !== p.id));
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
