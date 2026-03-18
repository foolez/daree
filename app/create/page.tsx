"use client";

import { useMemo, useState } from "react";

type GoalType = "fitness" | "quit_habit" | "study" | "weight_loss" | "custom";
type Duration = 7 | 14 | 21 | 30;

const GOALS: { id: GoalType; label: string; emoji: string }[] = [
  { id: "fitness", label: "Fitness", emoji: "🏋️" },
  { id: "quit_habit", label: "Quit Habit", emoji: "🚭" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "weight_loss", label: "Weight Loss", emoji: "💪" },
  { id: "custom", label: "Custom", emoji: "🎯" }
];

const DURATIONS: Duration[] = [7, 14, 21, 30];

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Pill(props: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-2xl border px-3 py-2 text-sm transition active:scale-[0.99] ${
        props.selected
          ? "border-[#00FF88] bg-black text-white"
          : "border-[#2A2A2A] bg-[#1A1A1A] text-[#888888]"
      }`}
    >
      {props.children}
    </button>
  );
}

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("fitness");
  const [duration, setDuration] = useState<Duration>(30);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => tomorrowIso());
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  async function submit() {
    if (!canSubmit || status === "loading") return;

    setStatus("loading");
    setError(null);

    const res = await fetch("/api/challenges/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        goal_type: goalType,
        duration_days: duration,
        description: description || null,
        start_date: startDate
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Could not create dare. Try again.");
      return;
    }

    window.location.href = `/challenge/${data.challenge_id}/invite?code=${encodeURIComponent(
      data.invite_code
    )}`;
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 py-6 pb-24">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Create a Dare</h1>
            <p className="mt-1 text-sm text-[#888888]">
              Set the rules. Invite your crew. No hiding.
            </p>
          </div>
        </header>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
              Challenge title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 days no sugar"
              className="w-full rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm outline-none focus:border-[#00FF88]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
              Goal type
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Pill
                  key={g.id}
                  selected={goalType === g.id}
                  onClick={() => setGoalType(g.id)}
                >
                  <span className="mr-2">{g.emoji}</span>
                  {g.label}
                </Pill>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <Pill
                  key={d}
                  selected={duration === d}
                  onClick={() => setDuration(d)}
                >
                  {d} days
                </Pill>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rules, details, what counts as proof..."
              rows={4}
              className="w-full resize-none rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm outline-none focus:border-[#00FF88]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm outline-none focus:border-[#00FF88]"
            />
          </div>

          {error && <p className="text-sm text-[#FF3B3B]">{error}</p>}

          <button
            onClick={submit}
            disabled={!canSubmit || status === "loading"}
            className="w-full rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black disabled:opacity-70"
          >
            {status === "loading" ? "Creating..." : "Create Dare 🔥"}
          </button>
        </div>
      </div>
    </main>
  );
}

