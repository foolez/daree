"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type ChallengeCard = {
  id: string;
  title: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  member_count: number | null;
  your_streak: number;
};

function IconBell(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={props.className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      <path
        d="M15 17H9m8-2v-5a5 5 0 10-10 0v5l-2 2h14l-2-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHome(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={props.className ?? "h-6 w-6"}
      aria-hidden="true"
    >
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCamera(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={props.className ?? "h-7 w-7"}
      aria-hidden="true"
    >
      <path
        d="M7 7h10l1.5 2H21v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9h2.5L7 7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 18a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconUser(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={props.className ?? "h-6 w-6"}
      aria-hidden="true"
    >
      <path
        d="M20 21a8 8 0 10-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconPlus(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={props.className ?? "h-6 w-6"}
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
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

function getProgress(challenge: ChallengeCard) {
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

function usePageIntroAnimation() {
  const [ready, setReady] = useState(false);
  useMemo(() => {
    const t = setTimeout(() => setReady(true), 40);
    return () => clearTimeout(t);
  }, []);
  return ready;
}

function JoinSheet(props: {
  open: boolean;
  onClose: () => void;
  onJoined: (challengeId: string) => void;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (status === "loading") return;
    setCode("");
    setStatus("idle");
    setError(null);
    props.onClose();
  }

  async function join() {
    const inviteCode = code.trim().toUpperCase();
    if (inviteCode.length !== 6) {
      setStatus("error");
      setError("Invite code must be 6 characters.");
      return;
    }

    setStatus("loading");
    setError(null);

    const res = await fetch("/api/challenges/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: inviteCode })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Could not join. Try again.");
      return;
    }

    props.onJoined(data.challenge_id);
  }

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/60"
      />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-3xl border border-[#2A2A2A] bg-[#0A0A0A] p-5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#2A2A2A]" />
        <h3 className="text-lg font-black tracking-tight">Join a Dare</h3>
        <p className="mt-1 text-sm text-[#888888]">
          Enter the 6-character invite code.
        </p>

        <div className="mt-4 space-y-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            inputMode="text"
            maxLength={6}
            className="w-full rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-center font-mono text-lg tracking-[0.3em] text-white outline-none focus:border-[#00FF88]"
          />
          <button
            onClick={join}
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black disabled:opacity-70"
          >
            {status === "loading" ? "Joining..." : "Join Dare 🤝"}
          </button>
          {error && <p className="text-sm text-[#FF3B3B]">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function DashboardClient(props: {
  profile: Profile;
  initialChallenges: ChallengeCard[];
  initialUnreadCount: number;
}) {
  const intro = usePageIntroAnimation();
  const [joinOpen, setJoinOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(props.initialUnreadCount ?? 0);
  const [installBanner, setInstallBanner] = useState(false);
  const installEventRef = useRef<any>(null);

  const challenges = props.initialChallenges ?? [];
  const hasChallenges = challenges.length > 0;

  const greetingName = props.profile.displayName || props.profile.username;
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/profile");

  useEffect(() => {
    // PWA install prompt after 2 visits.
    try {
      const key = "daree_visits";
      const visits = Number(localStorage.getItem(key) || "0") + 1;
      localStorage.setItem(key, String(visits));
    } catch {
      // ignore
    }

    function onBeforeInstallPrompt(e: any) {
      e.preventDefault();
      installEventRef.current = e;
      try {
        const visits = Number(localStorage.getItem("daree_visits") || "0");
        if (visits >= 2) setInstallBanner(true);
      } catch {
        setInstallBanner(true);
      }
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    // Realtime notifications badge.
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("notifications-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${props.profile.id}`
        },
        (payload) => {
          const row: any = payload.new;
          if (row?.is_read === false) setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${props.profile.id}`
        },
        (payload) => {
          const row: any = payload.new;
          const oldRow: any = payload.old;
          if (oldRow?.is_read === false && row?.is_read === true) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [props.profile.id]);

  async function triggerShameCheck() {
    // Runs on dashboard load. Creates missed-day notifications if after 8PM.
    if (new Date().getHours() < 20) return;
    const challengeIds = challenges.map((c) => c.id);
    if (challengeIds.length === 0) return;
    await fetch("/api/shame/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_ids: challengeIds })
    }).catch(() => {});
  }

  useEffect(() => {
    triggerShameCheck().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div
        className={`mx-auto min-h-screen max-w-md px-5 pb-28 pt-6 transition-all duration-500 ${
          intro ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-black p-0.5">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="text-left">
              <div className="text-base font-black tracking-tight">Daree</div>
              <div className="text-xs text-[#888888]">
                Hey, {greetingName} 👊
              </div>
            </div>
          </Link>

          <Link
            href="/notifications"
            className="relative rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-[#888888]"
            aria-label="Notifications"
          >
            <IconBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF3B3B] px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {installBanner && (
          <div className="mt-4 rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  📱 Install Daree for the best experience
                </p>
                <p className="mt-1 text-xs text-[#888888]">
                  Add it to your Home Screen. It opens like a real app.
                </p>
              </div>
              <button
                onClick={() => setInstallBanner(false)}
                className="rounded-xl border border-[#2A2A2A] bg-black/30 px-3 py-1 text-xs text-[#888888]"
              >
                Maybe later
              </button>
            </div>
            <button
              onClick={async () => {
                const e = installEventRef.current;
                if (!e) return;
                e.prompt();
                await e.userChoice.catch(() => {});
                installEventRef.current = null;
                setInstallBanner(false);
              }}
              className="mt-3 w-full rounded-2xl bg-[#00FF88] px-4 py-3 text-sm font-semibold text-black"
            >
              Add to Home Screen
            </button>
          </div>
        )}

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
              Active dares
            </h2>
            <button
              onClick={() => setJoinOpen(true)}
              className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-white"
            >
              Join
            </button>
          </div>

          {!hasChallenges ? (
            <div className="mt-3 overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <div className="relative">
                <div className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-[#00FF88]/10 blur-2xl" />
                <div className="absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-[#FF6B35]/10 blur-2xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-black/40 px-3 py-1 text-xs text-[#888888]">
                    <span className="h-2 w-2 rounded-full bg-[#00FF88]" />
                    No dares yet
                  </div>
                  <p className="mt-3 text-lg font-black tracking-tight">
                    No dares yet. Time to challenge someone.
                  </p>
                  <p className="mt-2 text-sm text-[#888888]">
                    Create a dare, invite your friends, and start posting daily
                    proof.
                  </p>

                  <Link
                    href="/create"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black transition active:scale-[0.99]"
                    style={{
                      animation: "pulseSoft 1.8s ease-in-out infinite"
                    }}
                  >
                    Create a Dare 🔥
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {challenges.map((c) => {
                const { dayNumber, daysRemaining, progress } = getProgress(c);
                return (
                  <Link
                    key={c.id}
                    href={`/challenge/${c.id}`}
                    className="group relative overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 transition active:scale-[0.99]"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#00FF88]" />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-tight">
                          {c.title}
                        </p>
                        <p className="mt-1 text-xs text-[#888888]">
                          Day {dayNumber} of {c.duration_days || "—"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#2A2A2A] bg-black/30 px-3 py-1 text-[11px] font-semibold text-[#888888]">
                        Live
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-black/30">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#00FF88] to-[#FF6B35]"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#888888]">
                      <span>
                        👥{" "}
                        <span className="text-white">
                          {c.member_count ?? "—"}
                        </span>
                      </span>
                      <span>
                        🔥{" "}
                        <span className="text-white">{c.your_streak}</span>
                      </span>
                      <span>
                        📅{" "}
                        <span className="text-white">{daysRemaining}</span>{" "}
                        left
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <Link
        href="/create"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88] text-black shadow-[0_0_30px_rgba(0,255,136,0.45)] transition active:scale-[0.98]"
        aria-label="Create a Dare"
      >
        <IconPlus className="h-6 w-6" />
      </Link>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#2A2A2A] bg-black/80 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 items-center px-6 py-3">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-[#00FF88]"
            aria-label="Home"
          >
            <IconHome className="h-6 w-6" />
          </Link>

          <Link
            href="/record"
            className="mx-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88] text-black"
            aria-label="Record"
          >
            <IconCamera className="h-7 w-7" />
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 ${
              onProfile ? "text-[#00FF88]" : "text-[#888888]"
            }`}
            aria-label="Profile"
          >
            {props.profile.avatarUrl ? (
              <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-[#2A2A2A] bg-[#1A1A1A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={props.profile.avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <IconUser className="h-6 w-6" />
            )}
          </Link>
        </div>
      </nav>

      <style jsx global>{`
        @keyframes pulseSoft {
          0% {
            transform: translateZ(0) scale(1);
            box-shadow: 0 0 0 rgba(0, 255, 136, 0);
          }
          50% {
            transform: translateZ(0) scale(1.01);
            box-shadow: 0 0 35px rgba(0, 255, 136, 0.28);
          }
          100% {
            transform: translateZ(0) scale(1);
            box-shadow: 0 0 0 rgba(0, 255, 136, 0);
          }
        }
      `}</style>

      <JoinSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={(challengeId) => {
          window.location.href = `/challenge/${challengeId}`;
        }}
      />
    </main>
  );
}

