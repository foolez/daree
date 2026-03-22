"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RequestRow = {
  id: string;
  fromUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
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

function AvatarThumb(props: { url: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  const showImg = props.url && !broken;
  const initial = (props.name || "U").trim().charAt(0).toUpperCase();
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
      style={!showImg ? { backgroundColor: avatarColor(props.name) } : undefined}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={props.url!}
          alt={props.name}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-white">{initial}</span>
      )}
    </span>
  );
}

export default function FriendRequestsClient({
  initialRequests,
  currentUserId
}: {
  initialRequests: RequestRow[];
  currentUserId: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function fetchPendingRequests(
    supabase: ReturnType<typeof createSupabaseBrowserClient>
  ) {
    const { data: reqRows, error: reqErr } = await supabase
      .from("friend_requests")
      .select("id, sender_id")
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    if (reqErr) throw reqErr;
    const pendingRows = reqRows ?? [];

    const fromIds = pendingRows
      .map((r: any) => r.sender_id as string)
      .filter(Boolean);

    if (fromIds.length === 0) return [];

    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", fromIds);

    if (usersErr) throw usersErr;

    const byId = new Map<string, RequestRow["fromUser"]>(
      (users ?? []).map((u: any) => [
        u.id as string,
        {
          id: u.id as string,
          username: (u.username ?? "") as string,
          displayName: (u.display_name ?? null) as string | null,
          avatarUrl: (u.avatar_url ?? null) as string | null
        }
      ])
    );

    return pendingRows
      .map((r: any) => {
        const from = byId.get(r.sender_id as string);
        if (!from) return null;
        return { id: r.id as string, fromUser: from };
      })
      .filter(Boolean) as RequestRow[];
  }

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const supabase = createSupabaseBrowserClient();

    const refresh = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const list = await fetchPendingRequests(supabase);
        if (!cancelled) setRequests(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load pending requests.");
      } finally {
        inFlight = false;
      }
    };

    // Initial sync (covers page loads & token timing).
    refresh().catch(() => {});

    const channel = supabase
      .channel("friend_requests_pending")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          refresh().catch(() => {});
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          refresh().catch(() => {});
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          refresh().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  async function respond(id: string, action: "accept" | "reject") {
    if (loadingId) return;
    setError(null);
    setLoadingId(id);

    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: id, action })
    }).catch(() => null);

    if (!res) {
      setError("Something went wrong 😅 Tap to retry");
      setLoadingId(null);
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not update request.");
      setLoadingId(null);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== id));
    setLoadingId(null);
    // Keep the rest of the page fresh
    router.refresh();
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-4 text-[15px] text-[#6B6B6B]">
        No pending requests.
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <AvatarThumb url={r.fromUser.avatarUrl} name={r.fromUser.username} />
            <div>
              <div className="text-sm font-semibold text-white">
                {r.fromUser.displayName ?? r.fromUser.username}
              </div>
              <div className="text-[11px] text-[#888888]">
                @{r.fromUser.username}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => respond(r.id, "accept")}
              disabled={loadingId === r.id}
              className="rounded-xl bg-[#00FF88] px-4 py-2 text-[13px] font-semibold text-black transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
            >
              Accept
            </button>
            <button
              onClick={() => respond(r.id, "reject")}
              disabled={loadingId === r.id}
              className="rounded-xl border border-[#1E1E1E] bg-transparent px-4 py-2 text-[13px] font-medium text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A] disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-[#FF3B3B]">{error}</p>}
    </div>
  );
}

