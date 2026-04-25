import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useAvatar } from "../hooks/useAvatar";
import ImageSlider from "../components/ImageSlider";
import ContentRenderer, { CodeBlock } from "../components/ContentRenderer";
import MentionInput from "../components/MentionInput";
import CommentBlock, { type CommentWithMeta } from "../components/CommentBlock";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { formatFullTwitterDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import { useWindowSize } from "../hooks/useWindowSize";
import ShareModal from "../components/ShareModal";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Comment01Icon,
  Share01Icon,
  Bookmark02Icon,
  Chart01Icon,
  SentIcon,
  FavouriteIcon,
  CheckmarkCircle01Icon,
  Download01Icon,
  Attachment01Icon,
  MoreHorizontalIcon,
  PinIcon,
  PencilEdit01Icon,
  Delete02Icon,
  GifIcon,
  Image01Icon,
  RepostIcon,
  WorkIcon,
  UserQuestion01Icon,
  ConfusedIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";
import Lightbox from "../components/Lightbox";
import SendToChatModal from "../components/SendToChatModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import EditPostModal from "../components/EditPostModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import GifPicker from "../components/GifPicker";
import { socket } from "../lib/socket";

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[] | null;
  attachments?: { name: string; url?: string; data?: string; size: number }[] | null;
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
  code_snippet?: string | null;
  isPinned?: boolean;
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  post_type?: string | null;
  isReposted?: boolean;
  repost_count?: number;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostDetailSkeleton } from "../components/LoadingSkeleton";

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
  const [commentSort, setCommentSort] = useState<"newest" | "top">("newest");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPinnedLocal, setIsPinnedLocal] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const { avatarUrl: currentUserAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    user?.fullName || user?.username || "User"
  );

  // 1. Fetch Post Data
  const { data: post = null, isLoading: postLoading } = useQuery<Post>({
    queryKey: ["post", id],
    queryFn: async ({ signal }) => {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/posts/${id}`, { headers, signal });

      // Update local pinned state if available
      if (res.data.isPinned !== undefined) {
        setIsPinnedLocal(res.data.isPinned);
      }

      // Secondary logic: track analytics (fire and forget)
      api.post(`/analytics/track`, {
        event_type: 'post_view',
        target_user_id: res.data.user_id,
        post_id: res.data.id
      }, { headers }).catch(() => { });

      return res.data as Post;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["postComments", id, commentSort],
    queryFn: async ({ signal }) => {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/comments/${id}?sort=${commentSort}`, { headers, signal });
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

  const [repostCountLocal, setRepostCountLocal] = useState(post?.repost_count || 0);
  const [isRepostedLocal, setIsRepostedLocal] = useState(post?.isReposted || false);
  const [isReShipping, setIsReShipping] = useState(false);

  useEffect(() => {
    if (post) {
      setRepostCountLocal(post.repost_count || 0);
      setIsRepostedLocal(post.isReposted || false);
    }
  }, [post]);

  useEffect(() => {
    if (!id) return;
    fetchLikeStatus();
    fetchSavedStatus();

    // Real-time updates via content_update
    const handleContentUpdate = ({ type, data }: any) => {
      if (!type || !data) return;

      // 1. Handle view updates
      if (type === "post_viewed" && String(data.postId) === String(id)) {
        queryClient.setQueryData(["post", id], (old: any) => {
          if (!old) return old;
          return { ...old, view_count: data.viewCount };
        });
      }

      // 2. Handle comment updates
      if (type === "post_commented" && String(data.postId) === String(id)) {
        queryClient.invalidateQueries({ queryKey: ["postComments", id] });
        queryClient.invalidateQueries({ queryKey: ["post", id] });
      }

      // 3. Handle repost updates
      if (type === "post_reposted" && String(data.id) === String(id)) {
        if (data.removed) {
          setRepostCountLocal(prev => Math.max(0, prev - 1));
          if (data.reposter_id === user?.id) {
            setIsRepostedLocal(false);
          }
        } else {
          setRepostCountLocal(prev => prev + 1);
          if (data.reposter_id === user?.id) {
            setIsRepostedLocal(true);
          }
        }
      }
    };

    socket.on("content_update", handleContentUpdate);
 
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
 
    return () => {
      socket.off("content_update", handleContentUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [id, fetchLikeStatus, fetchSavedStatus, queryClient, user?.id]);

  const isOwnPost = user?.id === post?.user_id;
  const isPinned = isPinnedLocal;

  const handlePin = async () => {
    try {
      const token = await getToken();
      const endpoint = isPinned ? `/posts/${post?.id}/unpin` : `/posts/${post?.id}/pin`;
      await api.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPinnedLocal(!isPinned);
      toast.success(isPinned ? "Post unpinned" : "Post pinned to profile");
      window.dispatchEvent(new Event("profileUpdated"));
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin");
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }

    const originalState = isRepostedLocal;
    const originalCount = repostCountLocal;

    // Optimistic Update
    setIsRepostedLocal(!originalState);
    setRepostCountLocal(prev => !originalState ? prev + 1 : Math.max(0, prev - 1));

    try {
      setIsReShipping(true);
      const token = await getToken();
      const res = await api.post('/posts/repost', {
        postId: id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.action === "reposted") {
        toast.success("Shipped to your profile!");
      } else {
        toast.info("Repost removed");
      }
    } catch (error) {
      console.error("Error re-shipping:", error);
      setIsRepostedLocal(originalState);
      setRepostCountLocal(originalCount);
      toast.error("Failed to Re-Ship");
    } finally {
      setIsReShipping(false);
    }
  };

  const handlePostDelete = async () => {
    if (!post?.id) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      await api.delete(`/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const updateCommentCountInCache = (delta: number) => {
    if (!id) return;
    queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
      if (!old || !old.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: (page.posts || []).map((p: any) =>
            String(p.id) === String(id) ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) + delta) } : p
          )
        }))
      };
    });
    queryClient.setQueryData(["post", id], (old: any) => {
      if (!old) return old;
      return { ...old, comment_count: Math.max(0, (old.comment_count || 0) + delta) };
    });
  };

  const handleSubmitComment = async () => {
    if (!isSignedIn) return;
    if (!commentContent.trim() && !selectedGif && !selectedImage) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const finalContent = selectedGif ? `${commentContent.trim()}\n${selectedGif}`.trim() : commentContent.trim();
      await api.post("/comments", {
        post_id: id,
        content: finalContent,
        image_url: selectedImage
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentContent("");
      setSelectedGif(null);
      setSelectedImage(null);
      updateCommentCountInCache(1);
      await queryClient.invalidateQueries({ queryKey: ["postComments", id] });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleReply = async (parentId: number | string, content: string) => {
    const token = await getToken();
    await api.post("/comments", { post_id: id, content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
    updateCommentCountInCache(1);
    await queryClient.invalidateQueries({ queryKey: ["postComments", id] });
  };

  const handleCommentDelete = async () => {
    if (!isSignedIn || !commentToDelete) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      await api.delete(`/comments/${commentToDelete}`, { headers: { Authorization: `Bearer ${token}` } });
      updateCommentCountInCache(-1);
      await queryClient.invalidateQueries({ queryKey: ["postComments", id] });
      setCommentToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
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

  const handleDownload = (e: React.MouseEvent, fileSource: string | undefined, fileName: string) => {
    e.stopPropagation();
    if (!fileSource) return;
    const link = document.createElement("a");
    link.href = fileSource;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build comment tree for threaded views
  const commentMap = new Map<number | string, CommentWithMeta>();
  comments.forEach(c => {
    // Make sure we clone and define a children array (if not already there)
    commentMap.set(c.id, { ...c, children: [] });
  });

  const topLevelComments: CommentWithMeta[] = [];
  comments.forEach(c => {
    const parentId = c.parent_id;
    if (parentId && commentMap.has(parentId)) {
      commentMap.get(parentId)!.children!.push(commentMap.get(c.id)!);
    } else {
      topLevelComments.push(commentMap.get(c.id)!);
    }
  });

  const { width } = useWindowSize();
  const isDesktop = width >= 1200;
  const isMobile = width < 768;

  if (loading) return (
    <div style={{
      backgroundColor: "var(--bg-page)",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      width: "100%",
    }}>
      <div style={{
        width: isDesktop ? "920px" : "100%",
        maxWidth: "920px",
        position: "relative",
        paddingTop: isMobile ? "64px" : "0"
      }}>
        <div style={{
          width: isDesktop ? "620px" : "100%",
          maxWidth: isDesktop ? "620px" : "700px",
          backgroundColor: "var(--bg-page)",
          borderLeft: isMobile ? "none" : "0.5px solid var(--border-hairline)",
          borderRight: isMobile ? "none" : "0.5px solid var(--border-hairline)",
          minHeight: "100vh",
          margin: isDesktop ? "0" : "0 auto",
        }}>
          <PostDetailSkeleton />
        </div>
      </div>
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
          width: isDesktop ? "920px" : "100%",
          maxWidth: "920px",
          position: "relative",
        }}>
          {/* Main Post Column */}
          <div style={{
            width: isDesktop ? "620px" : "100%",
            maxWidth: isDesktop ? "620px" : "700px",
            backgroundColor: "var(--bg-page)",
            borderLeft: (isMobile || !isDesktop) ? "none" : "0.5px solid var(--border-hairline)",
            borderRight: (isMobile || !isDesktop) ? "none" : "0.5px solid var(--border-hairline)",
            minHeight: "100vh",
            margin: "0 auto",
            position: "relative",
            flexShrink: 0
          }}>
            {/* Header */}
            <header style={{
              position: "sticky",
              top: 0,
              backgroundColor: "var(--bg-header)",
              backdropFilter: "blur(24px)",
              zIndex: 100,
              padding: isMobile ? "12px 16px" : "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "0.5px solid var(--border-hairline)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
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
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </button>
                <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Post
                </h1>
              </div>

              {/* Three Dots Menu */}
              {isOwnPost && (
                <div style={{ position: "relative" }} ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-tertiary)",
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={24} />
                  </button>

                  {isMenuOpen && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      backgroundColor: "var(--bg-card)",
                      borderRadius: "14px",
                      border: "0.5px solid var(--border-hairline)",
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
                      padding: "6px",
                      zIndex: 1000,
                      minWidth: isMobile ? "200px" : "180px",
                      animation: "dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}>
                      <button
                        onClick={handlePin}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "transparent",
                          color: "var(--text-primary)",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.1s ease",
                          textAlign: "left",
                          whiteSpace: "nowrap"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <HugeiconsIcon icon={PinIcon} size={18} />
                        {isPinned ? "Unpin from profile" : "Pin to profile"}
                      </button>

                      <button
                        onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "transparent",
                          color: "var(--text-primary)",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.1s ease",
                          textAlign: "left",
                          whiteSpace: "nowrap"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={18} />
                        Edit Post
                      </button>

                      <div style={{ height: "1px", backgroundColor: "var(--border-hairline)", margin: "4px 8px" }} />

                      <button
                        onClick={() => { setIsDeleteModalOpen(true); setIsMenuOpen(false); }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "transparent",
                          color: "#ef4444",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.1s ease",
                          textAlign: "left",
                          whiteSpace: "nowrap"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={18} />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </header>

            {/* Post Content */}
            <article style={{ padding: isMobile ? "20px 16px" : "32px 24px" }}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <img
                  src={avatarUrl}
                  alt={userName}
                  style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover", border: "0.5px solid var(--border-hairline)", backgroundColor: "var(--bg-page)" }}
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
                  <div style={{ fontSize: "12.5px", color: "var(--text-tertiary)", marginTop: "1px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                    @{post.user?.username || 'user'}
                    {post.post_type && (
                      <>
                        <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: post.post_type === "WIP" ? "#ffaa00" :
                            post.post_type === "Stuck" ? "#ff4d4f" :
                              post.post_type === "Advice" ? "#a855f7" :
                                "var(--text-tertiary)",
                          padding: post.post_type === "Update" ? "0" : "2px 10px",
                          borderRadius: "20px",
                          backgroundColor: post.post_type === "Update" ? "transparent" :
                            post.post_type === "WIP" ? "rgba(255, 170, 0, 0.08)" :
                              post.post_type === "Stuck" ? "rgba(255, 77, 79, 0.08)" :
                                "rgba(168, 85, 247, 0.1)",
                          border: post.post_type === "Update" ? "none" : `0.5px solid ${post.post_type === "WIP" ? "rgba(255, 170, 0, 0.15)" :
                            post.post_type === "Stuck" ? "rgba(255, 77, 79, 0.15)" :
                              "rgba(168, 85, 247, 0.15)"
                            }`,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em"
                        }}>
                          {post.post_type === "WIP" && <HugeiconsIcon icon={WorkIcon} size={12} />}
                          {post.post_type === "Stuck" && <HugeiconsIcon icon={UserQuestion01Icon} size={12} />}
                          {post.post_type === "Advice" && <HugeiconsIcon icon={ConfusedIcon} size={12} />}
                          {post.post_type === "Update" && <HugeiconsIcon icon={RepostIcon} size={12} />}
                          <span>{post.post_type}</span>
                        </div>
                      </>
                    )}
                    {post.project && (
                      <>
                        <span style={{ color: "var(--border-hairline)", fontSize: "10px" }}>•</span>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${post.project?.id}`);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12.5px",
                            color: "#0096ff",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "1px 6px",
                            borderRadius: "6px",
                            transition: "all 0.15s ease",
                            backgroundColor: "rgba(0, 150, 255, 0.05)"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 150, 255, 0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 150, 255, 0.05)"}
                        >
                          <span>{post.project.name}</span>
                        </div>
                      </>
                    )}
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
                <ContentRenderer content={post.content} hidePreview={!!(post.images && post.images.length > 0)} />
              </div>

              {post.code_snippet && (
                <div style={{ marginBottom: "24px" }}>
                  <CodeBlock language="typescript" code={post.code_snippet} />
                </div>
              )}

              {/* Media/Images */}
              {post.images && post.images.length > 0 && (
                <div style={{ marginBottom: "24px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                  <ImageSlider images={post.images} onImageClick={handleImageClick} />
                </div>
              )}

              {/* Attachments Section */}
              {post.attachments && post.attachments.length > 0 && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "32px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <HugeiconsIcon icon={Download01Icon} size={18} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Downloads</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                    {post.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => handleDownload(e, file.url || file.data, file.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          backgroundColor: "var(--bg-hover)",
                          borderRadius: "14px",
                          border: "1px solid var(--border-hairline)",
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--text-primary)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.backgroundColor = "var(--bg-page)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border-hairline)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "var(--bg-page)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "0.5px solid var(--border-hairline)",
                            flexShrink: 0
                          }}>
                            <HugeiconsIcon icon={Attachment01Icon} size={18} color="var(--text-primary)" />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                        <HugeiconsIcon icon={Download01Icon} size={20} color="var(--text-tertiary)" />
                      </div>
                    ))}
                  </div>
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
                    <HugeiconsIcon icon={Chart01Icon} size={18} />
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
                              {isSelected && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} {...({ variant: "solid" } as any)} style={{ marginLeft: "8px", verticalAlign: "middle" }} />}
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

              <div style={{
                padding: "16px 0",
                color: "var(--text-tertiary)",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px"
              }}>
                <span>{formatFullTwitterDate(post.created_at)}</span>
                {post.view_count && post.view_count > 0 ? (
                  <>
                    <span style={{ margin: "0 2px" }}>·</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                      {post.view_count.toLocaleString()}
                    </span>
                    <span>{post.view_count === 1 ? "View" : "Views"}</span>
                  </>
                ) : null}
              </div>

              {/* Actions Row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "32px",
                borderTop: "0.5px solid var(--border-hairline)",
                borderBottom: "0.5px solid var(--border-hairline)",
                padding: "16px 0",
                gap: isMobile ? "0px" : "16px"
              }}>
                <div style={{ 
                  display: "flex", 
                  gap: isMobile ? "0px" : "24px", 
                  justifyContent: isMobile ? "space-between" : "flex-start",
                  flex: isMobile ? 1 : "initial"
                }}>
                  <button
                    onClick={() => document.querySelector('textarea')?.focus()}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      background: "none", 
                      border: "none", 
                      color: "var(--text-secondary)", 
                      cursor: "pointer",
                      padding: isMobile ? "0 10px" : "0"
                    }}
                  >
                    <HugeiconsIcon icon={Comment01Icon} size={20} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{comments.length}</span>
                  </button>

                  <button
                    onClick={toggleLike}
                    disabled={likeLoading}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      background: "none", 
                      border: "none", 
                      color: isLiked ? "#f91880" : "var(--text-secondary)", 
                      cursor: "pointer",
                      padding: isMobile ? "0 10px" : "0"
                    }}
                  >
                    <HugeiconsIcon
                      icon={FavouriteIcon}
                      size={20}
                      className={isLiked ? "hugeicon-filled" : ""}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{likeCount}</span>
                  </button>

                  <button
                    onClick={handleRepost}
                    disabled={isReShipping}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "none",
                      border: "none",
                      color: isRepostedLocal ? "#00ba7c" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      padding: isMobile ? "0 10px" : "0"
                    }}
                  >
                    <HugeiconsIcon
                      icon={RepostIcon}
                      size={20}
                      style={{
                        transform: isReShipping ? "rotate(180deg)" : "none",
                        transition: "transform 0.3s ease"
                      }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{repostCountLocal}</span>
                  </button>
                </div>

                <div style={{ 
                  display: "flex", 
                  gap: isMobile ? "8px" : "16px",
                  marginLeft: isMobile ? "8px" : "0"
                }}>
                  <button onClick={handleShare} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                    <HugeiconsIcon icon={Share01Icon} size={20} />
                  </button>
                  <button onClick={handleSendToChat} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                    <HugeiconsIcon icon={SentIcon} size={20} />
                  </button>
                  <button onClick={toggleSave} style={{ background: "none", border: "none", color: isSaved ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer", padding: "4px" }}>
                    <HugeiconsIcon icon={Bookmark02Icon} size={20} {...({ variant: isSaved ? "solid" : "outline" } as any)} />
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
                  {selectedGif && (
                    <div style={{
                      position: "relative", width: "fit-content", marginBottom: "12px",
                      borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)",
                    }}>
                      <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: "150px", display: "block" }} />
                      <button
                        onClick={() => setSelectedGif(null)}
                        style={{
                          position: "absolute", top: "6px", right: "6px",
                          backgroundColor: "rgba(0,0,0,0.75)", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  )}
                  {selectedImage && (
                    <div style={{
                      position: "relative", width: "fit-content", marginBottom: "12px",
                      borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)",
                    }}>
                      <img src={selectedImage} alt="Selected" style={{ maxHeight: "150px", display: "block" }} />
                      <button
                        onClick={() => setSelectedImage(null)}
                        style={{
                          position: "absolute", top: "6px", right: "6px",
                          backgroundColor: "rgba(0,0,0,0.75)", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  )}
                  <MentionInput
                    value={commentContent}
                    onChange={setCommentContent}
                    placeholder="Post your reply"
                    transparent={true}
                    minHeight="40px"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsGifPickerOpen(!isGifPickerOpen);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: "6px", padding: "8px",
                            backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent", color: isGifPickerOpen ? "var(--text-primary)" : "var(--text-tertiary)",
                            border: "0.5px solid var(--border-hairline)", borderRadius: "100px", cursor: "pointer", fontSize: "11px", fontWeight: 700, textTransform: "uppercase"
                          }}
                        >
                          <HugeiconsIcon icon={GifIcon} size={18} />
                        </button>
                        {isGifPickerOpen && (
                          <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "12px", zIndex: 100 }}>
                            <GifPicker onSelect={(gif) => { setSelectedGif(gif); setIsGifPickerOpen(false); }} onClose={() => setIsGifPickerOpen(false)} />
                          </div>
                        )}
                      </div>

                      <label style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "8px",
                        backgroundColor: "transparent", color: "var(--text-tertiary)",
                        border: "0.5px solid var(--border-hairline)", borderRadius: "100px", cursor: "pointer", fontSize: "11px", fontWeight: 700, textTransform: "uppercase"
                      }}>
                        <HugeiconsIcon icon={Image01Icon} size={18} />
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={isUploading} />
                      </label>
                    </div>

                    <button
                      onClick={handleSubmitComment}
                      disabled={(!commentContent.trim() && !selectedGif && !selectedImage) || isSubmitting || isUploading}
                      style={{
                        padding: "8px 24px",
                        backgroundColor: (commentContent.trim() || selectedGif || selectedImage) && !isSubmitting && !isUploading ? "var(--text-primary)" : "transparent",
                        color: (commentContent.trim() || selectedGif || selectedImage) && !isSubmitting && !isUploading ? "var(--bg-page)" : "var(--text-tertiary)",
                        border: "0.5px solid var(--border-hairline)", borderRadius: "100px", fontWeight: 700, fontSize: "13px",
                        cursor: (commentContent.trim() || selectedGif || selectedImage) && !isSubmitting && !isUploading ? "pointer" : "not-allowed",
                      }}
                    >
                      {isSubmitting ? "..." : isUploading ? "Wait" : "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sorting Header — Twitter Style */}
            <div style={{
              padding: "16px 24px",
              borderBottom: "0.5px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--bg-page)",
              position: "relative",
              zIndex: 90
            }}>
              <div style={{ position: "relative" }} ref={sortMenuRef}>
                <button
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <span style={{ color: "#0096ff", fontWeight: 700 }}>
                    {commentSort === "newest" ? "Recent" : "Likes"}
                  </span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} style={{ color: "#0096ff" }} />
                </button>

                {isSortMenuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "12px",
                    border: "0.5px solid var(--border-hairline)",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)",
                    padding: "4px",
                    zIndex: 1000,
                    minWidth: "160px",
                    animation: "dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}>
                    <button
                      onClick={() => { setCommentSort("newest"); setIsSortMenuOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background-color 0.1s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Recent
                      {commentSort === "newest" && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: "#1d9bf0" }} />}
                    </button>
                    <button
                      onClick={() => { setCommentSort("top"); setIsSortMenuOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background-color 0.1s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Likes
                      {commentSort === "top" && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: "#1d9bf0" }} />}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                  {comments.length} replies
                </span>
              </div>
            </div>

            {/* Comments Section — flat list, only top-level. Replies via drill-down. */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {topLevelComments.length === 0 ? (
                <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                  No replies yet.
                </div>
              ) : (
                topLevelComments.map(c => (
                  <div key={c.id} style={{ borderBottom: "0.5px solid var(--border-hairline)" }}>
                    <CommentBlock
                      comment={c}
                      depth={0}
                      onReply={handleReply}
                      onDelete={(id) => setCommentToDelete(id)}
                      onImageClick={(url) => { setLightboxImage(url); setIsLightboxOpen(true); }}
                      resourceType="post"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          {isDesktop && (
            <aside style={{
              width: "300px",
              padding: "0",
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
          postUrl={shareUrl}
          author={post?.user ? {
            name: post.user.name || "User",
            username: post.user.username || "user",
            avatar_url: post.user.avatar_url || null
          } : undefined}
        />
        {post && (
          <SendToChatModal
            isOpen={isSendToChatModalOpen}
            onClose={() => setIsSendToChatModalOpen(false)}
            postId={post.id}
            initialMessage={`Check out this post on Codeown: ${post.title || post.content.substring(0, 50)}...`}
          />
        )}
        <ConfirmDeleteModal
          isOpen={commentToDelete !== null}
          onClose={() => setCommentToDelete(null)}
          onConfirm={handleCommentDelete}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          isLoading={isDeleting}
        />

        {/* Post Action Modals */}
        {post && (
          <EditPostModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            post={post}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ["post", id] })}
          />
        )}

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handlePostDelete}
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          isLoading={isDeleting}
        />
      </main>
    </div>
  );
}
