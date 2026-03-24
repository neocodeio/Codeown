import { SignUp } from "@clerk/clerk-react";
import { useClerkUser } from "../hooks/useClerkUser";
import { Navigate } from "react-router-dom";
import { isClerkEnabled, clerkPublishableKey } from "../lib/clerk";

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useClerkUser();

  if (isLoaded && isSignedIn) return <Navigate to="/onboarding" replace />;

  return (
    <div className="fade-in" style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      padding: "200px 24px",
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
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/onboarding"
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
                  headerTitle: "text-2xl font-bold tracking-tight text-black uppercase",
                  headerSubtitle: "text-gray-500 mt-2 text-sm",
                  socialButtonsBlockButton: "border-[0.5px] border-gray-200 hover:bg-gray-50 transition-all rounded-[2px]",
                  formButtonPrimary: "bg-black hover:bg-zinc-800 transition-all rounded-[2px] py-3 text-xs uppercase font-bold tracking-widest",
                  footerActionLink: "text-black hover:underline",
                  formFieldInput: "rounded-[2px] border-[0.5px] border-gray-200 focus:border-black transition-all",
                  dividerLine: "bg-gray-100",
                  dividerText: "text-gray-400 text-[10px] uppercase font-bold",
                  socialButtonsBlockButtonText: "text-sm font-medium",
                  formFieldLabel: "text-[11px] uppercase font-bold text-gray-400 mb-1"
                }
              }}
          />
        ) : (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ marginBottom: "16px", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>Sign Up</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Please configure Clerk to continue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
