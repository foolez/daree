import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function startOfTodayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

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

  const todayStart = startOfTodayIso();
  const { data: vlogs, error: vlogError } = await supabase
    .from("vlogs")
    .select("id, user_id, video_url, thumbnail_url, caption, duration_seconds, day_number, created_at, proof_type")
    .eq("challenge_id", params.id)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false });

  if (vlogError) {
    return NextResponse.json({ error: "Could not load feed." }, { status: 500 });
  }

  const vlogList =
    vlogs?.map((v: any) => ({
      id: v.id as string,
      userId: v.user_id as string,
      videoUrl: (v.video_url ?? null) as string | null,
      thumbnailUrl: (v.thumbnail_url ?? null) as string | null,
      caption: (v.caption ?? null) as string | null,
      durationSeconds: (v.duration_seconds ?? null) as number | null,
      dayNumber: (v.day_number ?? null) as number | null,
      createdAt: v.created_at as string,
      proofType: (v.proof_type ?? "vlog") as "vlog" | "selfie" | "checkin"
    })) ?? [];

  const vlogIds = vlogList.map((v) => v.id);
  let reactionCounts: Record<string, Record<string, number>> = {};
  if (vlogIds.length > 0) {
    const { data: reactions } = await supabase
      .from("reactions")
      .select("vlog_id, emoji")
      .in("vlog_id", vlogIds);

    for (const r of (reactions as any) ?? []) {
      reactionCounts[r.vlog_id] ||= {};
      reactionCounts[r.vlog_id][r.emoji] =
        (reactionCounts[r.vlog_id][r.emoji] ?? 0) + 1;
    }
  }

  return NextResponse.json({ vlogs: vlogList, reactionCounts }, { status: 200 });
}

