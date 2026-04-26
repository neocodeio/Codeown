import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilIcon,
  Chat01Icon,
  FavouriteIcon,
  Bookmark02Icon
} from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

interface Article {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  cover_image: string;
  created_at: string;
  user_id: string;
  users: {
    name: string;
    username: string;
    avatar_url: string;
    is_pro: boolean;
    is_og: boolean;
  };
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isDesktop = width >= 1200;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data } = await api.get("/articles");
      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      width: "100%",
      padding: 0,
    }}>
      {/* Main Content Column */}
      <div style={{
        flex: 1,
        maxWidth: isDesktop ? "var(--feed-width)" : "100%",
        padding: "0",
        borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        minHeight: "100vh",
      }}>
        {/* Sticky Top Header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--bg-header)",
          backdropFilter: "blur(24px)",
          borderBottom: "0.5px solid var(--border-hairline)",
          padding: "0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "58px", // Standard header height
        }}>
          <h1 style={{ 
            fontSize: "20px", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.02em",
            margin: 0
          }}>
            Articles
          </h1>
          <button
            onClick={() => navigate("/write-article")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              backgroundColor: "#1a1a1b", // Sleek dark color from screenshot
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <HugeiconsIcon icon={PencilIcon} size={16} />
            Write Article
          </button>
        </header>

        <div style={{ padding: "0" }}>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: "160px", backgroundColor: "var(--bg-hover)", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-tertiary)" }}>
          <p style={{ fontSize: "16px" }}>No articles yet. Be the first to write one!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border-hairline)" }}>
          {articles.map(article => (
            <div
              key={article.id}
              onClick={() => navigate(`/articles/${article.id}`)}
              style={{
                display: "flex",
                gap: "24px",
                padding: "24px 16px",
                backgroundColor: "var(--bg-page)",
                cursor: "pointer",
                borderBottom: "0.5px solid var(--border-hairline)",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <img
                    src={article.users.avatar_url || "/default-avatar.png"}
                    style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
                    alt=""
                  />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{article.users.name}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>• {formatRelativeDate(article.created_at)}</span>
                </div>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                  letterSpacing: "-0.02em"
                }}>{article.title}</h2>
                <p style={{
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                  marginBottom: "16px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>{article.subtitle}</p>
                
                <div style={{ display: "flex", gap: "20px", color: "var(--text-tertiary)" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                     <HugeiconsIcon icon={Chat01Icon} size={16} />
                     <span>0</span>
                   </div>
                   <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                     <HugeiconsIcon icon={FavouriteIcon} size={16} />
                     <span>0</span>
                   </div>
                   <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                     <HugeiconsIcon icon={Bookmark02Icon} size={16} />
                     <span>0</span>
                   </div>
                </div>
              </div>
              
              {article.cover_image && (
                <div style={{ width: "160px", height: "100px", flexShrink: 0, borderRadius: "12px", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                  <img
                    src={article.cover_image}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    alt=""
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </div>
      </div>

      {/* Right Sidebar */}
      {isDesktop && (
        <aside style={{
          width: "var(--sidebar-width)",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          // Line is shared with main content's borderRight
        }}>
          <RecommendedUsersSidebar />
        </aside>
      )}
    </div>
  );
}
