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

  const { data: vlogRows, error: vlogSelectError } = await supabase
    .from("vlogs")
    .select("id")
    .eq("challenge_id", params.id);
  if (vlogSelectError) {
    return NextResponse.json(
      { error: vlogSelectError.message, details: vlogSelectError },
      { status: 500 }
    );
  }
  const vlogIds = (vlogRows ?? []).map((v: any) => v.id as string);

  if (vlogIds.length > 0) {
    const { error: reactionsError } = await supabase
      .from("reactions")
      .delete()
      .in("vlog_id", vlogIds);
    if (reactionsError) {
      return NextResponse.json(
        { error: reactionsError.message, details: reactionsError },
        { status: 500 }
      );
    }

    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .in("vlog_id", vlogIds);
    if (commentsError) {
      return NextResponse.json(
        { error: commentsError.message, details: commentsError },
        { status: 500 }
      );
    }
  }

  const { error: vlogsError } = await supabase
    .from("vlogs")
    .delete()
    .eq("challenge_id", params.id);
  if (vlogsError) {
    return NextResponse.json({ error: vlogsError.message, details: vlogsError }, { status: 500 });
  }

  const { error: membersError } = await supabase
    .from("challenge_members")
    .delete()
    .eq("challenge_id", params.id);
  if (membersError) {
    return NextResponse.json(
      { error: membersError.message, details: membersError },
      { status: 500 }
    );
  }

  await supabase.from("wrapped_views").delete().eq("challenge_id", params.id);
  await supabase.from("join_requests").delete().eq("challenge_id", params.id);

  // Best effort cleanup for challenge-related notifications.
  await supabase
    .from("notifications")
    .delete()
    .or(`message.ilike.%${params.id}%,title.ilike.%${challenge.id}%`);

  const { error: challengeError } = await supabase
    .from("challenges")
    .delete()
    .eq("id", params.id);
  if (challengeError) {
    return NextResponse.json(
      { error: challengeError.message, details: challengeError },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
