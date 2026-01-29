import { type ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { clerkPublishableKey } from "./clerk";

export function ClerkWrapper({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Always try to use ClerkProvider if we have any key value
  // This handles cases where the key might exist but detection failed
  if (clerkPublishableKey && clerkPublishableKey.length > 0) {
    try {
      return (
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          routerPush={(to) => navigate(to)}
          routerReplace={(to) => navigate(to, { replace: true })}
          signInFallbackRedirectUrl="/onboarding"
          signUpFallbackRedirectUrl="/onboarding"
          localization={{
            signUp: {
              emailCode: {
                subtitle: "Enter the code sent to {{identifier}}. Note: If you can't find it, check your junk box."
              }
            },
            signIn: {
              emailCode: {
                subtitle: "Enter the code sent to {{identifier}}. Note: If you can't find it, check your junk box."
              }
            }
          }}
        >
          {children}
        </ClerkProvider>
      );
    } catch (error) {
      console.error("ClerkProvider error:", error);
      return <>{children}</>;
    }
  }

  console.warn("Clerk publishable key not found. Check your .env file in the frontend folder.");
  return <>{children}</>;
}

