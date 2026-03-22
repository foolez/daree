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

  const url = new URL(request.url);
  const challengeId = url.searchParams.get("challenge_id");

  if (!challengeId) {
    return NextResponse.json({ error: "challenge_id required" }, { status: 400 });
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, is_public, created_by")
    .eq("id", challengeId)
    .maybeSingle();

  if (!challenge || !challenge.is_public) {
    return NextResponse.json({ error: "Challenge not found or not public" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("challenge_members")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("join_requests").upsert(
    { challenge_id: challengeId, user_id: user.id, status: "pending" },
    { onConflict: "challenge_id,user_id" }
  );

  if (insertError) {
    return NextResponse.json({ error: "Could not send request" }, { status: 500 });
  }

  const { data: requester } = await supabase
    .from("users")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const requesterName = requester?.display_name || requester?.username || "Someone";

  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: challenge.created_by,
    sender_id: user.id,
    type: "join_request",
    title: "Join request",
    message: `${requesterName} wants to join your dare`
  } as any);

  if (notifError) {
    console.error("[request-join] notification insert failed", notifError);
  }

  return NextResponse.json({ success: true });
}
