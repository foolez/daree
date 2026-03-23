"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileAvatarClient } from "./ProfileAvatarClient";
import { BottomNav } from "@/components/BottomNav";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const INITIAL_COLORS = ["#2D5A3D", "#5A2D4D", "#2D3D5A", "#5A4D2D", "#3D2D5A", "#2D5A5A"] as const;

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < (username || "u").length; i++) {
    hash = (hash << 5) - hash + (username || "u").charCodeAt(i);
    hash = hash & hash;
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type Friend = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type ActiveChallenge = {
  id: string;
  title: string;
  yourRank: number;
  totalMembers: number;
};

type RecentActivity = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  proofType: "vlog" | "selfie" | "checkin";
  createdAt: string;
  dayNumber: number;
};

type PendingRequest = {
  id: string;
  fromUser: { username: string; displayName: string | null; avatarUrl: string | null };
};

function AddFriendSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

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
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-2xl border border-[#1E1E1E] bg-[#111111] p-5">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#1E1E1E]" />
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-white">Add friend</h3>
        <p className="mt-1 text-[15px] text-[#6B6B6B]">Enter their username to send a request.</p>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
            autoCapitalize="none"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] text-[15px] font-semibold text-black disabled:opacity-60"
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
  onRespond: () => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [local, setLocal] = useState(requests);
  useEffect(() => { setLocal(requests); }, [requests, open]);

  async function respond(id: string, action: "accept" | "reject") {
    if (loadingId) return;
    setLoadingId(id);
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: id, action })
    });
    setLoadingId(null);
    if (res?.ok) {
      setLocal((p) => p.filter((r) => r.id !== id));
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
          <h3 className="text-[18px] font-bold text-white">Friend requests</h3>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {local.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 border-b border-[#1E1E1E] py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                {r.fromUser.avatarUrl ? (
                  <img src={r.fromUser.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                    style={{ backgroundColor: avatarColor(r.fromUser.username) }}
                  >
                    {(r.fromUser.username || "?")[0].toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-[15px] font-medium text-white">{r.fromUser.displayName ?? r.fromUser.username}</p>
                  <p className="text-[12px] text-[#6B6B6B]">@{r.fromUser.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => respond(r.id, "accept")}
                  disabled={loadingId === r.id}
                  className="rounded-xl bg-[#00FF88] px-4 py-2 text-[13px] font-semibold text-black disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(r.id, "reject")}
                  disabled={loadingId === r.id}
                  className="rounded-xl border border-[#1E1E1E] px-4 py-2 text-[13px] text-[#6B6B6B] disabled:opacity-60"
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

function FriendPopup({
  friend,
  onClose
}: {
  friend: Friend;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-[280px] rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6">
        <div className="flex flex-col items-center">
          {friend.avatarUrl ? (
            <img src={friend.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
              style={{ backgroundColor: avatarColor(friend.username) }}
            >
              {(friend.displayName || friend.username || "?")[0].toUpperCase()}
            </span>
          )}
          <p className="mt-3 text-[16px] font-bold text-white">{friend.displayName ?? friend.username}</p>
          <p className="text-[13px] text-[#6B6B6B]">@{friend.username}</p>
        </div>
      </div>
    </div>
  );
}

export function ProfileClient(props: {
  profile: Profile;
  rank: { label: string; remaining: number; nextLabel: string };
  totalDares: number;
  currentStreak: number;
  totalPosts: number;
  friends: Friend[];
  activeChallenges: ActiveChallenge[];
  recentActivity: RecentActivity[];
  pendingRequests: PendingRequest[];
  handleLogout: () => void;
}) {
  const router = useRouter();
  const [avatarReady, setAvatarReady] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [friendPopup, setFriendPopup] = useState<Friend | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAvatarReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  const proofLabel = (pt: string) => (pt === "vlog" ? "Vlog" : pt === "selfie" ? "Selfie" : "Check-in");
  const proofDotColor = (pt: string) =>
    pt === "vlog" ? "bg-[#00FF88]" : pt === "selfie" ? "bg-[#3B82F6]" : "bg-[#6B6B6B]";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        {props.pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-center justify-between rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3"
          >
            <p className="text-[15px] text-white">
              {props.pendingRequests.length} friend request{props.pendingRequests.length !== 1 ? "s" : ""}
            </p>
            <button onClick={() => setRequestsOpen(true)} className="text-[14px] font-medium text-[#00FF88] hover:underline">
              View
            </button>
          </motion.div>
        )}

        <header className="relative flex flex-col items-center pb-4">
          <Link
            href="/dashboard"
            className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6B6B6B]"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            onClick={() => setAddFriendOpen(true)}
            className="absolute left-0 top-0 flex min-h-[44px] items-center rounded-xl border border-[#2A2A2A] px-3 py-2 text-[13px] font-medium text-[#6B6B6B] hover:bg-[#1A1A1A]"
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
              initialAvatarUrl={props.profile.avatarUrl}
              displayName={props.profile.displayName || props.profile.username}
              username={props.profile.username}
              size={80}
              centered
            />
          </motion.div>

          <h1 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-white">
            {props.profile.displayName || props.profile.username}
          </h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">@{props.profile.username}</p>
          <span className="mt-2 inline-flex rounded-full bg-[#00FF88]/10 px-3 py-1 text-[12px] font-medium text-[#00FF88]">
            {props.rank.label}
          </span>
          <p className="mt-1 text-[12px] text-[#3A3A3A]">
            {props.rank.remaining > 0
              ? `${props.rank.remaining} vlog${props.rank.remaining === 1 ? "" : "s"} to ${props.rank.nextLabel}`
              : "Max rank"}
          </p>
        </header>

        {/* Quick stats bar */}
        <div className="flex items-center justify-center gap-2 border-y border-[#1E1E1E] py-3">
          <span className="text-[14px] font-medium tabular-nums text-white">{props.totalDares}</span>
          <span className="text-[12px] text-[#6B6B6B]">dares</span>
          <span className="mx-1 h-4 w-px bg-[#1E1E1E]" />
          <span className="text-[14px] font-medium tabular-nums text-white">{props.currentStreak}</span>
          <span className="text-[12px] text-[#6B6B6B]">streak</span>
          <span className="mx-1 h-4 w-px bg-[#1E1E1E]" />
          <span className="text-[14px] font-medium tabular-nums text-white">{props.totalPosts}</span>
          <span className="text-[12px] text-[#6B6B6B]">posts</span>
        </div>

        {/* Friends */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
              friends ({props.friends.length})
            </h2>
            {props.friends.length > 0 && (
              <Link href="/dashboard" className="text-[13px] font-medium text-[#00FF88] hover:underline">
                See all →
              </Link>
            )}
          </div>
          {props.friends.length === 0 ? (
            <div className="mt-3 rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 text-center">
              <p className="text-[14px] text-[#6B6B6B]">Add friends to see them here</p>
              <button
                onClick={() => setAddFriendOpen(true)}
                className="mt-3 rounded-xl bg-[#00FF88] px-4 py-2 text-[14px] font-semibold text-black"
              >
                Add friend
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {props.friends.map((f) => (
                <button
                  key={f.userId}
                  onClick={() => setFriendPopup(f)}
                  className="flex shrink-0 flex-col items-center gap-2"
                >
                  {f.avatarUrl ? (
                    <img src={f.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: avatarColor(f.username) }}
                    >
                      {(f.displayName || f.username || "?")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[48px] truncate text-[11px] text-[#6B6B6B]">
                    {f.displayName || f.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Active dares */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            active dares
          </h2>
          {props.activeChallenges.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#6B6B6B]">No active dares</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
              {props.activeChallenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}`}
                  className="flex h-[48px] items-center justify-between border-b border-[#1E1E1E] px-4 last:border-b-0 transition-colors hover:bg-[#1A1A1A]"
                >
                  <span className="text-[14px] font-medium text-white">{c.title}</span>
                  <span className="flex items-center gap-2 text-[13px] text-[#6B6B6B]">
                    #{c.yourRank} of {c.totalMembers}
                    <span className="text-[#6B6B6B]">›</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            recent activity
          </h2>
          {props.recentActivity.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#6B6B6B]">No activity yet</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
              {props.recentActivity.map((a) => (
                <Link
                  key={a.id}
                  href={`/challenge/${a.challengeId}`}
                  className="flex h-[40px] min-h-[40px] items-center gap-3 border-b border-[#1E1E1E] px-4 last:border-b-0 transition-colors hover:bg-[#1A1A1A]"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${proofDotColor(a.proofType)}`} />
                  <span className="flex-1 truncate text-[14px] text-white">
                    {proofLabel(a.proofType)} in {a.challengeTitle}
                    {a.dayNumber > 0 && ` · Day ${a.dayNumber}`}
                    {" · "}
                    <span className="text-[#6B6B6B]">{timeAgo(a.createdAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Account */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            account
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
            <Link
              href="/profile/edit"
              className="flex h-12 w-full items-center justify-between border-b border-[#1E1E1E] px-4 text-left text-[15px] text-white hover:bg-[#1A1A1A]"
            >
              Edit profile
              <span className="text-[#6B6B6B]">›</span>
            </Link>
            <Link
              href="/profile/notifications"
              className="flex h-12 w-full items-center justify-between border-b border-[#1E1E1E] px-4 text-left text-[15px] text-white hover:bg-[#1A1A1A]"
            >
              Notifications
              <span className="text-[#6B6B6B]">›</span>
            </Link>
            <Link
              href="/profile/privacy"
              className="flex h-12 w-full items-center justify-between border-b border-[#1E1E1E] px-4 text-left text-[15px] text-white hover:bg-[#1A1A1A]"
            >
              Privacy
              <span className="text-[#6B6B6B]">›</span>
            </Link>
            <Link
              href="/profile/help"
              className="flex h-12 w-full items-center justify-between px-4 text-left text-[15px] text-white hover:bg-[#1A1A1A]"
            >
              Help & feedback
              <span className="text-[#6B6B6B]">›</span>
            </Link>
          </div>

          <div className="mt-4 border-t border-[#1E1E1E] pt-4">
            {logoutConfirm ? (
              <div className="flex gap-3">
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
                className="flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-[#FF4444] hover:bg-[#1A1A1A]"
              >
                Log out
              </button>
            )}
          </div>
        </section>
      </div>

      <AddFriendSheet open={addFriendOpen} onClose={() => setAddFriendOpen(false)} />
      <FriendRequestsSheet
        open={requestsOpen}
        onClose={() => setRequestsOpen(false)}
        requests={props.pendingRequests}
        onRespond={() => router.refresh()}
      />
      {friendPopup && (
        <FriendPopup friend={friendPopup} onClose={() => setFriendPopup(null)} />
      )}
      <BottomNav
        profile={{ avatarUrl: props.profile.avatarUrl, username: props.profile.username }}
      />
    </main>
  );
}
