"use client";

import { useState } from "react";

export default function AddFriendModal(props: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!props.open) return null;

  async function send() {
    const cleaned = username.trim().toLowerCase().replace(/\s+/g, "");
    if (!cleaned) {
      setError("Type a username first.");
      setStatus("error");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setToast("Sending...");
    setStatus("loading");

    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleaned })
    }).catch(() => null);

    if (!res) {
      setError("Network error. Please try again.");
      setStatus("error");
      setToast("Error: Network error. Please try again.");
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error ?? "Could not send request. Try again.";
      setError(msg);
      setStatus("error");
      setToast(`Error: ${msg}`);
      return;
    }

    setStatus("sent");
    setSuccessMessage(data.message ?? `Request sent to ${cleaned}! 🔥`);
    setToast("Success!");
    props.onSent();
    setTimeout(() => {
      setUsername("");
      setStatus("idle");
      setSuccessMessage(null);
      setToast(null);
      props.onClose();
    }, 700);
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={props.onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-3xl border border-[#2A2A2A] bg-[#0A0A0A] p-5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#2A2A2A]" />
        <h3 className="text-lg font-black tracking-tight">Add a Friend</h3>
        <p className="mt-1 text-sm text-[#888888]">
          Send a challenge request by username.
        </p>

        <div className="mt-4 space-y-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ali_works"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm outline-none focus:border-[#00FF88]"
          />
          {toast && (
            <p
              className={`text-sm font-semibold ${
                toast === "Success!" ? "text-[#00FF88]" : "text-[#FF3B3B]"
              }`}
            >
              {toast}
            </p>
          )}
          {error && <p className="text-sm text-[#FF3B3B]">{error}</p>}
          {successMessage && (
            <p className="text-sm font-semibold text-[#00FF88]">
              {successMessage}
            </p>
          )}
          <button
            onClick={send}
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black disabled:opacity-70"
          >
            {status === "loading" ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

