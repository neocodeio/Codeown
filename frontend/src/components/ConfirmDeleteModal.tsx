import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isLoading = false,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 5100,
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "2px",
          backgroundColor: "var(--bg-page)",
          border: "0.5px solid var(--border-hairline)",
          padding: "32px",
          boxSizing: "border-box",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-delete-title"
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            fontWeight: 800,
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              borderRadius: "2px",
              border: "0.5px solid var(--border-hairline)",
              backgroundColor: "transparent",
              fontSize: "12px",
              fontWeight: 800,
              color: "var(--text-tertiary)",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              borderRadius: "2px",
              border: "none",
              backgroundColor: "#ef4444",
              fontSize: "12px",
              fontWeight: 800,
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "opacity 0.15s ease",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "DELETING..." : confirmLabel.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
