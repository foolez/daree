import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_PREFS = {
  vlogs: true,
  reactions: true,
  comments: true,
  nudges: true,
  streaks: true,
  weekly_recap: true
};

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data } = await supabase
    .from("users")
    .select("notification_preferences, is_profile_public, show_in_leaderboard, allow_friend_requests")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (data?.notification_preferences as Record<string, boolean>) ?? DEFAULT_PREFS;
  return NextResponse.json({
    notification_preferences: { ...DEFAULT_PREFS, ...prefs },
    is_profile_public: data?.is_profile_public ?? true,
    show_in_leaderboard: data?.show_in_leaderboard ?? true,
    allow_friend_requests: data?.allow_friend_requests ?? true
  });
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

  const updates: Record<string, unknown> = {};

  if (typeof body.notification_preferences === "object") {
    updates.notification_preferences = body.notification_preferences;
  }
  if (typeof body.is_profile_public === "boolean") {
    updates.is_profile_public = body.is_profile_public;
  }
  if (typeof body.show_in_leaderboard === "boolean") {
    updates.show_in_leaderboard = body.show_in_leaderboard;
  }
  if (typeof body.allow_friend_requests === "boolean") {
    updates.allow_friend_requests = body.allow_friend_requests;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
