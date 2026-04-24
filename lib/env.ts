/**
 * Central place for public env used by the app. Fails fast in production if misconfigured.
 * In development, returns Supabase demo placeholders if unset (same idea as @/lib/supabase/client).
 */
const DEV_FALLBACK_URL = "https://placeholder.supabase.co";
const DEV_FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export function getPublicSupabaseEnv(): { url: string; anon: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (url && anon) {
    return { url, anon };
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure in Vercel / hosting."
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    "[Daree] Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (using dev placeholder)."
  );
  return { url: DEV_FALLBACK_URL, anon: DEV_FALLBACK_ANON };
}

export function isPublicSupabaseConfigured(): boolean {
  const u = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const k = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return u.length > 0 && k.length > 0;
}
