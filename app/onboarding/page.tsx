"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function saveProfile() {
    setStatus("loading");
    setError(null);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    const cleanedUsername = username.trim().toLowerCase();
    const cleanedDisplayName = displayName.trim();

    if (!cleanedUsername || cleanedUsername.length < 3) {
      setStatus("error");
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanedUsername)) {
      setStatus("error");
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (!cleanedDisplayName) {
      setStatus("error");
      setError("Please enter your display name.");
      return;
    }

    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: user.id,
        username: cleanedUsername,
        display_name: cleanedDisplayName,
        created_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      setStatus("error");
      setError(upsertError.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <div className="mt-8 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <h1 className="text-xl font-black tracking-tight">
            Set up your Daree profile
          </h1>
          <p className="mt-1 text-sm text-[#888888]">
            Your friends will see this on the leaderboard.
          </p>

          <div className="mt-5 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#888888]">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ali_works"
                className="w-full rounded-xl border border-[#2A2A2A] bg-black/40 px-3 py-3 text-sm outline-none focus:border-[#00FF88]"
              />
              <p className="text-[11px] text-[#888888]">
                Lowercase letters, numbers, underscores.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#888888]">
                Display name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ali"
                className="w-full rounded-xl border border-[#2A2A2A] bg-black/40 px-3 py-3 text-sm outline-none focus:border-[#00FF88]"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={status === "loading"}
              className="w-full rounded-xl bg-[#00FF88] px-4 py-3 text-sm font-semibold text-black disabled:opacity-70"
            >
              {status === "loading" ? "Saving..." : "Continue"}
            </button>

            {error && <p className="text-sm text-[#FF3B3B]">{error}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

