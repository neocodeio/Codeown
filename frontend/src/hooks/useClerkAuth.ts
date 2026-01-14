import { useAuth } from "@clerk/clerk-react";
import { isClerkEnabled } from "../lib/clerk";

// Always call the hook (React rules), but handle errors
let authHook: ReturnType<typeof useAuth> | null = null;

export function useClerkAuth() {
  if (!isClerkEnabled) {
    return {
      getToken: async () => null,
      isLoaded: false,
      userId: null,
      isSignedIn: false,
      signOut: async () => {},
    };
  }
  
  // Always call the hook - React requires this
  const auth = useAuth();
  return auth;
}

