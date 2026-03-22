import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChallengeClient } from "./ui/ChallengeClient";

function startOfTodayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

export default async function ChallengePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { vlog?: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, title, duration_days, start_date, end_date, invite_code, created_by")
    .eq("id", params.id)
    .maybeSingle();

  if (!challenge) redirect("/dashboard");

  const { data: members } = await supabase
    .from("challenge_members")
    .select(
      `id, role, current_streak, longest_streak, total_vlogs, total_points, joined_at,
       users ( id, username, display_name, avatar_url )`
    )
    .eq("challenge_id", params.id);

  const memberList =
    members?.map((m: any) => ({
      membershipId: m.id as string,
      userId: m.users?.id as string,
      username: (m.users?.username ?? "") as string,
      displayName: (m.users?.display_name ?? "") as string,
      avatarUrl: (m.users?.avatar_url ?? null) as string | null,
      role: (m.role ?? "member") as string,
      currentStreak: (m.current_streak ?? 0) as number,
      totalVlogs: (m.total_vlogs ?? 0) as number,
      totalPoints: (m.total_points ?? 0) as number
    })) ?? [];

  // Today’s vlogs for “posted today” status and initial feed.
  const todayStart = startOfTodayIso();
  const { data: vlogs } = await supabase
    .from("vlogs")
    .select(
      `id, user_id, video_url, thumbnail_url, caption, duration_seconds, day_number, created_at, proof_type`
    )
    .eq("challenge_id", params.id)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false });

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
  let reactionRows: { vlog_id: string; emoji: string }[] = [];
  if (vlogIds.length > 0) {
    const { data: reactions } = await supabase
      .from("reactions")
      .select("vlog_id, emoji")
      .in("vlog_id", vlogIds);
    reactionRows = (reactions as any) ?? [];
  }

  const reactionCounts: Record<string, Record<string, number>> = {};
  for (const r of reactionRows) {
    reactionCounts[r.vlog_id] ||= {};
    reactionCounts[r.vlog_id][r.emoji] = (reactionCounts[r.vlog_id][r.emoji] ?? 0) + 1;
  }

  // Find your membership (for streak + “posted today”).
  const yourMembership = memberList.find((m) => m.userId === user.id) ?? null;
  const youPostedToday = vlogList.some((v) => v.userId === user.id);

  return (
    <ChallengeClient
      initialOpenVlogId={searchParams?.vlog ?? null}
      viewer={{
        id: user.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url ?? null
      }}
      challenge={{
        id: challenge.id,
        title: challenge.title,
        durationDays: challenge.duration_days,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        inviteCode: challenge.invite_code,
        createdBy: challenge.created_by
      }}
      members={memberList}
      initialFeed={{
        vlogs: vlogList,
        reactionCounts
      }}
      yourMembership={yourMembership}
      youPostedToday={youPostedToday}
    />
  );
}

