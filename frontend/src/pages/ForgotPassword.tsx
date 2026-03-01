import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Mail01Icon,
  Key01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";

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
        padding: isMobile ? "24px 16px" : "40px 24px",
        background: "radial-gradient(ellipse at top, rgba(15, 23, 42, 0.03) 0%, transparent 60%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#fff",
          borderRadius: isMobile ? "20px" : "24px",
          padding: isMobile ? "28px 20px" : "40px 36px",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
          border: "1px solid #f1f5f9",
        }}
      >
        <Link
          to="/sign-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "24px",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ width: 18, height: 18 }} />
          Back to sign in
        </Link>

        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: isMobile ? "24px" : "28px",
              fontWeight: 900,
              marginBottom: "8px",
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            {step === "email" ? "Reset password" : "Check your email"}
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              lineHeight: 1.5,
            }}
          >
            {step === "email"
              ? "No worries, it happens to all of us. Enter your email and we'll send you reset instructions."
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
              padding: "14px 16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: 500,
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
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                >
                  <HugeiconsIcon icon={Mail01Icon} size={20} style={{ width: 20, height: 20 }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: "100%",
                    paddingLeft: "48px",
                    paddingRight: "16px",
                    paddingTop: "14px",
                    paddingBottom: "14px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "15px",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0f172a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
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
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  Verification code
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  >
                    <HugeiconsIcon icon={Key01Icon} size={20} style={{ width: 20, height: 20 }} />
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
                      paddingLeft: "48px",
                      paddingRight: "16px",
                      paddingTop: "14px",
                      paddingBottom: "14px",
                      borderRadius: "12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      letterSpacing: "0.2em",
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0f172a";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  New password
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  >
                    <HugeiconsIcon icon={LockIcon} size={20} style={{ width: 20, height: 20 }} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    style={{
                      width: "100%",
                      paddingLeft: "48px",
                      paddingRight: "16px",
                      paddingTop: "14px",
                      paddingBottom: "14px",
                      borderRadius: "12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: "15px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0f172a";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
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
              padding: "14px 24px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              backgroundColor: "#0f172a",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: "8px",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Please wait..." : step === "email" ? "Send Instructions" : "Reset Password"}
          </button>
        </form>

        {step === "code" && (
          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "14px",
              color: "#64748b",
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
                color: loading ? "#94a3b8" : "#0f172a",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
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
