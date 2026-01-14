import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import ImageSlider from "../components/ImageSlider";

interface Comment {
  id: number;
  post_id: number;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    name: string;
    email: string | null;
    avatar_url?: string | null;
  };
}

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
  const [comments, setComments] = useState<Comment[]>([]);
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
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        // Fetch post from posts list (we'll need to get it from the feed or create a single post endpoint)
        const postsRes = await api.get("/posts");
        const foundPost = postsRes.data.find((p: Post) => p.id === parseInt(id || "0"));

        if (!foundPost) {
          setLoading(false);
          return;
        }

        setPost(foundPost);

        // Fetch comments
        const commentsRes = await api.get(`/comments/${id}`);
        setComments(commentsRes.data);
      } catch (error) {
        console.error("Error fetching post and comments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

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
      // Refresh comments
      const commentsRes = await api.get(`/comments/${id}`);
      setComments(commentsRes.data);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      const errorData = error?.response?.data;
      let errorMessage = "Failed to create comment";

      if (errorData) {
        if (errorData.details) {
          errorMessage = `${errorData.error || "Failed to create comment"}: ${errorData.details}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }

      alert(`Failed to create comment: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const userName = post.user?.name || "Unknown User";
  const userEmail = post.user?.email || null;
  const avatarUrl = post.user?.avatar_url || getAvatarUrl(userName, userEmail);

  return (
    <div style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "32px 20px",
      minHeight: "calc(100vh - 80px)",
    }}>
      {/* Post Card */}
      <article style={{
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
      }}>
        {/* User Info Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid #f5f7fa",
        }}>
          <img
            src={avatarUrl}
            alt={userName}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #e4e7eb",
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1a1a1a",
              marginBottom: "2px",
            }}>
              {userName}
            </div>
            {userEmail && (
              <div style={{
                fontSize: "13px",
                color: "#64748b",
              }}>
                {userEmail}
              </div>
            )}
          </div>
          <time style={{
            color: "#64748b",
            fontSize: "13px",
            fontWeight: 500,
          }}>
            {formatDate(post.created_at)}
          </time>
        </div>

        {/* Post Title */}
        {post.title && (
          <h1 style={{
            color: "#1a1a1a",
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

        {/* Post Content */}
        <p style={{
          color: "#1a1a1a",
          fontSize: "16px",
          lineHeight: "1.6",
          marginBottom: post.images && post.images.length > 0 ? "16px" : 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {post.content}
        </p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <ImageSlider images={post.images} />
        )}
      </article>

      {/* Comments Section */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
      }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "20px",
        }}>
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        {isSignedIn && (
          <div style={{
            marginBottom: "24px",
            paddingBottom: "24px",
            borderBottom: "1px solid #f5f7fa",
          }}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px 16px",
                border: "1px solid #e4e7eb",
                borderRadius: "25px",
                fontSize: "16px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                transition: "all 0.15s",
                color: "#1a1a1a",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
                lineHeight: 1.5,
                marginBottom: "12px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#000";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 127, 245, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e4e7eb";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || isSubmitting}
              style={{
                padding: "10px 20px",
                backgroundColor: commentContent.trim() && !isSubmitting ? "#000" : "#e4e7eb",
                border: "none",
                color: commentContent.trim() && !isSubmitting ? "#ffffff" : "#94a3b8",
                borderRadius: "25px",
                cursor: commentContent.trim() && !isSubmitting ? "pointer" : "not-allowed",
                fontSize: "15px",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (commentContent.trim() && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (commentContent.trim() && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = "#000";
                }
              }}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#64748b",
          }}>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {comments.map((comment) => {
              const commentUserName = comment.user?.name || "Unknown User";
              const commentUserEmail = comment.user?.email || null;
              const commentAvatarUrl = comment.user?.avatar_url || getAvatarUrl(commentUserName, commentUserEmail);

              return (
                <div
                  key={comment.id}
                  style={{
                    padding: "16px",
                    backgroundColor: "#f5f7fa",
                    borderRadius: "12px",
                    border: "1px solid #e4e7eb",
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}>
                    <img
                      src={commentAvatarUrl}
                      alt={commentUserName}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #e4e7eb",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                      }}>
                        {commentUserName}
                      </div>
                    </div>
                    <time style={{
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}>
                      {formatDate(comment.created_at)}
                    </time>
                  </div>
                  <p style={{
                    color: "#1a1a1a",
                    fontSize: "15px",
                    lineHeight: "1.5",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

