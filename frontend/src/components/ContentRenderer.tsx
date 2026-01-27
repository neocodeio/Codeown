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
    // Navigate to user search or profile
    navigate(`/search?q=@${username}`);
  };

  const parseContent = (text: string) => {
    const elements: (string | React.JSX.Element)[] = [];
    let key = 0;

    // Regex to match code blocks: ```language\ncode\n``` or ```code```
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;

    // First, extract code blocks
    const codeBlocks: { start: number; end: number; element: React.JSX.Element }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || "plaintext";
      const code = match[2].trim();
      codeBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        element: (
          <CodeBlock key={`code-block-${key++}`} language={language} code={code} />
        ),
      });
    }

    // Sort blocks by start position (should already be sorted, but just in case)
    codeBlocks.sort((a, b) => a.start - b.start);

    // Process text outside code blocks
    let currentPos = 0;
    for (const block of codeBlocks) {
      if (currentPos < block.start) {
        const textSegment = text.slice(currentPos, block.start);
        elements.push(...parseTextSegment(textSegment, key));
        key += 100; // Leave room for keys
      }
      elements.push(block.element);
      currentPos = block.end;
    }

    // Process remaining text after last code block
    if (currentPos < text.length) {
      const textSegment = text.slice(currentPos);
      elements.push(...parseTextSegment(textSegment, key));
    }

    return elements;

    function parseTextSegment(segment: string, startKey: number): (string | React.JSX.Element)[] {
      const segmentElements: (string | React.JSX.Element)[] = [];
      let segmentLastIndex = 0;
      let localKey = startKey;

      // Combined regex for inline code, mentions, and URLs
      const combinedRegex = /(`[^`]+`)|(@\w+)|(https?:\/\/[^\s]+)/g;
      let segmentMatch;

      while ((segmentMatch = combinedRegex.exec(segment)) !== null) {
        // Add text before match
        if (segmentMatch.index > segmentLastIndex) {
          segmentElements.push(segment.slice(segmentLastIndex, segmentMatch.index));
        }

        if (segmentMatch[1]) {
          // Inline code
          const inlineCode = segmentMatch[1].slice(1, -1); // Remove backticks
          segmentElements.push(
            <code
              key={`inline-${localKey++}`}
              style={{
                backgroundColor: "#f1f5f9",
                color: "#e11d48",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.9em",
                fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
              }}
            >
              {inlineCode}
            </code>
          );
        } else if (segmentMatch[2]) {
          // Mention
          const username = segmentMatch[2].slice(1); // Remove @
          segmentElements.push(
            <span
              key={`mention-${localKey++}`}
              onClick={(e) => handleMentionClick(username, e)}
              style={{
                color: "#2563eb",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              @{username}
            </span>
          );
        } else if (segmentMatch[3]) {
          // URL
          const url = segmentMatch[3];
          segmentElements.push(
            <a
              key={`link-${localKey++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              {url.length > 50 ? url.substring(0, 47) + "..." : url}
            </a>
          );
        }

        segmentLastIndex = segmentMatch.index + segmentMatch[0].length;
      }

      // Add remaining text
      if (segmentLastIndex < segment.length) {
        segmentElements.push(segment.slice(segmentLastIndex));
      }

      return segmentElements;
    }
  };

  return (
    <div
      ref={contentRef}
      dir="auto"
      style={{
        color: "#000",
        marginTop: "20px",
        marginBottom: "5px",
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
