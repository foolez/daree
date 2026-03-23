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
  searchParams: { vlog?: string };
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

  // Fetch challenge (via membership or direct for public)
  const { data: membershipRow } = await supabase
    .from("challenge_members")
    .select("challenge_id, challenges (*)")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  let challenge = (membershipRow as { challenges?: Record<string, unknown> })?.challenges ?? null;

  if (!challenge) {
    const { data: pub } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("is_public", true)
      .maybeSingle();
    challenge = pub;
  }

  if (!challenge) redirect("/dashboard");

  // Members
  const { data: members } = await supabase
    .from("challenge_members")
    .select("id, role, current_streak, longest_streak, total_vlogs, total_points, users ( id, username, display_name, avatar_url )")
    .eq("challenge_id", challengeId);

  const memberList = (members ?? []).map((m: Record<string, unknown>) => {
    const u = m.users as Record<string, unknown> | null;
    return {
      membershipId: m.id,
      userId: u?.id ?? "",
      username: u?.username ?? "",
      displayName: u?.display_name ?? "",
      avatarUrl: u?.avatar_url ?? null,
      role: m.role ?? "member",
      currentStreak: m.current_streak ?? 0,
      totalVlogs: m.total_vlogs ?? 0,
      totalPoints: m.total_points ?? 0
    };
  });

  const todayStart = startOfTodayUtcIso();
  const today = new Date();
  const endDate = challenge.end_date ? new Date(challenge.end_date as string) : null;
  const isCompleted = challenge.status === "completed" || (endDate && today > endDate);

  // Vlog feed
  const startDate = challenge.start_date ? `${challenge.start_date}T00:00:00.000Z` : null;
  let vlogQuery = supabase
    .from("vlogs")
    .select("id, user_id, video_url, thumbnail_url, caption, duration_seconds, day_number, created_at, proof_type")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (startDate) vlogQuery = vlogQuery.gte("created_at", startDate);

  const { data: vlogs } = await vlogQuery;

  const vlogList = (vlogs ?? []).map((v: Record<string, unknown>) => ({
    id: v.id,
    userId: v.user_id,
    videoUrl: v.video_url ?? null,
    thumbnailUrl: v.thumbnail_url ?? null,
    caption: v.caption ?? null,
    durationSeconds: v.duration_seconds ?? null,
    dayNumber: v.day_number ?? null,
    createdAt: v.created_at,
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
      initialFeed={{ vlogs: vlogList, reactionCounts }}
      yourMembership={yourMembership}
      youPostedToday={youPostedToday}
      isCompleted={!!isCompleted}
    />
  );
}
