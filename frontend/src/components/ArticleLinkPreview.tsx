import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useWindowSize } from "../hooks/useWindowSize";

interface ArticlePreview {
  id: number;
  title: string;
  subtitle: string;
  content: string;
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
  const { width } = useWindowSize();
  const isSmallMobile = width < 480;

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
      height: "140px", 
      backgroundColor: "var(--bg-hover)", 
      borderRadius: "20px", 
      margin: "16px 0",
      border: "1px solid var(--border-hairline)",
      animation: "pulse 1.5s infinite" 
    }} />
  );

  if (!article) return null;

  const totalLength = (article.title?.length || 0) + (article.subtitle?.length || 0) + (article.content?.length || 0);
  const readTime = Math.max(1, Math.ceil(totalLength / 1200)); // ~200-250 words per min, roughly 1200 chars per min

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/articles/${articleId}`);
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
        transition: "all 0.2s ease-out",
        position: "relative",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--text-primary)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hairline)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      }}
    >
      {/* Header Info */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "16px 16px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img 
            src={article?.users?.avatar_url || "/default-avatar.png"} 
            style={{ 
              width: "20px", 
              height: "20px", 
              borderRadius: "50%", 
              objectFit: "cover"
            }} 
            alt="" 
          />
          <span style={{ 
            fontSize: "13px", 
            fontWeight: 600, 
            color: "var(--text-primary)",
            opacity: 0.9
          }}>
            {article?.users?.name}
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>•</span>
          <span style={{ 
            fontSize: "12px", 
            color: "var(--text-tertiary)",
            fontWeight: 500
          }}>
            {readTime} min read
          </span>
        </div>
        
        <div style={{ 
          backgroundColor: "var(--bg-tertiary)", 
          padding: "3px 8px", 
          borderRadius: "6px", 
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          Article
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: "flex", 
        gap: "16px", 
        padding: "0 16px 16px",
        alignItems: "flex-start" 
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontSize: "17px", 
            fontWeight: 700, 
            color: "var(--text-primary)", 
            marginBottom: "6px", 
            lineHeight: "1.3",
            letterSpacing: "-0.01em"
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
            overflow: "hidden",
            opacity: 0.8
          }}>
            {article.subtitle}
          </p>
        </div>
        
        {article.cover_image && !isSmallMobile && (
          <div style={{ 
            width: "90px", 
            height: "60px", 
            borderRadius: "10px", 
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
    </div>


  );
}
