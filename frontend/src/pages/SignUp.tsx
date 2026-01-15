import { SignUp } from "@clerk/clerk-react";
import { useClerkUser } from "../hooks/useClerkUser";
import { Navigate } from "react-router-dom";
import { isClerkEnabled } from "../lib/clerk";

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useClerkUser();

  // If already signed in, redirect to feed
  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // If Clerk is not enabled, show a message
  if (!isClerkEnabled) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "calc(100vh - 80px)",
        padding: "20px",
        textAlign: "center"
      }}>
        <h1 style={{ marginBottom: "16px" }}>Sign Up</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Please configure VITE_CLERK_PUBLISHABLE_KEY in your .env file to enable authentication.
        </p>
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "25px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%"
        }}>
          <p style={{ color: "#999", fontSize: "14px" }}>
            Once Clerk is configured, the sign-up form will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "calc(100vh - 100px)",
      padding: "20px"
    }}>
      <SignUp 
        routing="path" 
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignInUrl="/"
        afterSignUpUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
      />
    </div>
  );
}

