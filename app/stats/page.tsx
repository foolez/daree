import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StatsClient } from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
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
      "challenge_id, current_streak, longest_streak, total_vlogs, total_points, challenges (id, title)"
    )
    .eq("user_id", user.id);

  const today = new Date();
  const totalPoints = (memberships ?? []).reduce((s: number, m: any) => s + (m.total_points ?? 0), 0);
  const currentStreak = Math.max(0, ...(memberships ?? []).map((m: any) => m.current_streak ?? 0));
  const longestStreak = Math.max(0, ...(memberships ?? []).map((m: any) => m.longest_streak ?? 0));

  const { data: vlogs } = await supabase
    .from("vlogs")
    .select("id, proof_type, created_at")
    .eq("user_id", user.id);

  const vlogCount = (vlogs ?? []).filter((v: any) => (v.proof_type ?? "vlog") === "vlog").length;
  const selfieCount = (vlogs ?? []).filter((v: any) => (v.proof_type ?? "vlog") === "selfie").length;
  const checkinCount = (vlogs ?? []).filter((v: any) => (v.proof_type ?? "vlog") === "checkin").length;
  const totalVlogs = vlogCount + selfieCount + checkinCount;

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const twoWeeksAgo = new Date(sevenDaysAgo);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

  const vlogsLastWeek = (vlogs ?? []).filter((v: any) => {
    const d = new Date(v.created_at);
    return d >= twoWeeksAgo && d < sevenDaysAgo;
  });
  const pointsLastWeek = vlogsLastWeek.reduce((s: number, v: any) => {
    const pt = v.proof_type ?? "vlog";
    return s + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
  }, 0);

  const vlogsThisWeek = (vlogs ?? []).filter((v: any) => new Date(v.created_at) >= sevenDaysAgo);
  const pointsThisWeek = vlogsThisWeek.reduce((s: number, v: any) => {
    const pt = v.proof_type ?? "vlog";
    return s + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
  }, 0);

  const weekTrend = pointsThisWeek - pointsLastWeek;

  const weekKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    if (d <= today) weekKeys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  const daysWithProof = new Set(
    (vlogs ?? [])
      .filter((v: any) => new Date(v.created_at) >= sevenDaysAgo)
      .map((v: any) => {
        const d = new Date(v.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
  );
  const consistencyRate =
    weekKeys.size > 0 ? Math.round((daysWithProof.size / weekKeys.size) * 100) : 0;

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const dailyActivity: {
    day: string;
    points: number;
    proofType: "vlog" | "selfie" | "checkin" | null;
    isToday: boolean;
    isFuture: boolean;
    hasPosted: boolean;
  }[] = [];
  const proofRank = { vlog: 3, selfie: 2, checkin: 1 };

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const isToday = key === todayKey;
    const isFuture = d > today;

    const dayVlogs = (vlogs ?? []).filter((v: any) => {
      const created = new Date(v.created_at);
      return created >= dayStart && created <= dayEnd;
    });
    const pts = dayVlogs.reduce((s: number, v: any) => {
      const pt = v.proof_type ?? "vlog";
      return s + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
    }, 0);

    let proofType: "vlog" | "selfie" | "checkin" | null = null;
    for (const v of dayVlogs) {
      const pt = (v.proof_type ?? "vlog") as "vlog" | "selfie" | "checkin";
      if (!proofType || proofRank[pt] > proofRank[proofType]) proofType = pt;
    }

    dailyActivity.push({
      day: dayLabels[i],
      points: pts,
      proofType,
      isToday,
      isFuture,
      hasPosted: dayVlogs.length > 0
    });
  }

  const weeklyPoints: number[] = [];
  for (let w = 0; w < 4; w++) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStartDate = new Date(weekEnd);
    weekStartDate.setDate(weekStartDate.getDate() - 6);
    weekStartDate.setHours(0, 0, 0, 0);
    const weekEndDate = new Date(weekEnd);
    weekEndDate.setHours(23, 59, 59, 999);
    const weekVlogs = (vlogs ?? []).filter((v: any) => {
      const created = new Date(v.created_at);
      return created >= weekStartDate && created <= weekEndDate;
    });
    const pts = weekVlogs.reduce((s: number, v: any) => {
      const pt = v.proof_type ?? "vlog";
      return s + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
    }, 0);
    weeklyPoints.unshift(pts);
  }

  const { data: allMemberships } = await supabase
    .from("challenge_members")
    .select("user_id, total_points");

  const userPoints = new Map<string, number>();
  for (const row of allMemberships ?? []) {
    const uid = row.user_id as string;
    const pts = (row.total_points ?? 0) as number;
    userPoints.set(uid, (userPoints.get(uid) ?? 0) + pts);
  }

  const sorted = Array.from(userPoints.entries()).sort((a, b) => b[1] - a[1]);
  const yourIdx = sorted.findIndex(([uid]) => uid === user.id);
  const globalRank = yourIdx >= 0 ? yourIdx + 1 : sorted.length + 1;
  const totalUsers = sorted.length;
  const globalRankPercent =
    totalUsers > 0 ? Math.round((1 - yourIdx / totalUsers) * 100) : 0;

  const challengePerformance: {
    id: string;
    title: string;
    yourPoints: number;
    yourRank: number;
    totalMembers: number;
    topPoints: number;
    yourStreak: number;
  }[] = [];

  for (const m of memberships ?? []) {
    const cid = (m.challenges as any)?.id ?? m.challenge_id;
    if (!cid) continue;
    const { data: allMembers } = await supabase
      .from("challenge_members")
      .select("user_id, total_points")
      .eq("challenge_id", cid);
    const sortedMembers = (allMembers ?? []).sort(
      (a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0)
    );
    const yourIdxM = sortedMembers.findIndex((x: any) => x.user_id === user.id);
    const topPoints = sortedMembers[0]?.total_points ?? 0;
    challengePerformance.push({
      id: cid,
      title: (m.challenges as any)?.title ?? "Untitled",
      yourPoints: m.total_points ?? 0,
      yourRank: yourIdxM >= 0 ? yourIdxM + 1 : 0,
      totalMembers: sortedMembers.length,
      topPoints,
      yourStreak: m.current_streak ?? 0
    });
  }

  const vlogIdsForReactions = (vlogs ?? []).map((v: any) => v.id);
  let totalReactions = 0;
  if (vlogIdsForReactions.length > 0) {
    const { count } = await supabase
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .in("vlog_id", vlogIdsForReactions);
    totalReactions = count ?? 0;
  }

  const hasEarlyBird = (vlogs ?? []).some((v: any) => new Date(v.created_at).getHours() < 8);
  const hasNightOwl = (vlogs ?? []).some((v: any) => new Date(v.created_at).getHours() >= 22);

  const { count: createdCount } = await supabase
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id);

  const hasBrokenAndRecovered = longestStreak > 0 && currentStreak > 0 && longestStreak > currentStreak;

  const membersCount = (memberships ?? []).length;
  const milestones = [
    { id: "first_vlog", title: "First vlog", desc: "post 1 vlog", unlocked: totalVlogs >= 1, remaining: Math.max(0, 1 - totalVlogs) },
    { id: "week_warrior", title: "Week warrior", desc: "7 day streak", unlocked: longestStreak >= 7, remaining: Math.max(0, 7 - longestStreak) },
    { id: "consistency_king", title: "Consistency king", desc: "30 day streak", unlocked: longestStreak >= 30, remaining: Math.max(0, 30 - longestStreak) },
    { id: "social_butterfly", title: "Social butterfly", desc: "join 5 dares", unlocked: membersCount >= 5, remaining: Math.max(0, 5 - membersCount) },
    { id: "popular", title: "Popular", desc: "50 total reactions", unlocked: totalReactions >= 50, remaining: Math.max(0, 50 - totalReactions) },
    { id: "early_bird", title: "Early bird", desc: "post before 8 AM", unlocked: hasEarlyBird, remaining: hasEarlyBird ? 0 : 1 },
    { id: "night_owl", title: "Night owl", desc: "post after 10 PM", unlocked: hasNightOwl, remaining: hasNightOwl ? 0 : 1 },
    { id: "comeback_kid", title: "Comeback kid", desc: "recover from broken streak", unlocked: hasBrokenAndRecovered, remaining: hasBrokenAndRecovered ? 0 : 1 },
    { id: "century", title: "Century", desc: "100 total posts", unlocked: totalVlogs >= 100, remaining: Math.max(0, 100 - totalVlogs) },
    { id: "creator", title: "Creator", desc: "create 3 dares", unlocked: (createdCount ?? 0) >= 3, remaining: Math.max(0, 3 - (createdCount ?? 0)) }
  ];

  return (
    <StatsClient
      profile={{ id: profile.id, username: profile.username, displayName: profile.display_name, avatarUrl: profile.avatar_url }}
      totalPoints={totalPoints}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      vlogCount={vlogCount}
      selfieCount={selfieCount}
      checkinCount={checkinCount}
      weekTrend={weekTrend}
      dailyActivity={dailyActivity}
      weeklyPoints={weeklyPoints}
      challengePerformance={challengePerformance}
      milestones={milestones}
      consistencyRate={consistencyRate}
      globalRank={globalRank}
      globalRankPercent={globalRankPercent}
    />
  );
}
