import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./ui/DashboardClient";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  function startOfTodayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
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

  const { data: memberships } = await supabase
    .from("challenge_members")
    .select(
      `
      challenge_id,
      role,
      current_streak,
      total_vlogs,
      challenges (
        id,
        title,
        duration_days,
        start_date,
        end_date
      )
    `
    )
    .eq("user_id", user.id);

  const challenges =
    memberships
      ?.map((m: any) => ({
        id: m.challenges?.id ?? m.challenge_id,
        title: m.challenges?.title ?? "Untitled Dare",
        duration_days: m.challenges?.duration_days ?? 0,
        start_date: m.challenges?.start_date ?? null,
        end_date: m.challenges?.end_date ?? null,
        member_count: null as number | null, // filled later
        your_streak: m.current_streak ?? 0
      }))
      .filter((c) => !!c.id) ?? [];

  const todayStartIso = startOfTodayIso();

  // Doom clock: has the user posted a vlog today?
  const { count: youPostedCount } = await supabase
    .from("vlogs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayStartIso);

  const youPostedToday = (youPostedCount ?? 0) > 0;

  // Friend activity feed: accepted friend requests + posted today status
  const { data: friendReqRows } = await supabase
    .from("friend_requests")
    .select("from_user_id,to_user_id")
    .eq("status", "accepted")
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

  const friendIds = new Set<string>();
  for (const row of friendReqRows ?? []) {
    const fromId = row.from_user_id as string;
    const toId = row.to_user_id as string;
    if (fromId === user.id) friendIds.add(toId);
    else friendIds.add(fromId);
  }

  const friendIdList = Array.from(friendIds);
  const { data: friendUsers } = await supabase
    .from("users")
    .select("id,username,display_name,avatar_url")
    .in("id", friendIdList);

  const { data: friendVlogs } = await supabase
    .from("vlogs")
    .select("user_id")
    .in("user_id", friendIdList)
    .gte("created_at", todayStartIso);

  const postedFriendIds = new Set<string>(
    (friendVlogs ?? []).map((v: any) => v.user_id as string)
  );

  const friends =
    friendUsers?.map((u: any) => ({
      userId: u.id as string,
      username: (u.username ?? "") as string,
      displayName: (u.display_name ?? "") as string,
      avatarUrl: (u.avatar_url ?? null) as string | null,
      postedToday: postedFriendIds.has(u.id as string)
    })) ?? [];

  // Global Top 5 leaderboard: max longest_streak per user
  const { data: allMemberships } = await supabase
    .from("challenge_members")
    .select(
      `
        user_id,
        longest_streak,
        users (
          username,
          display_name,
          avatar_url
        )
      `
    );

  const leaderboardMap = new Map<
    string,
    {
      userId: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      longestStreak: number;
    }
  >();

  for (const row of allMemberships ?? []) {
    const uId = row.user_id as string;
    const longest = (row.longest_streak ?? 0) as number;
    const u = row.users as any | null;
    const username = (u?.username ?? "") as string;
    const displayName = (u?.display_name ?? null) as string | null;
    const avatarUrl = (u?.avatar_url ?? null) as string | null;

    const prev = leaderboardMap.get(uId);
    if (!prev) {
      leaderboardMap.set(uId, {
        userId: uId,
        username,
        displayName,
        avatarUrl,
        longestStreak: longest
      });
    } else if (longest > prev.longestStreak) {
      prev.longestStreak = longest;
    }
  }

  const globalTop5 = Array.from(leaderboardMap.values())
    .sort((a, b) => b.longestStreak - a.longestStreak)
    .slice(0, 5);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <div className="max-w-md mx-auto">
      <DashboardClient
        profile={{
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url ?? null
        }}
        initialChallenges={challenges}
        initialUnreadCount={unreadCount ?? 0}
        youPostedToday={youPostedToday}
        friends={friends}
        globalTop5={globalTop5}
      />
    </div>
  );
}

