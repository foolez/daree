import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const display_name = typeof body.display_name === "string" ? body.display_name.trim().slice(0, 100) : undefined;
  const username = typeof body.username === "string" ? body.username.trim().replace(/^@/, "").toLowerCase().slice(0, 50) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 150) : undefined;

  const updates: Record<string, unknown> = {};
  if (display_name !== undefined) updates.display_name = display_name || null;
  if (bio !== undefined) updates.bio = bio || null;

  if (username !== undefined) {
    if (!/^[a-z0-9_]+$/.test(username) || username.length < 2) {
      return NextResponse.json({ error: "Username must be 2+ chars, lowercase letters, numbers, underscore" }, { status: 400 });
    }
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Username is taken" }, { status: 400 });
    }
    updates.username = username;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
