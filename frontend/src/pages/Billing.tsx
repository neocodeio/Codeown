import { useClerkUser } from "../hooks/useClerkUser";
import { Link, Navigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";

const PRO_CHECKOUT_BASE =
  "https://codeown.lemonsqueezy.com/checkout/buy/33a97835-6017-448a-a671-57ef2302126d";

function buildProCheckoutUrl(userId: string): string {
  const url = new URL(PRO_CHECKOUT_BASE);
  url.searchParams.set("checkout[custom][user_id]", userId);
  return url.toString();
}

const PRO_FEATURES = [
  "Open to opportunities badge on your profile",
  "Stand out in search and project cards",
  "Show recruiters you're actively looking",
  "Manage subscription anytime",
];

export default function Billing() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  if (!isLoaded) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#0f172a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!isSignedIn || !user?.id) {
    return <Navigate to="/sign-in" replace />;
  }

  const handleUpgrade = () => {
    window.location.href = buildProCheckoutUrl(user.id);
  };

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      padding: isMobile ? "24px 16px" : "48px 24px",
    }}>
      <div style={{
        maxWidth: "560px",
        margin: "0 auto",
      }}>
        {/* Card */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? "28px 20px" : "36px 32px",
            textAlign: "center",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "#0f172a",
              color: "#fff",
              fontSize: 24,
              marginBottom: 16,
            }}>
              ★
            </div>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 22 : 26,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}>
              Pro Profile (Beta)
            </h1>
            <p style={{
              margin: "8px 0 0",
              fontSize: 15,
              color: "#64748b",
              lineHeight: 1.5,
            }}>
              Upgrade your account to get more visibility and unlock the Open to opportunities badge.
              <br />
              <br />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Note: This is a beta feature and may be subject to change.
              </span>
            </p>
          </div>

          {/* Features */}
          <div style={{
            padding: isMobile ? "20px" : "24px 32px",
          }}>
            <ul style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}>
              {PRO_FEATURES.map((text, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    fontSize: 14,
                    color: "#334155",
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div style={{
            padding: isMobile ? "20px" : "24px 32px 32px",
          }}>
            <button
              onClick={handleUpgrade}
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#0f172a",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseDown={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseUp={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Upgrade to Pro (Beta)
            </button>
            <p style={{
              margin: "12px 0 0",
              fontSize: 12,
              color: "#94a3b8",
              textAlign: "center",
            }}>
              Secure checkout via Lemon Squeezy. Cancel anytime.
            </p>
          </div>
        </div>

        <p style={{
          marginTop: 24,
          fontSize: 14,
          color: "#64748b",
          textAlign: "center",
        }}>
          <Link to="/profile" style={{ color: "#0f172a", fontWeight: 600, textDecoration: "none" }}>
            ← Back to profile
          </Link>
        </p>
      </div>
    </main>
  );
}
