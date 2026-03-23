"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";

type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type DailyActivity = {
  day: string;
  points: number;
  proofType: "vlog" | "selfie" | "checkin" | null;
  isToday: boolean;
  isFuture: boolean;
  hasPosted: boolean;
};

type ChallengePerf = {
  id: string;
  title: string;
  yourPoints: number;
  yourRank: number;
  totalMembers: number;
  topPoints: number;
  yourStreak: number;
};

type Milestone = {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  remaining: number;
};

function CountUp({ value, duration = 400 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span className="tabular-nums">{display}</span>;
}

export function StatsClient(props: {
  profile: Profile;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  vlogCount: number;
  selfieCount: number;
  checkinCount: number;
  weekTrend: number;
  dailyActivity: DailyActivity[];
  weeklyPoints: number[];
  challengePerformance: ChallengePerf[];
  milestones: Milestone[];
  consistencyRate: number;
  globalRank: number;
  globalRankPercent: number;
}) {
  const router = useRouter();
  const [range, setRange] = useState<"week" | "month" | "all">("week");

  const totalPosts = props.vlogCount + props.selfieCount + props.checkinCount;
  const daysActive = props.dailyActivity.filter((d) => d.hasPosted && !d.isFuture).length;
  const maxWeeklyPoints = Math.max(1, ...props.weeklyPoints);
  // weeklyPoints: [0]=current week, [1]=1w ago, [2]=2w ago, [3]=3w ago (newest to oldest)
  const weeklyImproving = props.weeklyPoints.length >= 2 && props.weeklyPoints[0] >= props.weeklyPoints[1];

  const getHeatmapColor = (d: DailyActivity) => {
    if (d.isFuture) return "bg-[#1A1A1A]";
    if (!d.hasPosted) return "bg-[#1A1A1A]";
    if (d.proofType === "vlog") return "bg-[#00FF88]";
    if (d.proofType === "selfie") return "bg-[#00CC66]";
    if (d.proofType === "checkin") return "bg-[#FF8C00]/25"; // dim yellow
    return "bg-[#1A1A1A]";
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-[#FFD700]"; // gold
    if (rank === 2) return "text-[#C0C0C0]"; // silver
    if (rank === 3) return "text-[#CD7F32]"; // bronze
    return "text-white";
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <header>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white">Your stats</h1>
          <div className="mt-3 flex gap-2">
            {(["week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-150 ${
                  range === r
                    ? "bg-[#00FF88] text-black"
                    : "bg-[#1A1A1A] text-[#6B6B6B] border border-[#1E1E1E] hover:border-[#2A2A2A]"
                }`}
              >
                {r === "week" ? "This week" : r === "month" ? "This month" : "All time"}
              </button>
            ))}
          </div>
        </header>

        {/* Metric cards — horizontal scroll */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-[130px] shrink-0 rounded-2xl bg-[#111111] p-4"
          >
            <p className="text-[28px] font-bold text-[#00FF88]">
              <CountUp value={props.totalPoints} />
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">points</p>
            <p
              className={`mt-2 text-[11px] font-medium ${
                props.weekTrend >= 0 ? "text-[#00FF88]" : "text-[#FF4444]"
              }`}
            >
              {props.weekTrend >= 0 ? "↑" : "↓"} {Math.abs(props.weekTrend)} this week
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="min-w-[130px] shrink-0 rounded-2xl bg-[#111111] p-4"
          >
            <p
              className={`text-[28px] font-bold ${
                props.currentStreak > 0 ? "text-white" : "text-[#6B6B6B]"
              }`}
            >
              <CountUp value={props.currentStreak} /> 🔥
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">day streak</p>
            <p className="mt-2 text-[11px] text-[#3A3A3A]">Best: {props.longestStreak}d</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="min-w-[130px] shrink-0 rounded-2xl bg-[#111111] p-4"
          >
            <p
              className={`text-[28px] font-bold ${
                props.consistencyRate >= 70
                  ? "text-[#00FF88]"
                  : props.consistencyRate >= 40
                  ? "text-[#FF8C00]"
                  : "text-[#FF4444]"
              }`}
            >
              <CountUp value={props.consistencyRate} />%
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">consistency</p>
            <p className="mt-2 text-[11px] text-[#3A3A3A]">
              {daysActive} of 7 days
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="min-w-[130px] shrink-0 rounded-2xl bg-[#111111] p-4"
          >
            <p className="text-[28px] font-bold text-white">
              #{props.globalRank}
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">global rank</p>
            <p className="mt-2 text-[11px] text-[#3A3A3A]">Top {props.globalRankPercent}%</p>
          </motion.div>
        </div>

        {/* Activity heatmap */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            activity
          </h2>
          <div className="mt-3 flex gap-2">
            {props.dailyActivity.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`h-11 w-full max-w-[44px] rounded-lg transition-all duration-150 ${getHeatmapColor(d)} ${
                    d.isToday && !d.hasPosted ? "ring-2 ring-dashed ring-[#00FF88]" : ""
                  }`}
                  title={d.hasPosted ? `${d.proofType ?? "activity"}` : d.isToday ? "Today (not yet posted)" : "No activity"}
                />
                <span className="text-[11px] font-medium text-[#6B6B6B]">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Proof breakdown — stacked bar */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            proof types
          </h2>
          {totalPosts === 0 ? (
            <p className="mt-3 text-[14px] text-[#6B6B6B]">No proofs yet</p>
          ) : (
            <div className="mt-3">
              <div className="flex h-8 w-full overflow-hidden rounded-lg">
                {props.vlogCount > 0 && (
                  <div
                    className="bg-[#00FF88] shrink-0"
                    style={{ width: `${(props.vlogCount / totalPosts) * 100}%` }}
                    title={`Vlogs · ${props.vlogCount}`}
                  />
                )}
                {props.selfieCount > 0 && (
                  <div
                    className="bg-[#3B82F6] shrink-0"
                    style={{ width: `${(props.selfieCount / totalPosts) * 100}%` }}
                    title={`Selfies · ${props.selfieCount}`}
                  />
                )}
                {props.checkinCount > 0 && (
                  <div
                    className="bg-[#6B6B6B] shrink-0"
                    style={{ width: `${(props.checkinCount / totalPosts) * 100}%` }}
                    title={`Check-ins · ${props.checkinCount}`}
                  />
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#6B6B6B]">
                <span>Vlogs · {props.vlogCount}</span>
                <span>Selfies · {props.selfieCount}</span>
                <span>Check-ins · {props.checkinCount}</span>
              </div>
            </div>
          )}
        </section>

        {/* Challenge rankings */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            your rankings
          </h2>
          {props.challengePerformance.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#6B6B6B]">No challenges yet</p>
          ) : (
            <div className="mt-3 space-y-3">
              {props.challengePerformance.map((c) => {
                const progressPct = c.topPoints > 0 ? (c.yourPoints / c.topPoints) * 100 : 0;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/challenge/${c.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/challenge/${c.id}`);
                      }
                    }}
                    className="cursor-pointer rounded-xl border border-[#1E1E1E] bg-[#111111] p-4 transition-all duration-150 hover:bg-[#1A1A1A] active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-bold text-white">{c.title}</p>
                      <span className={`text-[14px] font-bold ${getRankColor(c.yourRank)}`}>
                        #{c.yourRank} of {c.totalMembers}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">{c.yourPoints} pts</p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
                      <div
                        className="h-full rounded-full bg-[#00FF88]"
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Weekly trend */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            weekly trend
          </h2>
          <div className="mt-3 flex items-end justify-between gap-2 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
            {[...props.weeklyPoints].reverse().map((pts, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-[32px] rounded-t bg-[#00FF88] transition-all duration-300"
                  style={{
                    height: `${Math.max(8, (pts / maxWeeklyPoints) * 80)}px`
                  }}
                />
                <span className="text-[11px] font-medium text-[#6B6B6B]">W{i + 1}</span>
              </div>
            ))}
          </div>
          <p
            className={`mt-2 text-[12px] font-medium ${
              weeklyImproving ? "text-[#00FF88]" : "text-[#FF4444]"
            }`}
          >
            {weeklyImproving ? "↑ Improving" : props.weeklyPoints.length >= 2 ? "↓ Declining" : ""}
          </p>
        </section>

        {/* Milestones */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            milestones
          </h2>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {props.milestones.map((m) => (
              <div
                key={m.id}
                className={`flex min-w-[64px] shrink-0 flex-col items-center ${
                  m.unlocked ? "" : "opacity-70"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                    m.unlocked ? "bg-[#00FF88]/20 text-[#00FF88]" : "bg-[#1A1A1A] grayscale"
                  }`}
                >
                  {m.unlocked ? "✓" : "🔒"}
                </div>
                <p className="mt-2 text-center text-[11px] font-medium text-white">{m.title}</p>
                {!m.unlocked && m.remaining > 0 && (
                  <p className="mt-0.5 text-center text-[10px] text-[#6B6B6B]">
                    {m.remaining} more
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav
        profile={{
          avatarUrl: props.profile.avatarUrl,
          username: props.profile.username
        }}
      />
    </main>
  );
}
