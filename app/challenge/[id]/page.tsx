import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChallengeClient } from "./ui/ChallengeClient";

function startOfTodayUtcIso() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T00:00:00.000Z`;
}

export default async function ChallengePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { vlog?: string; posted?: string; streak?: string };
}) {
  const supabase = createSupabaseServerClient();
  const challengeId = params?.id?.trim?.();

  if (!challengeId) redirect("/dashboard");

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

  // Fetch challenge directly
  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("challenge_members")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Must have challenge AND (be a member OR challenge is public)
  if (!challenge) redirect("/dashboard");
  if (!membership && !(challenge as { is_public?: boolean }).is_public) redirect("/dashboard");

  // Members
  const { data: members } = await supabase
    .from("challenge_members")
    .select("id, role, current_streak, longest_streak, total_vlogs, total_points, users ( id, username, display_name, avatar_url )")
    .eq("challenge_id", challengeId);

  const memberList = (members ?? []).map((m: Record<string, unknown>) => {
    const u = m.users as Record<string, unknown> | null;
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
  });

  const todayStart = startOfTodayUtcIso();
  const today = new Date();
  const ch = challenge as Record<string, unknown>;
  const endDate = ch.end_date ? new Date(ch.end_date as string) : null;
  const isCompleted = ch.status === "completed" || (endDate && today > endDate);

  // Vlog feed
  const startDate = ch.start_date ? `${String(ch.start_date)}T00:00:00.000Z` : null;
  let vlogQuery = supabase
    .from("vlogs")
    .select("id, user_id, video_url, thumbnail_url, caption, duration_seconds, day_number, created_at, proof_type")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (startDate) vlogQuery = vlogQuery.gte("created_at", startDate);

  const { data: vlogs } = await vlogQuery;

  const vlogList = (vlogs ?? []).map((v: Record<string, unknown>) => ({
    id: v.id as string,
    userId: v.user_id as string,
    videoUrl: (v.video_url ?? null) as string | null,
    thumbnailUrl: (v.thumbnail_url ?? null) as string | null,
    caption: (v.caption ?? null) as string | null,
    durationSeconds: (v.duration_seconds ?? null) as number | null,
    dayNumber: (v.day_number ?? null) as number | null,
    createdAt: v.created_at as string,
    proofType: (v.proof_type ?? "vlog") as "vlog" | "selfie" | "checkin"
  }));

  const vlogIds = vlogList.map((v) => v.id);
  const reactionCounts: Record<string, Record<string, number>> = {};
  if (vlogIds.length > 0) {
    const { data: reactions } = await supabase.from("reactions").select("vlog_id, emoji").in("vlog_id", vlogIds);
    for (const r of reactions ?? []) {
      const row = r as { vlog_id: string; emoji: string };
      reactionCounts[row.vlog_id] ||= {};
      reactionCounts[row.vlog_id][row.emoji] = (reactionCounts[row.vlog_id][row.emoji] ?? 0) + 1;
    }
  }

  const yourMembership = memberList.find((m) => m.userId === user.id) ?? null;
  const todayStartMs = new Date(todayStart).getTime();
  const youPostedToday = vlogList.some(
    (v) => v.userId === user.id && new Date(v.createdAt).getTime() >= todayStartMs
  );

  return (
    <ChallengeClient
      initialOpenVlogId={searchParams?.vlog ?? null}
      postedToast={
        searchParams?.posted ? { type: searchParams.posted as "vlog" | "selfie", streak: searchParams?.streak } : null
      }
      todayStartIso={todayStart}
      viewer={{
        id: user.id,
        username: profile.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: profile.avatar_url ?? null
      }}
      challenge={{
        id: (ch.id ?? "") as string,
        title: (ch.title ?? "") as string,
        durationDays: (ch.duration_days ?? 0) as number,
        startDate: (ch.start_date ?? "") as string,
        endDate: (ch.end_date ?? "") as string,
        inviteCode: (ch.invite_code ?? "") as string,
        createdBy: (ch.created_by ?? "") as string,
        isPublic: (ch.is_public ?? false) as boolean,
        status: (ch.status ?? "active") as string,
        parentChallengeId: (ch.parent_challenge_id ?? null) as string | null
      }}
      members={memberList}
      initialFeed={{ vlogs: vlogList, reactionCounts }}
      yourMembership={yourMembership}
      youPostedToday={youPostedToday}
      isCompleted={!!isCompleted}
    />
  );
}
