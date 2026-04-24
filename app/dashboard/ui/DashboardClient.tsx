"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
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
  is_public?: boolean;
  is_completed?: boolean;
  status?: string;
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
  totalPoints?: number;
  longestStreak: number;
};

type NotificationItem = {
  id: string;
  requestId?: string;
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

function Avatar(props: {
  url: string | null;
  username: string;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const size = props.size ?? 32;
  const initial = (props.username || "U").trim().charAt(0).toUpperCase();
  const showImg = props.url && !broken;
  if (showImg) {
    return (
      <span
        className={`inline-flex shrink-0 overflow-hidden rounded-full bg-[#111111] ${props.className ?? ""}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={props.url!}
          alt={props.username}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${props.className ?? ""}`}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(props.username)
      }}
    >
      {initial}
    </span>
  );
}

function IconZap(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={props.className ?? "h-4 w-4"} aria-hidden="true">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

const NUDGE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const NUDGE_STORAGE_KEY = "daree_nudges";

function NudgeButton(props: {
  nudged: boolean;
  onClick: () => void;
  username: string;
  userId: string;
}) {
  const [phase, setPhase] = useState<"idle" | "animating" | "sent" | "cooldown">("idle");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remainingMins, setRemainingMins] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NUDGE_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const ts = data[props.userId];
      if (ts && typeof ts === "number") {
        const until = ts + NUDGE_COOLDOWN_MS;
        if (Date.now() < until) {
          setCooldownUntil(until);
          setPhase("cooldown");
        }
      }
    } catch {
      /* ignore */
    }
  }, [props.userId]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const left = cooldownUntil - Date.now();
      if (left <= 0) {
        setCooldownUntil(null);
        setRemainingMins(null);
        setPhase("idle");
        try {
          const raw = localStorage.getItem(NUDGE_STORAGE_KEY);
          const data = raw ? JSON.parse(raw) : {};
          delete data[props.userId];
          localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(data));
        } catch {
          /* ignore */
        }
        return;
      }
      setRemainingMins(Math.ceil(left / 60000));
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [cooldownUntil, props.userId]);

  const disabled = phase === "cooldown" || props.nudged;

  async function handleClick() {
    if (disabled) return;
    if (typeof navigator?.vibrate === "function") navigator.vibrate(50);
    setPhase("animating");
    props.onClick();
    const until = Date.now() + NUDGE_COOLDOWN_MS;
    setCooldownUntil(until);
    try {
      const raw = localStorage.getItem(NUDGE_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[props.userId] = Date.now();
      localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    setTimeout(() => setPhase("sent"), 300);
    setTimeout(() => setPhase("cooldown"), 1800);
  }

  const showSent = phase === "sent";
  const inCooldown = phase === "cooldown";

  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-full border border-[#2A2A2A] bg-[#1A1A1A] transition-opacity duration-150 ${
          disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
        }`}
        aria-label={`Nudge ${props.username}`}
        animate={phase === "animating" ? { scale: [1, 1.2, 1] } : {}}
        transition={{
          duration: 0.3,
          times: [0, 0.33, 1],
          ease: "easeOut"
        }}
      >
        {phase === "animating" && (
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#FF8C00]"
            initial={{ width: 40, height: 40, opacity: 0.3 }}
            animate={{ width: 80, height: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
        {showSent ? (
          <span className="text-[11px] font-medium text-[#00FF88]">Sent!</span>
        ) : (
          <span
            className="transition-colors duration-100"
            style={{
              color:
                phase === "animating"
                  ? "#FF8C00"
                  : inCooldown
                  ? "#6B6B6B"
                  : "#6B6B6B"
            }}
          >
            <IconZap className="h-4 w-4" />
          </span>
        )}
      </motion.button>
      {inCooldown && remainingMins != null && (
        <span className="mt-1 text-[10px] text-[#6B6B6B]">
          Nudge again in {remainingMins}m
        </span>
      )}
    </div>
  );
}

function IconArrowLeft(props: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className ?? "h-5 w-5"} aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth={props.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" />
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

function IconCompass(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={props.className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinecap="round" strokeLinejoin="round" />
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

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
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
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(t);
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
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-2xl border border-[#1E1E1E] bg-[#111111] p-5">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#1E1E1E]" />
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-white">Join a dare</h3>
        <p className="mt-1 text-[15px] text-[#6B6B6B]">
          Enter the 6-character invite code.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            inputMode="text"
            maxLength={6}
            className="w-full rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-4 text-center font-mono text-lg tracking-[0.3em] text-white outline-none transition-colors focus:border-[#00FF88]"
          />
          <button
            onClick={join}
            disabled={status === "loading"}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] px-4 py-3 text-[15px] font-semibold text-black transition-all duration-150 active:scale-[0.97] disabled:opacity-70"
          >
            {status === "loading" ? "Joining..." : "Join dare"}
          </button>
          {error && <p className="text-[13px] text-[#FF4444]">{error}</p>}
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
  const router = useRouter();
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

  const [challenges, setChallenges] = useState<ChallengeCard[]>(
    props.initialChallenges ?? []
  );
  const hasChallenges = challenges.length > 0;

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

  const [nudgedById, setNudgedById] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    props.initialNotifications ?? []
  );

  async function syncUnreadCount() {
    const supabase = createSupabaseBrowserClient();
    const primary = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", props.profile.id)
      .eq("is_read", false);
    if (!primary.error && typeof primary.count === "number") {
      setUnreadCount(primary.count);
      return;
    }
    const fallback = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", props.profile.id)
      .eq("read", false);
    if (!fallback.error && typeof fallback.count === "number") {
      setUnreadCount(fallback.count);
    } else {
      setUnreadCount(0);
    }
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

    if (!res || !res.ok) {
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
          if (row?.type === "nudge" && typeof row?.message === "string") {
            setNudgeBanner(row.message);
            setTimeout(() => setNudgeBanner(null), 6000);
          }
          syncUnreadCount().catch(() => {});
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
          syncUnreadCount().catch(() => {});
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === String(row?.id)
                ? {
                    ...n,
                    type: String(row?.type ?? n.type),
                    title: String(row?.title ?? n.title),
                    message: String(row?.message ?? n.message)
                  }
                : n
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${props.profile.id}`
        },
        (payload) => {
          const oldRow: any = payload.old;
          syncUnreadCount().catch(() => {});
          setNotifications((prev) =>
            prev.filter((n) => n.id !== String(oldRow?.id ?? ""))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [props.profile.id]);

  useEffect(() => {
    syncUnreadCount().catch(() => {});
  }, [props.profile.id]);

  useEffect(() => {
    function handleFocus() {
      router.refresh();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  useEffect(() => {
    async function updateExpiredChallenges() {
      const supabase = createSupabaseBrowserClient();
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("challenges")
        .update({ status: "completed" })
        .lte("end_date", today)
        .eq("status", "active");

      setChallenges((prev) =>
        prev.map((c) => {
          const ended = !!c.end_date && c.end_date < today;
          if (ended || c.status === "completed") {
            return { ...c, status: "completed", is_completed: true };
          }
          return c;
        })
      );
    }
    updateExpiredChallenges().catch(() => {});
  }, []);

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

  const sourceNotifications = notifications.filter(
    (n) =>
      n.type === "nudge" ||
      n.type.includes("challenge") ||
      n.type === "system" ||
      n.type === "friend_request"
  );

  const visibleNotifications = sourceNotifications.filter((n) => {
    if (notificationTab === "all") return true;
    if (notificationTab === "nudges") return n.type === "nudge";
    return (
      n.type.includes("challenge") ||
      n.title.toLowerCase().includes("challenge") ||
      n.type === "friend_request"
    );
  });

  const dayProgress = remainingSeconds / 86400;

  async function openChallenge(challenge: ChallengeCard) {
    const supabase = createSupabaseBrowserClient();
    const today = new Date().toISOString().split("T")[0];
    const isCompleted =
      challenge.status === "completed" ||
      challenge.is_completed === true ||
      (!!challenge.end_date && challenge.end_date < today);

    if (!isCompleted) {
      router.push(`/challenge/${challenge.id}`);
      return;
    }

    const { data: existingView } = await supabase
      .from("wrapped_views")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", props.profile.id)
      .maybeSingle();

    if (existingView?.id) {
      router.push(`/challenge/${challenge.id}`);
      return;
    }

    await supabase.from("wrapped_views").insert({
      challenge_id: challenge.id,
      user_id: props.profile.id
    });
    router.push(`/challenge/${challenge.id}/wrapped`);
  }

  function notificationCopy(n: NotificationItem) {
    const friendName = n.sender?.displayName || n.sender?.username || "A friend";
    if (n.type === "nudge") {
      return `${friendName} nudged you! Your streak is at risk. Post proof now. 😤`;
    }
    if (n.type === "friend_request") {
      return `${friendName} sent you a friend request. Accept and lock in accountability.`;
    }
    if (n.type.includes("challenge")) {
      return `Invitation to: '90 Days Alcohol-Free' by ${friendName}. Join or Slack? 🚫`;
    }
    return "Discipline Alert: 4 hours left to secure your 100-day streak.";
  }

  async function handleFriendRequestAction(
    requestId: string | undefined,
    action: "accept" | "reject"
  ) {
    if (!requestId) return;
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, action })
    }).catch(() => null);

    if (!res || !res.ok) return;
    setNotifications((prev) =>
      prev.filter((n) => !(n.type === "friend_request" && n.requestId === requestId))
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div
        className={`mx-auto min-h-screen max-w-md px-5 pb-28 pt-6 transition-all duration-500 ${
          intro ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between">
          <Link href="/profile" className="inline-flex items-center gap-3" aria-label="Go to profile">
            <Avatar
              url={props.profile.avatarUrl}
              username={props.profile.username}
              size={32}
            />
            <span className="text-[15px] font-semibold text-white tracking-[-0.02em]">
              {props.profile.username}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative rounded-xl p-2 text-[#6B6B6B] transition-colors duration-150 hover:bg-[#1A1A1A] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span
                className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#FF4444]"
                aria-hidden
              />
            )}
          </button>
        </header>

        {notificationsOpen && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A] hover:text-white"
                aria-label="Back"
              >
                <IconArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <h2 className="text-[16px] font-bold tracking-[-0.02em] text-white">
                Notifications
              </h2>
              <div className="w-10" />
            </div>

            <div className="mt-4 flex gap-6 border-b border-[#1E1E1E]">
              {(["all", "nudges", "challenges"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNotificationTab(t)}
                  className={`relative pb-3 pt-1 text-[13px] font-medium capitalize transition-colors ${
                    notificationTab === t ? "text-white" : "text-[#6B6B6B]"
                  }`}
                >
                  {t}
                  {notificationTab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF88]" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-0">
              {visibleNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-[15px] font-medium text-white">All caught up! 🎉</p>
                  <p className="mt-1 text-[12px] text-[#6B6B6B]">No new notifications</p>
                </div>
              )}
              {visibleNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 border-b border-[#1E1E1E] py-4 last:border-b-0"
                >
                  <Avatar
                    url={n.sender?.avatarUrl ?? null}
                    username={n.sender?.username ?? "?"}
                    size={28}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-white">{notificationCopy(n)}</p>
                    <p className="mt-0.5 text-[12px] text-[#3A3A3A]">{timeAgo(n.createdAt)}</p>
                  </div>
                  {n.type === "nudge" && (
                    <Link
                      href="/record"
                      className="shrink-0 text-[13px] font-medium text-[#00FF88] transition-colors hover:underline"
                    >
                      Record →
                    </Link>
                  )}
                  {n.type === "friend_request" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleFriendRequestAction(n.requestId, "accept")}
                        className="rounded-xl bg-[#00FF88] px-3 py-2 text-[13px] font-semibold text-black transition-all duration-150 active:scale-[0.97]"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleFriendRequestAction(n.requestId, "reject")}
                        className="rounded-xl border border-[#1E1E1E] px-3 py-2 text-[13px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {n.type.includes("challenge") && (
                    <div className="flex shrink-0 gap-2">
                      <button className="rounded-xl bg-[#00FF88] px-3 py-2 text-[13px] font-semibold text-black transition-all duration-150 active:scale-[0.97]">
                        Join
                      </button>
                      <button className="rounded-xl border border-[#1E1E1E] px-3 py-2 text-[13px] font-medium text-[#6B6B6B]">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className={notificationsOpen ? "hidden" : ""}>
        {/* Doom Clock + Slack Watch */}
        <section className="mt-4 space-y-2">
          {nudgeBanner && (
            <div className="mx-auto max-w-md rounded-2xl border border-[#1E1E1E] bg-[#111111] px-4 py-3 text-[15px] text-[#00FF88]">
              {nudgeBanner}
            </div>
          )}

          <div className="mx-auto max-w-md rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-colors hover:bg-[#1A1A1A]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-normal text-white">
                  Post today&apos;s vlog
                </p>
                <p className="mt-1 font-mono text-[20px] font-semibold tracking-tight text-white tabular-nums">
                  {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </p>
              </div>
              <div className="relative h-14 w-14 shrink-0">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#1E1E1E"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#00FF88"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${(1 - dayProgress) * 100} ${dayProgress * 100}`}
                    initial={false}
                    animate={{ strokeDasharray: `${(1 - dayProgress) * 100} ${dayProgress * 100}` }}
                    transition={{ duration: 0.25 }}
                  />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Needs a push
          </h2>
          <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-colors hover:bg-[#1A1A1A]">
            {props.friends.filter((f) => !f.postedToday).length === 0 ? (
              <p className="text-[15px] text-[#6B6B6B]">
                Everyone has posted today.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {props.friends
                  .filter((f) => !f.postedToday)
                  .map((f) => (
                    <div
                      key={f.userId}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar url={f.avatarUrl} username={f.username} size={28} />
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium text-white">
                            @{f.username}
                          </p>
                          <span className="inline-block rounded-full bg-[#FF8C00]/20 px-2 py-0.5 text-[11px] font-medium text-[#FF8C00]">
                            Hasn&apos;t posted
                          </span>
                        </div>
                      </div>
                      <NudgeButton
                        nudged={!!nudgedById[f.userId]}
                        onClick={() => nudgeFriend(f)}
                        username={f.username}
                        userId={f.userId}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {installBanner && (
          <div className="mt-4 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium text-white">
                  Install Daree for the best experience
                </p>
                <p className="mt-1 text-[13px] text-[#6B6B6B]">
                  Add it to your Home Screen. It opens like a real app.
                </p>
              </div>
              <button
                onClick={() => setInstallBanner(false)}
                className="shrink-0 rounded-xl border border-[#1E1E1E] bg-transparent px-3 py-1.5 text-[13px] text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A]"
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
              className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] px-4 text-[15px] font-semibold text-black transition-all duration-150 active:scale-[0.97]"
            >
              Add to Home Screen
            </button>
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
              Active dares
            </h2>
            <button
              onClick={() => setJoinOpen(true)}
              className="rounded-xl border border-[#2A2A2A] bg-transparent px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1A1A1A] active:scale-[0.97]"
            >
              Join
            </button>
          </div>

          {!hasChallenges ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00FF88]" />
                <span className="text-[12px] font-medium text-[#6B6B6B]">No dares yet</span>
              </div>
              <p className="mt-3 text-[16px] font-bold tracking-[-0.02em] text-white">
                No dares yet. Time to challenge someone.
              </p>
              <p className="mt-2 text-[15px] text-[#6B6B6B]">
                Create a dare, invite your friends, and start posting daily proof.
              </p>
              <Link
                href="/create"
                className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#00FF88] px-4 py-3 text-[15px] font-semibold text-black transition-all duration-150 active:scale-[0.97]"
              >
                Create a dare
              </Link>
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {challenges.map((c, i) => {
                const { dayNumber, daysRemaining, progress } = getProgress(c);
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const isValidId = c.id && typeof c.id === "string" && uuidRegex.test(c.id);
                if (!isValidId && typeof window !== "undefined") {
                  console.warn("[Challenge card] Invalid challenge.id:", c.id, "title:", c.title);
                }
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        console.log("[Challenge card] Opening:", c.id, "valid:", isValidId);
                      }
                      openChallenge(c).catch(() => {});
                    }}
                    className="relative z-10 block w-full cursor-pointer overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 text-left transition-all duration-150 hover:bg-[#1A1A1A] active:scale-[0.97]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <h3 className="truncate text-[16px] font-bold tracking-[-0.02em] text-white">
                          {c.title}
                        </h3>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${c.is_public ? "bg-[#1E1E1E] text-[#6B6B6B]" : "bg-[#1E1E1E] text-[#6B6B6B]"}`}>
                          {c.is_public ? "Public" : "Private"}
                        </span>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5">
                        {c.is_completed ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6B6B6B]" />
                            <span className="text-[12px] font-medium text-[#6B6B6B]">Done</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88]" />
                            <span className="text-[12px] font-medium text-[#00FF88]">Live</span>
                          </>
                        )}
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
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Global Top 5 */}
        <section className="mt-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Global top 5
          </h2>

          {props.globalTop5.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 text-[15px] text-[#6B6B6B]">
              No leaderboard data yet.
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
              {props.globalTop5.map((u, idx) => {
                const isCurrentUser = u.userId === props.profile.id;
                const rankColor =
                  idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : undefined;
                return (
                  <div
                    key={u.userId}
                    className={`flex items-center gap-3 border-b border-[#1E1E1E] px-4 py-3 last:border-b-0 ${
                      isCurrentUser ? "bg-[#00FF88]/10" : ""
                    }`}
                  >
                    <span
                      className="w-6 shrink-0 text-[14px] font-bold tabular-nums"
                      style={rankColor ? { color: rankColor } : { color: "#6B6B6B" }}
                    >
                      {idx + 1}
                    </span>
                    <Avatar url={u.avatarUrl} username={u.username} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-white">
                        {u.displayName || u.username}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B] tabular-nums">
                        {u.totalPoints ?? 0} pts · {u.longestStreak} streak
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* FAB - above nav bar */}
      <Link
        href="/create"
        className="fixed right-[20px] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88] text-black shadow-[0_4px_24px_rgba(0,255,136,0.3)] transition-all duration-150 active:scale-[0.97]"
        style={{ bottom: 88 }}
        aria-label="Create a Dare"
      >
        <IconPlus className="h-6 w-6" />
      </Link>
      </div>

      <BottomNav
        profile={{
          avatarUrl: props.profile.avatarUrl,
          username: props.profile.username
        }}
      />


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

