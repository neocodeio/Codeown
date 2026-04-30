import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { X, CheckCircle } from "phosphor-react";
import { useUser } from "@clerk/clerk-react";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChatFeedbackIcon, Cancel01Icon, SentIcon, PlusSignIcon } from "@hugeicons/core-free-icons";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const { user } = useUser();

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const getSubmissionData = () => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("feedback_limit");
    if (!stored) return { date: today, count: 0 };
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date !== today) return { date: today, count: 0 };
      return parsed;
    } catch {
      return { date: today, count: 0 };
    }
  };

  const incrementSubmissionCount = () => {
    const data = getSubmissionData();
    data.count += 1;
    localStorage.setItem("feedback_limit", JSON.stringify(data));
  };

  const reset = () => {
    setFullName(user?.fullName || "");
    setEmail(user?.primaryEmailAddress?.emailAddress || "");
    setUsername(user?.username || "");
    setMessage("");
    setSent(false);
    setError("");
    setRateLimited(getSubmissionData().count >= 5);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  useEffect(() => {
    const handleOpenFeedback = () => {
      setOpen(true);
      reset();
    };
    window.addEventListener("openFeedback", handleOpenFeedback);
    return () => window.removeEventListener("openFeedback", handleOpenFeedback);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getSubmissionData().count >= 5) {
      setError("Daily limit reached (5 feedbacks/day).");
      setRateLimited(true);
      return;
    }

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
      incrementSubmissionCount();
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

  const modal = open && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-hairline)",
          boxShadow: "var(--shadow-xl)",
          padding: "32px",
          position: "relative",
          animation: "reactionFadeUpSimple 0.2s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "8px", backgroundColor: "var(--bg-hover)", borderRadius: "100px", display: "flex" }}>
              <HugeiconsIcon icon={ChatFeedbackIcon} size={20} color="var(--text-primary)" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "17px", color: "var(--text-primary)" }}>
              Submit feedback
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "40px 0", animation: "reactionFadeUpSimple 0.2s ease-out" }}>
            <div style={{ width: "56px", height: "56px", background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border-hairline)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle size={28} weight="fill" />
            </div>
            <h3 style={{ margin: "0 0 12px", color: "var(--text-primary)", fontSize: "16px", fontWeight: 800 }}>Feedback received!</h3>
            <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 500 }}>Thank you for helping us improve {new URL(window.location.origin).hostname}.</p>
          </div>
        ) : rateLimited ? (
          <div style={{ textAlign: "center", padding: "40px 0", animation: "reactionFadeUpSimple 0.2s ease-out" }}>
            <div style={{ width: "56px", height: "56px", background: "rgba(239, 68, 68, 0.05)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <X size={28} weight="bold" />
            </div>
            <h3 style={{ margin: "0 0 12px", color: "var(--text-primary)", fontSize: "16px", fontWeight: 800 }}>Daily limit reached</h3>
            <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "14px", fontWeight: 500 }}>You've shared 5 insights today. Please come back tomorrow with more!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontWeight: 500,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-hairline)"}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Username (optional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    fontWeight: 500,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-hairline)"}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontWeight: 500,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-hairline)"}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of your feedback..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-hairline)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontWeight: 500,
                  outline: "none",
                  resize: "vertical",
                  minHeight: "120px",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--text-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-hairline)"}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px 16px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                color: "#ef4444",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "24px",
                textAlign: "center",
                animation: "reactionFadeUpSimple 0.2s ease-out"
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-page)",
                border: "none",
                borderRadius: "100px",
                fontWeight: 800,
                fontSize: "14px",
                cursor: sending ? "not-allowed" : "pointer",
                transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                opacity: sending ? 0.7 : 1,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
              onMouseEnter={(e) => !sending && (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => !sending && (e.currentTarget.style.transform = "scale(1)")}
            >
              {sending ? (
                <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              ) : (
                <>
                  Submit feedback
                  <HugeiconsIcon icon={SentIcon} size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => {
          if (isMobile) {
            // On mobile, this button acts as "Add Post" (triggering the post modal directly)
            window.dispatchEvent(new CustomEvent("openPostModal"));
          } else {
            setOpen(true);
            reset();
          }
        }}
        style={{
          position: "fixed",
          bottom: isMobile ? "88px" : "32px",
          right: isMobile ? "24px" : "32px",
          zIndex: 900,
          width: isMobile ? "48px" : "56px",
          height: isMobile ? "48px" : "56px",
          borderRadius: "100%",
          backgroundColor: "var(--bg-page)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-hairline)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-lg)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="btn-feedback-trigger"
        aria-label={isMobile ? "Add Post" : "Feedback"}
      >
        <HugeiconsIcon icon={isMobile ? PlusSignIcon : ChatFeedbackIcon} size={isMobile ? 22 : 24} />
      </button>
      {open && createPortal(modal, document.body)}
      <style>{`
        .btn-feedback-trigger:hover {
          background-color: var(--text-primary);
          color: var(--bg-page);
          transform: translateY(-4px) scale(1.05);
          box-shadow: var(--shadow-xl);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
