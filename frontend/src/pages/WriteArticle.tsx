import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Image01Icon,
  LoadingIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "react-toastify";
import { useWindowSize } from "../hooks/useWindowSize";
import RecommendedUsersSidebar from "../components/RecommendedUsersSidebar";

export default function WriteArticle() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isDesktop = width >= 1200;

  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  };

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
       contentRef.current.focus();
       setContent(contentRef.current.innerHTML);
       updateFormatState();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      if (textNode.nodeType === Node.TEXT_NODE) {
        const textBeforeCursor = textNode.textContent?.substring(0, range.startOffset) || '';
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1];
        
        const urlMatch = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i;
        if (urlMatch.test(lastWord)) {
          const urlToLink = lastWord.startsWith('www.') ? `https://${lastWord}` : lastWord;
          
          const startOffset = range.startOffset - lastWord.length;
          const newRange = document.createRange();
          newRange.setStart(textNode, startOffset);
          newRange.setEnd(textNode, range.startOffset);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          document.execCommand('createLink', false, urlToLink);
          selection.collapseToEnd();
          
          if (contentRef.current) {
            setContent(contentRef.current.innerHTML);
          }
        }
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const token = await getToken();
      const { data } = await api.post("/upload/image", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        },
      });

      setCoverImage(data.url);
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerInlineImageUpload = () => {
    // Save current cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0);
    }

    if (contentRef.current) {
       const imgCount = contentRef.current.querySelectorAll('img').length;
       if (imgCount >= 4) {
          toast.error("You can only add up to 4 photos in the article.");
          return;
       }
    }
    
    inlineImageInputRef.current?.click();
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Image size must be less than 1MB");
      return;
    }

    setIsUploadingInline(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const token = await getToken();
      const { data } = await api.post("/upload/image", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        },
      });

      if (contentRef.current) {
         contentRef.current.focus();
         if (savedRangeRef.current) {
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(savedRangeRef.current);
         }
         
         const imgHtml = `<br><img src="${data.url}" style="max-width: 100%; border-radius: 12px; margin: 16px 0;" alt="Article Image" /><br>`;
         const success = document.execCommand('insertHTML', false, imgHtml);
         
         if (!success) {
            setContent(prev => prev + imgHtml);
         } else {
            setContent(contentRef.current.innerHTML);
         }
      }
      toast.success("Image added to article!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingInline(false);
      if (inlineImageInputRef.current) {
        inlineImageInputRef.current.value = '';
      }
    }
  };

  const handlePublish = async () => {
    // Get plain text length for validation
    const plainText = contentRef.current?.innerText || "";
    
    if (!title.trim() || !plainText.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (plainText.length > 5000) {
      toast.error("Content is too long (max 5000 chars)");
      return;
    }

    setIsPublishing(true);
    try {
      // Final 4-photo limit check before publishing
      if (contentRef.current) {
         const imgCount = contentRef.current.querySelectorAll('img').length;
         if (imgCount > 4) {
            toast.error("Articles are limited to a maximum of 4 photos.");
            setIsPublishing(false);
            return;
         }
      }

      const token = await getToken();
      await api.post("/articles", {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: contentRef.current?.innerHTML || content.trim(),
        cover_image: coverImage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Article published!");
      navigate("/articles");
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish article");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      width: "100%",
      padding: 0,
    }}>
      {/* Main Content Column */}
      <div style={{
        flex: 1,
        maxWidth: isDesktop ? "var(--feed-width)" : "100%",
        padding: "0",
        borderLeft: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        borderRight: isDesktop ? "0.5px solid var(--border-hairline)" : "none",
        minHeight: "100vh",
        position: "relative"
      }}>
        {/* Sticky Top Header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--bg-header)",
          backdropFilter: "blur(24px)",
          borderBottom: "0.5px solid var(--border-hairline)",
          padding: "0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "58px", // Standard header height
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "15px",
              padding: 0,
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            Back
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing || !title.trim() || !(contentRef.current?.innerText.trim())}
            style={{
              padding: "8px 18px",
              backgroundColor: (title.trim() && (contentRef.current?.innerText.trim())) ? "#1a1a1b" : "var(--bg-hover)",
              color: (title.trim() && (contentRef.current?.innerText.trim())) ? "#ffffff" : "var(--text-tertiary)",
              border: "none",
              borderRadius: "100px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: (title.trim() && (contentRef.current?.innerText.trim()) && !isPublishing) ? "pointer" : "not-allowed",
              transition: "all 0.2s"
            }}
          >
            {isPublishing ? "Publishing..." : "Publish Article"}
          </button>
        </header>

        {/* Editor Container */}
        <div style={{ padding: isDesktop ? "40px 32px" : "24px 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Title Input */}
          <textarea
            placeholder="New article title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            style={{
              width: "100%",
              fontSize: "42px",
              fontWeight: 900,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              resize: "none",
              lineHeight: "1.2",
              letterSpacing: "-0.03em"
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          {/* Subtitle Input */}
          <textarea
            placeholder="Add a subtitle (optional)..."
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={1}
            style={{
              width: "100%",
              fontSize: "22px",
              fontWeight: 500,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              resize: "none",
              lineHeight: "1.4",
              letterSpacing: "-0.01em"
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          {/* Featured Image Studio */}
          <div style={{ margin: "8px 0 16px 0" }}>
             {coverImage ? (
               <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: "0.5px solid var(--border-hairline)" }}>
                 <img src={coverImage} alt="Cover" style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }} />
                 <button
                   onClick={() => setCoverImage(null)}
                   style={{
                     position: "absolute",
                     top: "16px",
                     right: "16px",
                     backgroundColor: "rgba(0,0,0,0.6)",
                     color: "#fff",
                     border: "none",
                     borderRadius: "50%",
                     width: "32px",
                     height: "32px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     backdropFilter: "blur(4px)"
                   }}
                 >
                   ✕
                 </button>
               </div>
             ) : (
               <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    height: "140px",
                    border: "0.5px solid var(--border-hairline)",
                    borderRadius: "16px",
                    backgroundColor: "var(--bg-hover)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(var(--text-primary-rgb), 0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
               >
                 {isUploading ? (
                   <HugeiconsIcon icon={LoadingIcon} size={28} className="spin" />
                 ) : (
                   <>
                     <div style={{ padding: "12px", backgroundColor: "var(--bg-page)", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                       <HugeiconsIcon icon={Image01Icon} size={24} />
                     </div>
                     <span style={{ fontSize: "14px", fontWeight: 600 }}>Add featured image <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(1200x630px recommended)</span></span>
                   </>
                 )}
               </button>
             )}
             <input
               type="file"
               ref={fileInputRef}
               style={{ display: "none" }}
               accept="image/*"
               onChange={handleImageUpload}
             />
          </div>

          {/* Premium Tool Palette */}
          <div style={{
            display: "flex",
            gap: "16px",
            padding: "10px 16px",
            backgroundColor: "var(--bg-page)",
            borderRadius: "12px",
            color: "var(--text-secondary)",
            alignItems: "center",
            border: "0.5px solid var(--border-hairline)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
          }}>
             <button 
                onClick={() => execCmd('bold')}
                title="Bold" 
                style={{ 
                  fontWeight: 800, 
                  cursor: "pointer", 
                  fontSize: "15px", 
                  background: isBold ? "rgba(59, 130, 246, 0.1)" : "none", 
                  color: isBold ? "#3b82f6" : "inherit", 
                  border: "none", 
                  padding: "4px 8px", 
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => !isBold && (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
                onMouseLeave={(e) => !isBold && (e.currentTarget.style.backgroundColor = "transparent")}
             >B</button>
             
             <button 
                onClick={() => execCmd('italic')}
                title="Italic" 
                style={{ 
                  fontStyle: "italic", 
                  cursor: "pointer", 
                  fontSize: "15px", 
                  fontFamily: "serif", 
                  background: isItalic ? "rgba(59, 130, 246, 0.1)" : "none", 
                  color: isItalic ? "#3b82f6" : "inherit", 
                  border: "none", 
                  padding: "4px 8px", 
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => !isItalic && (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
                onMouseLeave={(e) => !isItalic && (e.currentTarget.style.backgroundColor = "transparent")}
             >I</button>
             
             <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border-hairline)" }} />
             
             <button
                onClick={triggerInlineImageUpload}
                disabled={isUploadingInline}
                title="Add Image" 
                style={{ 
                   cursor: isUploadingInline ? "not-allowed" : "pointer", 
                   display: "flex", 
                   alignItems: "center", 
                   background: "none", 
                   border: "none", 
                   color: "inherit", 
                   padding: "6px 8px", 
                   borderRadius: "4px",
                   opacity: isUploadingInline ? 0.5 : 1
                }}
                onMouseEnter={(e) => !isUploadingInline && (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
                onMouseLeave={(e) => !isUploadingInline && (e.currentTarget.style.backgroundColor = "transparent")}
             >
                {isUploadingInline ? <HugeiconsIcon icon={LoadingIcon} size={18} className="spin" /> : <HugeiconsIcon icon={Image01Icon} size={18} />}
             </button>
             
             <input
               type="file"
               ref={inlineImageInputRef}
               style={{ display: "none" }}
               accept="image/*"
               onChange={handleInlineImageUpload}
             />
             <div style={{ flex: 1 }} />
             <div style={{ 
               fontSize: "12px", 
               fontWeight: 700, 
               color: (contentRef.current?.innerText.length || 0) > 4800 ? "#ef4444" : "var(--text-tertiary)",
               letterSpacing: "0.02em"
             }}>
               {contentRef.current?.innerText.length || 0} <span style={{ opacity: 0.5 }}>/ 5000</span>
             </div>
          </div>

          {/* Body Content Editor */}
          <div
            ref={contentRef}
            contentEditable
            onInput={() => setContent(contentRef.current?.innerHTML || "")}
            onKeyDown={handleKeyDown}
            onKeyUp={updateFormatState}
            onMouseUp={updateFormatState}
            data-placeholder="Start writing your article..."
            className="rich-text-editor"
            style={{
              width: "100%",
              minHeight: "500px",
              fontSize: "18px",
              lineHeight: "1.7",
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.01em",
              paddingBottom: "100px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      {isDesktop && (
        <aside style={{
          width: "var(--sidebar-width)",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          // The vertical line is shared with the main content's borderRight
        }}>
          <RecommendedUsersSidebar />
        </aside>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        
        /* Empty contentEditable placeholder styling */
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
          display: block; // For Firefox
        }
        /* Style links dynamically inserted by user */
        .rich-text-editor a {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
