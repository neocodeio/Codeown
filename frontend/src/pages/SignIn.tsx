import { SignIn } from "@clerk/clerk-react";
import { useClerkUser } from "../hooks/useClerkUser";
import { Navigate, Link } from "react-router-dom";
import { isClerkEnabled, clerkPublishableKey } from "../lib/clerk";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useClerkUser();

  if (isLoaded && isSignedIn) return <Navigate to="/onboarding" replace />;

  return (
    <div className="fade-in" style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      padding: "20px 24px",
      backgroundColor: "var(--bg-page)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
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
                  colorPrimary: "#000000",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px",
                },
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 bg-transparent p-0 m-0",
                  headerTitle: "text-2xl font-bold tracking-tight text-black",
                  headerSubtitle: "text-gray-500 mt-2 text-sm",
                  socialButtonsBlockButton: "border-[0.5px] border-gray-200 hover:bg-gray-50 transition-all rounded-[var(--radius-sm)]",
                  formButtonPrimary: "bg-black hover:bg-zinc-800 transition-all rounded-[var(--radius-sm)] py-3 text-sm font-semibold",
                  footerActionLink: "text-black hover:underline",
                  formFieldInput: "rounded-[var(--radius-sm)] border-[0.5px] border-gray-200 focus:border-black transition-all",
                  dividerLine: "bg-gray-100",
                  dividerText: "text-gray-400 text-[11px] font-bold",
                  socialButtonsBlockButtonText: "text-sm font-medium",
                  formFieldLabel: "text-[12px] font-semibold text-gray-500 mb-1",
                  identityPreviewText: "text-sm",
                  identityPreviewEditButtonIcon: "text-black"
                }
              }}
            />
            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
              >
                Forgot your password?
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
  );
}
