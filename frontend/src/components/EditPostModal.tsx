import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, AttachmentIcon } from "@hugeicons/core-free-icons";
import { normalizeLanguage } from "../utils/language";
import { validateImageSize } from "../constants/upload";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  post: {
    id: number;
    title: string;
    content: string;

    images?: string[] | null;
    attachments?: { name: string; url?: string; data?: string; size: number }[] | null;
    language?: "en" | "ar";
  };
}

export default function EditPostModal({ isOpen, onClose, onUpdated, post }: EditPostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; url?: string; data?: string; size: number }[]>([]);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();
  const charLimit = 2000;

  useEffect(() => {
    if (isOpen && post) {
      setTitle(post.title || "");
      setContent(post.content || "");

      setImages(post.images || []);
      setAttachments(post.attachments || []);
      setLanguage(normalizeLanguage(post.language));
    }
  }, [isOpen, post]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 10;
    if (images.length + files.length > maxImages) {
      alert(`You can upload a maximum of ${maxImages} images`);
      return;
    }

    for (const file of Array.from(files)) {
      const sizeError = validateImageSize(file);
      if (sizeError) {
        alert(sizeError);
        e.target.value = "";
        return;
      }
    }

    const { compressImage } = await import("../utils/image");

    Array.from(files).forEach(async (file) => {
      try {
        const compressedBase64 = await compressImage(file, 1200, 1200, 0.7);
        setImages((prev) => [...prev, compressedBase64]);
      } catch (error) {
        console.error("Compression error:", error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!isLoaded) {
      alert("Please sign in to edit post");
      return;
    }

    // title is optional
    if (!content.trim() || content.length > charLimit) {
      alert("Content must be 280 characters or less");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to edit post");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : null,
        attachments: attachments.length > 0 ? attachments : null,
        language: normalizeLanguage(language),
      };

      console.log("Submitting edit payload:", payload);

      await api.put(`/posts/${post.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      let errorMessage = "Failed to update post";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string } } };
        const errorData = axiosError.response?.data;

        if (errorData) {
          if (errorData.details) {
            errorMessage = `${errorData.error || "Failed to update post"}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Failed to update post: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .modal-backdrop {
          animation: modalFadeIn 0.15s ease-out;
        }
        .modal-dialog {
          animation: modalSlideIn 0.2s ease-out;
        }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          overflowY: "auto",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-dialog"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 32px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-xl)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "100%",
              overflow: "hidden",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #e4e7eb",
                flexShrink: 0,
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1a1a1a" }}>
                Edit Post
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  fontWeight: 300,
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  transition: "all 0.15s",
                }}
              >
                ×
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "20px",
                overflowY: "auto",
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post Title"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #e4e7eb",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "18px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#212121";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 33, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e4e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
                autoFocus
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                style={{
                  width: "100%",
                  minHeight: "150px",
                  padding: "12px 16px",
                  border: "1px solid #e4e7eb",
                  borderRadius: "var(--radius-md)",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#212121";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 33, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e4e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              {/* Image Upload Section */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Images (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  id="edit-image-upload"
                />
                <label
                  htmlFor="edit-image-upload"
                  style={{
                    display: "inline-block",
                    padding: "10px 16px",
                    backgroundColor: "#f8fafc",
                    border: "2px dashed #212121",
                    borderRadius: "var(--radius-md)",
                    color: "#212121",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <HugeiconsIcon icon={Image01Icon} style={{ marginRight: "8px" }} />
                  Upload Images
                </label>
                {images.length > 0 && (
                  <div style={{
                    marginTop: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "8px",
                  }}>
                    {images.map((img, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid #e4e7eb",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(220, 38, 38, 0.9)",
                            border: "none",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments Upload Section */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Attachments
                </label>
                {attachments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid #e4e7eb"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <HugeiconsIcon icon={AttachmentIcon} style={{ color: "#64748b" }} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments([])}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
                    No file attached. Use the Create Post modal to add a file.
                  </div>
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "16px",
                padding: "16px 20px",
                borderTop: "1px solid #e4e7eb",
                flexShrink: 0,
              }}
            >
              {content.length > 0 && (
                <div style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: content.length > charLimit ? "#ef4444" : "var(--text-tertiary)",
                }}>
                  {content.length.toString().padStart(3, '0')}/{charLimit}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#212121",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "var(--radius-sm)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isLoaded || !content.trim() || isSubmitting || content.length > charLimit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isLoaded && content.trim() && !isSubmitting && content.length <= charLimit ? "#212121" : "#e4e7eb",
                  border: "none",
                  color: isLoaded && content.trim() && !isSubmitting && content.length <= charLimit ? "#ffffff" : "#94a3b8",
                  borderRadius: "var(--radius-sm)",
                  cursor: isLoaded && content.trim() && !isSubmitting && content.length <= charLimit ? "pointer" : "not-allowed",
                  fontSize: "15px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

