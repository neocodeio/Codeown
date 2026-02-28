import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export default function ShareModal({ isOpen, onClose, url, title = "Share link" }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen, url]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 3000,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth: "380px",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
          padding: "18px 18px 16px",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px 0" }}>
          Copy a link you can share anywhere.
        </p>

        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            padding: "8px 10px",
            fontSize: "12px",
            color: "#0f172a",
            backgroundColor: "#f8fafc",
            marginBottom: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={url}
        >
          {url}
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: "999px",
            border: "none",
            backgroundColor: copied ? "#16a34a" : "#0f172a",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: "6px",
            transition: "background-color 0.15s ease, transform 0.05s ease",
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "999px",
            border: "none",
            backgroundColor: "transparent",
            color: "#64748b",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

