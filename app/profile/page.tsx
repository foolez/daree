import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

function buildRank(totalVlogs: number) {
  if (totalVlogs >= 30) return { label: "Warrior", remaining: 0, nextLabel: "" };
  if (totalVlogs >= 10) return { label: "Rookie", remaining: 30 - totalVlogs, nextLabel: "Warrior" };
  return { label: "Seedling", remaining: Math.max(0, 10 - totalVlogs), nextLabel: "Rookie" };
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
      "id, challenge_id, current_streak, total_vlogs, total_points, challenges (id, title, duration_days, start_date, end_date)"
    )
    .eq("user_id", user.id);

  const totalDares = memberships?.length ?? 0;
  const currentStreak = Math.max(0, ...(memberships ?? []).map((m: any) => m.current_streak ?? 0));
  const totalVlogs = (memberships ?? []).reduce((s: number, m: any) => s + (m.total_vlogs ?? 0), 0);

  const challengeIds = (memberships ?? []).map((m: any) => m.challenges?.id ?? m.challenge_id).filter(Boolean);
  const memberCounts = new Map<string, number>();
  if (challengeIds.length > 0) {
    const { data: counts } = await supabase.from("challenge_members").select("challenge_id");
    for (const row of counts ?? []) {
      const cid = row.challenge_id as string;
      memberCounts.set(cid, (memberCounts.get(cid) ?? 0) + 1);
    }
  }

  const activeChallengesWithRank: {
    id: string;
    title: string;
    yourRank: number;
    totalMembers: number;
  }[] = [];

  for (const m of memberships ?? []) {
    const cid = (m.challenges as any)?.id ?? m.challenge_id;
    if (!cid) continue;
    const { data: allMembers } = await supabase
      .from("challenge_members")
      .select("user_id, total_points")
      .eq("challenge_id", cid);
    const sorted = (allMembers ?? []).sort((a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0));
    const yourIdx = sorted.findIndex((x: any) => x.user_id === user.id);
    activeChallengesWithRank.push({
      id: cid,
      title: (m.challenges as any)?.title ?? "Untitled Dare",
      yourRank: yourIdx >= 0 ? yourIdx + 1 : 0,
      totalMembers: sorted.length
    });
  }

  const { data: friendReqRows } = await supabase
    .from("friend_requests")
    .select("sender_id, receiver_id")
    .eq("status", "accepted")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const friendIds = new Set<string>();
  for (const row of friendReqRows ?? []) {
    const s = row.sender_id as string;
    const r = row.receiver_id as string;
    friendIds.add(s === user.id ? r : s);
  }

  const friendIdList = Array.from(friendIds);
  const { data: friendUsers } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", friendIdList);

  const friends = (friendUsers ?? []).map((u: any) => ({
    userId: u.id,
    username: u.username ?? "",
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null
  }));

  const { data: recentVlogs } = await supabase
    .from("vlogs")
    .select("id, challenge_id, proof_type, created_at, day_number")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const cids = [...new Set((recentVlogs ?? []).map((v: any) => v.challenge_id).filter(Boolean))];
  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("id, title")
    .in("id", cids);

  const challengeTitles = new Map<string, string>();
  for (const c of challengeRows ?? []) {
    challengeTitles.set((c as any).id, (c as any).title ?? "Dare");
  }

  const recentActivity = (recentVlogs ?? []).map((v: any) => ({
    id: v.id,
    challengeId: v.challenge_id,
    challengeTitle: challengeTitles.get(v.challenge_id) ?? "Dare",
    proofType: (v.proof_type ?? "vlog") as "vlog" | "selfie" | "checkin",
    createdAt: v.created_at,
    dayNumber: v.day_number ?? 0
  }));

  const { data: requestRows } = await supabase
    .from("friend_requests")
    .select("id, sender_id")
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  const fromIds = (requestRows ?? []).map((r: any) => r.sender_id);
  const { data: fromUsers } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", fromIds);

  const fromById = new Map((fromUsers ?? []).map((u: any) => [u.id, u]));
  const pendingRequests = (requestRows ?? []).map((r: any) => {
    const u = fromById.get(r.sender_id);
    return {
      id: r.id,
      fromUser: {
        username: u?.username ?? "",
        displayName: u?.display_name ?? null,
        avatarUrl: u?.avatar_url ?? null
      }
    };
  });

  const rank = buildRank(totalVlogs);

  async function handleLogout() {
    "use server";
    const supa = createSupabaseServerClient();
    await supa.auth.signOut();
    redirect("/login");
  }

  return (
    <ProfileClient
      profile={{
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: profile.avatar_url
      }}
      rank={rank}
      totalDares={totalDares}
      currentStreak={currentStreak}
      totalPosts={totalVlogs}
      friends={friends}
      activeChallenges={activeChallengesWithRank}
      recentActivity={recentActivity}
      pendingRequests={pendingRequests}
      handleLogout={handleLogout}
    />
  );
}
