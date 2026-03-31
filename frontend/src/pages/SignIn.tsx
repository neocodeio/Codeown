import { SignIn } from "@clerk/clerk-react";
import { useClerkUser } from "../hooks/useClerkUser";
import { Navigate, Link } from "react-router-dom";
import { isClerkEnabled, clerkPublishableKey } from "../lib/clerk";
import { useWindowSize } from "../hooks/useWindowSize";
import logo from "../assets/icon-removebg.png";
import logoWhite from "../assets/logo-white.png";
import { useTheme } from "../context/ThemeContext";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useClerkUser();
  const { width } = useWindowSize();
  const { theme } = useTheme();
  const isDesktop = width >= 1024;

  if (isLoaded && isSignedIn) return <Navigate to="/onboarding" replace />;

  return (
    <div className="fade-in" style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "var(--bg-page)",
      flexDirection: isDesktop ? "row" : "column"
    }}>
      {/* Form Side - Left on Desktop */}
      <div style={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: isDesktop ? "60px" : "40px 24px",
        backgroundColor: "var(--bg-page)",
        zIndex: 2,
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
             <img 
               src={theme === 'dark' ? logoWhite : logo} 
               alt="Codeown Logo" 
               style={{ width: "24px", height: "24px", objectFit: "contain" }} 
             />
             <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>Codeown</span>
          </div>

          {isClerkEnabled && clerkPublishableKey ? (
            <>
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                afterSignInUrl="/onboarding"
                forceRedirectUrl="/onboarding"
                appearance={{
                  variables: {
                    colorPrimary: "var(--text-primary)",
                    borderRadius: "12px",
                    fontSize: "14px",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent p-0 w-full",
                    headerTitle: "text-2xl font-bold tracking-tight text-[var(--text-primary)]",
                    headerSubtitle: "text-[var(--text-tertiary)] mt-2 text-sm font-medium",
                    socialButtonsBlockButton: "border-[0.5px] border-[var(--border-hairline)] hover:bg-[var(--bg-hover)] transition-all bg-[var(--bg-page)]",
                    socialButtonsBlockButtonText: "text-[var(--text-primary)] font-semibold text-sm",
                    formButtonPrimary: "bg-[var(--text-primary)] text-[var(--bg-page)] hover:opacity-90 transition-all py-3 text-sm font-bold shadow-none",
                    footerActionLink: "text-[var(--text-primary)] hover:underline font-bold",
                    footerActionText: "text-[var(--text-tertiary)] font-medium",
                    formFieldInput: "bg-[var(--bg-input)] rounded-[var(--radius-sm)] border-[0.5px] border-[var(--border-hairline)] focus:border-[var(--text-primary)] transition-all text-[var(--text-primary)]",
                    formFieldLabel: "text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2",
                    dividerLine: "bg-[var(--border-hairline)]",
                    dividerText: "text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest",
                    identityPreviewText: "text-[var(--text-primary)]",
                    identityPreviewEditButtonIcon: "text-[var(--text-primary)]",
                    formFieldLabelRow: "mb-1",
                  }
                }}
              />
              <div style={{ marginTop: "32px", textAlign: "left" }}>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-tertiary)",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                  Lost access to your account?
                </Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ marginBottom: "16px", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>Sign In</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Please configure Clerk to continue.</p>
            </div>
          )}
        </div>
      </div>

      {/* Brand Side - Right on Desktop */}
      {isDesktop && (
        <div style={{
          flex: "0 0 50%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          overflow: "hidden",
          backgroundColor: "#000"
        }}>
          {/* Background Image */}
          <img 
            src="/auth_banner_1774960075949.png" 
            alt="Auth Background" 
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6,
              filter: "contrast(1.1) brightness(0.9)"
            }} 
          />
          
          {/* Overlay Gradient */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)",
            zIndex: 1
          }} />

          {/* Logo Area */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "12px" }}>
             <img src={logoWhite} alt="Codeown" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
             <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em" }}>Codeown</span>
          </div>

          {/* Tagline */}
          <div style={{ position: "relative", zIndex: 2, maxWidth: "440px" }}>
            <h1 style={{ 
              fontSize: "48px", 
              fontWeight: 800, 
              color: "#fff", 
              lineHeight: 1.1, 
              marginBottom: "24px",
              letterSpacing: "-0.03em"
            }}>
              Where founders<br />build in public.
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1.6 }}>
              Join the ecosystem of software engineers, designers, and dreamers building the next wave of unicorns.
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 2, fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
             &copy; 2024 Codeown Space. All systems operational.
          </div>
        </div>
      )}
    </div>
  );
}
