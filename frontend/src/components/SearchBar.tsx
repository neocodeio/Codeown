import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
import { useWindowSize } from "../hooks/useWindowSize";

export default function SearchBar() {
  const { query, setQuery, users, posts, loading, showResults, setShowResults, clearSearch } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowResults]);

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
    clearSearch();
    setIsOpen(false);
  };

  const handlePostClick = (postId: number) => {
    navigate(`/post/${postId}`);
    clearSearch();
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        style={{
          width: "100%",
          padding: "10px 18px",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-input)",
          fontSize: "14px",
          transition: "all 0.3s ease",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim().length >= 2) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }
        }}
      />

      {isOpen && showResults && (users.length > 0 || posts.length > 0) && (
        <div className="glass fade-in" style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          left: 0,
          right: 0,
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "360px",
          overflowY: "auto",
          zIndex: 2000,
          padding: "8px",
        }}>
          {users.length > 0 && (
            <div style={{ padding: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px 8px", display: "block" }}>Users</span>
              {users.map((u) => (
                <div key={u.id} onClick={() => handleUserClick(u.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=5046e5&color=fff`} alt="" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{u.name}</div>
                    {u.username && <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>@{u.username}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {posts.length > 0 && (
            <div style={{ padding: "8px", borderTop: "1px solid var(--border-light)" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 8px 8px", display: "block" }}>Posts</span>
              {posts.map((p) => (
                <div key={p.id} onClick={() => handlePostClick(p.id)} style={{ padding: "8px", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || p.content.slice(0, 40) + "..."}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
