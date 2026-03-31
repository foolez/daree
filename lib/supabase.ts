import { createClient } from "@supabase/supabase-js";

function isValidHttpUrl(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function tryCreateClient() {
  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey?.trim()) return null;
  try {
    return createClient(supabaseUrl!.trim(), supabaseAnonKey.trim());
  } catch {
    return null;
  }
}

export const supabase = tryCreateClient();

