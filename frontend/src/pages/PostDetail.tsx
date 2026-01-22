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
import { faArrowLeft, faSortAmountDown, faSortAmountUp } from "@fortawesome/free-solid-svg-icons";

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
  const { getToken, isLoaded: authLoaded } = useClerkAuth();
  const { isSignedIn } = useClerkUser();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [commentSort, setCommentSort] = useState<"newest" | "top">("newest");
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = (name: string, email: string | null) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=5046e5&color=ffffff&size=128&bold=true`;
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
      <div style={{ width: "40px", height: "40px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const avatarUrl = post.user?.avatar_url || getAvatarUrl(userName, post.user?.email || null);

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "24px", padding: "8px 0" }}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Back
      </button>

      <article style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "40px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <img src={avatarUrl} alt={userName} style={{ width: "56px", height: "56px", borderRadius: "16px", border: "1px solid var(--border-color)" }} />
          <div>
            <h3 style={{ fontSize: "18px", color: "var(--text-primary)" }}>{userName}</h3>
            <span style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>{formatDate(post.created_at)}</span>
          </div>
        </div>

        <h1 style={{ fontSize: "32px", lineHeight: "1.3", marginBottom: "24px", fontFamily: "Outfit, sans-serif" }}>{post.title}</h1>
        
        <div style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)", marginBottom: "32px" }}>
          <ContentRenderer content={post.content} />
        </div>

        {post.images && post.images.length > 0 && (
          <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
            <ImageSlider images={post.images} />
          </div>
        )}
      </article>

      <section style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-2xl)", padding: "40px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "22px" }}>Comments ({comments.length})</h2>
          <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--gray-100)", padding: "4px", borderRadius: "var(--radius-lg)" }}>
            <button
              onClick={() => setCommentSort("newest")}
              style={{ padding: "6px 16px", borderRadius: "var(--radius-md)", border: "none", fontSize: "13px", fontWeight: 700, backgroundColor: commentSort === "newest" ? "var(--bg-card)" : "transparent", color: commentSort === "newest" ? "var(--primary)" : "var(--text-secondary)", boxShadow: commentSort === "newest" ? "var(--shadow-sm)" : "none" }}
            >
              Newest
            </button>
            <button
              onClick={() => setCommentSort("top")}
              style={{ padding: "6px 16px", borderRadius: "var(--radius-md)", border: "none", fontSize: "13px", fontWeight: 700, backgroundColor: commentSort === "top" ? "var(--bg-card)" : "transparent", color: commentSort === "top" ? "var(--primary)" : "var(--text-secondary)", boxShadow: commentSort === "top" ? "var(--shadow-sm)" : "none" }}
            >
              Top
            </button>
          </div>
        </div>

        {isSignedIn && (
          <div style={{ marginBottom: "40px" }}>
            <MentionInput value={commentContent} onChange={setCommentContent} placeholder="Share your thoughts..." minHeight="120px" />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || isSubmitting}
                style={{ padding: "12px 32px", backgroundColor: "var(--primary)", border: "none", color: "white", borderRadius: "var(--radius-lg)", fontWeight: 700, opacity: commentContent.trim() ? 1 : 0.6 }}
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {buildTree(comments).length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>No comments yet.</div>
          ) : (
            buildTree(comments).map(c => (
              <CommentBlock key={c.id} comment={c} depth={0} getAvatarUrl={getAvatarUrl} formatDate={formatDate} onReply={handleReply} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
