import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faTimes } from "@fortawesome/free-solid-svg-icons";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setFullName("");
    setEmail("");
    setUsername("");
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
        backgroundColor: "#000",
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          maxHeight: "90vh",
          overflow: "auto",
          backgroundColor: "#fff",
          borderRadius: "25px",
          boxShadow: "var(--shadow-hover)",
          border: "1px solid var(--border-color)",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#000" }}>Feedback</h2>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {sent ? (
          <p style={{ color: "var(--text-primary)", textAlign: "center", padding: "24px 0" }}>Thanks! Your feedback was sent.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Full name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{
                width: "90%",
                padding: "10px 12px",
                borderRadius: "15px",
                border: "1px solid #000",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            />

            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "90%",
                padding: "10px 12px",
                borderRadius: "15px",
                border: "1px solid #000",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            />

            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Username (optional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              style={{
                width: "90%",
                padding: "10px 12px",
                borderRadius: "15px",
                border: "1px solid #000",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                marginBottom: "12px",
                fontSize: "14px",
              }}
            />

            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Suggestions, recommendations, or issues..."
              rows={4}
              style={{
                width: "90%",
                padding: "10px 12px",
                borderRadius: "15px",
                border: "1px solid #000",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                marginBottom: "12px",
                fontSize: "14px",
                resize: "vertical",
              }}
            />

            {error && <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

            <button
              type="submit"
              disabled={sending}
              style={{
                width: "96%",
                padding: "12px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "15px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 900,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "var(--accent)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "var(--shadow-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Feedback"
      >
        <FontAwesomeIcon icon={faComment} style={{ fontSize: "22px", color: "#fff", backgroundColor: "#000", padding: "12px", borderRadius: "25px" }} />
      </button>
      {modal}
    </>
  );
}
