"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/Toast";

type Prefs = {
  vlogs: boolean;
  reactions: boolean;
  comments: boolean;
  nudges: boolean;
  streaks: boolean;
  weekly_recap: boolean;
};

export function NotificationsClient({
  profile,
  initialPrefs
}: {
  profile: { username: string; avatarUrl: string | null };
  initialPrefs: Prefs;
}) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const toast = useToast();

  async function toggle(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_preferences: next })
      });
      if (!res.ok) toast.showToast("Could not save", "error");
    } catch {
      setPrefs(prefs);
      toast.showToast("Network error", "error");
    }
  }

  const rows: { key: keyof Prefs; label: string }[] = [
    { key: "vlogs", label: "Someone posts a vlog" },
    { key: "reactions", label: "Someone reacts to your vlog" },
    { key: "comments", label: "Someone comments on your vlog" },
    { key: "nudges", label: "Nudge notifications" },
    { key: "streaks", label: "Streak reminders" },
    { key: "weekly_recap", label: "Weekly recap" }
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]">
          <span className="text-xl">←</span>
          <span className="text-[14px]">Back</span>
        </Link>

        <h1 className="mb-6 text-[20px] font-bold">Notifications</h1>

        <div className="overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
          {rows.map((r, i) => (
            <div
              key={r.key}
              className={`flex h-14 items-center justify-between px-4 ${
                i < rows.length - 1 ? "border-b border-[#1E1E1E]" : ""
              }`}
            >
              <span className="text-[15px] text-white">{r.label}</span>
              <button
                role="switch"
                aria-checked={prefs[r.key]}
                onClick={() => toggle(r.key, !prefs[r.key])}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                  prefs[r.key] ? "bg-[#00FF88]" : "bg-[#1E1E1E]"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                    prefs[r.key] ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNav profile={profile} />
    </main>
  );
}
