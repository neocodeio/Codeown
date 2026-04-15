import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { NewTwitterIcon, Copy01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  shareText?: string;
}

export default function ShareModal({ isOpen, onClose, url, title = "Share link", shareText = "Check out this content on Codeown!" }: ShareModalProps) {
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

  const handleShareToX = () => {
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
  };

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
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
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-page)",
          border: "0.5px solid var(--border-hairline)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          padding: "24px",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: "0 0 16px 0",
          lineHeight: "1.5"
        }}>
          Copy the unique link below to share this content.
        </p>

        <div
          style={{
            borderRadius: "var(--radius-sm)",
            border: "0.5px solid var(--border-hairline)",
            padding: "8px 12px",
            fontSize: "13px",
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-input)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            justifyContent: "space-between"
          }}
        >
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={url}>
            {url}
          </div>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: copied ? "rgba(5, 150, 69, 0.1)" : "transparent",
              color: copied ? "#059669" : "var(--text-tertiary)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Copy to clipboard"
          >
            <HugeiconsIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleShareToX}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}
          >
            <HugeiconsIcon icon={NewTwitterIcon} size={18} />
            Share to X
          </button>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: "0.5px solid var(--border-hairline)",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.1s ease"
            }}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
        <style>{`
          .cancel-button:hover {
            background-color: var(--bg-hover);
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

