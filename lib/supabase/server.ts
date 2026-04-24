import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

export function createSupabaseServerClient() {
  const { url, anon } = getPublicSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot mutate cookies during render; middleware / route handlers refresh session.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Same as set — only Server Actions / Route Handlers may write cookies.
        }
      }
    }
  });
}

