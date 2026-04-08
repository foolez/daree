import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const challengeId =
    typeof body.challenge_id === "string" ? body.challenge_id.trim() : "";
  if (!challengeId) {
    return NextResponse.json({ error: "challenge_id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("wrapped_views").upsert(
    {
      challenge_id: challengeId,
      user_id: user.id
    },
    { onConflict: "challenge_id,user_id", ignoreDuplicates: true }
  );
  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
