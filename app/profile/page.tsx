import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

function buildRank(totalVlogs: number) {
  if (totalVlogs >= 30) {
    return { label: "Warrior", remaining: 0 };
  }
  if (totalVlogs >= 10) {
    return { label: "Rookie", remaining: 30 - totalVlogs };
  }
  return { label: "Seedling", remaining: 10 - totalVlogs };
}

export default async function ProfilePage() {
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

  const { data: memberships } = await supabase
    .from("challenge_members")
    .select(
      `
      id,
      challenge_id,
      current_streak,
      longest_streak,
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

  const totalDares = memberships?.length ?? 0;
  const currentStreak = memberships
    ? memberships.reduce(
        (max, m: any) => Math.max(max, m.current_streak ?? 0),
        0
      )
    : 0;
  const longestStreak = memberships
    ? memberships.reduce(
        (max, m: any) => Math.max(max, m.longest_streak ?? 0),
        0
      )
    : 0;

  const totalVlogsFromMemberships = memberships
    ? memberships.reduce(
        (sum, m: any) => sum + (m.total_vlogs ?? 0),
        0
      )
    : 0;

  const { count: totalVlogsDirect } = await supabase
    .from("vlogs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalVlogs = totalVlogsDirect ?? totalVlogsFromMemberships ?? 0;

  const challengeIds = (memberships ?? [])
    .map((m: any) => m.challenges?.id ?? m.challenge_id)
    .filter(Boolean);
  const memberCounts = new Map<string, number>();
  if (challengeIds.length > 0) {
    const { data: counts } = await supabase
      .from("challenge_members")
      .select("challenge_id");
    const byChallenge = new Map<string, number>();
    for (const row of counts ?? []) {
      const cid = row.challenge_id as string;
      byChallenge.set(cid, (byChallenge.get(cid) ?? 0) + 1);
    }
    byChallenge.forEach((v, k) => memberCounts.set(k, v));
  }
  const activeChallengesList =
    memberships
      ?.map((m: any) => {
        const cid = m.challenges?.id ?? m.challenge_id;
        if (!cid) return null;
        return {
          id: cid,
          title: m.challenges?.title ?? "Untitled Dare",
          duration_days: m.challenges?.duration_days ?? 0,
          start_date: m.challenges?.start_date ?? null,
          end_date: m.challenges?.end_date ?? null,
          member_count: memberCounts.get(cid) ?? null,
          your_streak: m.current_streak ?? 0
        };
      })
      .filter(Boolean) ?? [];
  const activeChallenges = activeChallengesList as {
    id: string;
    title: string;
    duration_days: number;
    start_date: string | null;
    end_date: string | null;
    member_count: number | null;
    your_streak: number;
  }[];

  // Pending friend requests (to current user)
  let pendingRequests: {
    id: string;
    fromUser: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }[] = [];

  const { data: requestRows, error: requestError } = await supabase
    .from("friend_requests")
    .select("id, sender_id")
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (!requestError && requestRows && requestRows.length > 0) {
    const fromIds = requestRows.map((r: any) => r.sender_id);
    const { data: fromUsers, error: fromUsersError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", fromIds);

    if (!fromUsersError && fromUsers) {
      const byId = new Map(
        fromUsers.map((u: any) => [
          u.id as string,
          {
            id: u.id as string,
            username: (u.username ?? "") as string,
            displayName: (u.display_name ?? null) as string | null,
            avatarUrl: (u.avatar_url ?? null) as string | null
          }
        ])
      );

      pendingRequests = requestRows
        .map((r: any) => {
          const from = byId.get(r.sender_id as string);
          if (!from) return null;
          return { id: r.id as string, fromUser: from };
        })
        .filter(Boolean) as any;
    }
  }

  // Pending friend requests (sent by current user)
  let sentRequests: {
    id: string;
    toUser: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }[] = [];

  const { data: sentRows, error: sentError } = await supabase
    .from("friend_requests")
    .select("id, receiver_id")
    .eq("sender_id", user.id)
    .eq("status", "pending");

  if (!sentError && sentRows && sentRows.length > 0) {
    const toIds = sentRows.map((r: any) => r.receiver_id);
    const { data: toUsers, error: toUsersError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", toIds);

    if (!toUsersError && toUsers) {
      const byId = new Map(
        toUsers.map((u: any) => [
          u.id as string,
          {
            id: u.id as string,
            username: (u.username ?? "") as string,
            displayName: (u.display_name ?? null) as string | null,
            avatarUrl: (u.avatar_url ?? null) as string | null
          }
        ])
      );

      sentRequests = sentRows
        .map((r: any) => {
          const to = byId.get(r.receiver_id as string);
          if (!to) return null;
          return { id: r.id as string, toUser: to };
        })
        .filter(Boolean) as any;
    }
  }

  const today = new Date();
  const sevenDaysAgo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 6
  );

  const { data: recentVlogs } = await supabase
    .from("vlogs")
    .select("id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString());

  const postedByDay = new Set<string>();
  for (const v of recentVlogs ?? []) {
    const d = new Date(v.created_at as string);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    postedByDay.add(key);
  }

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (6 - i)
    );
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const isToday = key === todayKey;
    const isFuture = d > today;
    const shortDay = d.toLocaleDateString(undefined, { weekday: "short" });
    return {
      label: shortDay.charAt(0),
      key,
      posted: postedByDay.has(key),
      isToday,
      isFuture
    };
  });

  const rank = buildRank(totalVlogs);

  async function handleLogout() {
    "use server";
    const supa = createSupabaseServerClient();
    await supa.auth.signOut();
    redirect("/login");
  }

  const pendingForClient = pendingRequests.map((r) => ({
    id: r.id,
    fromUser: {
      username: r.fromUser.username,
      displayName: r.fromUser.displayName,
      avatarUrl: r.fromUser.avatarUrl
    }
  }));

  return (
    <ProfileClient
      profile={{
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url
      }}
      rank={rank}
      totalDares={totalDares}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      totalVlogs={totalVlogs}
      activeChallenges={activeChallenges}
      pendingRequests={pendingForClient}
      last7Days={last7Days}
      handleLogout={handleLogout}
    />
  );
}

