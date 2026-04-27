import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Chat01Icon, 
  FavouriteIcon
} from "@hugeicons/core-free-icons";
import { useWindowSize } from "../hooks/useWindowSize";

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
  const { width } = useWindowSize();
  const isMobile = width < 768;
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

  const readTime = Math.max(1, Math.ceil(((article.subtitle?.length || 0) + (article.title?.length || 0) + 1500) / 1000));

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/articles/${articleId}`);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-page)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "20px",
        margin: "16px 0",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        position: "relative",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        maxWidth: "600px" // Keep it focused
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(var(--text-primary-rgb), 0.2)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hairline)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
      }}
    >
      {/* Top Meta Hub */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: isMobile ? "14px 14px 10px" : "18px 20px 12px",
        background: "linear-gradient(to bottom, rgba(var(--text-primary-rgb), 0.01), transparent)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative", display: "flex" }}>
            <img 
              src={article?.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(article?.users?.name || "U")}&background=212121&color=fff&bold=true`} 
              style={{ 
                width: "28px", 
                height: "28px", 
                borderRadius: "50%", 
                border: "1px solid var(--border-hairline)", 
                objectFit: "cover",
                backgroundColor: "var(--bg-hover)"
              }} 
              alt="" 
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ 
                fontSize: "13.5px", 
                fontWeight: 700, 
                color: "var(--text-primary)",
                letterSpacing: "-0.01em"
              }}>
                {article?.users?.name || "User"}
              </span>
              <span style={{ color: "var(--text-tertiary)", opacity: 0.4, fontSize: "10px" }}>•</span>
              <span style={{ 
                fontSize: "12px", 
                color: "var(--text-tertiary)", 
                fontWeight: 500 
              }}>
                {readTime} min read
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: "rgba(3, 3, 3, 0.8)", 
          padding: "4px 10px", 
          borderRadius: "8px", 
          display: "flex", 
          alignItems: "center", 
          gap: "6px"
        }}>
           <div style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }} />
           <span style={{ 
             fontSize: "10.5px", 
             fontWeight: 800, 
             color: "#fff", 
             textTransform: "uppercase",
             letterSpacing: "0.06em" 
           }}>
             Articles
           </span>
        </div>
      </div>

      {/* Main Feature Container */}
      <div style={{ 
        display: "flex", 
        gap: isMobile ? "12px" : "24px", 
        padding: isMobile ? "0 14px 14px" : "0 20px 18px",
        alignItems: "flex-start" 
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontSize: isMobile ? "16px" : "18px", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            marginBottom: "8px", 
            lineHeight: "1.35",
            letterSpacing: "-0.02em"
          }}>
            {article.title}
          </h3>
          <p style={{ 
            fontSize: "14px", 
            color: "var(--text-secondary)", 
            lineHeight: "1.6",
            display: "-webkit-box",
            WebkitLineClamp: isSmallMobile ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            opacity: 0.8
          }}>
            {article.subtitle}
          </p>
        </div>
        
        {article.cover_image && !isSmallMobile && (
          <div style={{ 
            width: isMobile ? "100px" : "140px", 
            height: isMobile ? "64px" : "88px", 
            borderRadius: "14px", 
            overflow: "hidden", 
            flexShrink: 0,
            border: "1px solid var(--border-hairline)",
            backgroundColor: "var(--bg-hover)",
            transform: "rotate(1deg)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <img 
              src={article.cover_image} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              alt="" 
            />
          </div>
        )}
      </div>

      {/* Subtle Engagement Row */}
      <div style={{ 
        padding: isMobile ? "10px 14px 14px" : "12px 20px 18px", 
        display: "flex", 
        gap: "20px", 
        color: "var(--text-tertiary)",
        alignItems: "center",
        borderTop: "0.5px solid var(--border-hairline)",
        backgroundColor: "rgba(var(--text-primary-rgb), 0.005)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600 }}>
          <HugeiconsIcon icon={FavouriteIcon} size={15} style={{ color: "var(--text-tertiary)", opacity: 0.7 }} />
          <span>{article.likes_count || 0}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600 }}>
          <HugeiconsIcon icon={Chat01Icon} size={15} style={{ color: "var(--text-tertiary)", opacity: 0.7 }} />
          <span>{article.comments_count || 0}</span>
        </div>
        
        <div style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Read Full →
        </div>
      </div>
    </div>
  );
}
