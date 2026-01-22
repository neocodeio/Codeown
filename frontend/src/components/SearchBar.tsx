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

  const handleTagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(`#${tag}`)}`);
    clearSearch();
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} style={{ 
      position: "relative", 
      flex: 1, 
      maxWidth: isMobile ? "100%" : "500px", 
            margin: isMobile ? "0" : "0 20px",
      width: "100%",
    }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search users, posts, or tags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: "150%",
            padding: isMobile ? "8px 12px" : "10px 16px",
            borderRadius: "25px",
            border: "2px solid #e4e7eb",
            fontSize: isMobile ? "12px" : "14px",
            outline: "none",
            transition: "all 0.2s",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim().length >= 2) {
              navigate(`/search?q=${encodeURIComponent(query)}`);
              setIsOpen(false);
            }
          }}
        />
      </div>

      {isOpen && showResults && (users.length > 0 || posts.length > 0) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "8px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e4e7eb",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {users.length > 0 && (
            <div style={{ padding: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "8px", padding: "0 8px" }}>
                USERS
              </div>
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f7fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=000&color=ffffff&size=64`}
                    alt={user.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>
                      {user.name}
                    </div>
                    {user.username && (
                      <div style={{ fontSize: "12px", color: "#64748b" }}>@{user.username}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(posts) && posts.length > 0 && (
            <div style={{ padding: "12px", borderTop: users.length > 0 ? "1px solid #e4e7eb" : "none" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "8px", padding: "0 8px" }}>
                POSTS
              </div>
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f7fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>
                    {post.title || post.content.substring(0, 50) + "..."}
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(tag);
                          }}
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            backgroundColor: "#f0f7ff",
                            color: "#2563eb",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "8px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            padding: "20px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ fontSize: "14px", color: "#64748b" }}>Searching...</div>
        </div>
      )}
    </div>
  );
}
