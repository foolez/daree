import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const invite_code =
    typeof body.invite_code === "string" ? body.invite_code.trim().toUpperCase() : "";

  if (invite_code.length !== 6) {
    return NextResponse.json(
      { error: "Invite code must be 6 characters." },
      { status: 400 }
    );
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id")
    .eq("invite_code", invite_code)
    .maybeSingle();

  if (challengeError) {
    return NextResponse.json(
      { error: "Could not look up challenge." },
      { status: 500 }
    );
  }

  if (!challenge) {
    return NextResponse.json(
      { error: "No dare found with this code. Check and try again." },
      { status: 404 }
    );
  }

  const { data: existing } = await supabase
    .from("challenge_members")
    .select("id")
    .eq("challenge_id", challenge.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You're already in this dare!" },
      { status: 409 }
    );
  }

  const { error: joinError } = await supabase.from("challenge_members").insert({
    challenge_id: challenge.id,
    user_id: user.id,
    role: "member"
  });

  if (joinError) {
    return NextResponse.json({ error: "Could not join dare." }, { status: 500 });
  }

  return NextResponse.json({ challenge_id: challenge.id }, { status: 200 });
}

