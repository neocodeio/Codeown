import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import api from "../api/axios";
import { Star, Check, CaretLeft } from "phosphor-react";

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
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-page)" }}>
        <div style={{ width: "20px", height: "20px", border: "0.5px solid var(--border-hairline)", borderTopColor: "var(--text-primary)", borderRadius: "var(--radius-sm)", animation: "spin 0.8s linear infinite" }} />
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
      backgroundColor: "var(--bg-page)",
      padding: isMobile ? "32px 24px" : "64px 24px",
    }}>
      <div style={{
        maxWidth: "560px",
        margin: "0 auto",
      }}>
        {/* Card */}
        <div style={{
          backgroundColor: "var(--bg-page)",
          borderRadius: "var(--radius-sm)",
          border: "0.5px solid var(--border-hairline)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? "32px 24px" : "48px 40px",
            textAlign: "center",
            borderBottom: "0.5px solid var(--border-hairline)",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-page)",
              marginBottom: 20,
            }}>
              <Star size={20} weight="fill" />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              Pro membership
            </h1>
            <p style={{
              margin: "12px 0 0",
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}>
              Upgrade your account to unlock advanced tools and premium visibility.
            </p>
          </div>

          {/* Features */}
          <div style={{
            padding: isMobile ? "24px" : "32px 40px",
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
                    gap: 16,
                    padding: "8px 0",
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  <Check size={14} weight="bold" color="var(--text-primary)" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div style={{
            padding: isMobile ? "24px" : "0 40px 40px",
          }}>
            <button
              onClick={handleUpgrade}
              disabled={isPro}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "13px",
                fontWeight: 700,
                color: isPro ? "var(--text-primary)" : "var(--bg-page)",
                backgroundColor: isPro ? "var(--bg-hover)" : "var(--text-primary)",
                border: isPro ? "0.5px solid var(--border-hairline)" : "none",
                borderRadius: "var(--radius-sm)",
                cursor: isPro ? "default" : "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isPro ? (
                <>
                  <Check size={16} weight="bold" />
                  Active subscription
                </>
              ) : (
                "Upgrade to Pro"
              )}
            </button>
            {isPro && (
              <p style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "12px",
                color: "var(--text-tertiary)",
              }}>
                Thank you for supporting Codeown.
              </p>
            )}
            <p style={{
              margin: "16px 0 0",
              fontSize: 12,
              color: "var(--text-tertiary)",
              textAlign: "center",
              letterSpacing: "0.02em"
            }}>
              Secure checkout via Dodo Payments.
            </p>
          </div>
        </div>

        <p style={{
          marginTop: 32,
          fontSize: 12,
          textAlign: "center",
        }}>
          <Link to="/profile" style={{ 
            color: "var(--text-tertiary)", 
            fontWeight: 700, 
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
          >
            <CaretLeft size={16} weight="bold" /> Back to profile
          </Link>
        </p>
      </div>
    </main>
  );
}
