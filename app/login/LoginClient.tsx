"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginClient() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/dashboard";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setStatus("loading");
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(
          redirectTo
        )}`
      }
    });

    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }
  }

  async function submitEmailPassword() {
    setStatus("loading");
    setError(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(
            redirectTo
          )}`
        }
      });

      if (signUpError) {
        setStatus("error");
        setError(signUpError.message);
        return;
      }

      window.location.href = redirectTo;
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setStatus("error");
      setError(signInError.message);
      return;
    }

    window.location.href = redirectTo;
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <div className="mt-8 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <div className="flex flex-col items-center text-center">
            <div
              className="h-16 w-16 rounded-full border border-white/15 bg-[#E81224] p-0.5"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Daree logo"
                height={64}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <h1 className="mt-3 text-xl font-black tracking-tight">Daree</h1>
            <p className="mt-1 text-xs text-[#888888]">
              Dare your friends. Prove yourself.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={signInWithGoogle}
              disabled={status === "loading"}
              className="w-full rounded-xl bg-[#00FF88] px-4 py-3 text-sm font-semibold text-black disabled:opacity-70"
            >
              Continue with Google
            </button>

            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2A2A2A]" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#888888]">
                or
              </span>
              <div className="h-px flex-1 bg-[#2A2A2A]" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setMode("signin")}
                className={`rounded-xl border px-3 py-2 ${
                  mode === "signin"
                    ? "border-[#00FF88] text-[#00FF88]"
                    : "border-[#2A2A2A] text-[#888888]"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`rounded-xl border px-3 py-2 ${
                  mode === "signup"
                    ? "border-[#00FF88] text-[#00FF88]"
                    : "border-[#2A2A2A] text-[#888888]"
                }`}
              >
                Sign up
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border border-[#2A2A2A] bg-black/40 px-3 py-3 text-sm outline-none focus:border-[#00FF88]"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-[#2A2A2A] bg-black/40 px-3 py-3 text-sm outline-none focus:border-[#00FF88]"
              />
              <button
                onClick={submitEmailPassword}
                disabled={status === "loading"}
                className="w-full rounded-xl border border-[#2A2A2A] bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </div>

            {error && (
              <p className="pt-2 text-sm text-[#FF3B3B]">{error}</p>
            )}

            <p className="pt-3 text-[11px] text-[#888888]">
              By continuing, you agree to compete with your friends and accept
              the consequences of missing a day.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

