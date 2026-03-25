import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
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
import ShareModal from "../components/ShareModal";
import { 
  CaretLeft,
  ChatTeardropText,
  Heart,
  ShareNetwork,
  BookmarkSimple,
  ChartBar
} from "phosphor-react";
import { toast } from "react-toastify";
import Lightbox from "../components/Lightbox";
import SendToChatModal from "../components/SendToChatModal";
import { PaperPlaneTilt } from "phosphor-react";

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
  poll?: {
    options: string[];
    votes?: Record<number, number>;
    userVoted?: number;
  } | null;
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);

  const { avatarUrl: currentUserAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    user?.fullName || user?.username || "User"
  );

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
          if (postRes.data.poll?.userVoted !== undefined) {
             setVotedOption(postRes.data.poll.userVoted);
          }

          // Track post view analytics
          api.post(`/analytics/track`, {
            event_type: 'post_view',
            target_user_id: postRes.data.user_id,
            post_id: postRes.data.id
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).catch(err => console.error("Failed to record post analytics", err));
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

  const handleReply = async (parentId: number | string, content: string) => {
    const token = await getToken();
    await api.post("/comments", { post_id: id, content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
    const res = await api.get(`/comments/${id}?sort=${commentSort}`);
    setComments(Array.isArray(res.data) ? res.data : []);
  };

  const handleShare = () => {
    if (!post) return;
    setIsShareModalOpen(true);
  };

  const handleSendToChat = () => {
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    setIsSendToChatModalOpen(true);
  };

  const handleVote = async (optionIndex: number) => {
    if (!isSignedIn || votedOption !== null || isVoting || !id) return;

    setIsVoting(true);
    try {
      const token = await getToken();
      await api.post(`/posts/${id}/vote`, {
          optionIndex
      }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setVotedOption(optionIndex);
      toast.success("Vote recorded!");
      // Optionally refetch post to get latest vote counts
    } catch (error) {
      console.error("Error voting:", error);
      setVotedOption(optionIndex);
      toast.info("Vote simulated (backend support pending)");
    } finally {
      setIsVoting(false);
    }
  };

  const handleImageClick = (index: number) => {
    if (post?.images && post.images[index]) {
      setLightboxImage(post.images[index]);
      setIsLightboxOpen(true);
    }
  };

  function buildTree(list: CommentWithMeta[]): CommentWithMeta[] {
    const map = new Map<number | string, CommentWithMeta & { children: CommentWithMeta[] }>();
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <div style={{ width: "20px", height: "20px", border: "0.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "999px", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const shareUrl = `${window.location.origin}/post/${id}`;
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=212121&color=ffffff&bold=true`;

  return (
    <main style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <SEO
        title={post.title || (post.content.length > 30 ? post.content.substring(0, 30) + "..." : post.content)}
        description={post.content.length > 160 ? post.content.substring(0, 157) + "..." : post.content}
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
        backgroundColor: "var(--bg-page)",
        borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
        borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
        minHeight: "100vh"
      }}>
        {/* Header: Back Button */}
        <div style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          backgroundColor: "var(--bg-page)", // Removed blur for flat look or kept very subtle
          zIndex: 10,
          borderBottom: "0.5px solid var(--border-hairline)"
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "4px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <CaretLeft size={20} weight="thin" color="var(--text-primary)" />
          </button>
          <span style={{ marginLeft: "20px", fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>POST</span>
        </div>

        {/* Post Content */}
        <article style={{ padding: isMobile ? "24px 16px" : "32px 24px", display: "flex", gap: "16px" }}>
          {/* Left Column: Avatar */}
          {!isMobile && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "48px", height: "48px", borderRadius: "var(--radius-sm)", objectFit: "cover", border: "0.5px solid var(--border-hairline)" }}
              />
            </div>
          )}

          {/* Right Column: Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* User Info Line */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
              {isMobile && (
                <img
                  src={avatarUrl}
                  alt={userName}
                  style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", objectFit: "cover", border: "0.5px solid var(--border-hairline)" }}
                />
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                    {userName}
                  </span>
                  <VerifiedBadge username={post.user?.username} size="12px" />
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginTop: "2px", fontWeight: 600 }}>
                  @{post.user?.username || 'user'} • {formatRelativeDate(post.created_at)}
                </div>
              </div>
            </div>

            {/* Content Text */}
            <div dir="auto" style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "var(--text-primary)",
              wordBreak: "break-word",
              marginBottom: "32px"
            }}>
              <ContentRenderer content={post.content} />
            </div>

            {/* Media/Images */}
            {post.images && post.images.length > 0 && (
              <div style={{ marginBottom: "24px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                <ImageSlider images={post.images} onImageClick={handleImageClick} />
              </div>
            )}

            {/* Poll Content */}
            {post.poll && post.poll.options && post.poll.options.length > 0 && (
              <div style={{
                marginBottom: "32px",
                padding: "24px",
                backgroundColor: "var(--bg-hover)",
                border: "0.5px solid var(--border-hairline)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <ChartBar size={18} weight="bold" color="var(--text-primary)" />
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Poll</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {post.poll.options.map((option, idx) => {
                    const votes = post.poll?.votes || {};
                    const voteCount = Number(votes[idx] || 0);
                    const totalVotes = Object.values(votes).reduce((a: number, b: any) => a + Number(b), 0) || (votedOption !== null ? 1 : 0);
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isSelected = votedOption === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleVote(idx)}
                        disabled={votedOption !== null || isVoting}
                        style={{
                          position: "relative",
                          width: "100%",
                          padding: "16px",
                          backgroundColor: isSelected ? "var(--text-primary)" : "var(--bg-page)",
                          border: "0.5px solid var(--border-hairline)",
                          borderRadius: "var(--radius-xs)",
                          cursor: votedOption !== null ? "default" : "pointer",
                          textAlign: "left",
                          overflow: "hidden",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {votedOption !== null && (
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${percentage}%`,
                            backgroundColor: isSelected ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                            zIndex: 0
                          }} />
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                          <span style={{
                            fontSize: "13px",
                            fontWeight: isSelected ? 800 : 700,
                            color: isSelected ? "var(--bg-page)" : "var(--text-primary)",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
                          }}>
                            {option}
                          </span>
                          {votedOption !== null && (
                            <span style={{
                              fontSize: "12px",
                              fontWeight: 800,
                              color: isSelected ? "var(--bg-page)" : "var(--text-tertiary)",
                              fontFamily: "var(--font-mono)"
                            }}>
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: "4px" }}>
                   <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                      {Object.values(post.poll?.votes || {}).reduce((a: number, b: any) => a + Number(b), 0) + (votedOption !== null && post.poll && !post.poll.votes?.[votedOption] ? 1 : 0)} Votes • {votedOption !== null ? "Final results" : "Select an option to vote"}
                   </span>
                </div>
              </div>
            )}

            {/* Actions Row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "400px",
              marginTop: "32px",
              borderTop: "0.5px solid var(--border-hairline)",
              paddingTop: "16px"
            }}>
              {/* Comment */}
              <button
                onClick={() => {
                  const replyBox = document.querySelector('textarea');
                  if (replyBox) replyBox.focus();
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600 }}
              >
                <ChatTeardropText size={18} weight="thin" />
                {comments.length > 0 && <span style={{ fontFamily: "var(--font-mono)" }}>{comments.length}</span>}
              </button>

              {/* Like */}
              <button
                onClick={toggleLike}
                disabled={likeLoading}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: isLiked ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600 }}
              >
                <Heart size={18} weight={isLiked ? "fill" : "thin"} />
                {likeCount > 0 && <span style={{ fontFamily: "var(--font-mono)" }}>{likeCount}</span>}
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
              >
                <ShareNetwork size={18} weight="thin" />
              </button>

              {/* Send to Chat */}
              <button
                onClick={handleSendToChat}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
              >
                <PaperPlaneTilt size={18} weight="thin" />
              </button>

              {/* Save */}
              <button
                onClick={toggleSave}
                style={{ background: "none", border: "none", color: isSaved ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
              >
                <BookmarkSimple size={18} weight={isSaved ? "fill" : "thin"} />
              </button>
            </div>
          </div>
        </article>

        {/* Comment Composer */}
        {isSignedIn && (
          <div style={{
            padding: isMobile ? "24px 16px" : "32px 24px",
            borderBottom: "1px solid var(--border-hairline)",
            display: "flex",
            gap: isMobile ? "12px" : "16px",
            backgroundColor: "rgba(var(--text-primary-rgb), 0.01)"
          }}>
            <img
              src={currentUserAvatarUrl}
              alt="My Avatar"
              style={{ 
                width: isMobile ? "32px" : "44px", 
                height: isMobile ? "32px" : "44px", 
                borderRadius: "var(--radius-sm)", 
                objectFit: "cover", 
                border: "1px solid var(--border-hairline)",
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1 }}>
              <MentionInput
                value={commentContent}
                onChange={setCommentContent}
                placeholder="Share your thoughts..."
                transparent={true}
                minHeight="40px"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || isSubmitting}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: commentContent.trim() && !isSubmitting ? "var(--text-primary)" : "transparent",
                    color: commentContent.trim() && !isSubmitting ? "var(--bg-page)" : "var(--text-tertiary)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 900,
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    cursor: commentContent.trim() && !isSubmitting ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                    letterSpacing: "0.1em"
                  }}
                  onMouseEnter={(e) => {
                    if (commentContent.trim() && !isSubmitting) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {isSubmitting ? "SENDING..." : "POST REPLY"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section Container */}
        <section style={{ padding: "0" }}>
          {comments.length === 0 ? (
            <div style={{
              padding: "64px 24px",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              No replies yet — ask them something about this
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {buildTree(comments).map(c => (
                <div key={c.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                  <CommentBlock comment={c} depth={0} onReply={handleReply} resourceType="post" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={shareUrl}
        title="Share this post"
      />
      <Lightbox 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
        imageSrc={lightboxImage} 
      />
      {post && (
        <SendToChatModal
          isOpen={isSendToChatModalOpen}
          onClose={() => setIsSendToChatModalOpen(false)}
          postId={post.id}
          initialMessage={`Check out this post: ${post.title || post.content.substring(0, 50)}...`}
        />
      )}

      <style>{`
        body { background-color: var(--bg-page) !important; }
      `}</style>
    </main>
  );
}
