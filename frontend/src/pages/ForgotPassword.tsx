import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { CaretLeft, EnvelopeSimple, Key, Lock } from "phosphor-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 640;

  if (!isLoaded) return null;

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!signIn) return;
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
    } catch (err: unknown) {
      const errObj = err as { errors?: Array<{ longMessage?: string }> };
      console.error("Error requesting code:", err);
      setError(
        errObj.errors?.[0]?.longMessage ||
          "Failed to send verification code. Please check your email."
      );
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!signIn || !setActive) return;
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/");
      } else {
        console.error("Incomplete verification:", result);
        setError("Something went wrong. Please try again.");
      }
    } catch (err: unknown) {
      const errObj = err as { errors?: Array<{ longMessage?: string }> };
      console.error("Error resetting password:", err);
      setError(
        errObj.errors?.[0]?.longMessage ||
          "Failed to reset password. Please check your code."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fade-in"
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "32px 24px" : "48px 24px",
        backgroundColor: "var(--bg-page)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-sm)",
          padding: isMobile ? "32px 24px" : "48px 40px",
          border: "0.5px solid var(--border-hairline)",
        }}
      >
        <Link
          to="/sign-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-tertiary)",
            fontSize: "11px",
            fontWeight: 700,
            marginBottom: "32px",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          <CaretLeft size={16} weight="bold" />
          BACK TO SIGN IN
        </Link>

        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "12px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {step === "email" ? "Reset password" : "Check your email"}
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            {step === "email"
              ? "Enter your email and we'll send you reset instructions."
              : (
                  <>
                    We've sent a 6-digit verification code to{" "}
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{email}</span>.
                    <span
                      style={{
                        display: "block",
                        marginTop: "12px",
                        fontSize: "13px",
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      If you don't see it, check your spam folder.
                    </span>
                  </>
                )}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--bg-hover)",
              border: "0.5px solid var(--border-hairline)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={step === "email" ? onRequestCode : onResetPassword}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {step === "email" ? (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <EnvelopeSimple size={18} weight="thin" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "transparent",
                    border: "0.5px solid var(--border-hairline)",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-mono)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Verification code
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <Key size={18} weight="thin" />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "transparent",
                      border: "0.5px solid var(--border-hairline)",
                      letterSpacing: "0.2em",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-mono)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-primary)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-hairline)";
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  New password
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <Lock size={18} weight="thin" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "transparent",
                      border: "0.5px solid var(--border-hairline)",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-mono)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--text-primary)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-hairline)";
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 700,
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              marginTop: "8px",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {loading ? "PLEASE WAIT..." : step === "email" ? "SEND INSTRUCTIONS" : "RESET PASSWORD"}
          </button>
        </form>

        {step === "code" && (
          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              fontSize: "11px",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
            }}
          >
            Didn't receive the email?{" "}
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                if (loading) return;
                setLoading(true);
                setError("");
                signIn
                  ?.create({
                    strategy: "reset_password_email_code",
                    identifier: email,
                  })
                  .then(() => setLoading(false))
                  .catch((err: unknown) => {
                    const errObj = err as { errors?: Array<{ longMessage?: string }> };
                    setError(
                      errObj.errors?.[0]?.longMessage ||
                        "Failed to resend. Please try again."
                    );
                    setLoading(false);
                  });
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: loading ? "var(--text-tertiary)" : "var(--text-primary)",
                fontWeight: 700,
                fontSize: "11px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                textDecoration: "underline",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Resend
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
