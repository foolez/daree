/**
 * Challenge detail — /challenge/[id]
 * Server page: auth, load challenge + members + vlog feed from Supabase, render ChallengeClient.
 */
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChallengeClient } from "./ui/ChallengeClient";

function startOfTodayUtcIso() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
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
  const challengeId = params?.id?.trim?.();

  if (!challengeId || challengeId === "undefined" || challengeId === "null") {
    redirect("/dashboard");
  }

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

  // Member path first (matches dashboard) — avoids RLS blocking direct challenges reads
  const { data: membershipRow } = await supabase
    .from("challenge_members")
    .select(
      `
      challenge_id,
      challenges (
        id, title, duration_days, start_date, end_date, invite_code,
        created_by, is_public, status, parent_challenge_id
      )
    `
    )
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  let challenge = (membershipRow as { challenges?: Record<string, unknown> } | null)?.challenges ?? null;

  if (!challenge) {
    const { data: publicChallenge } = await supabase
      .from("challenges")
      .select(
        "id, title, duration_days, start_date, end_date, invite_code, created_by, is_public, status, parent_challenge_id"
      )
      .eq("id", challengeId)
      .eq("is_public", true)
      .maybeSingle();
    challenge = publicChallenge;
  }

  if (!challenge) redirect("/dashboard");

  const { data: members } = await supabase
    .from("challenge_members")
    .select(
      `id, role, current_streak, longest_streak, total_vlogs, total_points, joined_at,
       users ( id, username, display_name, avatar_url )`
    )
    .eq("challenge_id", challengeId);

  const memberList =
    members?.map((m: Record<string, unknown>) => {
      const u = m.users as Record<string, unknown> | null | undefined;
      return {
        membershipId: m.id as string,
        userId: (u?.id ?? "") as string,
        username: (u?.username ?? "") as string,
        displayName: (u?.display_name ?? "") as string,
        avatarUrl: (u?.avatar_url ?? null) as string | null,
        role: (m.role ?? "member") as string,
        currentStreak: (m.current_streak ?? 0) as number,
        totalVlogs: (m.total_vlogs ?? 0) as number,
        totalPoints: (m.total_points ?? 0) as number
      };
    }) ?? [];

  const todayStart = startOfTodayUtcIso();
  const today = new Date();
  const endDate = challenge.end_date ? new Date(challenge.end_date as string) : null;
  const isCompleted =
    challenge.status === "completed" || (endDate != null && today > endDate);

  // Full feed: recent proofs for this challenge (not only today)
  const challengeStart = challenge.start_date
    ? `${String(challenge.start_date)}T00:00:00.000Z`
    : null;

  let vlogQuery = supabase
    .from("vlogs")
    .select(
      "id, user_id, video_url, thumbnail_url, caption, duration_seconds, day_number, created_at, proof_type"
    )
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (challengeStart) {
    vlogQuery = vlogQuery.gte("created_at", challengeStart);
  }

  const { data: vlogs } = await vlogQuery;

  const vlogList =
    vlogs?.map((v: Record<string, unknown>) => ({
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
    reactionRows = (reactions as { vlog_id: string; emoji: string }[]) ?? [];
  }

  const reactionCounts: Record<string, Record<string, number>> = {};
  for (const r of reactionRows) {
    reactionCounts[r.vlog_id] ||= {};
    reactionCounts[r.vlog_id][r.emoji] = (reactionCounts[r.vlog_id][r.emoji] ?? 0) + 1;
  }

  const yourMembership = memberList.find((m) => m.userId === user.id) ?? null;
  const youPostedToday = vlogList.some(
    (v) => v.userId === user.id && new Date(v.createdAt).getTime() >= new Date(todayStart).getTime()
  );

  return (
    <ChallengeClient
      initialOpenVlogId={searchParams?.vlog ?? null}
      todayStartIso={todayStart}
      viewer={{
        id: user.id,
        username: profile.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: profile.avatar_url ?? null
      }}
      challenge={{
        id: challenge.id as string,
        title: challenge.title as string,
        durationDays: (challenge.duration_days ?? 0) as number,
        startDate: (challenge.start_date ?? "") as string,
        endDate: (challenge.end_date ?? "") as string,
        inviteCode: (challenge.invite_code ?? "") as string,
        createdBy: (challenge.created_by ?? "") as string,
        isPublic: (challenge.is_public ?? false) as boolean,
        status: (challenge.status ?? "active") as string,
        parentChallengeId: (challenge.parent_challenge_id ?? null) as string | null
      }}
      members={memberList}
      initialFeed={{
        vlogs: vlogList,
        reactionCounts
      }}
      yourMembership={yourMembership}
      youPostedToday={youPostedToday}
      isCompleted={!!isCompleted}
    />
  );
}
