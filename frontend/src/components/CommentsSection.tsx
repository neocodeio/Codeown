import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import CommentBlock, { type CommentWithMeta } from "./CommentBlock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Gif, Image as ImageIcon } from "phosphor-react";
import { useAvatar } from "../hooks/useAvatar";
import GifPicker from "./GifPicker";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { useActivityBroadcast } from "../hooks/useActivityBroadcast";
import { useEffect } from "react";
import Lightbox from "./Lightbox";

interface CommentsSectionProps {
  resourceId: number;
  resourceType: "post" | "project";
  onCommentAdded?: () => void;
}

export default function CommentsSection({ resourceId, resourceType, onCommentAdded }: CommentsSectionProps) {
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { announce } = useActivityBroadcast();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (newComment.trim()) announce("commenting");
  }, [newComment, announce]);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [lightboxAuthor, setLightboxAuthor] = useState<any>(null);

  const { avatarUrl } = useAvatar(
    currentUser?.id,
    currentUser?.imageUrl,
    currentUser?.fullName || currentUser?.username || "User"
  );

  const queryKey = resourceType === "project"
    ? ["project_comments", String(resourceId)]
    : ["comments", String(resourceId)];

  const { data: rawComments = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      const response = await api.get(endpoint);
      return response.data || [];
    },
    enabled: !!resourceId
  });

  const buildCommentTree = (flatComments: CommentWithMeta[]): CommentWithMeta[] => {
    if (!flatComments || flatComments.length === 0) return [];

    // Normalize and Index
    const nodeMap: Record<string, CommentWithMeta & { children: CommentWithMeta[] }> = {};
    const processed = flatComments.map(c => {
      const node = { ...c, children: [] as CommentWithMeta[] };
      nodeMap[String(c.id)] = node;
      return node;
    });

    const roots: CommentWithMeta[] = [];

    // Link
    processed.forEach(node => {
      const pId = node.parent_id != null ? String(node.parent_id) : null;
      if (pId && nodeMap[pId] && pId !== String(node.id)) {
        nodeMap[pId].children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort threads (Oldest first) and roots (Newest first)
    roots.forEach(root => {
      const sortChildren = (node: any) => {
        if (node.children) {
          node.children.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          node.children.forEach(sortChildren);
        }
      };
      sortChildren(root);
    });

    return roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const comments = buildCommentTree(rawComments);

  const handleSubmitComment = async () => {
    if (!currentUser) return;
    if (!newComment.trim() && !selectedGif && !selectedImage) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const finalContent = selectedGif ? `${newComment.trim()}\n${selectedGif}`.trim() : newComment.trim();
      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      await api.post(
        endpoint,
        { content: finalContent, image_url: selectedImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      setSelectedGif(null);
      setSelectedImage(null);
      setIsFocused(false);
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number | string, content: string, image_url?: string | null) => {
    if (!currentUser) return;
    try {
      const token = await getToken();
      if (!token) return;
      const endpoint = resourceType === "project" ? `/projects/${resourceId}/comments` : `/posts/${resourceId}/comments`;
      await api.post(
        endpoint,
        { content, parent_id: parentId, image_url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      queryClient.invalidateQueries({ queryKey });
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply");
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

  const handleCommentDelete = async () => {
    if (!currentUser || !commentToDelete) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const endpoint = resourceType === "project"
        ? `/project-comments/${commentToDelete}`
        : `/comments/${commentToDelete}`;

      await api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      queryClient.invalidateQueries({ queryKey });
      onCommentAdded?.();
      setCommentToDelete(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderComment = (comment: CommentWithMeta, depth: number = 0) => (
    <CommentBlock
      key={comment.id}
      comment={comment}
      depth={depth}
      onReply={handleReply}
      onDelete={(id) => setCommentToDelete(id)}
      onImageClick={(url) => {
        setLightboxImage(url);
        setLightboxAuthor(comment.user);
        setIsLightboxOpen(true);
      }}
      resourceType={resourceType}
    />
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="loading-spinner" style={{
          width: "32px", height: "32px", border: "2px solid var(--border-hairline)",
          borderTopColor: "var(--text-primary)", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto"
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "20px", paddingBottom: "12px", borderBottom: "0.5px solid var(--border-hairline)"
      }}>
        <h3 style={{
          fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0,
        }}>
          Comments ({rawComments.length.toString().padStart(2, '0')})
        </h3>
      </div>

      {currentUser && (
        <div style={{ marginBottom: "32px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <img
            src={avatarUrl}
            alt={currentUser.fullName || "User"}
            style={{ width: "44px", height: "44px", borderRadius: "var(--radius-sm)", objectFit: "cover", border: "1px solid var(--border-hairline)", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            {selectedGif && (
              <div style={{
                position: "relative", width: "fit-content", marginBottom: "12px",
                borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border-hairline)",
                animation: "reactionFadeUp 0.15s ease-out"
              }}>
                <img src={selectedGif} alt="Selected GIF" style={{ maxHeight: "150px", display: "block" }} />
                <button
                  onClick={() => setSelectedGif(null)}
                  style={{
                    position: "absolute", top: "6px", right: "6px",
                    backgroundColor: "rgba(0,0,0,0.75)",
                    color: "#ffffff", border: "none", width: "26px", height: "26px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.15s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    backdropFilter: "blur(4px)",
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#000";
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.75)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                >
                  <FontAwesomeIcon icon={faXmark} style={{ fontSize: "14px" }} />
                </button>
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={submitting}
              style={{
                width: "100%", minHeight: isFocused ? "80px" : "40px", padding: "8px 0",
                border: "none", outline: "none", fontSize: "15px", fontWeight: 500,
                resize: "none", fontFamily: "inherit",
                color: "var(--text-primary)", backgroundColor: "transparent",
                borderRadius: "0px",
                borderBottom: isFocused ? "1px solid var(--text-primary)" : "0.5px solid var(--border-hairline)",
                transition: "border-color 0.2s"
              }}
            />

            <div style={{ position: "relative", marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "8px",
                    backgroundColor: isGifPickerOpen ? "var(--bg-hover)" : "transparent",
                    color: isGifPickerOpen ? "var(--text-primary)" : "var(--text-tertiary)",
                    border: "0.5px solid var(--border-hairline)", borderRadius: "100px",
                    cursor: "pointer", fontSize: "11px", fontWeight: 700,
                    textTransform: "uppercase", transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isGifPickerOpen) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-tertiary)";
                    }
                  }}
                >
                  <Gif size={18} weight={isGifPickerOpen ? "fill" : "bold"} />
                </button>

                {isGifPickerOpen && (
                  <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "12px", zIndex: 100 }}>
                    <GifPicker
                      onSelect={(gifUrl) => { setSelectedGif(gifUrl); setIsGifPickerOpen(false); }}
                      onClose={() => setIsGifPickerOpen(false)}
                    />
                  </div>
                )}

                <label style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "8px",
                  backgroundColor: "transparent", color: "var(--text-tertiary)",
                  border: "0.5px solid var(--border-hairline)", borderRadius: "100px",
                  cursor: "pointer", fontSize: "11px", fontWeight: 700,
                  textTransform: "uppercase", transition: "all 0.2s ease"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-tertiary)";
                  }}
                >
                  <ImageIcon size={18} weight={selectedImage ? "fill" : "bold"} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => { setIsFocused(false); setNewComment(""); setSelectedImage(null); setSelectedGif(null); }}
                  style={{ padding: "6px 12px", backgroundColor: "transparent", color: "var(--text-tertiary)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={(!newComment.trim() && !selectedImage && !selectedGif) || submitting || isUploading}
                  style={{
                    padding: "8px 24px",
                    backgroundColor: (newComment.trim() || selectedImage || selectedGif) && !submitting && !isUploading ? "var(--text-primary)" : "transparent",
                    color: (newComment.trim() || selectedImage || selectedGif) && !submitting && !isUploading ? "var(--bg-page)" : "var(--text-tertiary)",
                    border: "0.5px solid var(--border-hairline)", borderRadius: "100px",
                    cursor: (newComment.trim() || selectedImage || selectedGif) && !submitting && !isUploading ? "pointer" : "not-allowed",
                    fontWeight: 700, fontSize: "13px",
                    transition: "all 0.2s ease"
                  }}
                >
                  {submitting ? "..." : isUploading ? "Wait" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        {comments.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 40px", backgroundColor: "var(--bg-hover)",
            borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)",
          }}>
            <div style={{
              width: "48px", height: "48px", backgroundColor: "var(--bg-hover)",
              borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 24px",
              border: "0.5px solid var(--border-hairline)", color: "var(--text-primary)"
            }}>
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "28px" }} />
            </div>
            <div style={{
              fontSize: "16px", fontWeight: 700, color: "var(--text-primary)",
              marginBottom: "12px",
            }}>
              No replies yet
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500, maxWidth: "300px", margin: "0 auto" }}>
              Be the first to share your thoughts and start the conversation!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleCommentDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        isLoading={isDeleting}
      />

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={lightboxImage}
        postUrl={`${window.location.origin}/${resourceType}/${resourceId}`}
        author={lightboxAuthor ? {
          name: lightboxAuthor.name || "User",
          username: lightboxAuthor.username || "user",
          avatar_url: lightboxAuthor.avatar_url || null
        } : undefined}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
