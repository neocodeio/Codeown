import { SignIn } from "@clerk/clerk-react";
import { useClerkUser } from "../hooks/useClerkUser";
import { Navigate, Link } from "react-router-dom";
import { isClerkEnabled, clerkPublishableKey } from "../lib/clerk";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useClerkUser();

  if (isLoaded && isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="fade-in" style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "70vh",
      padding: "20px 20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        borderRadius: "24px",
        padding: "40px",
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
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 p-0 m-0",
                  headerTitle: "text-3xl font-bold tracking-tight text-gray-900",
                  headerSubtitle: "text-gray-500 mt-2",
                  socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 transition-all rounded-xl",
                  formButtonPrimary: "bg-[#5046e5] hover:bg-[#3730a3] transition-all rounded-xl py-3",
                  footerActionLink: "text-[#5046e5] hover:text-[#3730a3]",
                  formFieldInput: "rounded-xl border-gray-200 focus:ring-[#5046e5] transition-all",
                }
              }}
            />
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#6366f1",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >
                Forgot your password?
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ marginBottom: "16px", fontSize: "28px", color: "var(--text-primary)" }}>Sign In</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>Please configure Clerk to continue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
