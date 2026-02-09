import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import ImageSlider from "../components/ImageSlider";
import ContentRenderer from "../components/ContentRenderer";
import MentionInput from "../components/MentionInput";
import CommentBlock, { type CommentWithMeta } from "../components/CommentBlock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faHeart as faHeartSolid, faBookmark as faBookmarkSolid, faBookmark as faBookmarkRegular, faShareNodes, faEye } from "@fortawesome/free-solid-svg-icons";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[] | null;
  tags?: string[] | null;
  like_count?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  user?: {
    name: string;
    email: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };
  view_count?: number;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const { isSignedIn } = useClerkUser();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [commentSort] = useState<"newest" | "top">("newest");
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { isLiked, likeCount, toggleLike, fetchLikeStatus, loading: likeLoading } = useLikes(Number(id), post?.isLiked, post?.like_count);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(Number(id), post?.isSaved);

  useEffect(() => {
    if (id) {
      fetchLikeStatus();
      fetchSavedStatus();
    }
  }, [id]);


  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [postRes, commentsRes] = await Promise.all([
          api.get(`/posts/${id}`, { headers }),
          api.get(`/comments/${id}?sort=${commentSort}`, { headers })
        ]);
        if (isMounted) {
          setPost(postRes.data);
          setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        }
      } catch (e) {
        console.error("Error fetching post details:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id, commentSort, getToken]);

  const handleSubmitComment = async () => {
    if (!isSignedIn || !commentContent.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post("/comments", { post_id: id, content: commentContent.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentContent("");
      const res = await api.get(`/comments/${id}?sort=${commentSort}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    const token = await getToken();
    await api.post("/comments", { post_id: id, content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
    const res = await api.get(`/comments/${id}?sort=${commentSort}`);
    setComments(Array.isArray(res.data) ? res.data : []);
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `https://codeown.space/post/${id}`;
    const shareData = {
      title: `Codeown - Post by ${post.user?.name || 'User'}`,
      text: post.title || post.content?.substring(0, 100) || '',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  function buildTree(list: CommentWithMeta[]): CommentWithMeta[] {
    const map = new Map<number, CommentWithMeta & { children: CommentWithMeta[] }>();
    list.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: (CommentWithMeta & { children: CommentWithMeta[] })[] = [];
    list.forEach(c => {
      if (c.parent_id) {
        map.get(c.parent_id)?.children.push(map.get(c.id)!);
      } else {
        roots.push(map.get(c.id)!);
      }
    });
    return roots;
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=212121&color=ffffff&bold=true`;

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
      <SEO
        title={post.title}
        description={post.content.substring(0, 150) + "..."}
        image={post.images && post.images.length > 0 ? post.images[0] : avatarUrl}
        url={window.location.href}
        type="article"
        author={userName}
        publishedTime={post.created_at}
      />
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "40px",
            border: "2px solid #e0e0e0",
            background: "#f5f5f5",
            fontSize: "12px",
            padding: "4px",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span style={{ fontWeight: 600, fontSize: "20px", background: "transparent" }}>BACK</span>
        </button>

        <article className="fade-in" style={{ background: "#fff", padding: "20px", borderRadius: "25px", border: "1px solid #e0e0e0" }}>
          <header style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img src={avatarUrl} alt={userName} style={{ width: "48px", height: "48px", border: "1px solid var(--border-color)", borderRadius: "50%" }} />
                <h3 style={{ fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center" }}>
                  {userName}
                  <VerifiedBadge username={post.user?.username} size="14px" />
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                <span style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  fontWeight: 700,
                  backgroundColor: "rgba(0,0,0,0.03)",
                  padding: "4px 10px",
                  borderRadius: "10px",
                  letterSpacing: "0.05em",
                  textAlign: "right"
                }}>
                  {formatRelativeDate(post.created_at).toUpperCase()}
                </span>
                {post.view_count !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 700, opacity: 0.8 }}>
                    <FontAwesomeIcon icon={faEye} style={{ fontSize: "10px" }} />
                    <span>{post.view_count} VIEWS</span>
                  </div>
                )}
              </div>
            </div>
            <h1 dir="auto" style={{ fontSize: "42px", marginBottom: "4px" }}>{post.title}</h1>
          </header>

          <div style={{ fontSize: "18px", lineHeight: "1.7", marginBottom: "20px" }}>
            <ContentRenderer content={post.content} />
          </div>

          {post.images && post.images.length > 0 && (
            <div style={{ border: "1px solid var(--border-color)", marginBottom: "20px" }}>
              <ImageSlider images={post.images} />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    backgroundColor: "#212121",
                    color: "#fff",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    textTransform: "lowercase",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#444";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#212121";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderRadius: "15px",
            marginTop: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={toggleLike}
                disabled={likeLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: isLiked ? "#fff1f2" : "#fff",
                  border: "1px solid",
                  borderColor: isLiked ? "#fecdd3" : "#dcdcdc",
                  color: isLiked ? "#ef4444" : "#212121",
                  cursor: likeLoading ? "not-allowed" : "pointer",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
              >
                <FontAwesomeIcon icon={faHeartSolid} />
                <span>{likeCount || 0}</span>
              </button>

              <button
                onClick={handleShare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: "#fff",
                  border: "1px solid #dcdcdc",
                  color: shareCopied ? "#10b981" : "#212121",
                  cursor: "pointer",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <FontAwesomeIcon icon={faShareNodes} />
                <span>{shareCopied ? "COPIED" : "SHARE"}</span>
                {shareCopied && (
                  <span style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#10b981",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontSize: "10px",
                    whiteSpace: "nowrap",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}>
                    LINK COPIED!
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={toggleSave}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: isSaved ? "rgba(33, 33, 33, 0.1)" : "#fff",
                border: "1px solid #dcdcdc",
                color: isSaved ? "#212121" : "#212121",
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isSaved ? "rgba(33, 33, 33, 0.2)" : "#f8f9fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSaved ? "rgba(33, 33, 33, 0.1)" : "#fff";
              }}
            >
              <FontAwesomeIcon
                icon={isSaved ? faBookmarkSolid : faBookmarkRegular}
                style={{
                  transform: isSaved ? "scale(1.2)" : "scale(1)",
                  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}
              />
            </button>
          </div>
        </article>

        <section id="comments" style={{ borderTop: "4px solid var(--border-color)", paddingTop: "60px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px" }}>COMMENTS ({comments.length})</h2>
          </div>

          {isSignedIn && (
            <div style={{ marginBottom: "60px" }}>
              <div style={{ padding: "12px" }}>
                <MentionInput value={commentContent} onChange={setCommentContent} placeholder="TYPE YOUR THOUGHTS..." minHeight="100px" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSubmitComment}
                  className="primary"
                  disabled={!commentContent.trim() || isSubmitting}
                  style={{ padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px", backgroundColor: "#212121", color: "#fff" }}
                >
                  {isSubmitting ? "POSTING..." : "POST COMMENT"}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "40px", backgroundColor: "#fff", padding: "20px", borderRadius: "25px", border: "1px solid #e0e0e0" }}>
            {buildTree(comments).length === 0 ? (
              <div style={{ textAlign: "left", padding: "40px 0", color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 700 }}>NO COMMENTS YET.</div>
            ) : (
              buildTree(comments).map(c => (
                <CommentBlock key={c.id} comment={c} depth={0} onReply={handleReply} />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
