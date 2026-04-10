import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Import common languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import LinkPreview from "./LinkPreview";

interface ContentRendererProps {
  content: string;
  fontSize?: string;
}

export const CodeBlock = ({ language, code }: { language: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langClass = Prism.languages[language] ? `language-${language}` : "language-markdown";
  const hasHeader = language && language !== "plaintext";

  return (
    <div style={{ margin: "12px 0", position: "relative" }}>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: hasHeader ? "6px" : "10px",
          right: "12px",
          zIndex: 10,
          background: "transparent",
          border: "none",
          color: copied ? "#4ade80" : "#a1a1aa",
          cursor: "pointer",
          fontSize: "14px",
          transition: "color 0.2s"
        }}
        title="Copy code"
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
      </button>

      {hasHeader && (
        <div
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "6px 12px",
            borderTopLeftRadius: "15px",
            borderTopRightRadius: "15px",
            fontSize: "12px",
            fontFamily: "monospace",
            borderBottom: "1px solid #3d3d3d",
          }}
        >
          {language}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: "16px",
          backgroundColor: "#2d2d2d",
          borderRadius: hasHeader ? "0 0 15px 15px" : "15px",
          overflow: "auto",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        <code className={langClass}>{code}</code>
      </pre>
    </div>
  );
};

export default function ContentRenderer({ content, fontSize = "16px" }: ContentRendererProps) {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    try {
      Prism.highlightAllUnder(contentRef.current);
    } catch (err) {
      console.error("Prism highlight error:", err);
    }
  }, [content]);

  const handleMentionClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/${username.toLowerCase()}`);
  };

  const parseContent = (text: string) => {
    const elements: (string | React.JSX.Element)[] = [];
    let key = 0;
    let firstUrl: string | null = null;

    // Split text into lines to handle block-level elements like headings and lists
    const lines = (text || "").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block detector (simple version for line-by-line processing)
      if (line.startsWith("```")) {
        let codeBlockLines: string[] = [];
        const language = line.slice(3).trim() || "plaintext";
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeBlockLines.push(lines[i]);
          i++;
        }
        elements.push(<CodeBlock key={`cb-${key++}`} language={language} code={codeBlockLines.join("\n")} />);
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        elements.push(<h1 key={`h1-${key++}`} style={{ fontSize: "1.5em", margin: "16px 0 8px 0", fontWeight: 700 }}>{parseInline(line.slice(2))}</h1>);
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<h2 key={`h2-${key++}`} style={{ fontSize: "1.3em", margin: "14px 0 6px 0", fontWeight: 700 }}>{parseInline(line.slice(3))}</h2>);
        continue;
      }
      if (line.startsWith("### ")) {
        elements.push(<h3 key={`h3-${key++}`} style={{ fontSize: "1.1em", margin: "12px 0 4px 0", fontWeight: 700 }}>{parseInline(line.slice(4))}</h3>);
        continue;
      }

      // Quote
      if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={`q-${key++}`} style={{ borderLeft: "4px solid var(--border-hairline)", paddingLeft: "16px", color: "var(--text-secondary)", fontStyle: "italic", margin: "12px 0" }}>
            {parseInline(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // List item
      if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <div key={`li-${key++}`} style={{ display: "flex", gap: "8px", margin: "4px 0 4px 12px" }}>
            <span>•</span>
            <div>{parseInline(line.slice(2))}</div>
          </div>
        );
        continue;
      }

      // Normal paragraph (with inline parsing)
      if (line.trim() === "") {
        elements.push(<br key={`br-${key++}`} />);
      } else {
        elements.push(<div key={`p-${key++}`} style={{ marginBottom: "8px" }}>{parseInline(line)}</div>);
      }
    }

    if (firstUrl) {
      elements.push(<LinkPreview key={`lp-${key++}`} url={firstUrl} />);
    }

    return elements;

    function parseInline(inlineText: string) {
      let parts: (string | React.JSX.Element)[] = [inlineText];

      // Bold (**text**)
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /\*\*([^*]+)\*\*/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          res.push(<strong key={`b-${key++}`}>{match[1]}</strong>);
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      // Italic (*text*)
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /\*([^*]+)\*/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          res.push(<em key={`i-${key++}`}>{match[1]}</em>);
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      // Inline Code (`text`)
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /`([^`]+)`/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          res.push(
            <code key={`ic-${key++}`} style={{ backgroundColor: "var(--bg-hover)", padding: "2px 6px", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", border: "0.5px solid var(--border-hairline)", fontSize: "0.9em", fontFamily: "var(--font-mono)" }}>
              {match[1]}
            </code>
          );
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      // Mentions (@username)
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /@(\w+(?:\.\w+)*)/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          const username = match[1];
          res.push(
            <span key={`m-${key++}`} onClick={(e) => handleMentionClick(username, e)} style={{ color: "var(--text-primary)", cursor: "pointer", fontWeight: 700, textDecoration: "underline", textDecorationColor: "var(--border-hairline)" }} onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'var(--border-hairline)'}>
              @{username}
            </span>
          );
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      // Hashtags (#hashtag)
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /#(\w+)/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          const tag = match[1];
          res.push(
            <span 
              key={`h-${key++}`} 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/?tag=${tag.toLowerCase()}`);
              }} 
              style={{ 
                color: "var(--text-primary)", 
                cursor: "pointer", 
                fontWeight: 750, 
                backgroundColor: "var(--bg-hover)",
                padding: "1px 8px",
                borderRadius: "100px",
                fontSize: "13px",
                border: "0.5px solid var(--border-hairline)",
                transition: "all 0.15s ease",
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 2px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-primary)';
                e.currentTarget.style.color = 'var(--bg-page)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              #{tag}
            </span>
          );
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      // Links ([text](url))
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          const url = match[2];
          const isImage = /\.(gif|jpe?g|png|webp|bmp)$/i.test(url) || url.includes("tenor.com") || url.includes("giphy.com");
          if (!firstUrl && !isImage) firstUrl = url;
          res.push(
            <a key={`l-${key++}`} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: "underline", textDecorationColor: "var(--border-hairline)" }} onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'var(--border-hairline)'}>
              {match[1]}
            </a>
          );
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      // Bare URLs (https?://...)
      parts = parts.flatMap(p => {
        if (typeof p !== 'string') return p;
        const regex = /(https?:\/\/[^\s]+)/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          const url = match[1];
          // Check if it's an image/GIF
          const isImage = /\.(gif|jpe?g|png|webp|bmp)$/i.test(url) || url.includes("tenor.com") || url.includes("giphy.com");
          
          if (!firstUrl && !isImage) firstUrl = url;
          
          if (isImage) {
            res.push(
              <div key={`img-${key++}`} style={{ margin: "12px 0" }}>
                <img 
                  src={url} 
                  alt="" 
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "360px", 
                    borderRadius: "var(--radius-sm)", 
                    border: "0.5px solid var(--border-hairline)",
                    display: "block",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }} 
                  onError={(e) => {
                    // fallback to link if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            );
          } else {
            res.push(
              <a key={`lu-${key++}`} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: "underline", textDecorationColor: "var(--border-hairline)" }} onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'var(--border-hairline)'}>
                {url.length > 40 ? url.substring(0, 37) + "..." : url}
              </a>
            );
          }
          lastIdx = match.index + match[0].length;
        }
        if (lastIdx < p.length) res.push(p.slice(lastIdx));
        return res;
      });

      return parts;
    }
  };

  return (
    <div
      ref={contentRef}
      style={{
        color: "var(--text-primary)",
        fontSize,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {parseContent(content)}
    </div>
  );
}
