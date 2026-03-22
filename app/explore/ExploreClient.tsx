"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";

type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type TrendingVlog = {
  id: string;
  userId: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  proofType: string;
  createdAt: string;
  challengeId: string;
  reactionCount: number;
};

type PublicChallenge = {
  id: string;
  title: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberCount: number;
  vlogsToday: number;
  dayNumber: number;
};

type Creators = Record<
  string,
  { username: string; displayName: string | null; avatarUrl: string | null }
>;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function daysBetweenUtc(a: Date, b: Date) {
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bu - au) / day);
}

function RequestJoinButton({ challengeId }: { challengeId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "member">("idle");

  async function request() {
    if (status !== "idle") return;
    setStatus("loading");
    const res = await fetch(`/api/challenges/request-join?challenge_id=${challengeId}`, {
      method: "POST"
    });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? "done" : data.error?.includes("member") ? "member" : "idle");
  }

  if (status === "done") {
    return (
      <span className="flex flex-1 items-center justify-center rounded-xl bg-[#1E1E1E] px-4 py-2 text-[14px] text-[#6B6B6B]">
        Request sent
      </span>
    );
  }
  if (status === "member") {
    return (
      <Link
        href={`/challenge/${challengeId}`}
        className="flex flex-1 rounded-xl bg-[#00FF88] px-4 py-2 text-center text-[14px] font-semibold text-black"
      >
        Open
      </Link>
    );
  }
  return (
    <button
      onClick={request}
      disabled={status === "loading"}
      className="flex-1 rounded-xl bg-[#00FF88] px-4 py-2 text-[14px] font-semibold text-black disabled:opacity-70"
    >
      {status === "loading" ? "..." : "Request to join"}
    </button>
  );
}

export function ExploreClient(props: {
  profile: Profile;
  initialData?: {
    trendingVlogs?: TrendingVlog[];
    publicChallenges?: PublicChallenge[];
    creators?: Creators;
  };
}) {
  const [data, setData] = useState(props.initialData ?? {});

  useEffect(() => {
    fetch("/api/explore")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const trendingVlogs = data.trendingVlogs ?? [];
  const publicChallenges = data.publicChallenges ?? [];
  const creators = data.creators ?? {};

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <h1 className="text-[20px] font-bold">Explore</h1>

        <section className="mt-6">
          <h2 className="mb-3 text-[14px] font-semibold text-[#6B6B6B]">Trending Vlogs</h2>
          {trendingVlogs.length === 0 ? (
            <p className="text-[14px] text-[#6B6B6B]">No public vlogs yet.</p>
          ) : (
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 py-2">
              {trendingVlogs.map((v) => {
                const creator = creators[v.userId];
                const mediaUrl = v.videoUrl || v.thumbnailUrl;
                return (
                  <Link
                    key={v.id}
                    href={`/challenge/${v.challengeId}?vlog=${v.id}`}
                    className="flex shrink-0 flex-col"
                  >
                    <div className="relative h-[160px] w-[120px] overflow-hidden rounded-xl bg-[#111111]">
                      {mediaUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={mediaUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#3A3A3A]">
                          No preview
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="truncate text-[11px] font-medium text-white">
                          @{creator?.username ?? "unknown"}
                        </p>
                        <p className="text-[10px] text-[#6B6B6B]">{v.reactionCount} reactions</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-[14px] font-semibold text-[#6B6B6B]">Public Challenges</h2>
          {publicChallenges.length === 0 ? (
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 text-center">
              <p className="text-[15px] text-[#6B6B6B]">
                No public dares yet. Be the first to go public!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicChallenges.map((c) => {
                const creator = creators[c.createdBy];
                const start = new Date(c.startDate);
                const end = new Date(c.endDate);
                const today = new Date();
                const dayNumber = clamp(daysBetweenUtc(start, today) + 1, 1, c.durationDays);
                const progress = clamp(dayNumber / c.durationDays, 0, 1);
                return (
                  <div
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4"
                  >
                    <h3 className="text-[16px] font-bold text-white">{c.title}</h3>
                    <p className="mt-1 text-[13px] text-[#6B6B6B]">
                      by @{creator?.username ?? "unknown"}
                    </p>
                    <p className="mt-2 text-[12px] text-[#6B6B6B]">
                      {c.memberCount} members · Day {c.dayNumber} of {c.durationDays} · {c.vlogsToday} vlogs today
                    </p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1E1E1E]">
                      <div
                        className="h-full rounded-full bg-[#00FF88]"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/challenge/${c.id}`}
                        className="flex-1 rounded-xl border border-[#2A2A2A] px-4 py-2 text-center text-[14px] font-medium text-white"
                      >
                        Watch
                      </Link>
                      <RequestJoinButton challengeId={c.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
