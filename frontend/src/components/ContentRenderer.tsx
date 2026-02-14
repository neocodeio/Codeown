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

interface ContentRendererProps {
  content: string;
  fontSize?: string;
}

const CodeBlock = ({ language, code }: { language: string; code: string }) => {
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
    navigate(`/search?q=@${username}`);
  };

  const parseContent = (text: string) => {
    const elements: (string | React.JSX.Element)[] = [];
    let key = 0;

    // Split text into lines to handle block-level elements like headings and lists
    const lines = text.split("\n");

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
          <blockquote key={`q-${key++}`} style={{ borderLeft: "4px solid #e2e8f0", paddingLeft: "16px", color: "#64748b", fontStyle: "italic", margin: "12px 0" }}>
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
            <code key={`ic-${key++}`} style={{ backgroundColor: "#f1f5f9", padding: "2px 4px", borderRadius: "4px", color: "#e11d48", fontSize: "0.9em" }}>
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
        const regex = /@(\w+)/g;
        const res: (string | React.JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(p)) !== null) {
          if (match.index > lastIdx) res.push(p.slice(lastIdx, match.index));
          res.push(
            <span key={`m-${key++}`} onClick={(e) => handleMentionClick(match![1], e)} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              @{match[1]}
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
          res.push(
            <a key={`l-${key++}`} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
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
          res.push(
            <a key={`lu-${key++}`} href={match[1]} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              {match[1].length > 40 ? match[1].substring(0, 37) + "..." : match[1]}
            </a>
          );
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
        color: "#0f172a",
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
