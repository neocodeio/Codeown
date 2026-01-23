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
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[] | null;
  user?: {
    name: string;
    email: string | null;
    avatar_url?: string | null;
  };
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [postRes, commentsRes] = await Promise.all([
          api.get(`/posts/${id}`),
          api.get(`/comments/${id}?sort=${commentSort}`)
        ]);
        if (isMounted) {
          setPost(postRes.data);
          setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id, commentSort]);

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
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=000000&color=ffffff&bold=true`;

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
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

        <article className="fade-in" style={{ background: "#f5f5f5", padding: "20px", borderRadius: "25px", border: "2px solid #e0e0e0" }}>
          <header style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <img src={avatarUrl} alt={userName} style={{ width: "48px", height: "48px", border: "1px solid var(--border-color)", borderRadius: "50%" }} />
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 800 }}>{userName}</h3>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700 }}>{formatDate(post.created_at)}</span>
              </div>
            </div>
            <h1 style={{ fontSize: "42px", marginBottom: "4px" }}>{post.title}</h1>
          </header>
          
          <div style={{ fontSize: "18px", lineHeight: "1.7", marginBottom: "20px" }}>
            <ContentRenderer content={post.content} />
          </div>

          {post.images && post.images.length > 0 && (
            <div style={{ border: "1px solid var(--border-color)" }}>
              <ImageSlider images={post.images} />
            </div>
          )}
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
                  style={{ padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
                >
                  {isSubmitting ? "POSTING..." : "POST COMMENT"}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "40px", backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "25px", border: "2px solid #e0e0e0" }}>
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
