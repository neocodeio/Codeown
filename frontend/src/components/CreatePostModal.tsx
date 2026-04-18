import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  SourceCodeIcon,
  TextBoldIcon,
  TextItalicIcon,
  Heading01Icon,
  Link01Icon,
  Attachment01Icon,
  Rocket01Icon,
  ArrowDown01Icon,
  MinusPlusCircle01Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";
import MentionInput from "./MentionInput";
import ContentRenderer from "./ContentRenderer";
import { normalizeLanguage } from "../utils/language";
import { validateImageSize, validateFileSize } from "../constants/upload";
// Removed phosphor-react import
import { useUserProjects } from "../hooks/useUserProjects";
import { useClerkUser } from "../hooks/useClerkUser";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialProjectId?: number | string | null;
}

export default function CreatePostModal({ isOpen, onClose, onCreated, initialProjectId }: CreatePostModalProps) {
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
  const { user } = useClerkUser();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | string | null>(initialProjectId || null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const charLimit = 2000;

  // 1. Fetch User's Projects for Selection using the shared hook
  const { projects: userProjects = [] } = useUserProjects(user?.id || null, isOpen);

  const selectedProject = userProjects.find((p: any) => p.id == selectedProjectId);

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
      setSelectedProjectId(initialProjectId || null);
      setIsProjectMenuOpen(false);
    }
  }, [isOpen, initialProjectId]);

  // Click outside to close project menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        project_id: selectedProjectId || null,
      };
      const res = await api.post("/posts", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new CustomEvent("postCreated", { detail: res.data }));
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
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          borderRadius: "var(--radius-md)",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-hairline)",
          overflow: "hidden",
          animation: "modalEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalEnter {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .editor-toolbar-btn {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: var(--text-tertiary);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
          }
          .editor-toolbar-btn:hover {
            background-color: var(--bg-hover);
            color: var(--text-primary);
            transform: translateY(0);
          }
          .tab-trigger {
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 100px;
            border: none;
            background: transparent;
            color: var(--text-tertiary);
            cursor: pointer;
            transition: all 0.2s;
          }
          .tab-trigger.active {
            background-color: var(--text-primary);
            color: var(--bg-page);
          }
          
          @media (max-width: 640px) {
            .modal-content-wrapper {
              max-height: 100vh !important;
              max-width: 100vw !important;
              height: 100% !important;
              width: 100% !important;
              border-radius: 0 !important;
              border: none !important;
              margin: 0 !important;
            }
          }

          .mention-input-custom textarea {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            font-size: 16px !important;
            line-height: 1.6 !important;
            color: var(--text-primary) !important;
          }
          
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* Header - Integrated with Tabs */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px", backgroundColor: "var(--bg-hover)", padding: "4px", borderRadius: "var(--radius-pill)" }}>
            <button className={`tab-trigger ${activeTab === "write" ? "active" : ""}`} onClick={() => setActiveTab("write")}>Write</button>
            <button className={`tab-trigger ${activeTab === "preview" ? "active" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "28px",
              fontWeight: 300,
              lineHeight: 1,
              padding: "0 0 3px 0",
              color: "var(--text-tertiary)",
              background: "none",
              border: "none",
              outline: "none"
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }} className="hide-scrollbar">
          {activeTab === "write" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Title Section - Minimalist */}
              <input
                type="text"
                placeholder="Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "20px",
                  fontWeight: 700,
                  border: "none",
                  outline: "none",
                  padding: "0",
                  color: "var(--text-primary)",
                  backgroundColor: "transparent",
                  letterSpacing: "-0.01em",
                }}
              />

              {/* Textarea */}
              <div className="mention-input-custom">
                <MentionInput
                  ref={textareaRef}
                  value={content}
                  onChange={setContent}
                  placeholder="Share your raw progress, ship notes, or ideas..."
                  minHeight="200px"
                />
              </div>
            </div>
          ) : (
            <div style={{ minHeight: "260px", padding: "0", borderRadius: "0", overflowY: "auto" }}>
              {content ? (
                <ContentRenderer content={content} />
              ) : (
                <div style={{ color: "var(--text-tertiary)", textAlign: "center", marginTop: "80px", fontSize: "14px", fontWeight: 500 }}>No preview available</div>
              )}
            </div>
          )}

          {/* Media & Attachments Section - Horizontal Scrollable Row */}
          {(images.length > 0 || attachments.length > 0) && (
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }} className="hide-scrollbar">
              {images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", minWidth: "120px", width: "120px", height: "120px", flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-hairline)" }} />
                  <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: "6px", right: "6px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", cursor: "pointer" }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              ))}
              {attachments.map((file, idx) => (
                <div key={idx} style={{ position: "relative", minWidth: "160px", padding: "12px", backgroundColor: "var(--bg-hover)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <HugeiconsIcon icon={Attachment01Icon} size={18} style={{ color: "var(--text-tertiary)" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button onClick={() => removeAttachment(idx)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags - Compact Row */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map((tag, idx) => (
                <span key={idx} style={{ padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "rgba(var(--text-primary-rgb), 0.05)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  #{tag}
                  <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} style={{ border: "none", background: "none", padding: 0, color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Integrated Tool Bar - Modern & Sticky-bottom feel inside body */}
          {activeTab === "write" && (
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "4px", borderTop: "1px solid var(--border-hairline)", paddingTop: "16px", flexWrap: "wrap" }}>
              <label className="editor-toolbar-btn" title="Add Image">
                <HugeiconsIcon icon={Image01Icon} size={18} />
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
              <label className="editor-toolbar-btn" title="Attach File">
                <HugeiconsIcon icon={Attachment01Icon} size={18} />
                <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>
              <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border-hairline)", margin: "0 6px" }} />
              <button className="editor-toolbar-btn" title="Bold" onClick={() => insertMarkdown("**", "**")}><HugeiconsIcon icon={TextBoldIcon} size={18} /></button>
              <button className="editor-toolbar-btn" title="Italic" onClick={() => insertMarkdown("*", "*")}><HugeiconsIcon icon={TextItalicIcon} size={18} /></button>
              <button className="editor-toolbar-btn" title="Heading" onClick={() => insertBlockMarkdown("### ")}><HugeiconsIcon icon={Heading01Icon} size={18} /></button>
              <button className="editor-toolbar-btn" title="Code" onClick={() => insertMarkdown("`", "`")}><HugeiconsIcon icon={SourceCodeIcon} size={18} /></button>
              <button className="editor-toolbar-btn" title="Link" onClick={() => insertMarkdown("[", "](https://)")}><HugeiconsIcon icon={Link01Icon} size={18} /></button>

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="#tag"
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
                  style={{ width: "80px", fontSize: "12px", border: "none", background: "transparent", outline: "none", color: "var(--text-primary)", fontWeight: 600 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Project Selection & Post Button */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-hover-light)" }}>
          <div ref={projectMenuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "var(--radius-pill)",
                border: selectedProjectId ? "1.5px solid var(--text-primary)" : "1px solid var(--border-hairline)",
                backgroundColor: "var(--bg-card)",
                color: selectedProjectId ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {selectedProject?.cover_image ? (
                <img src={selectedProject.cover_image} style={{ width: "16px", height: "16px", borderRadius: "4px", objectFit: "cover" }} alt="" />
              ) : (
                <HugeiconsIcon icon={Rocket01Icon} size={14} />
              )}
              <span style={{ maxWidth: "100px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedProject?.name || "Target Project"}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={12}
                style={{
                  transform: isProjectMenuOpen ? "rotate(-180deg)" : "none",
                  transition: "transform 0.2s ease"
                }}
              />
            </button>

            {isProjectMenuOpen && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: 0,
                width: "220px",
                backgroundColor: "var(--bg-page)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-lg)",
                padding: "6px",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                <button
                  onClick={() => { setSelectedProjectId(null); setIsProjectMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "var(--radius-xs)", border: "none", backgroundColor: !selectedProjectId ? "var(--bg-hover)" : "transparent", color: "var(--text-primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                >
                  <HugeiconsIcon icon={MinusPlusCircle01Icon} size={16} /> None
                </button>
                {userProjects.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => { setSelectedProjectId(project.id); setIsProjectMenuOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "var(--radius-xs)", border: "none", backgroundColor: selectedProjectId === project.id ? "var(--bg-hover)" : "transparent", color: "var(--text-primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {project.cover_image ? <img src={project.cover_image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <HugeiconsIcon icon={Rocket01Icon} size={12} />}
                    </div>
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: content.length > charLimit ? "#ef4444" : "var(--text-tertiary)" }}>
              {content.length}/{charLimit}
            </div>
            <button
              onClick={submit}
              disabled={(!content.trim() && images.length === 0 && attachments.length === 0) || isSubmitting || content.length > charLimit}
              style={{
                padding: "10px 24px",
                borderRadius: "var(--radius-pill)",
                border: "none",
                background: "var(--text-primary)",
                color: "var(--bg-page)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: ((!content.trim() && images.length === 0 && attachments.length === 0) || isSubmitting || content.length > charLimit) ? 0.3 : 1,
              }}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
