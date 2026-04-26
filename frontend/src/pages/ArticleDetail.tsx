import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  FavouriteIcon,
  Bookmark02Icon,
  Chat01Icon,
  Link01Icon
} from "@hugeicons/core-free-icons";
import VerifiedBadge from "../components/VerifiedBadge";
import ArticleCommentsSection from "../components/ArticleCommentsSection";
import { toast } from "react-toastify";
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { SEO } from "../components/SEO";

interface Article {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  cover_image: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  users: {
    name: string;
    username: string;
    avatar_url: string;
    is_pro: boolean;
    is_og: boolean;
  };
}

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { getToken } = useClerkAuth();
  const { user: currentUser } = useClerkUser();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isDesktop = width >= 1200;
  const isMobile = width < 768;

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data } = await api.get(`/articles/${id}`);
      if (data && !data.error) {
        setArticle(data);
      } else {
        throw new Error(data?.error || "Article not found");
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error("Article not found");
      navigate("/articles");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return navigate("/sign-in");
    try {
      const token = await getToken();
      const { data } = await api.post(`/articles/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(data.liked);
      setArticle(prev => prev ? {
        ...prev,
        likes_count: data.liked ? prev.likes_count + 1 : prev.likes_count - 1
      } : null);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleSave = async () => {
    if (!currentUser) return navigate("/sign-in");
    try {
      const token = await getToken();
      const { data } = await api.post(`/articles/${id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(data.saved);
      setArticle(prev => prev ? {
        ...prev,
        saves_count: data.saved ? prev.saves_count + 1 : prev.saves_count - 1
      } : null);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <div style={{
        flex: 1,
        maxWidth: isDesktop ? "var(--feed-width)" : "100%",
        padding: "40px 16px",
        borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        minHeight: "100vh",
      }}>
        <div className="loading-spinner" />
      </div>
    </div>
  );

  if (!article) return null;

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <SEO 
        title={article.title} 
        description={article.subtitle} 
        image={article.cover_image}
        url={window.location.href}
        type="article"
      />
      
      {/* Main Content Column */}
      <div style={{
        flex: 1,
        maxWidth: isDesktop ? "var(--feed-width)" : "100%",
        padding: isMobile ? "24px 16px" : "40px 24px",
        borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        minHeight: "100vh",
      }}>
        {/* Back Link */}
        <button
          onClick={() => navigate("/articles")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            marginBottom: "32px",
            fontSize: "14px",
            fontWeight: 600,
            padding: 0
          }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          All Articles
        </button>

      {/* Author Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <img
          src={article.users.avatar_url || "/default-avatar.png"}
          style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-hairline)" }}
          alt=""
          onClick={() => navigate(`/${article.users.username}`)}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span 
              onClick={() => navigate(`/${article.users.username}`)}
              style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
            >
              {article.users.name}
            </span>
            <VerifiedBadge username={article.users.username} size="14px" />
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
            {new Date(article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • 5 min read
          </div>
        </div>
      </div>

      {/* Content */}
      <article>
        <h1 style={{
          fontSize: isContentShort(article.title) ? "48px" : "40px",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "16px",
          lineHeight: "1.1",
          letterSpacing: "-0.04em"
        }}>
          {article.title}
        </h1>
        
        {article.subtitle && (
          <p style={{
            fontSize: "24px",
            color: "var(--text-secondary)",
            marginBottom: "32px",
            lineHeight: "1.4",
            fontWeight: 400
          }}>
            {article.subtitle}
          </p>
        )}

        {article.cover_image && (
          <div style={{ margin: "32px 0", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-hairline)" }}>
            <img src={article.cover_image} style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }} alt="" />
          </div>
        )}

        <div 
          className="article-content"
          style={{
            fontSize: "19px",
            lineHeight: "1.8",
            color: "var(--text-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "var(--font-serif, Georgia, serif)",
            paddingBottom: "32px"
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

      </article>

      {/* Bottom Actions */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "64px 0 32px",
        padding: "16px 0",
        borderTop: "1px solid var(--border-hairline)",
        borderBottom: "1px solid var(--border-hairline)"
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <button
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isLiked ? "#ef4444" : "var(--text-tertiary)",
              transition: "all 0.2s"
            }}
          >
            <HugeiconsIcon icon={FavouriteIcon} size={22} className={isLiked ? "hugeicon-filled" : ""} />
            <span style={{ fontWeight: 600 }}>{article.likes_count}</span>
          </button>

          <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-tertiary)"
            }}>
            <HugeiconsIcon icon={Chat01Icon} size={22} />
            <span style={{ fontWeight: 600 }}>{article.comments_count}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={handleSave}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isSaved ? "var(--text-primary)" : "var(--text-tertiary)",
              transition: "all 0.2s"
            }}
          >
            <HugeiconsIcon icon={Bookmark02Icon} size={22} className={isSaved ? "hugeicon-filled" : ""} />
          </button>
          <button
            onClick={handleShare}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              transition: "all 0.2s"
            }}
          >
            <HugeiconsIcon icon={Link01Icon} size={22} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments" style={{ marginTop: "40px" }}>
        <ArticleCommentsSection articleId={article.id} />
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
          borderRight: "0.5px solid var(--border-hairline)",
        }}>
          <RecommendedUsersSidebar />
        </aside>
      )}
      <style>{`
        .article-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

function isContentShort(text: string) {
  return text.length < 50;
}
