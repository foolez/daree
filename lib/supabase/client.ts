import { createBrowserClient } from "@supabase/ssr";

function isValidHttpUrl(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Only used when env is missing or URL is not a real http(s) URL (e.g. CI placeholder text). Real deploys must set NEXT_PUBLIC_SUPABASE_* so values are inlined. */
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasValidPair =
    isValidHttpUrl(url) && typeof key === "string" && key.trim().length > 0;
  if (hasValidPair) {
    return createBrowserClient(url!.trim(), key.trim());
  }
  console.error(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing/invalid. Using fallback client."
  );
  return createBrowserClient(FALLBACK_URL, FALLBACK_ANON_KEY);
}
