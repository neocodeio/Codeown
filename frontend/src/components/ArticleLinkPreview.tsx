import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Chat01Icon, 
  FavouriteIcon
} from "@hugeicons/core-free-icons";

interface ArticlePreview {
  id: number;
  title: string;
  subtitle: string;
  cover_image: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  users: {
    name: string;
    avatar_url: string;
    username: string;
  };
}

export default function ArticleLinkPreview({ articleId }: { articleId: number }) {
  const [article, setArticle] = useState<ArticlePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data } = await api.get(`/articles/${articleId}`);
        setArticle(data);
      } catch (err) {
        console.error("Link preview error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  if (loading) return (
    <div style={{ 
      height: "120px", 
      backgroundColor: "var(--bg-hover)", 
      borderRadius: "16px", 
      margin: "12px 0",
      animation: "pulse 1.5s infinite" 
    }} />
  );

  if (!article) return null;

  // Calculate read time (rough estimate)
  const readTime = Math.max(1, Math.ceil((article.subtitle?.length || 0 + 1000) / 1000));

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/articles/${article.id}`);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "16px",
        margin: "12px 0",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative"
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--text-tertiary)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-hairline)"}
    >
      {/* Top Header Section */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "16px 16px 12px" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img 
            src={article.users.avatar_url || "/default-avatar.png"} 
            style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--border-hairline)" }} 
            alt="" 
          />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{article.users.name}</span>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", opacity: 0.8 }}>• {readTime} min read</span>
          </div>
        </div>
        <div style={{ 
          backgroundColor: "#10b98120", 
          padding: "2px 8px", 
          borderRadius: "6px", 
          display: "flex", 
          alignItems: "center", 
          gap: "4px",
          border: "0.5px solid #10b98140"
        }}>
           <div style={{ width: "8px", height: "8px", backgroundColor: "#10b981", borderRadius: "50%" }} />
           <span style={{ fontSize: "10px", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>Articles</span>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ display: "flex", gap: "16px", padding: "0 16px 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontSize: "16px", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            marginBottom: "8px", 
            lineHeight: "1.3" 
          }}>
            {article.title}
          </h3>
          <p style={{ 
            fontSize: "14px", 
            color: "var(--text-secondary)", 
            lineHeight: "1.5",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {article.subtitle}
          </p>
        </div>
        {article.cover_image && (
          <div style={{ 
            width: "120px", 
            height: "72px", 
            borderRadius: "12px", 
            overflow: "hidden", 
            flexShrink: 0,
            border: "1px solid var(--border-hairline)"
          }}>
            <img 
              src={article.cover_image} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              alt="" 
            />
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div style={{ 
        padding: "0 16px 16px", 
        display: "flex", 
        gap: "16px", 
        color: "var(--text-tertiary)",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
          <HugeiconsIcon icon={Chat01Icon} size={14} />
          <span>{article.comments_count || 0}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
          <HugeiconsIcon icon={FavouriteIcon} size={14} />
          <span>{article.likes_count || 0}</span>
        </div>
      </div>
    </div>
  );
}
