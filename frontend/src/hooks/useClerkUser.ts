import { useUser } from "@clerk/clerk-react";
import { isClerkEnabled } from "../lib/clerk";

export function useClerkUser() {
  if (!isClerkEnabled) {
    return {
      user: null,
      isLoaded: true, // Set to true so UI can render
      isSignedIn: false,
    };
  }
  
  // Always call the hook - React requires this
  const user = useUser();
  return user;
}

