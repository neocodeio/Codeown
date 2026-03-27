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
          borderRadius: "var(--radius-lg)",
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
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: "15px",
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
              borderRadius: "var(--radius-sm)",
              border: "0.5px solid var(--border-hairline)",
              backgroundColor: "transparent",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-tertiary)",
              cursor: isLoading ? "not-allowed" : "pointer",
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
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: "#ef4444",
              fontSize: "15px",
              fontWeight: 600,
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s ease",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
