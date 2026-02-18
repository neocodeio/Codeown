import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import ImageSlider from "../components/ImageSlider";
import ContentRenderer from "../components/ContentRenderer";
import MentionInput from "../components/MentionInput";
import CommentBlock, { type CommentWithMeta } from "../components/CommentBlock";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Share01Icon,
  FavouriteIcon,
  Comment02Icon,
  Bookmark01Icon,
  Bookmark02Icon,
  // Delete01Icon,
  // Pen01Icon,
  ArrowLeftIcon,
  // PinIcon,
} from '@hugeicons/core-free-icons';

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
  const { isSignedIn, user } = useClerkUser();
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

  const { width } = useWindowSize();
  const isMobile = width < 768;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=212121&color=ffffff&bold=true`;

  return (
    <main style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <SEO
        title={post.title || "Post"}
        description={post.content.substring(0, 160) + "..."}
        image={post.images && post.images.length > 0 ? post.images[0] : avatarUrl}
        url={window.location.href}
        type="article"
        author={userName}
        publishedTime={post.created_at}
        keywords={post.tags || ["post", "developer", "coding"]}
        schema={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title || post.content.substring(0, 60),
          "image": post.images && post.images.length > 0 ? post.images : [avatarUrl],
          "datePublished": post.created_at,
          "author": [{
            "@type": "Person",
            "name": userName,
            "url": `${window.location.origin}/user/${post.user?.username || post.user_id}`
          }],
          "description": post.content.substring(0, 160)
        }}
      />

      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderLeft: isMobile ? "none" : "1px solid #f1f5f9",
        borderRight: isMobile ? "none" : "1px solid #f1f5f9",
        minHeight: "100vh"
      }}>
        {/* Header: Back Button */}
        <div style={{
          height: "53px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          backgroundColor: "#ffffff",
          zIndex: 10,
          borderBottom: "1px solid #f1f5f9"
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "none",
              background: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <HugeiconsIcon icon={ArrowLeftIcon} style={{ fontSize: "16px", color: "#1a1a1a" }} />
          </button>
          <span style={{ marginLeft: "20px", fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>Post</span>
        </div>

        {/* Post Content */}
        <article style={{ padding: isMobile ? "16px" : "24px", display: "flex", gap: "12px" }}>
          {/* Left Column: Avatar */}
          {!isMobile && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* Right Column: Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* User Info Line */}
            <div style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
              {isMobile && (
                <img
                  src={avatarUrl}
                  alt={userName}
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
                    {userName.toUpperCase()}
                  </span>
                  <VerifiedBadge username={post.user?.username} size="12px" />
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  @{post.user?.username || 'user'} • {formatRelativeDate(post.created_at)}
                </div>
              </div>
            </div>

            {/* Content Text */}
            <div dir="auto" style={{
              fontSize: isMobile ? "15px" : "16px",
              lineHeight: "1.5",
              color: "#1a1a1a",
              wordBreak: "break-word",
              marginBottom: "16px"
            }}>
              <ContentRenderer content={post.content} />
            </div>

            {/* Media/Images */}
            {post.images && post.images.length > 0 && (
              <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden" }}>
                <ImageSlider images={post.images} />
              </div>
            )}

            {/* Actions Row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "400px",
              marginTop: "9%",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "12px"
            }}>
              {/* Comment */}
              <button
                onClick={() => {
                  const replyBox = document.querySelector('textarea');
                  if (replyBox) replyBox.focus();
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "13px" }}
              >
                <HugeiconsIcon icon={Comment02Icon} style={{ fontSize: "414px" }} />
                <span>{comments.length || 0}</span>
              </button>

              {/* Like */}
              <button
                onClick={toggleLike}
                disabled={likeLoading}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: isLiked ? "#ef4444" : "#666", cursor: "pointer", fontSize: "13px" }}
              >
                <HugeiconsIcon icon={isLiked ? FavouriteIcon : FavouriteIcon} style={{ fontSize: "12px", opacity: isLiked ? 1 : 0.6 }} />
                <span>{likeCount || 0}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                style={{ background: "none", border: "none", color: shareCopied ? "#10b981" : "#666", cursor: "pointer", padding: "4px" }}
              >
                <HugeiconsIcon icon={Share01Icon} style={{ fontSize: "12px" }} />
              </button>

              {/* Save */}
              <button
                onClick={toggleSave}
                style={{ background: "none", border: "none", color: isSaved ? "#1a1a1a" : "#666", cursor: "pointer", padding: "4px" }}
              >
                <HugeiconsIcon icon={isSaved ? Bookmark01Icon : Bookmark02Icon} style={{ fontSize: "12px" }} />
              </button>
            </div>
          </div>
        </article>

        {/* Comment Composer */}
        {isSignedIn && (
          <div style={{
            padding: isMobile ? "12px 16px" : "24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: "12px"
          }}>
            <img
              src={user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=212121&color=ffffff&bold=true`}
              alt="My Avatar"
              style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
            />
            <div style={{ flex: 1 }}>
              <MentionInput
                value={commentContent}
                onChange={setCommentContent}
                placeholder="Post your reply"
                transparent={true}
                minHeight="40px"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || isSubmitting}
                  style={{
                    padding: "6px 20px",
                    backgroundColor: commentContent.trim() && !isSubmitting ? "#1a1a1a" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: commentContent.trim() && !isSubmitting ? "pointer" : "not-allowed",
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section Container */}
        <section style={{ padding: isMobile ? "0 12px" : "0 16px" }}>
          {comments.length === 0 ? (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "15px"
            }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {buildTree(comments).map(c => (
                <div key={c.id} style={{ borderBottom: "1px solid #eff3f4" }}>
                  <CommentBlock comment={c} depth={0} onReply={handleReply} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        body { background-color: #fff !important; }
      `}</style>
    </main>
  );
}
