import { SignIn } from "@clerk/clerk-react";
import { useClerkUser } from "../hooks/useClerkUser";
import { Navigate } from "react-router-dom";
import { isClerkEnabled, clerkPublishableKey } from "../lib/clerk";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useClerkUser();

  // If already signed in, redirect to feed
  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Always try to render SignIn - let Clerk handle errors if key is invalid
  // This way if the key exists but wasn't detected, it will still work
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "calc(100vh - 80px)",
      padding: "32px 20px",
      backgroundColor: "#f5f7fa",
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "420px",
        backgroundColor: "#ffffff",
        borderRadius: "25px",
        padding: "40px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e4e7eb",
      }}>
        {isClerkEnabled && clerkPublishableKey ? (
          <SignIn 
            routing="path" 
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
            afterSignUpUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
                formButtonPrimary: "bg-[#317ff5] hover:bg-[#2563eb]",
                footerActionLink: "text-[#317ff5] hover:text-[#2563eb]",
              }
            }}
          />
        ) : (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              marginBottom: "16px",
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a1a1a",
            }}>
              Sign In
            </h1>
            <p style={{ 
              color: "#64748b", 
              marginBottom: "24px",
              fontSize: "15px",
            }}>
              Please configure VITE_CLERK_PUBLISHABLE_KEY in your .env file.
            </p>
            <div style={{
              backgroundColor: "#f5f7fa",
              borderRadius: "25px",
              padding: "20px",
              textAlign: "left",
            }}>
              <p style={{ 
                color: "#64748b", 
                fontSize: "13px", 
                marginBottom: "12px",
                fontWeight: 600,
              }}>
                Make sure:
              </p>
              <ul style={{ 
                color: "#64748b", 
                fontSize: "14px", 
                listStyle: "disc",
                paddingLeft: "20px",
                lineHeight: "1.8",
              }}>
                <li>The .env file is in the <code style={{ backgroundColor: "#e4e7eb", padding: "2px 6px", borderRadius: "4px" }}>frontend</code> folder</li>
                <li>The variable name is exactly: <code style={{ backgroundColor: "#e4e7eb", padding: "2px 6px", borderRadius: "4px" }}>VITE_CLERK_PUBLISHABLE_KEY</code></li>
                <li>No spaces around the = sign</li>
                <li>You've restarted the dev server</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

