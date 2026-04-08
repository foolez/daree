import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WrappedClient } from "./ui/WrappedClient";

export default async function WrappedPage({
  params
}: {
  params: { id: string };
}) {
  function userRow(entry: any) {
    if (!entry?.users) return null;
    return Array.isArray(entry.users) ? entry.users[0] ?? null : entry.users;
  }

  const supabase = createSupabaseServerClient();
  const challengeId = params?.id;

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

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, title, duration_days, start_date, end_date, status, created_by")
    .eq("id", challengeId)
    .maybeSingle();
  if (!challenge) redirect("/dashboard");

  const { data: membership } = await supabase
    .from("challenge_members")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) redirect(`/challenge/${challengeId}`);

  const { data: members } = await supabase
    .from("challenge_members")
    .select("user_id, total_points, longest_streak, users(username, display_name, avatar_url)")
    .eq("challenge_id", challengeId);

  const sortedMembers = [...(members ?? [])].sort(
    (a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0)
  );
  const yourRank =
    Math.max(
      0,
      sortedMembers.findIndex((m: any) => m.user_id === user.id)
    ) + 1;
  const winner = sortedMembers[0] as any | undefined;
  const yourMember = sortedMembers.find((m: any) => m.user_id === user.id) as
    | any
    | undefined;

  const { data: vlogs } = await supabase
    .from("vlogs")
    .select("user_id, created_at, proof_type")
    .eq("challenge_id", challengeId);

  const yourVlogs = (vlogs ?? []).filter((v: any) => v.user_id === user.id);
  const totalPosts = yourVlogs.length;
  const uniqueDays = new Set(
    yourVlogs.map((v: any) => String(v.created_at).slice(0, 10))
  );
  const daysCompleted = uniqueDays.size;
  const yourLongestStreak = Number(yourMember?.longest_streak ?? 0);
  const yourPoints = Number(yourMember?.total_points ?? 0);

  const allDates = (vlogs ?? []).map((v: any) => new Date(v.created_at));
  const weekdayCounts = new Map<string, number>();
  allDates.forEach((d) => {
    const k = d.toLocaleDateString("en-US", { weekday: "long" });
    weekdayCounts.set(k, (weekdayCounts.get(k) ?? 0) + 1);
  });
  const mostConsistentDay =
    [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const postsByUserDay = new Map<string, number>();
  (vlogs ?? []).forEach((v: any) => {
    const key = `${v.user_id}:${String(v.created_at).slice(0, 10)}`;
    postsByUserDay.set(key, (postsByUserDay.get(key) ?? 0) + 1);
  });
  const maxPostsEntry = [...postsByUserDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const [maxUserId = "", maxCount = 0] = maxPostsEntry ?? [];
  const maxUser = sortedMembers.find((m: any) => m.user_id === maxUserId);
  const maxUserProfile = userRow(maxUser);
  const maxUserName =
    maxUserProfile?.display_name || maxUserProfile?.username || "Unknown";

  const { data: reactions } = await supabase
    .from("reactions")
    .select("id")
    .in(
      "vlog_id",
      (await supabase
        .from("vlogs")
        .select("id")
        .eq("challenge_id", challengeId)).data?.map((r: any) => r.id) ?? []
    );

  return (
    <WrappedClient
      challengeId={challenge.id}
      challengeTitle={challenge.title}
      durationDays={challenge.duration_days}
      yourRank={yourRank}
      memberCount={sortedMembers.length}
      yourPoints={yourPoints}
      yourDaysCompleted={daysCompleted}
      yourTotalPosts={totalPosts}
      yourLongestStreak={yourLongestStreak}
      winner={{
        name: userRow(winner)?.display_name || userRow(winner)?.username || "Unknown",
        avatarUrl: userRow(winner)?.avatar_url ?? null,
        points: Number(winner?.total_points ?? 0),
        isYou: winner?.user_id === user.id
      }}
      funFacts={{
        mostPostsInADay: Number(maxCount ?? 0),
        mostPostsUser: maxUserName,
        totalReactions: reactions?.length ?? 0,
        mostConsistentDay,
        longestGroupStreak: Math.max(
          0,
          ...sortedMembers.map((m: any) => Number(m.longest_streak ?? 0))
        )
      }}
    />
  );
}
