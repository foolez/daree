"use client";

import { useState } from "react";

export default function AddFriendClient() {
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
  }

  return (
    <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-3"
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="flex-1 rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button
          type="submit"
          disabled={sending}
          className="h-12 rounded-xl bg-[#00FF88] px-5 font-semibold text-black transition-all duration-150 ease-in-out active:scale-[0.97] disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {feedback && (
        <p className={`mt-2 text-[12px] ${feedback.kind === "success" ? "text-[#00FF88]" : "text-[#FF4444]"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
