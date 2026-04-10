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
  faPaperclip
} from "@fortawesome/free-solid-svg-icons";
import MentionInput from "./MentionInput";
import ContentRenderer from "./ContentRenderer";
import { normalizeLanguage } from "../utils/language";
import { validateImageSize, validateFileSize } from "../constants/upload";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; data: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const { getToken, isLoaded } = useClerkAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charLimit = 2000;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
      setImages([]);
      setAttachments([]);
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
        // Compress image before adding string to state
        const compressedBase64 = await compressImage(file, 1200, 1200, 0.7);
        setImages((prev) => [...prev, compressedBase64]);
      } catch (error) {
        console.error("Compression error:", error);
        // Fallback to original if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (attachments.length >= 1) {
      alert("You can only upload one file per post");
      return;
    }

    const file = files[0];
    const sizeError = validateFileSize(file);
    if (sizeError) {
      alert(sizeError);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachments([{
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!isLoaded || !content.trim() || content.length > charLimit) return;
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
        attachments: attachments.length > 0 ? attachments : null,
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
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 10000,
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
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "none",
          border: "0.5px solid var(--border-hairline)",
          overflow: "hidden",
          animation: "modalSlideIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .toolbar-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justifyContent: center;
            border-radius: var(--radius-sm);
            border: 0.5px solid transparent;
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s;
          }
          .toolbar-btn:hover {
            background-color: var(--bg-hover);
            color: var(--text-primary);
            border-color: var(--border-hairline);
          }
          .tab-btn {
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            font-family: var(--font-main);
            border: none;
            background: transparent;
            color: var(--text-tertiary);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.15s;
          }
          .tab-btn.active {
            color: var(--text-primary);
            border-bottom-color: var(--text-primary);
          }
          
          @media (max-width: 640px) {
            .modal-content-wrapper {
              max-height: 100vh !important;
              max-width: 100vw !important;
              height: 100% !important;
              width: 100% !important;
              border-radius: var(--radius-lg) !important;
              border: none !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="modal-header" style={{ padding: "24px 32px", borderBottom: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Create post</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: "32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Title Input */}
          <input
            type="text"
            className="title-input"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              fontSize: "24px",
              fontWeight: 700,
              border: "none",
              outline: "none",
              padding: "0",
              color: "var(--text-primary)",
              backgroundColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          />

          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "0.5px solid var(--border-hairline)" }}>
            <button style={{ borderRadius: "0px" }} className={`tab-btn ${activeTab === "write" ? "active" : ""}`} onClick={() => setActiveTab("write")}>
              Write
            </button>
            <button style={{ borderRadius: "0px" }} className={`tab-btn ${activeTab === "preview" ? "active" : ""}`} onClick={() => setActiveTab("preview")}>
              Preview
            </button>
          </div>

          {activeTab === "write" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Toolbar */}
               <div className="toolbar-container" style={{ display: "flex", gap: "4px", padding: "6px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-hairline)", flexWrap: "wrap", alignItems: "center" }}>
                <button className="toolbar-btn" title="Bold" onClick={() => insertMarkdown("**", "**")}><FontAwesomeIcon icon={faBold} /></button>
                <button className="toolbar-btn" title="Italic" onClick={() => insertMarkdown("*", "*")}><FontAwesomeIcon icon={faItalic} /></button>
                <button className="toolbar-btn" title="Heading" onClick={() => insertBlockMarkdown("### ")}><FontAwesomeIcon icon={faHeading} /></button>
                <div className="divider" style={{ width: "1px", height: "18px", backgroundColor: "var(--border-hairline)", margin: "0 4px" }} />
                <button className="toolbar-btn" title="Quote" onClick={() => insertBlockMarkdown("> ")}><FontAwesomeIcon icon={faQuoteRight} /></button>
                <button className="toolbar-btn" title="Bullet List" onClick={() => insertBlockMarkdown("- ")}><FontAwesomeIcon icon={faListUl} /></button>
                <div className="divider" style={{ width: "1px", height: "18px", backgroundColor: "var(--border-hairline)", margin: "0 4px" }} />
                <button className="toolbar-btn" title="Link" onClick={() => insertMarkdown("[", "](https://)")}><FontAwesomeIcon icon={faLink} /></button>
                <button className="toolbar-btn" title="Code" onClick={() => insertMarkdown("`", "`")}><FontAwesomeIcon icon={faCode} /></button>
                <button className="toolbar-btn" title="Code Block" onClick={() => insertMarkdown("\n```javascript\n", "\n```\n")}><FontAwesomeIcon icon={faCode} style={{ fontSize: "12px" }} /></button>
                <div className="divider" style={{ width: "1px", height: "18px", backgroundColor: "var(--border-hairline)", margin: "0 4px" }} />
                {attachments.length === 0 && (
                  <label className="toolbar-btn" title="Attach file" style={{ cursor: "pointer" }}>
                    <FontAwesomeIcon icon={faPaperclip} />
                    <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                )}
              </div>

              {/* Textarea */}
              <MentionInput
                ref={textareaRef}
                value={content}
                onChange={setContent}
                placeholder="Share your thoughts, code, or ideas... (Markdown supported)"
                minHeight="240px"
              />
            </div>
          ) : (
             <div style={{ minHeight: "240px", padding: "24px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-hairline)", overflowY: "auto" }}>
              {content ? (
                <ContentRenderer content={content} />
              ) : (
                <div style={{ color: "var(--text-tertiary)", textAlign: "center", marginTop: "80px", fontSize: "13px", fontWeight: 500 }}>No preview available</div>
              )}
            </div>
          )}

          {/* Images */}
           <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: "relative", width: "100px", height: "100px" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }} />
                <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: "4px", right: "4px", width: "24px", height: "24px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-page)", color: "#ef4444", border: "0.5px solid var(--border-hairline)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
              </div>
            ))}
            <label style={{ width: "100px", height: "100px", borderRadius: "var(--radius-sm)", border: "0.5px dashed var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-tertiary)", backgroundColor: "var(--bg-hover)", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
              <FontAwesomeIcon icon={faImage} />
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            </label>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)" }}>Attachments ({attachments.length})</label>
              {attachments.map((file, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <FontAwesomeIcon icon={faPaperclip} style={{ color: "var(--text-tertiary)" }} />
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button onClick={() => removeAttachment(idx)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "4px" }}>&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* Tags Section */}
          <div className="tags-section" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="tags-label" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-tertiary)" }}>Tags / Hashtags (Optional)</label>

             <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "0.5px solid var(--border-hairline)",
                  }}
                >
                  #{tag}
                  <button
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "16px", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
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
                width: "100%",
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid var(--border-hairline)",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
                transition: "all 0.15s ease",
              }}
              onFocus={e => e.currentTarget.style.backgroundColor = "var(--bg-page)"}
              onBlur={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            />
             <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>
              {tags.length}/10 tags. Use #hashtag in content to auto-add.
            </div>
          </div>
        </div>

        {/* Footer */}
         <div className="modal-footer" style={{ padding: "24px 32px", borderTop: "0.5px solid var(--border-hairline)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px" }}>
          {content.length > 0 && (
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              color: content.length > charLimit ? "#ef4444" : "var(--text-tertiary)",
            }}>
              {content.length}/{charLimit}
            </div>
          )}
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-hairline)", background: "transparent", color: "var(--text-secondary)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>Cancel</button>
          <button
            onClick={submit}
            disabled={(!content.trim() && images.length === 0 && attachments.length === 0) || isSubmitting || content.length > charLimit}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--text-primary)",
              color: "var(--bg-page)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: (!content.trim() && images.length === 0 && attachments.length === 0) || isSubmitting || content.length > charLimit ? "not-allowed" : "pointer",
              opacity: (!content.trim() && images.length === 0 && attachments.length === 0) || isSubmitting || content.length > charLimit ? 0.3 : 1,
              transition: "all 0.15s ease"
            }}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
