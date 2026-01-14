import { type ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { clerkPublishableKey } from "./clerk";

export function ClerkWrapper({ children }: { children: ReactNode }) {
  // Always try to use ClerkProvider if we have any key value
  // This handles cases where the key might exist but detection failed
  if (clerkPublishableKey && clerkPublishableKey.length > 0) {
    try {
      return <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>;
    } catch (error) {
      console.error("ClerkProvider error:", error);
      return <>{children}</>;
    }
  }

  console.warn("Clerk publishable key not found. Check your .env file in the frontend folder.");
  return <>{children}</>;
}

