import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faCode,
  faBold,
  faItalic,
  faHeading,
  faQuoteRight,
  faListUl,
  faLink,
  faEye,
  faEdit
} from "@fortawesome/free-solid-svg-icons";
import MentionInput from "./MentionInput";
import ContentRenderer from "./ContentRenderer";
import { normalizeLanguage } from "../utils/language";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const { getToken, isLoaded } = useClerkAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
      setImages([]);
      setLanguage("en");
      setIsSubmitting(false);
      setActiveTab("write");
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (!isOpen || activeTab !== "write") return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            insertMarkdown("**", "**");
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown("*", "*");
            break;
          case 'k':
            e.preventDefault();
            insertMarkdown("[", "](url)");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [isOpen, activeTab, content]);

  const insertMarkdown = (before: string, after: string = "", placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent =
      content.substring(0, start) +
      before + textToInsert + after +
      content.substring(end);

    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + before.length;
      const newCursorEnd = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  const insertBlockMarkdown = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;

    // Find the start of the current line
    const lastNewline = content.lastIndexOf("\n", start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newContent =
      content.substring(0, lineStart) +
      prefix +
      content.substring(lineStart);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxImages = 10;
    if (images.length + files.length > maxImages) {
      alert(`You can upload a maximum of ${maxImages} images`);
      return;
    }
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!isLoaded || !title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const hashtagRegex = /#(\w+)/g;
      const contentTags = content.match(hashtagRegex)?.map((tag) => tag.substring(1).toLowerCase()) || [];
      const allTags = [...new Set([...tags, ...contentTags])].slice(0, 10);
      const payload = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : null,
        tags: allTags.length > 0 ? allTags : null,
        language: normalizeLanguage(language),
      };
      await api.post("/posts", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new CustomEvent("postCreated"));
      onCreated();
      onClose();
    } catch (error: any) {
      console.error("Error creating post:", error);
      alert(`Failed to create post: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        zIndex: 10000,
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content-wrapper"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          animation: "modalSlideIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .toolbar-btn {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
          }
          .toolbar-btn:hover {
            background-color: #f1f5f9;
            color: #0f172a;
          }
          .tab-btn {
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }
          .tab-btn.active {
            color: #212121;
            border-bottom-color: #212121;
          }
          
          @media (max-width: 640px) {
            .modal-content-wrapper {
              max-height: 100vh !important;
              max-width: 100vw !important;
              height: 100% !important;
              width: 100% !important;
              border-radius: 25px !important;
              margin: 0 !important;
            }
            .modal-header {
              padding: 16px !important;
            }
            .modal-body {
              padding: 16px !important;
            }
            .modal-footer {
              padding: 12px 16px !important;
              flex-direction: column-reverse !important;
              gap: 8px !important;
            }
            .modal-footer button {
              width: 100% !important;
              padding: 12px !important;
            }
            .title-input {
              font-size: 20px !important;
            }
            .toolbar-container {
              gap: 2px !important;
              padding: 2px !important;
            }
            .toolbar-btn {
              width: 30px !important;
              height: 30px !important;
            }
            .divider {
              height: 16px !important;
              margin: 7px 2px !important;
            }
            .tags-label {
              font-size: 13px !important;
            }
            .tag-input {
              padding: 12px 14px !important;
              font-size: 13px !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="modal-header" style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>Create Post</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Title Input */}
          <input
            type="text"
            className="title-input"
            placeholder="Give your post a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              fontSize: "24px",
              fontWeight: 800,
              border: "none",
              outline: "none",
              padding: "0",
              color: "#0f172a",
              backgroundColor: "transparent",
            }}
          />

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #f1f5f9" }}>
            <button className={`tab-btn ${activeTab === "write" ? "active" : ""}`} onClick={() => setActiveTab("write")}>
              <FontAwesomeIcon icon={faEdit} style={{ marginRight: "6px" }} /> Write
            </button>
            <button className={`tab-btn ${activeTab === "preview" ? "active" : ""}`} onClick={() => setActiveTab("preview")}>
              <FontAwesomeIcon icon={faEye} style={{ marginRight: "6px" }} /> Preview
            </button>
          </div>

          {activeTab === "write" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Toolbar */}
              <div className="toolbar-container" style={{ display: "flex", gap: "4px", padding: "4px", backgroundColor: "#f8fafc", borderRadius: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <button className="toolbar-btn" title="Bold" onClick={() => insertMarkdown("**", "**")}><FontAwesomeIcon icon={faBold} /></button>
                <button className="toolbar-btn" title="Italic" onClick={() => insertMarkdown("*", "*")}><FontAwesomeIcon icon={faItalic} /></button>
                <button className="toolbar-btn" title="Heading" onClick={() => insertBlockMarkdown("### ")}><FontAwesomeIcon icon={faHeading} /></button>
                <div className="divider" style={{ width: "1px", height: "20px", backgroundColor: "#e2e8f0", margin: "0 4px" }} />
                <button className="toolbar-btn" title="Quote" onClick={() => insertBlockMarkdown("> ")}><FontAwesomeIcon icon={faQuoteRight} /></button>
                <button className="toolbar-btn" title="Bullet List" onClick={() => insertBlockMarkdown("- ")}><FontAwesomeIcon icon={faListUl} /></button>
                <div className="divider" style={{ width: "1px", height: "20px", backgroundColor: "#e2e8f0", margin: "0 4px" }} />
                <button className="toolbar-btn" title="Link" onClick={() => insertMarkdown("[", "](https://)")}><FontAwesomeIcon icon={faLink} /></button>
                <button className="toolbar-btn" title="Code" onClick={() => insertMarkdown("`", "`")}><FontAwesomeIcon icon={faCode} /></button>
                <button className="toolbar-btn" title="Code Block" onClick={() => insertMarkdown("\n```javascript\n", "\n```\n")}><FontAwesomeIcon icon={faCode} style={{ fontSize: "12px" }} /></button>
              </div>

              {/* Textarea */}
              <MentionInput
                ref={textareaRef}
                value={content}
                onChange={setContent}
                placeholder="Share your thoughts, code, or ideas... (Markdown supported)"
                minHeight="200px"
              />
            </div>
          ) : (
            <div style={{ minHeight: "200px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9", overflowY: "auto" }}>
              {content ? (
                <ContentRenderer content={content} />
              ) : (
                <div style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>Nothing to preview yet...</div>
              )}
            </div>
          )}

          {/* Images */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: "relative", width: "80px", height: "80px" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", fontSize: "12px", cursor: "pointer" }}>&times;</button>
              </div>
            ))}
            <label style={{ width: "80px", height: "80px", borderRadius: "12px", border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
              <FontAwesomeIcon icon={faImage} />
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            </label>
          </div>

          {/* Tags Section */}
          <div className="tags-section" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <label className="tags-label" style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Tags / Hashtags (Optional)</label>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#2563eb",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  #{tag}
                  <button
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: 0, lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <input
              type="text"
              className="tag-input"
              placeholder="Add tags... (Enter or comma)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const tag = tagInput.trim().toLowerCase().replace(/^#/, "");
                  if (tag && !tags.includes(tag) && tags.length < 10) {
                    setTags([...tags, tag]);
                    setTagInput("");
                  }
                }
              }}
              style={{
                width: "94%",
                padding: "10px 16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#f8fafc"
              }}
            />
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              {tags.length}/10 tags. Use #hashtag in your post to add them automatically.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={submit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background: "#212121",
              color: "white",
              fontWeight: 700,
              cursor: (!title.trim() || !content.trim() || isSubmitting) ? "not-allowed" : "pointer",
              opacity: (!title.trim() || !content.trim() || isSubmitting) ? 0.5 : 1
            }}
          >
            {isSubmitting ? "Posting..." : "Post it"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
