"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

type FriendCircle = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  postedToday: boolean;
};

type GlobalLeader = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  longestStreak: number;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

function NudgeButton(props: {
  nudged: boolean;
  onClick: () => void;
  username: string;
  assetSrc: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={props.onClick}
        whileHover={{ scale: 1.05, boxShadow: "0 0 14px rgba(0,255,136,0.3)" }}
        whileTap={{ scale: [0.9, 1.1, 1] }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-[#1A1A1A] transition-colors duration-300 ${
          props.nudged
            ? "border-[#00FF88] bg-[#00FF88]"
            : "border-[#2A2A2A] bg-[#1A1A1A]"
        }`}
        aria-label={`Nudge ${props.username}`}
      >
        <span
          className={`relative inline-flex items-center justify-center rounded-full ${
            props.nudged ? "animate-pulse" : "bg-[#00FF88]/15"
          }`}
        >
          <Image
            src={props.assetSrc}
            alt=""
            width={16}
            height={16}
            className={`h-4 w-4 object-contain ${
              props.nudged
                ? ""
                : "brightness-125 saturate-200 [filter:drop-shadow(0_0_6px_rgba(0,255,136,0.95))]"
            }`}
          />
        </span>
      </motion.button>
      <AnimatePresence mode="wait">
        <motion.p
          key={props.nudged ? "sent" : "nudge"}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="mt-1 text-[10px] font-bold tracking-widest text-[#888888]"
        >
          {props.nudged ? "SENT" : "NUDGE"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

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

function IconArrowLeft(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className ?? "h-5 w-5"} aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  nudgeAssetSrc: string;
  initialChallenges: ChallengeCard[];
  initialUnreadCount: number;
  initialNotifications: NotificationItem[];
  youPostedToday: boolean;
  friends: FriendCircle[];
  globalTop5: GlobalLeader[];
}) {
  const intro = usePageIntroAnimation();
  const [joinOpen, setJoinOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(props.initialUnreadCount ?? 0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"all" | "nudges" | "challenges">("all");
  const [nudgeBanner, setNudgeBanner] = useState<string | null>(null);
  const [installBanner, setInstallBanner] = useState(false);
  const installEventRef = useRef<any>(null);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const challenges = props.initialChallenges ?? [];
  const hasChallenges = challenges.length > 0;

  const greetingName = props.profile.displayName || props.profile.username;
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/profile");

  const midnight = new Date(nowMs);
  midnight.setHours(24, 0, 0, 0);
  const remainingSeconds = Math.max(
    0,
    Math.floor((midnight.getTime() - nowMs) / 1000)
  );
  const hh = Math.floor(remainingSeconds / 3600);
  const mm = Math.floor((remainingSeconds % 3600) / 60);
  const ss = remainingSeconds % 60;
  const secured = props.youPostedToday;

  // Inline friend request (mobile-friendly)
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSending, setFriendSending] = useState(false);
  const [friendFeedback, setFriendFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [nudgedById, setNudgedById] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    props.initialNotifications ?? []
  );

  async function sendFriendRequest() {
    const typed = friendSearch.trim();
    if (!typed) {
      setFriendFeedback({ kind: "error", text: "Type a username first." });
      return;
    }

    setFriendSending(true);
    setFriendFeedback(null);

    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: typed })
    }).catch(() => null);

    if (!res) {
      setFriendSending(false);
      setFriendFeedback({
        kind: "error",
        text: "Error: Network error. Please try again."
      });
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.error ?? "Error.";
      setFriendSending(false);
      setFriendFeedback({ kind: "error", text: msg });
      return;
    }

    setFriendSending(false);
    setFriendSearch("");
    setFriendFeedback({
      kind: "success",
      text: data.message ?? "Request sent! 🚀"
    });
  }

  async function nudgeFriend(friend: FriendCircle) {
    if (nudgedById[friend.userId]) return;
    // Optimistic UI for instant, haptic-like feedback.
    setNudgedById((prev) => ({ ...prev, [friend.userId]: true }));

    const res = await fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: friend.userId })
    }).catch(() => null);

    if (!res) {
      setFriendFeedback({
        kind: "error",
        text: "Database sync issue - check column names."
      });
      setNudgedById((prev) => ({ ...prev, [friend.userId]: false }));
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[dashboard] nudge failed", data);
      setFriendFeedback({
        kind: "error",
        text: "Database sync issue - check column names."
      });
      setNudgedById((prev) => ({ ...prev, [friend.userId]: false }));
      return;
    }
  }

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
          if (row?.type === "nudge" && typeof row?.message === "string") {
            setNudgeBanner(row.message);
            setTimeout(() => setNudgeBanner(null), 6000);
          }
          setNotifications((prev) => [
            {
              id: String(row?.id ?? crypto.randomUUID?.() ?? Date.now()),
              type: String(row?.type ?? "general"),
              title: String(row?.title ?? ""),
              message: String(row?.message ?? ""),
              createdAt: String(row?.created_at ?? new Date().toISOString()),
              sender: null
            },
            ...prev
          ]);
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

  const fallbackCards: NotificationItem[] = [
    {
      id: "fallback-nudge",
      type: "nudge",
      title: "Nudge",
      message: "Ahmet D. nudged you! Your streak is at risk. Post proof now. 😤",
      createdAt: new Date().toISOString(),
      sender: {
        id: "ahmet",
        username: "ahmetd",
        displayName: "Ahmet D.",
        avatarUrl: "/image_996971.png"
      }
    },
    {
      id: "fallback-challenge",
      type: "challenge",
      title: "Challenge Invite",
      message: "Invitation to: '90 Days Alcohol-Free' by Vural C.. Join or Slack? 🚫",
      createdAt: new Date().toISOString(),
      sender: {
        id: "vural",
        username: "vuralc",
        displayName: "Vural C.",
        avatarUrl: "/image_996971.png"
      }
    },
    {
      id: "fallback-streak",
      type: "system",
      title: "Discipline Alert",
      message: "Discipline Alert: 4 hours left to secure your 100-day streak.",
      createdAt: new Date().toISOString(),
      sender: null
    }
  ];

  const sourceNotifications = (notifications.length > 0 ? notifications : fallbackCards)
    .filter((n) => n.type === "nudge" || n.type.includes("challenge") || n.type === "system");

  const visibleNotifications = sourceNotifications.filter((n) => {
    if (notificationTab === "all") return true;
    if (notificationTab === "nudges") return n.type === "nudge";
    return (
      n.type.includes("challenge") ||
      n.title.toLowerCase().includes("challenge")
    );
  });

  const dayProgress = remainingSeconds / 86400;

  function notificationCopy(n: NotificationItem) {
    const friendName = n.sender?.displayName || n.sender?.username || "A friend";
    if (n.type === "nudge") {
      return `${friendName} nudged you! Your streak is at risk. Post proof now. 😤`;
    }
    if (n.type.includes("challenge")) {
      return `Invitation to: '90 Days Alcohol-Free' by ${friendName}. Join or Slack? 🚫`;
    }
    return "Discipline Alert: 4 hours left to secure your 100-day streak.";
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div
        className={`mx-auto min-h-screen max-w-md px-5 pb-28 pt-6 transition-all duration-500 ${
          intro ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" aria-label="Go to profile">
              <div
                className="h-[52px] w-[52px] overflow-hidden rounded-full border-2 border-[#00FF88] bg-[#1A1A1A] p-0.5 ring-1 ring-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.18)]"
              >
                {props.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.profile.avatarUrl}
                    alt="Profile avatar"
                    width={52}
                    height={52}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white/5 text-[#FFFFFF]">
                    <IconUser className="h-7 w-7" />
                  </div>
                )}
              </div>
            </Link>
            <div className="text-left">
              <div className="text-base font-black tracking-tight">Daree</div>
              <div className="text-xs text-[#888888]">
                Hey, {greetingName} 👊
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative rounded-2xl border border-[#00FF88]/50 bg-[#0E1A14] p-2 text-[#00FF88] shadow-[0_0_32px_rgba(0,255,136,0.48)] transition-all duration-200 ease-in-out"
            aria-label="Notifications"
            style={{ animation: "pulseSoft 1.6s ease-in-out infinite" }}
          >
            <Image src="/image_99d668.png" alt="" width={26} height={26} className="h-6 w-6 object-contain" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4B4B] px-1 text-[10px] font-semibold text-white">
              {unreadCount > 0 ? Math.min(unreadCount, 99) : 2}
            </span>
          </button>
        </header>

        {notificationsOpen && (
          <motion.section
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4 rounded-3xl border border-[#2A2A2A] bg-[#0D0D0D] p-4"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#00FF88]/40 px-2 py-1 text-xs font-bold text-[#00FF88]"
              >
                <IconArrowLeft className="h-4 w-4" />
                BACK
              </button>
              <h2 className="text-center text-lg font-black tracking-[0.18em] text-[#00FF88]">
                NOTIFICATIONS
              </h2>
              <div className="w-16" />
            </div>

            <div className="mt-4 flex items-center gap-5 border-b border-[#2A2A2A] pb-2">
              {(["all", "nudges", "challenges"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNotificationTab(t)}
                  className={`relative text-xs font-black tracking-[0.18em] ${
                    notificationTab === t ? "text-[#00FF88]" : "text-[#888888]"
                  }`}
                >
                  {t.toUpperCase()}
                  {notificationTab === t && (
                    <span className="absolute -bottom-[10px] left-0 h-[3px] w-full rounded-full bg-[#00FF88]" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {visibleNotifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-3 [background-image:radial-gradient(circle_at_100%_0%,rgba(0,255,136,0.09),transparent_45%)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {n.type === "nudge" ? (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#00FF88]/40 bg-[#0E1A14]">
                          <Image src={props.nudgeAssetSrc} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                        </span>
                      ) : n.sender?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={n.sender.avatarUrl}
                          alt={n.sender.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] text-[#00FF88]">
                          🔥
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-extrabold text-white">
                          {notificationCopy(n)}
                        </p>
                        <p className="mt-1 text-[11px] text-[#888888]">
                          {n.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {n.type === "nudge" ? (
                      <button className="rounded-xl bg-[#00FF88] px-3 py-2 text-xs font-bold text-black transition-all duration-200 ease-in-out hover:brightness-110">
                        POST PROOF
                      </button>
                    ) : n.type.includes("challenge") ? (
                      <div className="flex items-center gap-2">
                        <button className="rounded-xl bg-[#00FF88] px-3 py-2 text-xs font-bold text-black transition-all duration-200 ease-in-out hover:brightness-110">
                          JOIN
                        </button>
                        <button className="rounded-xl border border-[#FF4B4B]/50 px-3 py-2 text-xs font-bold text-[#FF4B4B] transition-all duration-200 ease-in-out hover:bg-[#FF4B4B]/10">
                          REJECT
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className={notificationsOpen ? "hidden" : ""}>
        {/* Doom Clock + Slack Watch */}
        <section className="mt-4 space-y-2">
          {nudgeBanner && (
            <div className="max-w-md mx-auto rounded-2xl border border-[#00FF88]/40 bg-[#0E1A14] px-3 py-2 text-xs font-semibold text-[#B8FFD9]">
              {nudgeBanner}
            </div>
          )}

          <div
            className={`max-w-md mx-auto rounded-2xl border p-3 backdrop-blur-md ${
              secured
                ? "border-[#00FF88]/30 bg-white/5"
                : "border-[#FF4B4B]/30 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${secured ? "text-[#00FF88]" : "text-[#FF4B4B]"}`}>
                {secured ? "STREAK SECURED" : "DISCIPLINE ALERT"}
              </p>
              <span className="rounded-full border border-[#2A2A2A] px-2 py-0.5 text-[10px] text-[#888888]">
                until 00:00
              </span>
            </div>
            <div className="mt-2 font-mono text-[28px] font-bold tracking-[0.06em] text-white">
              {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
              <motion.div
                className={`h-full ${secured ? "bg-[#00FF88]" : "bg-[#FF4B4B]"}`}
                animate={{ width: `${Math.max(0, Math.min(100, dayProgress * 100))}%` }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Add Friend (neon card) */}
          <div className="mx-auto max-w-md rounded-2xl border border-[#2A2A2A] bg-[#121212] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
                Add friend
              </h2>
              <span className="text-[11px] text-[#888888]">
                Username (case-insensitive)
              </span>
            </div>

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendFriendRequest().catch(() => {});
              }}
            >
              <input
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="e.g. ali_works"
                className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-[11px] text-white outline-none focus:border-[#00FF88]"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <button
                type="submit"
                disabled={friendSending}
                className="rounded-xl bg-[#00FF88] px-4 py-2 text-xs font-semibold text-black shadow-[0_0_22px_rgba(0,255,136,0.35)] transition active:scale-[0.99] disabled:opacity-60"
              >
                {friendSending ? "Adding…" : "Add"}
              </button>
            </form>

            {friendFeedback && (
              <div
                className={`mt-2 text-[11px] font-semibold ${
                  friendFeedback.kind === "success"
                    ? "text-[#00FF88]"
                    : "text-[#FF3B3B]"
                }`}
              >
                {friendFeedback.text}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[#FF6B35]">
              LOSER RADAR
            </h2>
          </div>

          <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-3">
            <div className="flex gap-3 overflow-x-auto pb-1">
            {props.friends.filter((f) => !f.postedToday).length === 0 ? (
              <div className="min-w-[240px] rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm text-[#888888]">
                Everyone posted today. No slackers in sight.
              </div>
            ) : (
              props.friends
                .filter((f) => !f.postedToday)
                .map((f) => (
                <div
                  key={f.userId}
                  className="w-16 shrink-0"
                  aria-label={`${f.username} missed`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border p-0.5 transition ${
                        nudgedById[f.userId]
                          ? "border-[#00FF88] bg-[#00FF88]/10"
                          : "border-[#2A2A2A] bg-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0A0A0A]">
                        {f.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.avatarUrl}
                            alt={f.username}
                            width={44}
                            height={44}
                            className={`h-full w-full rounded-full object-cover transition ${
                              nudgedById[f.userId]
                                ? "grayscale-0 opacity-100"
                                : "grayscale opacity-60"
                            }`}
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center ${
                              nudgedById[f.userId]
                                ? "text-[#00FF88]"
                                : "text-[#888888]"
                            }`}
                          >
                            <IconUser className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="max-w-[62px] truncate text-[10px] text-[#888888]">
                      @{f.username}
                    </p>
                    <NudgeButton
                      nudged={!!nudgedById[f.userId]}
                      onClick={() => nudgeFriend(f)}
                      username={f.username}
                      assetSrc={props.nudgeAssetSrc}
                    />
                  </div>
                </div>
                ))
            )}
          </div>
          </div>
        </section>

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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setJoinOpen(true)}
                className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-white"
              >
                Join
              </button>
            </div>
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

        {/* Global Top 5 (Arena) */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
            Global Top 5
          </h2>

          {props.globalTop5.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm text-[#888888]">
              No leaderboard data yet.
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]">
              <div className="px-4 py-3 text-[11px] text-[#888888]">
                Rank <span className="ml-2">|</span> Avatar <span className="ml-2">|</span>{" "}
                Username <span className="ml-2">|</span> Streak
              </div>
              <div className="divide-y divide-[#2A2A2A]">
                {props.globalTop5.map((u, idx) => (
                  <div
                    key={u.userId}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx === 0
                        ? "bg-[#00FF88]/10"
                        : idx === 1
                        ? "bg-[#FF6B35]/10"
                        : idx === 2
                        ? "bg-[#00FF88]/5"
                        : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div
                      className={`w-8 text-sm font-black ${
                        idx === 0
                          ? "text-[#00FF88]"
                          : idx === 1
                          ? "text-[#FF6B35]"
                          : idx === 2
                          ? "text-[#00FF88]"
                          : "text-[#888888]"
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#2A2A2A] bg-[#0A0A0A]">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt={u.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#888888]">
                          {u.username?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {u.displayName || u.username}
                      </div>
                      <div className="text-[11px] text-[#888888]">
                        🔥 {u.longestStreak} Days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
      </div>

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

