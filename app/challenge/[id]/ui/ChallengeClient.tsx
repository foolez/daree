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
};

type Vlog = {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  durationSeconds: number | null;
  dayNumber: number | null;
  createdAt: string;
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
}

function Avatar(props: { name: string; url: string | null; size?: number }) {
  const size = props.size ?? 36;
  if (props.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={props.url}
        alt={props.name}
        width={size}
        height={size}
        className="rounded-full border border-[#2A2A2A] object-cover"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full border border-[#2A2A2A] bg-black/40 text-xs font-semibold text-white"
      style={{ width: size, height: size }}
      aria-label={props.name}
    >
      {initials(props.name)}
    </div>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M9 9h10v10H9V9z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M16 8a3 3 0 10-2.8-4H13a3 3 0 000 6h.2A3 3 0 0016 8zM6 14a3 3 0 10-2.8-4H3a3 3 0 000 6h.2A3 3 0 006 14zm10 8a3 3 0 10-2.8-4H13a3 3 0 000 6h.2A3 3 0 0016 22z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 12l8-4M8 12l8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
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
        <video
          ref={videoRef}
          src={props.vlog.videoUrl}
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
      </div>
    </div>
  );
}

type Tab = "feed" | "leaderboard" | "members";

export function ChallengeClient(props: {
  initialOpenVlogId?: string | null;
  viewer: Viewer;
  challenge: Challenge;
  members: Member[];
  initialFeed: {
    vlogs: Vlog[];
    reactionCounts: Record<string, Record<string, number>>;
  };
  yourMembership: Member | null;
  youPostedToday: boolean;
}) {
  const [tab, setTab] = useState<Tab>("feed");
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  const postedTodayUserIds = useMemo(() => {
    const set = new Set<string>();
    feedVlogs.forEach((v) => set.add(v.userId));
    return set;
  }, [feedVlogs]);

  const youPostedToday = props.youPostedToday || postedTodayUserIds.has(props.viewer.id);

  const leaderboard = useMemo(() => {
    const sorted = [...props.members].sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      return b.totalVlogs - a.totalVlogs;
    });
    return sorted;
  }, [props.members]);

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

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      {/* sticky banner */}
      {!youPostedToday && !bannerDismissed && (
        <div className="sticky top-0 z-40 border-b border-[#2A2A2A] bg-[#FF6B35]">
          <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 text-sm font-semibold text-black">
            <span>You haven’t posted today’s vlog yet! 📸</span>
            <button
              onClick={() => setBannerDismissed(true)}
              className="rounded-xl border border-black/20 bg-black/10 px-3 py-1 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md px-5 pb-36 pt-6">
        {/* top section */}
        <header>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {props.challenge.title}
              </h1>
              <p className="mt-1 text-sm text-[#888888]">
                Day {dayNumber} of {props.challenge.durationDays} ·{" "}
                <span className="text-white">{daysRemaining}</span> days left
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-xs text-[#888888]"
            >
              Back
            </Link>
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-[#1A1A1A]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#00FF88] to-[#FF6B35]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-white"
            >
              Code: <span className="font-mono">{props.challenge.inviteCode}</span>
              <IconCopy />
            </button>
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-black px-3 py-2 text-xs font-semibold text-white"
            >
              Share <IconShare />
            </button>
          </div>
        </header>

        {/* tabs */}
        <div className="mt-6 flex gap-2 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-1">
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
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-black text-[#00FF88]"
                  : "text-[#888888]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "feed" && (
          <section className="mt-5">
            {/* stories */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {props.members.map((m) => {
                const posted = postedTodayUserIds.has(m.userId);
                return (
                  <button
                    key={m.userId}
                    onClick={() => {
                      const vlog = feedVlogs.find((v) => v.userId === m.userId);
                      if (!vlog) return;
                      setPlayerVlogId(vlog.id);
                      setPlayerOpen(true);
                    }}
                    className="flex min-w-[64px] flex-col items-center gap-1"
                  >
                    <div
                      className={`rounded-full p-[2px] ${
                        posted ? "bg-[#00FF88]" : "bg-[#2A2A2A]"
                      }`}
                    >
                      <div className="rounded-full bg-[#0A0A0A] p-[2px]">
                        <Avatar
                          name={m.displayName || m.username}
                          url={m.avatarUrl}
                          size={44}
                        />
                      </div>
                    </div>
                    <span className="max-w-[64px] truncate text-[11px] text-[#888888]">
                      {m.displayName || m.username}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* feed */}
            {feedVlogs.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
                <p className="text-sm text-[#888888]">
                  No one has posted yet today. Be the first! 👀
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {feedVlogs.map((v) => {
                  const author = memberById.get(v.userId) ?? null;
                  const counts = reactionCounts[v.id] ?? {};
                  return (
                    <div
                      key={v.id}
                      className="overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A]"
                    >
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={author?.displayName || "Member"}
                            url={author?.avatarUrl ?? null}
                            size={34}
                          />
                          <div className="leading-tight">
                            <div className="text-sm font-semibold">
                              {author?.displayName || author?.username || "Member"}
                            </div>
                            <div className="text-[11px] text-[#888888]">
                              {timeAgo(v.createdAt)}
                            </div>
                          </div>
                        </div>
                        <VlogMenu
                          isOwnVlog={v.userId === props.viewer.id}
                          onDelete={() => openDeleteDialog(v.id)}
                        />
                      </div>

                      <button
                        onClick={() => {
                          setPlayerVlogId(v.id);
                          setPlayerOpen(true);
                        }}
                        className="relative block w-full bg-black"
                        aria-label="Play vlog"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt="Vlog thumbnail"
                            className="h-56 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-56 w-full items-center justify-center bg-black/60 text-sm text-[#888888]">
                            Tap to play
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white">
                            Play
                          </div>
                        </div>
                      </button>

                      {v.caption && (
                        <div className="px-4 pb-1 pt-3 text-sm text-white">
                          {v.caption}
                        </div>
                      )}

                      <div className="flex items-center gap-2 px-4 pb-4 pt-3">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            onClick={() => toggleReaction(v.id, e)}
                            className="flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-black/20 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-[0.97]"
                            style={{
                              animation:
                                reacting === v.id ? "bounceTiny 250ms ease-out" : undefined
                            }}
                          >
                            <span className="text-sm">{e}</span>
                            <span className="text-[#888888]">
                              {counts[e] ?? 0}
                            </span>
                          </button>
                        ))}
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
            <div className="grid gap-2">
              {leaderboard.map((m, idx) => {
                const isYou = m.userId === props.viewer.id;
                const posted = postedTodayUserIds.has(m.userId);
                const medal =
                  idx === 0 ? "text-yellow-300" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-700" : "text-[#888888]";
                return (
                  <div
                    key={m.userId}
                    className={`flex items-center justify-between rounded-2xl border border-[#2A2A2A] px-4 py-3 ${
                      isYou ? "bg-[#00FF88]/10" : "bg-[#1A1A1A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 text-sm font-black ${medal}`}>
                        #{idx + 1}
                      </div>
                      <Avatar
                        name={m.displayName || m.username}
                        url={m.avatarUrl}
                        size={34}
                      />
                      <div className="leading-tight">
                        <div className="text-sm font-semibold">
                          {m.displayName || m.username}
                        </div>
                        <div className="text-[11px] text-[#888888]">
                          🏆 {m.totalVlogs} vlogs
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!posted && (
                        <span className="rounded-full bg-[#FF6B35] px-2 py-1 text-[10px] font-semibold text-black">
                          ⚠️ No vlog today
                        </span>
                      )}
                      <span className="rounded-full border border-[#2A2A2A] bg-black/30 px-3 py-1 text-xs font-semibold text-white">
                        🔥 {m.currentStreak}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "members" && (
          <section className="mt-5">
            <div className="grid gap-2">
              {props.members.map((m) => {
                const posted = postedTodayUserIds.has(m.userId);
                const isCreator = m.userId === props.challenge.createdBy || m.role === "creator";
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={m.displayName || m.username}
                        url={m.avatarUrl}
                        size={34}
                      />
                      <div className="leading-tight">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">
                            {m.displayName || m.username}
                          </div>
                          {isCreator && (
                            <span className="rounded-full border border-[#2A2A2A] bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white">
                              Creator
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#888888]">
                          🔥 {m.currentStreak} · 🏆 {m.totalVlogs}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        posted
                          ? "bg-[#00FF88] text-black"
                          : "bg-[#FF6B35] text-black"
                      }`}
                    >
                      {posted ? "Posted today ✅" : "Not yet ⚠️"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={share}
              className="mt-4 w-full rounded-2xl border border-[#2A2A2A] bg-black px-4 py-4 text-sm font-semibold text-white"
            >
              Invite more friends
            </button>
          </section>
        )}
      </div>

      {/* Record CTA */}
      <Link
        href={`/challenge/${props.challenge.id}/record`}
        className="fixed bottom-4 left-0 right-0 z-40 mx-auto w-full max-w-md px-5"
      >
        <div
          className="mx-auto flex items-center justify-center gap-3 rounded-3xl border border-[#2A2A2A] bg-black/80 px-4 py-3 backdrop-blur"
          style={{
            animation: !youPostedToday ? "pulseRecord 1.8s ease-in-out infinite" : undefined
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00FF88] text-black">
            <IconCamera />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black text-white">Record today’s vlog</div>
            <div className="text-[11px] text-[#888888]">
              {youPostedToday ? "Posted today ✅" : "You haven’t posted yet"}
            </div>
          </div>
        </div>
      </Link>

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

