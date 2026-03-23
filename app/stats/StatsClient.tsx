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
  vlogs: number;
  selfies: number;
  checkins: number;
};

type ChallengePerf = {
  id: string;
  title: string;
  yourPoints: number;
  yourRank: number;
  totalMembers: number;
  yourStreak: number;
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
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
  totalVlogs: number;
  vlogCount: number;
  selfieCount: number;
  checkinCount: number;
  weekTrend: number;
  dailyActivity: DailyActivity[];
  challengePerformance: ChallengePerf[];
  milestones: Milestone[];
  consistencyRate: number;
}) {
  const router = useRouter();
  const [range, setRange] = useState<"week" | "month" | "all">("week");

  const maxPoints = Math.max(1, ...props.dailyActivity.map((d) => d.points));

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

        {/* Overview cards - horizontal scroll */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-[140px] shrink-0 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4"
          >
            <p className="text-[28px] font-bold text-[#00FF88]">
              <CountUp value={props.totalPoints} />
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">points earned</p>
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
            className="min-w-[140px] shrink-0 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4"
          >
            <p
              className={`text-[28px] font-bold ${
                props.currentStreak > 0 ? "text-[#FF8C00]" : "text-[#6B6B6B]"
              }`}
            >
              <CountUp value={props.currentStreak} /> 🔥
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">day streak</p>
            <p className="mt-2 text-[11px] text-[#3A3A3A]">Best: {props.longestStreak} days</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="min-w-[140px] shrink-0 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4"
          >
            <p className="text-[28px] font-bold text-white">
              <CountUp value={props.totalVlogs} />
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">vlogs posted</p>
            <p className="mt-2 text-[11px] text-[#3A3A3A]">
              {props.vlogCount} video · {props.selfieCount} photo · {props.checkinCount} check-in
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="min-w-[140px] shrink-0 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4"
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
            <p className="mt-1 text-[12px] text-[#6B6B6B]">consistency rate</p>
            <p className="mt-2 text-[11px] text-[#3A3A3A]">
              {Math.min(7, props.dailyActivity.filter((d) => d.points > 0).length)} of 7 days
            </p>
          </motion.div>
        </div>

        {/* Weekly activity chart */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            activity
          </h2>
          <div className="mt-3 flex items-end justify-between gap-2 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
            {props.dailyActivity.map((d, i) => {
              const heightPct = maxPoints > 0 ? (d.points / maxPoints) * 100 : 0;
              const isToday = i === props.dailyActivity.length - 1;
              return (
                <motion.div
                  key={d.day}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, heightPct)}%` }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`w-full max-w-[32px] rounded-t transition-all duration-150 ${
                      d.points >= 3
                        ? "bg-[#00FF88]"
                        : d.points >= 2
                        ? "bg-[#3B82F6]"
                        : d.points >= 1
                        ? "bg-[#6B6B6B]"
                        : "bg-[#1E1E1E]"
                    } ${isToday ? "ring-2 ring-[#00FF88] ring-offset-2 ring-offset-[#111111]" : ""}`}
                    style={{ minHeight: 8 }}
                  />
                  <span className="text-[11px] font-medium text-[#6B6B6B]">{d.day}</span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Challenge performance */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            your dares
          </h2>
          {props.challengePerformance.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#6B6B6B]">No challenges yet</p>
          ) : (
            <div className="mt-3 space-y-2">
              {props.challengePerformance.map((c) => (
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
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-4 py-3 transition-all duration-150 hover:bg-[#1A1A1A] active:scale-[0.99]"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-white">{c.title}</p>
                    <p className="text-[12px] text-[#6B6B6B]">
                      #{c.yourRank} of {c.totalMembers} · {c.yourPoints} pts · {c.yourStreak}d streak
                    </p>
                  </div>
                  <span className="text-[#6B6B6B]">›</span>
                </div>
              ))}
            </div>
          )}
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
                className={`flex min-w-[80px] shrink-0 flex-col items-center rounded-2xl border p-3 transition-all duration-150 ${
                  m.unlocked
                    ? "border-[#00FF88]/30 bg-[#00FF88]/5"
                    : "border-[#1E1E1E] bg-[#111111] opacity-60"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                    m.unlocked ? "bg-[#00FF88]/20" : "bg-[#1A1A1A] grayscale"
                  }`}
                >
                  {m.unlocked ? "✓" : "🔒"}
                </div>
                <p className="mt-2 text-center text-[11px] font-medium text-white">{m.title}</p>
                <p className="mt-0.5 text-center text-[10px] text-[#6B6B6B]">{m.description}</p>
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
