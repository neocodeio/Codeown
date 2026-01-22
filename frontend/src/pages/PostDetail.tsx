import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import ImageSlider from "../components/ImageSlider";
import ContentRenderer from "../components/ContentRenderer";
import MentionInput from "../components/MentionInput";
import CommentBlock, { type CommentWithMeta } from "../components/CommentBlock";

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
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  };

  const getAvatarUrl = (name: string, email: string | null) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=000&color=ffffff&size=128&bold=true&font-size=0.5`;
  };

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const postRes = await api.get(`/posts/${id}`);
        if (isMounted && postRes.data) setPost(postRes.data);
        const commentsRes = await api.get(`/comments/${id}?sort=${commentSort}`);
        if (isMounted && Array.isArray(commentsRes.data)) setComments(commentsRes.data);
        else if (isMounted) setComments([]);
      } catch (e) {
        if (isMounted) setPost(null);
        if (isMounted) setComments([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [id, commentSort]);

  const handleSubmitComment = async () => {
    if (!isSignedIn || !authLoaded) {
      alert("Please sign in to add a comment");
      return;
    }

    if (!commentContent.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to add a comment");
        setIsSubmitting(false);
        return;
      }

      await api.post(
        "/comments",
        { post_id: id, content: commentContent.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCommentContent("");
      const commentsRes = await api.get(`/comments/${id}?sort=${commentSort}`);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
    } catch (error) {
      console.error("Error creating comment:", error);
      let errorMessage = "Failed to create comment";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string } } };
        const errorData = axiosError.response?.data;

        if (errorData) {
          if (errorData.details) {
            errorMessage = `${errorData.error || "Failed to create comment"}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Failed to create comment: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    if (!id || !authLoaded || !isSignedIn) return;
    const token = await getToken();
    if (!token) return;
    await api.post("/comments", { post_id: id, content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
    const commentsRes = await api.get(`/comments/${id}?sort=${commentSort}`);
    setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
  };

  function buildTree(list: CommentWithMeta[]): CommentWithMeta[] {
    const map = new Map<number, CommentWithMeta & { children: CommentWithMeta[] }>();
    list.forEach((c) => map.set(c.id, { ...c, children: [] }));
    list.forEach((c) => {
      if (c.parent_id != null) {
        const p = map.get(c.parent_id);
        if (p) p.children.push(map.get(c.id)!);
      }
    });
    const roots = list.filter((c) => c.parent_id == null).map((c) => map.get(c.id)!);
    roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (commentSort === "top") {
      roots.sort((a, b) => {
        const la = a.like_count ?? 0, lb = b.like_count ?? 0;
        if (lb !== la) return lb - la;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    roots.forEach((r) => {
      r.children.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    return roots;
  }

  const commentTree = buildTree(comments);
  const totalComments = comments.length;

  if (loading) {
    return (
      <div style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "32px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 80px)",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #e4e7eb",
          borderTopColor: "#000",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "32px 20px",
        textAlign: "center",
      }}>
        <h2 style={{ marginBottom: "16px", color: "#1a1a1a" }}>Post not found</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#000",
            border: "none",
            color: "#ffffff",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Go back to Feed
        </button>
      </div>
    );
  }

  const userName = post.user?.name || "User";
  const userEmail = post.user?.email || null;
  const avatarUrl = post.user?.avatar_url || getAvatarUrl(userName, userEmail);

  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "24px 16px",
      minHeight: "calc(100vh - 80px)",
      backgroundColor: "transparent",
    }}>
      <article style={{
        backgroundColor: "#F5F5F5",
        borderRadius: "30px",
        padding: "28px",
        marginBottom: "24px",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--border-light)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-light)",
        }}>
          <img
            src={avatarUrl}
            alt={userName}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid var(--border-color)",
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{userName}</div>
            {userEmail && <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{userEmail}</div>}
          </div>
          <time style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>{formatDate(post.created_at)}</time>
        </div>

        {post.title && (
          <h1 style={{
            color: "var(--text-primary)",
            fontSize: "28px",
            fontWeight: 700,
            lineHeight: "1.4",
            marginBottom: "16px",
            marginTop: 0,
            wordBreak: "break-word",
          }}>
            {post.title}
          </h1>
        )}

        <div style={{ marginBottom: post.images && post.images.length > 0 ? "16px" : 0 }}>
          <ContentRenderer content={post.content} />
        </div>

        {post.images && post.images.length > 0 && <ImageSlider images={post.images} />}
      </article>

      {/* Comments Section */}
      <div style={{
        backgroundColor: "#F5F5F5",
        borderRadius: "30px",
        padding: "28px",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--border-light)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Comments ({totalComments})
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setCommentSort("newest")}
              style={{
                padding: "6px 14px",
                borderRadius: "16px",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                backgroundColor: commentSort === "newest" ? "var(--accent)" : "var(--bg-elevated)",
                color: commentSort === "newest" ? "gray" : "#000",
              }}
            >
              Newest
            </button>
            <button
              onClick={() => setCommentSort("top")}
              style={{
                padding: "6px 14px",
                borderRadius: "16px",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                backgroundColor: commentSort === "top" ? "var(--accent)" : "var(--bg-elevated)",
                color: commentSort === "top" ? "gray" : "#000",
              }}
            >
              Top
            </button>
          </div>
        </div>

        {isSignedIn && (
          <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--border-light)" }}>
            <MentionInput
              value={commentContent}
              onChange={setCommentContent}
              placeholder="Write a comment... (Use @ to mention users)"
              minHeight="100px"
              style={{ marginBottom: "12px", borderRadius: "15px" }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || isSubmitting}
              style={{
                padding: "10px 20px",
                backgroundColor: commentContent.trim() && !isSubmitting ? "var(--accent)" : "var(--border-color)",
                border: "none",
                color: commentContent.trim() && !isSubmitting ? "#fff" : "#000",
                backgroundColor: commentContent.trim() && !isSubmitting ? "#000" : "#e4e7eb",
                borderRadius: "12px",
                cursor: commentContent.trim() && !isSubmitting ? "pointer" : "not-allowed",
                fontSize: "15px",
                fontWeight: 500,
              }}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        )}

        {commentTree.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "gray" }}>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {commentTree.map((c) => (
              <CommentBlock
                key={c.id}
                comment={c}
                depth={0}
                getAvatarUrl={getAvatarUrl}
                formatDate={formatDate}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

