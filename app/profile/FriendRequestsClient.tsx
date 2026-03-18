"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RequestRow = {
  id: string;
  fromUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

function AvatarThumb(props: { url: string | null; name: string }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#2A2A2A] bg-[#1A1A1A]">
      {props.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.url} alt={props.name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-[#00FF88]">
          {props.name.trim()[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </span>
  );
}

export default function FriendRequestsClient({
  initialRequests
}: {
  initialRequests: RequestRow[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      <div className="mt-3 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm text-[#888888]">
        No pending requests.
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-3"
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
              className="rounded-xl bg-[#00FF88] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
            >
              Accept
            </button>
            <button
              onClick={() => respond(r.id, "reject")}
              disabled={loadingId === r.id}
              className="rounded-xl border border-[#FF3B3B]/40 bg-transparent px-3 py-2 text-xs font-semibold text-[#FF3B3B] disabled:opacity-60"
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

