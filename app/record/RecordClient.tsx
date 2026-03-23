"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";

type Challenge = {
  id: string;
  title: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  dayNumber: number;
  postedToday: boolean;
  todayVlogId?: string | null;
};

function daysBetweenUtc(a: Date, b: Date) {
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bu - au) / day);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function RecordClient({
  profile,
  challenges
}: {
  profile: { username: string; avatarUrl: string | null };
  challenges: Challenge[];
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div
        className={`mx-auto max-w-md px-5 pb-24 pt-6 transition-opacity duration-200 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <header className="relative flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white">
              Record
            </h1>
            <p className="mt-1 text-[14px] text-[#6B6B6B]">
              Choose a challenge to post today&apos;s proof
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6B6B6B]"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </header>

        {challenges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 flex flex-col items-center justify-center px-4 text-center"
          >
            <p className="text-[18px] font-semibold text-white">
              No active dares yet
            </p>
            <p className="mt-2 text-[15px] text-[#6B6B6B]">
              Create or join a dare first
            </p>
            <Link
              href="/dashboard"
              className="mt-6 rounded-xl border border-[#2A2A2A] bg-transparent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1A1A1A]"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {challenges.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                {c.postedToday ? (
                  <div className="flex items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#0D0D0D] p-4 opacity-70">
                    <div className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center text-[#00FF88]">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="h-4 w-4"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <p className="text-[16px] font-bold text-[#6B6B6B]">
                          {c.title}
                        </p>
                        <p className="text-[13px] text-[#3A3A3A]">
                          Posted today
                        </p>
                      </div>
                    </div>
                    <Link
                      href={c.todayVlogId ? `/challenge/${c.id}?vlog=${c.todayVlogId}` : `/challenge/${c.id}`}
                      className="text-[14px] font-medium text-[#6B6B6B] hover:text-white"
                    >
                      View
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/challenge/${c.id}/record`}
                    className="flex items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-all duration-150 hover:bg-[#1A1A1A] active:scale-[0.97]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#00FF88]" />
                      <div>
                        <p className="text-[16px] font-bold text-white">
                          {c.title}
                        </p>
                        <p className="text-[13px] text-[#6B6B6B]">
                          Day {c.dayNumber} of {c.duration_days}
                        </p>
                      </div>
                    </div>
                    <span className="text-[14px] font-medium text-[#00FF88]">
                      Post proof →
                    </span>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav
        profile={{
          avatarUrl: profile.avatarUrl,
          username: profile.username
        }}
      />
    </main>
  );
}
