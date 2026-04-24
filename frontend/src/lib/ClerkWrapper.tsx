import { type ReactNode, useEffect } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { clerkPublishableKey } from "./clerk";
import logoWhite from "../assets/logo-white.png";

export function ClerkWrapper({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    // If Clerk isn't ready in 8 seconds, show a fallback or auto-reload
    const timer = setTimeout(() => {
      if (!(window as any).Clerk?.isReady?.()) {
        console.warn("[Clerk] Initialization taking longer than expected...");
        // Don't set isTimedOut immediately to allow more buffer
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  if (clerkPublishableKey && clerkPublishableKey.length > 0) {
    return (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        routerPush={(to) => navigate(to)}
        routerReplace={(to) => navigate(to, { replace: true })}
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        // Use the manually loaded Clerk if available to skip the internal loader race
        clerkJSUrl={(window as any).Clerk ? undefined : undefined} 
      >
        {children}
      </ClerkProvider>
    );
  }

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000",
      color: "#fff",
      fontFamily: "Inter, sans-serif"
    }}>
      <img src={logoWhite} alt="Codeown" style={{ height: "40px", marginBottom: "24px", opacity: 0.8 }} />
      <div style={{ fontSize: "14px", fontWeight: 500, opacity: 0.6 }}>Establishing secure connection...</div>
      <button 
        onClick={() => window.location.reload()}
        style={{ marginTop: "24px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: "100px", fontSize: "12px", cursor: "pointer" }}
      >
        Retry Connection
      </button>
    </div>
  );
}

