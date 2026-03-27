import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { ChatTeardropDots, X, CheckCircle } from "phosphor-react";
import { useUser } from "@clerk/clerk-react";
import { useWindowSize } from "../hooks/useWindowSize";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const reset = () => {
    setFullName(user?.fullName || "");
    setEmail(user?.primaryEmailAddress?.emailAddress || "");
    setUsername(user?.username || "");
    setMessage("");
    setSent(false);
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (!trimmedMessage) {
      setError("Message is required.");
      return;
    }
    setSending(true);
    try {
      await api.post("/feedback", {
        fullName: trimmedName,
        email: trimmedEmail,
        username: trimmedUsername || undefined,
        message: trimmedMessage,
      });
      setSent(true);
      setMessage("");
      setTimeout(() => handleClose(), 1500);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to send. Try again.";
      setError(msg || "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  const modal = open && createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "400px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-lg)",
          border: "0.5px solid var(--border-hairline)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
          padding: "32px",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: "16px", 
            fontWeight: 700, 
            color: "var(--text-primary)", 
          }}>Submit feedback</h2>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.1s"
            }}
            className="btn-modal-close"
          >
            <X size={18} weight="thin" />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: "48px", height: "48px", background: "var(--bg-hover)", color: "var(--text-primary)", border: "0.5px solid var(--border-hairline)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle size={24} weight="thin" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)", fontSize: "14px", fontWeight: 700 }}>Feedback received</h3>
            <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "13px" }}>Thank you for your feedback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Name"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Username (optional)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of your feedback..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "0.5px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "100px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px",
                border: "0.5px solid var(--border-hairline)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                marginBottom: "20px",
                textAlign: "center",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: sending ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: sending ? 0.7 : 1,
                boxSizing: "border-box"
              }}
            >
              {sending ? "Sending..." : "Submit feedback"}
            </button>
          </form>
        )}
      </div>
      <style>{`
        .btn-modal-close:hover { background-color: var(--bg-hover); }
      `}</style>
    </div>,
    document.body
  );

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          reset();
        }}
        style={{
          position: "fixed",
          bottom: isMobile ? "88px" : "32px",
          right: isMobile ? "24px" : "32px",
          zIndex: 900,
          width: isMobile ? "48px" : "56px",
          height: isMobile ? "48px" : "56px",
          borderRadius: "100%",
          backgroundColor: isMobile ? "var(--text-primary)" : "var(--bg-page)",
          color: isMobile ? "var(--bg-page)" : "var(--text-primary)",
          border: "0.5px solid var(--border-hairline)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="btn-feedback-trigger"
        aria-label="Feedback"
      >
        <ChatTeardropDots size={isMobile ? 22 : 24} weight="thin" />
      </button>
      {modal && createPortal(modal, document.body)}
      <style>{`
        .btn-feedback-trigger:hover {
          background-color: var(--text-primary);
          color: var(--bg-page);
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
}
