"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { VlogMenu } from "@/components/ui/VlogMenu";
import { DeleteVlogDialog } from "@/components/ui/DeleteVlogDialog";
import { useToast } from "@/components/ui/Toast";

type Viewer = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type Challenge = {
  id: string;
  title: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  inviteCode: string;
  createdBy: string;
  isPublic?: boolean;
  status?: string;
  parentChallengeId?: string | null;
};

type Member = {
  membershipId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  currentStreak: number;
  totalVlogs: number;
  totalPoints?: number;
};

type Vlog = {
  id: string;
  userId: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  durationSeconds: number | null;
  dayNumber: number | null;
  createdAt: string;
  proofType: "vlog" | "selfie" | "checkin";
};

const EMOJIS = ["🔥", "💪", "👀", "😤", "❤️"] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function daysBetweenUtc(a: Date, b: Date) {
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bu - au) / day);
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
}

function Avatar(props: {
  name: string;
  url: string | null;
  size?: number;
  borderColor?: "green" | "gray";
}) {
  const [broken, setBroken] = useState(false);
  const size = props.size ?? 36;
  const showImg = props.url && !broken;
  const displayName = props.name || "?";
  const borderCls =
    props.borderColor === "green"
      ? "border-[#00FF88]"
      : "border-[#2A2A2A]";

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={props.url!}
        alt={displayName}
        width={size}
        height={size}
        className={`rounded-full border-2 object-cover ${borderCls}`}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 text-xs font-semibold text-white ${borderCls}`}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(displayName)
      }}
      aria-label={displayName}
    >
      {initials(displayName)}
    </div>
  );
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <rect x="3" y="11" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path d="M9 9h10v10H9V9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShareExternal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera(props?: { size?: number }) {
  const size = props?.size ?? 32;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: size, height: size }}>
      <path d="M7 7h10l1.5 2H21v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9h2.5L7 7z" strokeLinejoin="round" />
      <path d="M12 18a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FullscreenPlayer(props: {
  open: boolean;
  onClose: () => void;
  vlog: (Vlog & { author: Member | null }) | null;
  isOwnVlog: boolean;
  onDelete?: (vlogId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (props.open) {
      setTimeout(() => videoRef.current?.play().catch(() => {}), 120);
    }
  }, [props.open]);

  if (!props.open || !props.vlog) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        className="absolute inset-0"
        aria-label="Close video"
        onClick={props.onClose}
      />
      <div className="absolute left-0 right-0 top-0 z-10 mx-auto flex max-w-md items-center justify-between px-4 py-4 text-white">
        <div className="flex items-center gap-2">
          <Avatar
            name={props.vlog.author?.displayName || "Member"}
            url={props.vlog.author?.avatarUrl ?? null}
            size={30}
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold">
              {props.vlog.author?.displayName || "Member"}
            </div>
            <div className="text-[11px] text-[#888888]">{timeAgo(props.vlog.createdAt)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {props.isOwnVlog && props.onDelete && (
            <VlogMenu
              isOwnVlog
              onDelete={() => props.onDelete?.(props.vlog!.id)}
            />
          )}
          <button
            onClick={props.onClose}
            className="rounded-full border border-[#2A2A2A] bg-black/40 px-3 py-1 text-xs text-white"
          >
            Close
          </button>
        </div>
      </div>

      <div className="absolute inset-0 mx-auto flex max-w-md items-center justify-center px-4">
        {props.vlog.proofType === "selfie" && props.vlog.videoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={props.vlog.videoUrl}
            alt="Selfie"
            className="max-h-[82vh] w-full rounded-2xl border border-[#2A2A2A] object-contain bg-black"
          />
        ) : (
          <video
            ref={videoRef}
            src={props.vlog.videoUrl ?? undefined}
            className="max-h-[82vh] w-full rounded-2xl border border-[#2A2A2A] bg-black"
            playsInline
            loop
            muted={false}
            onClick={(e) => {
              e.stopPropagation();
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            }}
          />
        )}
      </div>
    </div>
  );
}

type Tab = "feed" | "leaderboard" | "members";

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLockSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCrown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12">
      <path d="M2 18l3-6 4 4 5-10 4 6 3-2v12H2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChallengeClient(props: {
  initialOpenVlogId?: string | null;
  /** UTC midnight ISO for “posted today” rings + Record CTA */
  todayStartIso: string;
  viewer: Viewer;
  challenge: Challenge;
  members: Member[];
  initialFeed: {
    vlogs: Vlog[];
    reactionCounts: Record<string, Record<string, number>>;
  };
  yourMembership: Member | null;
  youPostedToday: boolean;
  isCompleted?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("feed");

  const [feedVlogs, setFeedVlogs] = useState<Vlog[]>(props.initialFeed.vlogs);
  const [reactionCounts, setReactionCounts] = useState<
    Record<string, Record<string, number>>
  >(props.initialFeed.reactionCounts);
  const [reacting, setReacting] = useState<string | null>(null);

  const [playerOpen, setPlayerOpen] = useState(!!props.initialOpenVlogId);
  const [playerVlogId, setPlayerVlogId] = useState<string | null>(
    props.initialOpenVlogId ?? null
  );
  const [deleteDialogVlogId, setDeleteDialogVlogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    props.members.forEach((m) => map.set(m.userId, m));
    return map;
  }, [props.members]);

  const start = new Date(props.challenge.startDate);
  const end = new Date(props.challenge.endDate);
  const today = new Date();
  const dayNumber = clamp(
    daysBetweenUtc(start, today) + 1,
    1,
    props.challenge.durationDays
  );
  const daysRemaining = clamp(
    daysBetweenUtc(today, end),
    0,
    props.challenge.durationDays
  );
  const progress = clamp(dayNumber / props.challenge.durationDays, 0, 1);

  const todayStartMs = useMemo(
    () => new Date(props.todayStartIso).getTime(),
    [props.todayStartIso]
  );

  const postedTodayUserIds = useMemo(() => {
    const set = new Set<string>();
    feedVlogs.forEach((v) => {
      if (new Date(v.createdAt).getTime() >= todayStartMs) set.add(v.userId);
    });
    return set;
  }, [feedVlogs, todayStartMs]);

  const youPostedToday = props.youPostedToday || postedTodayUserIds.has(props.viewer.id);

  const leaderboard = useMemo(() => {
    const sorted = [...props.members].sort((a, b) => {
      const ap = a.totalPoints ?? 0;
      const bp = b.totalPoints ?? 0;
      if (bp !== ap) return bp - ap;
      return (b.currentStreak ?? 0) - (a.currentStreak ?? 0);
    });
    return sorted;
  }, [props.members]);

  const winner = leaderboard[0];
  const isCompleted = props.isCompleted ?? false;

  async function copyCode() {
    await navigator.clipboard.writeText(props.challenge.inviteCode);
  }

  async function share() {
    const text = `Join my Daree challenge! Code: ${props.challenge.inviteCode}`;
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
  }

  async function refreshFeed() {
    const res = await fetch(`/api/challenges/${props.challenge.id}/feed`, {
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setFeedVlogs(data.vlogs ?? []);
    setReactionCounts(data.reactionCounts ?? {});
  }

  async function deleteVlog(vlogId: string) {
    if (deleting) return;
    setDeleting(true);
    const res = await fetch(`/api/vlogs/${vlogId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteDialogVlogId(null);
    setPlayerOpen(false);
    setPlayerVlogId(null);
    if (!res.ok) {
      toast.showToast("Something went wrong. Try again.", "error");
      return;
    }
    toast.showToast("Vlog deleted. Post before midnight to keep streak.", "warning");
    await refreshFeed();
  }

  function openDeleteDialog(vlogId: string) {
    setDeleteDialogVlogId(vlogId);
  }

  async function toggleReaction(vlogId: string, emoji: string) {
    if (reacting) return;
    setReacting(vlogId);

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vlog_id: vlogId, emoji })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.reactionCounts) {
      setReactionCounts((prev) => ({ ...prev, [vlogId]: data.reactionCounts }));
    }
    setReacting(null);
  }

  useEffect(() => {
    // Light refresh after mount so reactions stay fresh.
    const t = setTimeout(() => {
      refreshFeed().catch(() => {});
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const selectedVlog =
    playerVlogId && feedVlogs.find((v) => v.id === playerVlogId)
      ? {
          ...(feedVlogs.find((v) => v.id === playerVlogId) as Vlog),
          author: memberById.get(
            (feedVlogs.find((v) => v.id === playerVlogId) as Vlog).userId
          ) ?? null
        }
      : null;

  if (isCompleted) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-md px-5 pb-24 pt-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#6B6B6B]">
            <span className="text-xl">←</span>
            <span className="text-[14px]">Back</span>
          </Link>
          <h1 className="mt-6 text-center text-[24px] font-bold">Challenge Complete</h1>
          <p className="mt-2 text-center text-[16px] text-[#6B6B6B]">{props.challenge.title}</p>
          <p className="mt-1 text-center text-[14px] text-[#3A3A3A]">
            {props.challenge.durationDays} days ·{" "}
            {new Date(props.challenge.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {new Date(props.challenge.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>

          {winner && (
            <div className="mt-8 flex flex-col items-center rounded-2xl border border-[#1E1E1E] bg-[#111111] px-6 py-8">
              <span className="text-[#FFD700]">
                <IconCrown />
              </span>
              <div className="rounded-full border-4 border-[#FFD700] p-0.5">
                <Avatar
                  name={winner.displayName || winner.username}
                  url={winner.avatarUrl}
                  size={80}
                />
              </div>
              <p className="mt-3 text-[20px] font-bold text-white">{winner.displayName || winner.username}</p>
              <p className="mt-1 text-[14px] text-[#6B6B6B]">
                Winner · {winner.totalPoints ?? 0} pts · {winner.currentStreak} day streak
              </p>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
            <p className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Final leaderboard
            </p>
            {leaderboard.map((m, idx) => {
              const rankColor = idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : undefined;
              const isYou = m.userId === props.viewer.id;
              return (
                <div
                  key={m.userId}
                  className={`flex h-[52px] items-center justify-between border-t border-[#1E1E1E] px-4 ${
                    isYou ? "bg-[#00FF88]/8" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 text-[16px] font-bold"
                      style={rankColor ? { color: rankColor } : { color: "#6B6B6B" }}
                    >
                      {idx + 1}
                    </span>
                    <Avatar name={m.displayName || m.username} url={m.avatarUrl} size={32} />
                    <span className="truncate text-[14px] font-medium text-white">
                      {m.displayName || m.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-[#6B6B6B]">
                    <span>{m.totalPoints ?? 0} pts</span>
                    <span>{m.currentStreak} streak</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href={`/create?rematch=${props.challenge.id}`}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] text-[16px] font-semibold text-black"
            >
              Rematch — Same crew, new dare
            </Link>
            <button
              onClick={() => share()}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-[#2A2A2A] bg-transparent text-[16px] font-medium text-white"
            >
              Share Results
            </button>
            <Link href="/dashboard" className="block py-3 text-center text-[14px] text-[#6B6B6B]">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      {/* banner removed per design */}
      {false && (
        <div className="sticky top-0 z-40 border-b border-[#2A2A2A] bg-[#FF6B35]">
          <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 text-sm font-semibold text-black">
            <span>You haven’t posted today’s vlog yet! 📸</span>
            <button
              onClick={() => {}}
              className="rounded-xl border border-black/20 bg-black/10 px-3 py-1 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md px-5 pb-36 pt-6">
        {/* header */}
        <header className="relative">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6B6B6B]"
              aria-label="Back"
            >
              <IconArrowLeft />
            </Link>
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
              <h1 className="text-[18px] font-bold tracking-[-0.02em] text-white">
                {props.challenge.title}
              </h1>
              {props.challenge.isPublic ? (
                <span className="flex items-center gap-1 rounded-md bg-[#1E1E1E] px-2 py-0.5 text-[11px] text-[#6B6B6B]">
                  <IconEye />
                  Public
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-md bg-[#1E1E1E] px-2 py-0.5 text-[11px] text-[#6B6B6B]">
                  <IconLockSmall />
                  Private
                </span>
              )}
            </div>
            <button
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6B6B6B]"
              aria-label="More options"
            >
              <IconMore />
            </button>
          </div>
          <p className="mt-2 text-center text-[14px] text-[#6B6B6B]">
            Day {dayNumber} of {props.challenge.durationDays} · {daysRemaining} days left
          </p>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#1E1E1E]">
            <div
              className="h-full rounded-full bg-[#00FF88] transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 rounded-lg py-2">
            <button
              onClick={async () => {
                await copyCode();
                toast.showToast("Code copied", "success");
              }}
              className="flex flex-1 items-center gap-2 transition-colors hover:opacity-80"
            >
              <span className="shrink-0 text-[#6B6B6B]"><IconLock /></span>
              <span className="font-mono text-[13px] text-[#6B6B6B]">
                {props.challenge.inviteCode}
              </span>
              <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[#6B6B6B]"><IconCopy /></span>
            </button>
            <button
              onClick={share}
              className="shrink-0 text-[#6B6B6B] hover:text-white"
              aria-label="Share"
            >
              <IconShareExternal />
            </button>
          </div>
        </header>

        {/* tabs */}
        <div className="mt-6 flex border-b border-[#1E1E1E]">
          {(
            [
              { id: "feed", label: "Feed" },
              { id: "leaderboard", label: "Leaderboard" },
              { id: "members", label: "Members" }
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 pb-3 pt-1 text-[14px] font-medium transition-colors ${
                tab === t.id ? "text-white" : "text-[#6B6B6B]"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#00FF88]" />
              )}
            </button>
          ))}
        </div>

        {tab === "feed" && (
          <section className="mt-5">
            {/* story circles */}
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4">
              {props.members.map((m) => {
                const posted = postedTodayUserIds.has(m.userId);
                const name = m.displayName || m.username;
                return (
                    <button
                    key={m.userId}
                    onClick={() => {
                      const vlog = feedVlogs.find(
                        (v) =>
                          v.userId === m.userId &&
                          new Date(v.createdAt).getTime() >= todayStartMs &&
                          v.proofType !== "checkin"
                      );
                      if (!vlog) return;
                      setPlayerVlogId(vlog.id);
                      setPlayerOpen(true);
                    }}
                    className="flex shrink-0 flex-col items-center gap-2"
                  >
                    <Avatar
                      name={name}
                      url={m.avatarUrl}
                      size={48}
                      borderColor={posted ? "green" : "gray"}
                    />
                    <span className="max-w-[48px] truncate text-[11px] text-[#6B6B6B]">
                      {name.length > 6 ? `${name.slice(0, 6)}...` : name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* feed */}
            {feedVlogs.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center py-12">
                <div className="mb-3 text-[#3A3A3A]">
                  <IconCamera />
                </div>
                <p className="text-[15px] text-[#6B6B6B]">No proof posted yet</p>
                <p className="mt-1 text-[13px] text-[#3A3A3A]">Be the first to post</p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {feedVlogs.map((v) => {
                  const author = memberById.get(v.userId) ?? null;
                  const counts = reactionCounts[v.id] ?? {};
                  const proofType = v.proofType ?? "vlog";

                  if (proofType === "checkin") {
                    return (
                      <div
                        key={v.id}
                        className="rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Avatar
                              name={author?.displayName || author?.username || "Member"}
                              url={author?.avatarUrl ?? null}
                              size={28}
                            />
                            <span className="text-[14px] text-[#6B6B6B]">
                              {author?.displayName || author?.username || "Member"} checked in today
                            </span>
                          </div>
                          <VlogMenu
                            isOwnVlog={v.userId === props.viewer.id}
                            onDelete={() => openDeleteDialog(v.id)}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {EMOJIS.map((e) => {
                            const count = counts[e] ?? 0;
                            return (
                              <button
                                key={e}
                                onClick={() => toggleReaction(v.id, e)}
                                className="flex h-6 items-center gap-1 rounded-full bg-[#1A1A1A] px-2 transition-all duration-150"
                              >
                                <span className="text-xs">{e}</span>
                                {count > 0 && (
                                  <span className="text-[11px] text-[#6B6B6B]">{count}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  const mediaUrl = v.videoUrl || v.thumbnailUrl;
                  const isSelfie = proofType === "selfie";
                  const badgeCls = isSelfie
                    ? "bg-[#4A9EFF] text-white"
                    : "bg-[#00FF88] text-black";

                  return (
                    <div key={v.id}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Avatar
                            name={author?.displayName || author?.username || "Member"}
                            url={author?.avatarUrl ?? null}
                            size={32}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[14px] font-bold text-white">
                              {author?.displayName || author?.username || "Member"}
                            </span>
                            <span className="ml-2 text-[12px] text-[#3A3A3A]">
                              {timeAgo(v.createdAt)}
                            </span>
                          </div>
                        </div>
                        <VlogMenu
                          isOwnVlog={v.userId === props.viewer.id}
                          onDelete={() => openDeleteDialog(v.id)}
                        />
                      </div>

                      <button
                        onClick={() => { setPlayerVlogId(v.id); setPlayerOpen(true); }}
                        className="relative mt-2 block w-full overflow-hidden rounded-xl bg-black"
                        aria-label={isSelfie ? "View selfie" : "Play vlog"}
                      >
                        {mediaUrl ? (
                          isSelfie ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={mediaUrl}
                              alt="Selfie"
                              className="aspect-[4/3] w-full object-cover"
                            />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={v.thumbnailUrl || mediaUrl}
                              alt="Vlog"
                              className="aspect-video w-full object-cover"
                            />
                          )
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center bg-[#111111] text-[#6B6B6B]">
                            Tap to play
                          </div>
                        )}
                        <span className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-semibold ${badgeCls}`}>
                          {isSelfie ? "Selfie" : "Vlog"}
                        </span>
                        {!isSelfie && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white">
                              Play
                            </div>
                          </div>
                        )}
                      </button>

                      {v.caption && (
                        <div className="mt-2 text-[14px] text-white">{v.caption}</div>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {EMOJIS.map((e) => {
                          const count = counts[e] ?? 0;
                          return (
                            <button
                              key={e}
                              onClick={() => toggleReaction(v.id, e)}
                              className="flex h-8 items-center gap-1.5 rounded-full bg-[#1A1A1A] transition-all duration-150 active:scale-[0.97]"
                              style={{
                                paddingLeft: 8,
                                paddingRight: count > 0 ? 10 : 8,
                                animation: reacting === v.id ? "bounceTiny 250ms ease-out" : undefined
                              }}
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-sm">{e}</span>
                              {count > 0 && (
                                <span className="text-[12px] text-[#6B6B6B]">{count}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "leaderboard" && (
          <section className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
              {leaderboard.map((m, idx) => {
                const isYou = m.userId === props.viewer.id;
                const posted = postedTodayUserIds.has(m.userId);
                const rankColor =
                  idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : undefined;
                return (
                  <div
                    key={m.userId}
                    className={`flex h-[52px] items-center justify-between border-b border-[#1E1E1E] px-4 last:border-b-0 ${
                      isYou ? "bg-[#00FF88]/8" : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="w-6 shrink-0 text-[16px] font-bold"
                        style={rankColor ? { color: rankColor } : { color: "#6B6B6B" }}
                      >
                        {idx + 1}
                      </span>
                      <Avatar
                        name={m.displayName || m.username}
                        url={m.avatarUrl}
                        size={32}
                      />
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-[14px] font-medium text-white">
                          {m.displayName || m.username}
                        </span>
                        {!posted && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF8C00]" />
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[14px] text-[#6B6B6B]">
                      <span>{m.totalPoints ?? 0} pts</span>
                      <span>🔥 {m.currentStreak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "members" && (
          <section className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
              {props.members.map((m) => {
                const posted = postedTodayUserIds.has(m.userId);
                const isCreator = m.userId === props.challenge.createdBy || m.role === "creator";
                return (
                  <div
                    key={m.userId}
                    className="flex h-[52px] items-center justify-between border-b border-[#1E1E1E] px-4 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        name={m.displayName || m.username}
                        url={m.avatarUrl}
                        size={32}
                      />
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-[14px] font-medium text-white">
                          {m.displayName || m.username}
                        </span>
                        {isCreator && (
                          <span className="shrink-0 text-[12px] text-[#3A3A3A]">Creator</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[12px] ${
                        posted ? "text-[#00FF88]" : "text-[#FF8C00]"
                      }`}
                    >
                      {posted ? "✓" : "not yet"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={share}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-[#2A2A2A] bg-transparent text-[14px] font-medium text-white transition-colors hover:bg-[#1A1A1A]"
            >
              + Invite friends
            </button>
          </section>
        )}
      </div>

      {/* Record CTA */}
      {youPostedToday ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex h-14 max-w-md items-center justify-center border-t border-[#1E1E1E] bg-[#111111] px-5">
          <span className="text-[14px] text-[#6B6B6B]">Posted today ✓</span>
        </div>
      ) : (
      <Link
        href={`/challenge/${props.challenge.id}/record`}
        className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex h-14 max-w-md items-center gap-3 border-t border-[#1E1E1E] bg-[#111111] px-5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00FF88] text-black">
          <IconCamera size={24} />
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[14px] font-bold text-white">Post your proof</div>
          <div className="text-[12px] text-[#6B6B6B]">You haven&apos;t posted yet</div>
        </div>
      </Link>
      )}

      <FullscreenPlayer
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        vlog={selectedVlog}
        isOwnVlog={!!(selectedVlog && selectedVlog.userId === props.viewer.id)}
        onDelete={openDeleteDialog}
      />

      <DeleteVlogDialog
        open={!!deleteDialogVlogId}
        onClose={() => setDeleteDialogVlogId(null)}
        onConfirm={() => deleteDialogVlogId && deleteVlog(deleteDialogVlogId)}
        loading={deleting}
      />

      <style jsx global>{`
        @keyframes pulseRecord {
          0% {
            transform: translateZ(0) scale(1);
            box-shadow: 0 0 0 rgba(0, 255, 136, 0);
          }
          50% {
            transform: translateZ(0) scale(1.01);
            box-shadow: 0 0 36px rgba(0, 255, 136, 0.25);
          }
          100% {
            transform: translateZ(0) scale(1);
            box-shadow: 0 0 0 rgba(0, 255, 136, 0);
          }
        }
        @keyframes bounceTiny {
          0% {
            transform: translateZ(0) scale(1);
          }
          50% {
            transform: translateZ(0) scale(1.06);
          }
          100% {
            transform: translateZ(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}

