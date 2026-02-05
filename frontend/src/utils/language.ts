export type LanguageCode = "en" | "ar";

export function normalizeLanguage(input?: string | null): LanguageCode {
  const raw = String(input ?? "").trim().toLowerCase();
  if (raw === "ar" || raw === "arabic") return "ar";
  return "en";
}
