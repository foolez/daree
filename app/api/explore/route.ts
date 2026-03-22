import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function startOfTodayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

function startOf24hAgoIso() {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export async function GET(_request: Request) {
  const supabase = createSupabaseServerClient();
  const todayStart = startOfTodayIso();
  const dayAgoStart = startOf24hAgoIso();

  const { data: publicChallenges } = await supabase
    .from("challenges")
    .select("id, title, duration_days, start_date, end_date, created_by")
    .eq("is_public", true)
    .neq("status", "completed");

  const challengeIds = (publicChallenges ?? []).map((c: any) => c.id);
  if (challengeIds.length === 0) {
    return NextResponse.json({
      trendingVlogs: [],
      publicChallenges: [],
      creators: {}
    });
  }

  const { data: vlogs } = await supabase
    .from("vlogs")
    .select("id, user_id, video_url, thumbnail_url, proof_type, created_at, challenge_id")
    .in("challenge_id", challengeIds)
    .gte("created_at", dayAgoStart)
    .order("created_at", { ascending: false })
    .limit(50);

  const vlogIds = (vlogs ?? []).map((v: any) => v.id);
  let reactionCounts: Record<string, number> = {};
  if (vlogIds.length > 0) {
    const { data: reactions } = await supabase
      .from("reactions")
      .select("vlog_id")
      .in("vlog_id", vlogIds);
    for (const r of reactions ?? []) {
      reactionCounts[r.vlog_id as string] = (reactionCounts[r.vlog_id as string] ?? 0) + 1;
    }
  }

  const trendingVlogs = (vlogs ?? [])
    .sort((a: any, b: any) => (reactionCounts[b.id] ?? 0) - (reactionCounts[a.id] ?? 0))
    .slice(0, 20)
    .map((v: any) => ({
      id: v.id,
      userId: v.user_id,
      videoUrl: v.video_url,
      thumbnailUrl: v.thumbnail_url,
      proofType: v.proof_type ?? "vlog",
      createdAt: v.created_at,
      challengeId: v.challenge_id,
      reactionCount: reactionCounts[v.id] ?? 0
    }));

  const userIds = [...new Set([...(vlogs ?? []).map((v: any) => v.user_id), ...(publicChallenges ?? []).map((c: any) => c.created_by)])];
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, username, display_name, avatar_url").in("id", userIds)
    : { data: [] };

  const creators: Record<string, { username: string; displayName: string | null; avatarUrl: string | null }> = {};
  for (const u of users ?? []) {
    creators[u.id as string] = {
      username: (u.username ?? "") as string,
      displayName: (u.display_name ?? null) as string | null,
      avatarUrl: (u.avatar_url ?? null) as string | null
    };
  }

  const todayVlogCounts: Record<string, number> = {};
  for (const v of vlogs ?? []) {
    const cid = v.challenge_id as string;
    if ((v.created_at as string) >= todayStart) {
      todayVlogCounts[cid] = (todayVlogCounts[cid] ?? 0) + 1;
    }
  }

  const { data: memberCounts } = await supabase
    .from("challenge_members")
    .select("challenge_id")
    .in("challenge_id", challengeIds);
  const membersByChallenge: Record<string, number> = {};
  for (const m of memberCounts ?? []) {
    const cid = m.challenge_id as string;
    membersByChallenge[cid] = (membersByChallenge[cid] ?? 0) + 1;
  }

  const today = new Date();
  const publicChallengesList = (publicChallenges ?? [])
    .map((c: any) => {
      const endDate = new Date(c.end_date);
      const startDate = new Date(c.start_date);
      const dayNumber = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);
      return {
        id: c.id,
        title: c.title,
        durationDays: c.duration_days,
        startDate: c.start_date,
        endDate: c.end_date,
        createdBy: c.created_by,
        memberCount: membersByChallenge[c.id] ?? 0,
        vlogsToday: todayVlogCounts[c.id] ?? 0,
        dayNumber: Math.min(dayNumber, c.duration_days)
      };
    })
    .sort((a: any, b: any) => (b.vlogsToday ?? 0) - (a.vlogsToday ?? 0));

  return NextResponse.json({
    trendingVlogs,
    publicChallenges: publicChallengesList,
    creators
  });
}
