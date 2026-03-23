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
      `
      challenge_id,
      current_streak,
      longest_streak,
      total_vlogs,
      total_points,
      challenges (
        id,
        title,
        duration_days,
        start_date,
        end_date,
        status
      )
    `
    )
    .eq("user_id", user.id);

  const today = new Date();
  const totalPoints = (memberships ?? []).reduce(
    (sum: number, m: any) => sum + (m.total_points ?? 0),
    0
  );
  const currentStreak = Math.max(
    0,
    ...(memberships ?? []).map((m: any) => m.current_streak ?? 0)
  );
  const longestStreak = Math.max(
    0,
    ...(memberships ?? []).map((m: any) => m.longest_streak ?? 0)
  );

  const { data: vlogs } = await supabase
    .from("vlogs")
    .select("id, proof_type, created_at")
    .eq("user_id", user.id);

  const vlogCount =
    (vlogs ?? []).filter((v: any) => (v.proof_type ?? "vlog") === "vlog").length;
  const selfieCount = (vlogs ?? []).filter(
    (v: any) => (v.proof_type ?? "vlog") === "selfie"
  ).length;
  const checkinCount = (vlogs ?? []).filter(
    (v: any) => (v.proof_type ?? "vlog") === "checkin"
  ).length;
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
  const pointsLastWeek = vlogsLastWeek.reduce((sum: number, v: any) => {
    const pt = v.proof_type ?? "vlog";
    return sum + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
  }, 0);

  const vlogsThisWeek = (vlogs ?? []).filter(
    (v: any) => new Date(v.created_at) >= sevenDaysAgo
  );
  const pointsThisWeek = vlogsThisWeek.reduce((sum: number, v: any) => {
    const pt = v.proof_type ?? "vlog";
    return sum + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
  }, 0);

  const weekTrend = pointsThisWeek - pointsLastWeek;

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const dailyActivity: { day: string; points: number; vlogs: number; selfies: number; checkins: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const dayVlogs = (vlogs ?? []).filter((v: any) => {
      const created = new Date(v.created_at);
      return created >= dayStart && created <= dayEnd;
    });
    const pts = dayVlogs.reduce((s: number, v: any) => {
      const pt = v.proof_type ?? "vlog";
      return s + (pt === "vlog" ? 3 : pt === "selfie" ? 2 : 0);
    }, 0);
    const vc = dayVlogs.filter((v: any) => (v.proof_type ?? "vlog") === "vlog").length;
    const sc = dayVlogs.filter((v: any) => (v.proof_type ?? "vlog") === "selfie").length;
    const cc = dayVlogs.filter((v: any) => (v.proof_type ?? "vlog") === "checkin").length;
    dailyActivity.push({
      day: dayLabels[i],
      points: pts,
      vlogs: vc,
      selfies: sc,
      checkins: cc
    });
  }

  const challengeIds = (memberships ?? [])
    .map((m: any) => m.challenges?.id ?? m.challenge_id)
    .filter(Boolean);

  const challengePerformance: {
    id: string;
    title: string;
    yourPoints: number;
    yourRank: number;
    totalMembers: number;
    yourStreak: number;
  }[] = [];

  for (const m of memberships ?? []) {
    const cid = (m.challenges as any)?.id ?? m.challenge_id;
    if (!cid) continue;

    const { data: allMembers } = await supabase
      .from("challenge_members")
      .select("user_id, total_points")
      .eq("challenge_id", cid);

    const sorted = (allMembers ?? []).sort(
      (a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0)
    );
    const yourIdx = sorted.findIndex((x: any) => x.user_id === user.id);
    const yourRank = yourIdx >= 0 ? yourIdx + 1 : 0;

    challengePerformance.push({
      id: cid,
      title: (m.challenges as any)?.title ?? "Untitled",
      yourPoints: m.total_points ?? 0,
      yourRank,
      totalMembers: sorted.length,
      yourStreak: m.current_streak ?? 0
    });
  }

  const vlogIdsForReactions = (vlogs ?? []).map((v: any) => v.id);
  let maxReactionsOnSingleVlog = 0;
  if (vlogIdsForReactions.length > 0) {
    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("vlog_id")
      .in("vlog_id", vlogIdsForReactions);
    const byVlog: Record<string, number> = {};
    for (const r of reactionRows ?? []) {
      const vid = (r as any).vlog_id;
      byVlog[vid] = (byVlog[vid] ?? 0) + 1;
    }
    maxReactionsOnSingleVlog = Math.max(0, ...Object.values(byVlog));
  }

  const hasEarlyBird = (vlogs ?? []).some((v: any) => {
    const h = new Date(v.created_at).getHours();
    return h < 8;
  });
  const hasNightOwl = (vlogs ?? []).some((v: any) => {
    const h = new Date(v.created_at).getHours();
    return h >= 22;
  });

  const milestones = [
    {
      id: "first_vlog",
      title: "First vlog",
      description: "Post your first vlog",
      unlocked: totalVlogs >= 1
    },
    {
      id: "week_warrior",
      title: "Week warrior",
      description: "7 day streak",
      unlocked: longestStreak >= 7
    },
    {
      id: "consistency_king",
      title: "Consistency king",
      description: "30 day streak",
      unlocked: longestStreak >= 30
    },
    {
      id: "social_butterfly",
      title: "Social butterfly",
      description: "Join 5 challenges",
      unlocked: (memberships ?? []).length >= 5
    },
    {
      id: "influencer",
      title: "Influencer",
      description: "50 reactions on a single vlog",
      unlocked: maxReactionsOnSingleVlog >= 50
    },
    {
      id: "early_bird",
      title: "Early bird",
      description: "Post before 8 AM",
      unlocked: hasEarlyBird
    },
    {
      id: "night_owl",
      title: "Night owl",
      description: "Post after 10 PM",
      unlocked: hasNightOwl
    }
  ];

  const weekKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    if (d <= today) {
      weekKeys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
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
    weekKeys.size > 0
      ? Math.round((daysWithProof.size / weekKeys.size) * 100)
      : 0;

  return (
    <StatsClient
      profile={{
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url
      }}
      totalPoints={totalPoints}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      totalVlogs={totalVlogs}
      vlogCount={vlogCount}
      selfieCount={selfieCount}
      checkinCount={checkinCount}
      weekTrend={weekTrend}
      dailyActivity={dailyActivity}
      challengePerformance={challengePerformance}
      milestones={milestones}
      consistencyRate={consistencyRate}
    />
  );
}
