"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileAvatarClient } from "./ProfileAvatarClient";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const INITIAL_COLORS = ["#2D5A3D", "#5A2D4D", "#2D3D5A", "#5A4D2D", "#3D2D5A", "#2D5A5A"] as const;

function avatarColor(username: string): string {
  let hash = 0;
  const s = username || "u";
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash = hash & hash;
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function daysBetweenUtc(a: Date, b: Date) {
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bu - au) / day);
}

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ActiveChallenge = {
  id: string;
  title: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  member_count: number | null;
  your_streak: number;
};

type DayState = {
  label: string;
  key: string;
  posted: boolean;
  isToday: boolean;
  isFuture: boolean;
};

type PendingRequest = {
  id: string;
  fromUser: { username: string; displayName: string | null; avatarUrl: string | null };
};

function CountUp({ value, duration = 300 }: { value: number; duration?: number }) {
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

function AddFriendSheet({
  open,
  onClose,
  onSuccess
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function close() {
    if (sending) return;
    setUsername("");
    setFeedback(null);
    onClose();
  }

  async function send() {
    const typed = username.trim().replace(/^@/, "").toLowerCase();
    if (!typed) {
      setFeedback({ kind: "error", text: "Type a username first." });
      return;
    }
    setSending(true);
    setFeedback(null);
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: typed })
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSending(false);
    if (!res || !res.ok) {
      setFeedback({ kind: "error", text: data.error ?? "Could not send request." });
      return;
    }
    setUsername("");
    setFeedback({ kind: "success", text: data.message ?? "Request sent." });
    onSuccess?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" onClick={close} className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-2xl border border-[#1E1E1E] bg-[#111111] p-5">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#1E1E1E]" />
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-white">Add friend</h3>
        <p className="mt-1 text-[15px] text-[#6B6B6B]">Enter their username to send a request.</p>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] text-[15px] font-semibold text-black transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {sending ? "Sending..." : "Add"}
          </button>
          {feedback && (
            <p className={`text-[13px] ${feedback.kind === "success" ? "text-[#00FF88]" : "text-[#FF4444]"}`}>
              {feedback.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function FriendRequestsSheet({
  open,
  onClose,
  requests,
  onRespond
}: {
  open: boolean;
  onClose: () => void;
  requests: PendingRequest[];
  currentUserId: string;
  onRespond: () => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localRequests, setLocalRequests] = useState(requests);

  useEffect(() => {
    setLocalRequests(requests);
  }, [requests, open]);

  async function respond(id: string, action: "accept" | "reject") {
    if (loadingId) return;
    setLoadingId(id);
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: id, action })
    }).catch(() => null);
    setLoadingId(null);
    if (res?.ok) {
      setLocalRequests((prev) => prev.filter((r) => r.id !== id));
      onRespond();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[70vh] w-full max-w-md overflow-hidden rounded-t-2xl border border-[#1E1E1E] bg-[#111111]">
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#1E1E1E]" />
        <div className="border-b border-[#1E1E1E] px-4 py-3">
          <h3 className="text-[18px] font-bold tracking-[-0.02em] text-white">Friend requests</h3>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {localRequests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-[#1E1E1E] py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {r.fromUser.avatarUrl ? (
                  <img
                    src={r.fromUser.avatarUrl}
                    alt={r.fromUser.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                    style={{ backgroundColor: avatarColor(r.fromUser.username) }}
                  >
                    {(r.fromUser.username || "?")[0].toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-[15px] font-medium text-white">
                    {r.fromUser.displayName ?? r.fromUser.username}
                  </p>
                  <p className="text-[12px] text-[#6B6B6B]">@{r.fromUser.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => respond(r.id, "accept")}
                  disabled={loadingId === r.id}
                  className="rounded-xl bg-[#00FF88] px-4 py-2 text-[13px] font-semibold text-black active:scale-[0.97] disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(r.id, "reject")}
                  disabled={loadingId === r.id}
                  className="rounded-xl border border-[#1E1E1E] px-4 py-2 text-[13px] font-medium text-[#6B6B6B] active:scale-[0.97] disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconUser(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={props.className ?? "h-4 w-4"}>
      <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}

function IconZap(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={props.className ?? "h-4 w-4"}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getProgress(challenge: ActiveChallenge) {
  if (!challenge.start_date || !challenge.end_date || !challenge.duration_days) {
    return { dayNumber: 0, daysRemaining: 0, progress: 0 };
  }
  const start = new Date(challenge.start_date);
  const end = new Date(challenge.end_date);
  const today = new Date();
  const dayNumber = clamp(daysBetweenUtc(start, today) + 1, 1, challenge.duration_days);
  const daysRemaining = clamp(daysBetweenUtc(today, end), 0, challenge.duration_days);
  const progress = clamp(dayNumber / challenge.duration_days, 0, 1);
  return { dayNumber, daysRemaining, progress };
}

const RANK_EMOJI: Record<string, string> = {
  Seedling: "🌱",
  Rookie: "🌿",
  Warrior: "🏆"
};

export function ProfileClient(props: {
  profile: Profile;
  rank: { label: string; remaining: number };
  totalDares: number;
  currentStreak: number;
  longestStreak: number;
  totalVlogs: number;
  activeChallenges: ActiveChallenge[];
  pendingRequests: PendingRequest[];
  last7Days: DayState[];
  handleLogout: () => void;
}) {
  const router = useRouter();
  const [avatarReady, setAvatarReady] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAvatarReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  const rankEmoji = RANK_EMOJI[props.rank.label] ?? "";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-6">
        {/* Friend requests banner - only if pending */}
        {props.pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-between rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3"
          >
            <p className="text-[15px] text-white">
              {props.pendingRequests.length} friend request
              {props.pendingRequests.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setRequestsOpen(true)}
              className="text-[14px] font-medium text-[#00FF88] hover:underline"
            >
              View
            </button>
          </motion.div>
        )}

        {/* Header - centered */}
        <header className="relative flex flex-col items-center pb-6">
          <button
            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A] hover:text-white"
            aria-label="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="absolute left-0 top-0 rounded-xl border border-[#2A2A2A] bg-transparent px-3 py-2 text-[13px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A] hover:text-white"
            onClick={() => setAddFriendOpen(true)}
            aria-label="Add friend"
          >
            + Add friend
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: avatarReady ? 1 : 0, scale: avatarReady ? 1 : 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative mt-8"
          >
            <ProfileAvatarClient
              initialAvatarUrl={props.profile.avatar_url}
              displayName={props.profile.display_name || props.profile.username}
              username={props.profile.username}
              size={80}
              centered
            />
          </motion.div>

          <h1 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-white">
            {props.profile.display_name || props.profile.username}
          </h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">@{props.profile.username}</p>
          <span className="mt-2 inline-flex rounded-full bg-[#00FF88]/10 px-3 py-1 text-[12px] font-medium text-[#00FF88]">
            {rankEmoji} {props.rank.label}
          </span>
          <p className="mt-1 text-[12px] text-[#3A3A3A]">
            {props.rank.remaining} vlog{props.rank.remaining === 1 ? "" : "s"} to Warrior
          </p>
        </header>

        {/* Stats - no boxes, separators */}
        <section className="flex items-center justify-center gap-0 py-6">
          <div className="flex flex-1 flex-col items-center">
            <p className="text-[24px] font-bold text-white">
              <CountUp value={props.totalDares} />
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">dares</p>
          </div>
          <div className="h-6 w-px bg-[#1E1E1E]" />
          <div className="flex flex-1 flex-col items-center">
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-[24px] font-bold text-white">
              <CountUp value={props.currentStreak} />
              {props.longestStreak > 0 && (
                <span className="rounded bg-[#00FF88]/15 px-2 py-0.5 text-[11px] font-medium text-[#00FF88]">
                  Best: {props.longestStreak}d
                </span>
              )}
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">streak</p>
          </div>
          <div className="h-6 w-px bg-[#1E1E1E]" />
          <div className="flex flex-1 flex-col items-center">
            <p className="text-[24px] font-bold text-white">
              <CountUp value={props.totalVlogs} />
            </p>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">vlogs</p>
          </div>
        </section>

        {/* Weekly consistency */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            this week
          </h2>
          <div className="mt-3 flex justify-between gap-1">
            {props.last7Days.map((d, i) => (
              <motion.div
                key={d.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    d.posted
                      ? "bg-[#00FF88]"
                      : d.isToday
                      ? "border-2 border-dashed border-[#00FF88] bg-transparent"
                      : d.isFuture
                      ? "bg-[#1A1A1A]"
                      : "bg-[#FF4444]/40"
                  } ${d.isToday ? "animate-pulse" : ""}`}
                />
                <span className="text-[11px] font-medium text-[#6B6B6B]">{d.label}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-center text-[13px] text-[#3A3A3A]">
            Keep posting to grow your streak
          </p>
        </section>

        {/* Active dares */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            active dares
          </h2>
          {props.activeChallenges.length === 0 ? (
            <p className="mt-3 text-center text-[15px] text-[#3A3A3A]">No active dares</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {props.activeChallenges.map((c) => {
                const { daysRemaining, progress } = getProgress(c);
                return (
                  <Link
                    key={c.id}
                    href={`/challenge/${c.id}`}
                    className="block overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-all duration-150 hover:bg-[#1A1A1A] active:scale-[0.97]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[16px] font-bold tracking-[-0.02em] text-white">
                        {c.title}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88]" />
                        <span className="text-[12px] font-medium text-[#00FF88]">Live</span>
                      </span>
                    </div>
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#1E1E1E]">
                      <motion.div
                        className="h-full rounded-full bg-[#00FF88]"
                        initial={false}
                        animate={{ width: `${Math.round(progress * 100)}%` }}
                        transition={{ duration: 0.25 }}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[12px] text-[#6B6B6B]">
                      <span className="flex items-center gap-1">
                        <IconUser className="h-3.5 w-3.5" />
                        <span className="tabular-nums text-white">{c.member_count ?? "—"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <IconZap className="h-3.5 w-3.5" />
                        <span className="tabular-nums text-white">{c.your_streak}</span>
                      </span>
                      <span className="tabular-nums text-white">{daysRemaining} days left</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Settings / Account */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            account
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
            <button className="flex h-12 w-full items-center justify-between border-b border-[#1E1E1E] px-4 text-left text-[15px] text-white transition-colors hover:bg-[#1A1A1A]">
              Edit profile
              <span className="text-[#6B6B6B]">›</span>
            </button>
            <button className="flex h-12 w-full items-center justify-between border-b border-[#1E1E1E] px-4 text-left text-[15px] text-white transition-colors hover:bg-[#1A1A1A]">
              Notifications
              <span className="text-[#6B6B6B]">›</span>
            </button>
            <button className="flex h-12 w-full items-center justify-between border-b border-[#1E1E1E] px-4 text-left text-[15px] text-white transition-colors hover:bg-[#1A1A1A]">
              Privacy
              <span className="text-[#6B6B6B]">›</span>
            </button>
            <button className="flex h-12 w-full items-center justify-between px-4 text-left text-[15px] text-white transition-colors hover:bg-[#1A1A1A]">
              Help & feedback
              <span className="text-[#6B6B6B]">›</span>
            </button>
          </div>

          {logoutConfirm ? (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-[#1E1E1E] py-3 text-[15px] font-medium text-white"
              >
                Cancel
              </button>
              <form action={props.handleLogout} className="flex-1">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#FF4444]/20 py-3 text-[15px] font-semibold text-[#FF4444]"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setLogoutConfirm(true)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-[#FF4444] transition-colors hover:bg-[#1A1A1A]"
            >
              Log out
            </button>
          )}
        </section>
      </div>

      <AddFriendSheet open={addFriendOpen} onClose={() => setAddFriendOpen(false)} />
      <FriendRequestsSheet
        open={requestsOpen}
        onClose={() => setRequestsOpen(false)}
        requests={props.pendingRequests}
        currentUserId={props.profile.id}
        onRespond={() => router.refresh()}
      />
    </main>
  );
}

