import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function dayNumber(startDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const bu = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(1, Math.floor((bu - au) / day) + 1);
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const challenge_id = String(body.challenge_id || "");

  if (!challenge_id) {
    return NextResponse.json({ error: "challenge_id is required." }, { status: 400 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, start_date")
    .eq("id", challenge_id)
    .maybeSingle();

  if (challengeError || !challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const dn = dayNumber(challenge.start_date);

  const { error: insertError } = await supabase.from("vlogs").insert({
    challenge_id,
    user_id: user.id,
    video_url: null,
    proof_type: "checkin",
    caption: null,
    day_number: dn
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not save check-in." }, { status: 500 });
  }

  const { data: member } = await supabase
    .from("challenge_members")
    .select("id, current_streak, longest_streak, total_vlogs")
    .eq("challenge_id", challenge_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (member) {
    const nextStreak = (member.current_streak ?? 0) + 1;
    const nextLongest = Math.max(member.longest_streak ?? 0, nextStreak);
    await supabase
      .from("challenge_members")
      .update({
        total_vlogs: (member.total_vlogs ?? 0) + 1,
        current_streak: nextStreak,
        longest_streak: nextLongest
      })
      .eq("id", member.id);
  }

  return NextResponse.json(
    { success: true, day_number: dn, current_streak: member ? (member.current_streak ?? 0) + 1 : null },
    { status: 200 }
  );
}
