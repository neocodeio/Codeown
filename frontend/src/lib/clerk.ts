// Get the environment variable - check multiple ways
const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY ||
  "";

// Trim whitespace and check if it's a valid key
const trimmedKey = typeof envKey === "string" ? envKey.trim() : "";

// Debug logging
console.log("Clerk Environment Check:", {
  rawValue: envKey,
  trimmedValue: trimmedKey,
  hasKey: !!trimmedKey,
  keyLength: trimmedKey.length,
  keyPreview: trimmedKey ? `${trimmedKey.substring(0, 20)}...` : "undefined",
  allViteEnvKeys: Object.keys(import.meta.env).filter(k => k.startsWith("VITE_")),
  allEnvKeys: Object.keys(import.meta.env)
});

export const clerkPublishableKey = trimmedKey;
// More lenient check - just verify it's not empty
export const isClerkEnabled = trimmedKey.length > 0;