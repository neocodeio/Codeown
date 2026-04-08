import { useAuth } from "@clerk/clerk-react";
import { isClerkEnabled } from "../lib/clerk";
import { useCallback, useMemo } from "react";

export function useClerkAuth() {
  const mockGetToken = useCallback(async () => null, []);
  const mockSignOut = useCallback(async () => { }, []);

  const mockAuth = useMemo(() => ({
    getToken: mockGetToken,
    isLoaded: true, // Set to true to avoid infinite loading screens in mock mode
    userId: "mock_user",
    isSignedIn: true,
    signOut: mockSignOut,
  }), [mockGetToken, mockSignOut]);

  // Always call the hook - React requires this
  const auth = useAuth();

  if (!isClerkEnabled) {
    return mockAuth;
  }

  return auth;
}

