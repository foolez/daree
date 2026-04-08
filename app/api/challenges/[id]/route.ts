import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("id, title, description, goal_type, duration_days, start_date, end_date, is_public")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  return NextResponse.json(challenge);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, created_by")
    .eq("id", params.id)
    .maybeSingle();

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }
  if (challenge.created_by !== user.id) {
    return NextResponse.json({ error: "Only creator can delete" }, { status: 403 });
  }

  const { error } = await supabase.from("challenges").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
