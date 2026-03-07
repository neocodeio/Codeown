import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import api from "../api/axios";

const PRO_CHECKOUT_PRODUCT_ID = "pdt_0NZynf5GNfjz9K6ddEmO0";

function buildProCheckoutUrl(userId: string): string {
  // Dodo Payments uses metadata_ prefix for custom fields on static links
  const baseUrl = `https://checkout.dodopayments.com/buy/${PRO_CHECKOUT_PRODUCT_ID}`;
  const finalUrl = `${baseUrl}?metadata_user_id=${encodeURIComponent(userId)}`;

  console.log("[Billing] Generated Dodo checkout URL:", finalUrl);
  return finalUrl;
}

const PRO_FEATURES = [
  "Comprehensive Analytics dashboard",
  "Open to opportunities badge on your profile",
  "Stand out in search and project cards",
  "Show recruiters you're actively looking",
  "Manage subscription anytime",
];

export default function Billing() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isSignedIn && user?.id) {
        try {
          const token = await getToken();
          const res = await api.get(`/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfile(res.data);
        } catch (err) {
          console.error("Failed to fetch profile in billing", err);
        } finally {
          setLoadingProfile(false);
        }
      } else if (isLoaded) {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [isSignedIn, user?.id, isLoaded, getToken]);

  if (!isLoaded || loadingProfile) {
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

  const isPro = profile?.is_pro === true;

  const handleUpgrade = () => {
    if (isPro) return;
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
              Upgrade your account to get better visibility, unlock advanced analytics, and get the "Open to opportunities" badge.
              <br />
              <br />
              <span style={{ fontSize: 14, color: "#94a3b8" }}>
                Note: This is not ready yet, we are working on it.
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
              disabled={isPro}
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: isPro ? "#10b981" : "#0f172a",
                border: "none",
                borderRadius: "12px",
                cursor: isPro ? "default" : "pointer",
                transition: "all 0.2s",
                opacity: isPro ? 1 : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isPro ? (
                <>
                  <span style={{ fontSize: "18px" }}>✓</span>
                  You are a Pro member
                </>
              ) : (
                "Upgrade to Pro (Beta)"
              )}
            </button>
            {isPro && (
              <p style={{
                textAlign: "center",
                marginTop: "12px",
                fontSize: "13px",
                color: "#64748b"
              }}>
                You already have a Pro account. Thank you for your support!
              </p>
            )}
            <p style={{
              margin: "12px 0 0",
              fontSize: 12,
              color: "#94a3b8",
              textAlign: "center",
            }}>
              Secure checkout via Dodo Payments. Cancel anytime.
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
