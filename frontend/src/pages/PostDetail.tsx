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
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { 
  CaretLeft,
  ChatTeardropText,
  Heart,
  ShareNetwork,
  BookmarkSimple,
  ChartBar,
  PaperPlaneTilt,
  CheckCircle
} from "phosphor-react";
import { toast } from "react-toastify";
import Lightbox from "../components/Lightbox";
import SendToChatModal from "../components/SendToChatModal";

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

import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const { isSignedIn, user } = useClerkUser();
  const queryClient = useQueryClient();

  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [isSendToChatModalOpen, setIsSendToChatModalOpen] = useState(false);
  const [commentSort] = useState<"newest" | "top">("newest");

  const { avatarUrl: currentUserAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    user?.fullName || user?.username || "User"
  );

  // 1. Fetch Post Data
  const { data: post = null, isLoading: postLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/posts/${id}`, { headers });
      
      // Secondary logic: track analytics (fire and forget)
      api.post(`/analytics/track`, {
        event_type: 'post_view',
        target_user_id: res.data.user_id,
        post_id: res.data.id
      }, { headers }).catch(() => {});

      return res.data as Post;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["postComments", id, commentSort],
    queryFn: async () => {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/comments/${id}?sort=${commentSort}`, { headers });
      return (Array.isArray(res.data) ? res.data : []) as CommentWithMeta[];
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const loading = postLoading || (commentsLoading && comments.length === 0);

  // Sync voted option when post loads
  useEffect(() => {
    if (post?.poll?.userVoted !== undefined) {
      setVotedOption(post.poll.userVoted);
    }
  }, [post?.poll?.userVoted]);

  const { isLiked, likeCount, toggleLike, fetchLikeStatus, loading: likeLoading } = useLikes(Number(id), post?.isLiked, post?.like_count);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(Number(id), post?.isSaved);

  useEffect(() => {
    if (id) {
      fetchLikeStatus();
      fetchSavedStatus();
    }
  }, [id, fetchLikeStatus, fetchSavedStatus]);

  const handleSubmitComment = async () => {
    if (!isSignedIn || !commentContent.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post("/comments", { post_id: id, content: commentContent.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentContent("");
      await api.get(`/comments/${id}?sort=${commentSort}`, { headers: { Authorization: `Bearer ${token}` } });
      await queryClient.invalidateQueries({ queryKey: ["postComments", id] });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number | string, content: string) => {
    const token = await getToken();
    await api.post("/comments", { post_id: id, content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
    await api.get(`/comments/${id}?sort=${commentSort}`, { headers: { Authorization: `Bearer ${token}` } });
    await queryClient.invalidateQueries({ queryKey: ["postComments", id] });
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
      // Refresh post to update counts
      await api.get(`/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await queryClient.invalidateQueries({ queryKey: ["post", id] });
    } catch (error) {
      console.error("Error voting:", error);
      setVotedOption(optionIndex);
      toast.info("Vote simulated");
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
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-page)" }}>
      <div style={{ width: "20px", height: "20px", border: "0.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "999px", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px", color: "var(--text-tertiary)" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const shareUrl = `${window.location.origin}/post/${id}`;
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=212121&color=ffffff&bold=true`;

  return (
    <div style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}>
      <main style={{ 
        backgroundColor: "var(--bg-page)", 
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}>
        <SEO
        title={post.title || (post.content.length > 30 ? post.content.substring(0, 30) + "..." : post.content)}
        description={post.content.length > 160 ? post.content.substring(0, 157) + "..." : post.content}
        image={post.images && post.images.length > 0 ? post.images[0] : avatarUrl}
        url={window.location.href}
        type="article"
        author={userName}
        publishedTime={post.created_at}
        keywords={post.tags || ["post", "developer", "coding"]}
      />

      <div style={{
          display: "flex",
          width: isDesktop ? "1020px" : "100%",
          maxWidth: "1020px",
          position: "relative",
      }}>
        {/* Main Post Column */}
        <div style={{
            flex: 1,
            width: isDesktop ? "var(--feed-width)" : "100%",
            maxWidth: isDesktop ? "var(--feed-width)" : "700px",
            backgroundColor: "var(--bg-page)",
            borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
            borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
            minHeight: "100vh",
            margin: isDesktop ? "0" : "0 auto",
            position: "relative",
        }}>
          {/* Header */}
          <header style={{
            position: "sticky",
            top: 0,
            backgroundColor: "var(--bg-page)",
            opacity: 0.98,
            backdropFilter: "blur(24px)",
            zIndex: 100,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            borderBottom: "0.5px solid var(--border-hairline)"
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <CaretLeft size={20} weight="thin" color="var(--text-primary)" />
            </button>
            <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Post
            </h1>
          </header>

          {/* Post Content */}
          <article style={{ padding: isMobile ? "20px 16px" : "32px 24px" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              <img
                src={avatarUrl}
                alt={userName}
                style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover", border: "0.5px solid var(--border-hairline)" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span 
                    onClick={() => navigate(`/${post.user?.username || post.user_id}`)}
                    style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
                  >
                    {userName}
                  </span>
                  <VerifiedBadge username={post.user?.username} size="14px" />
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-tertiary)", marginTop: "1px", fontWeight: 500 }}>
                  @{post.user?.username || 'user'} • {formatRelativeDate(post.created_at)}
                </div>
              </div>
            </div>

            {/* Content Text */}
            <div dir="auto" style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "var(--text-primary)",
              wordBreak: "break-word",
              marginBottom: "24px"
            }}>
              <ContentRenderer content={post.content} />
            </div>

            {/* Media/Images */}
            {post.images && post.images.length > 0 && (
              <div style={{ marginBottom: "24px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
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
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <ChartBar size={18} weight="bold" color="var(--text-primary)" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Poll</span>
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
                        padding: "14px 16px",
                        backgroundColor: "transparent",
                        border: isSelected ? "1.5px solid var(--text-primary)" : "1.5px solid var(--border-hairline)",
                        borderRadius: "14px",
                        cursor: votedOption !== null ? "default" : "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
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
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            opacity: isSelected ? 1 : 0.8
                          }}>
                            {option || "Option " + (idx + 1)}
                            {isSelected && <CheckCircle size={14} weight="fill" style={{ marginLeft: "8px", verticalAlign: "middle" }} />}
                          </span>
                          {votedOption !== null && (
                            <span style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              color: isSelected ? "var(--text-primary)" : "var(--text-tertiary)",
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
                   <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>
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
              width: "100%",
              marginTop: "32px",
              borderTop: "0.5px solid var(--border-hairline)",
              borderBottom: "0.5px solid var(--border-hairline)",
              padding: "16px 0"
            }}>
              <div style={{ display: "flex", gap: "24px" }}>
                <button
                  onClick={() => document.querySelector('textarea')?.focus()}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                  <ChatTeardropText size={20} weight="thin" />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{comments.length}</span>
                </button>

                <button
                  onClick={toggleLike}
                  disabled={likeLoading}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: isLiked ? "#f91880" : "var(--text-secondary)", cursor: "pointer" }}
                >
                  <Heart size={20} weight={isLiked ? "fill" : "thin"} />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{likeCount}</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <button onClick={handleShare} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                  <ShareNetwork size={20} weight="thin" />
                </button>
                <button onClick={handleSendToChat} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                  <PaperPlaneTilt size={20} weight="thin" />
                </button>
                <button onClick={toggleSave} style={{ background: "none", border: "none", color: isSaved ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                  <BookmarkSimple size={20} weight={isSaved ? "fill" : "thin"} />
                </button>
              </div>
            </div>
          </article>

          {/* Comment Composer */}
          {isSignedIn && (
            <div style={{
              padding: isMobile ? "20px 16px" : "24px 24px",
              borderBottom: "0.5px solid var(--border-hairline)",
              display: "flex",
              gap: "16px",
            }}>
              <img
                src={currentUserAvatarUrl}
                alt=""
                style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover", border: "1px solid var(--border-hairline)", flexShrink: 0 }}
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
                      padding: "8px 20px",
                      backgroundColor: commentContent.trim() && !isSubmitting ? "var(--text-primary)" : "rgba(var(--text-primary-rgb), 0.5)",
                      color: "var(--bg-page)",
                      border: "none",
                      borderRadius: "var(--radius-xl)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: commentContent.trim() && !isSubmitting ? "pointer" : "not-allowed",
                      transition: "opacity 0.2s",
                    }}
                  >
                    {isSubmitting ? "..." : "Reply"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {comments.length === 0 ? (
              <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                No replies yet.
              </div>
            ) : (
              buildTree(comments).map(c => (
                <div key={c.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                  <CommentBlock comment={c} depth={0} onReply={handleReply} resourceType="post" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        {isDesktop && (
          <aside style={{
              width: "340px",
              padding: "0 0 24px 12px",
              position: "sticky",
              top: 0,
              alignSelf: "flex-start",
              flexShrink: 0,
          }}>
              <RecommendedUsersSidebar />
          </aside>
        )}
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
          initialMessage={`Check out this post on Codeown: ${post.title || post.content.substring(0, 50)}...`}
        />
      )}
      </main>
    </div>
  );
}
