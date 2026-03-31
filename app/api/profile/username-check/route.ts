import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ available: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim().replace(/^@/, "").toLowerCase().slice(0, 50);

  if (!username || username.length < 2) {
    return NextResponse.json({ available: false, error: "Username too short" }, { status: 200 });
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, error: "Invalid characters" }, { status: 200 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  const isOwn = existing?.id === user.id;
  const available = !existing || isOwn;

  return NextResponse.json({ available, isOwn }, { status: 200 });
}
