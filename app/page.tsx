"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2, ...options }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}

function AnimatedSection({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-all duration-700 ease-out ${
        inView
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(
          data.message ??
            "You're in! We'll notify you when Daree launches. 🔥"
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(0,255,136,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,107,53,0.18),_transparent_55%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 md:px-8 md:py-10">
        {/* Top nav */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#00FF88]/40 bg-[#00FF88]/10 text-xl font-black text-[#00FF88] shadow-[0_0_25px_rgba(0,255,136,0.35)]">
              D
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">
                Daree
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Dare your friends. Prove yourself.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-400 lg:inline">
              Arkadaşlarına meydan oku. Kendini kanıtla.
            </span>

            {/* Mobile: single button */}
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-black/30 px-3 py-2 text-xs font-semibold text-slate-100 backdrop-blur transition hover:border-[#00FF88]/60 md:hidden"
            >
              Sign in
            </a>

            {/* Desktop: two buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-transparent px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-[#00FF88]/60 hover:text-white"
              >
                Log in
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#00FF88] px-3 py-2 text-xs font-semibold text-black shadow-[0_0_25px_rgba(0,255,136,0.35)] transition hover:bg-[#4dffac]"
              >
                Sign up
              </a>
            </div>
          </div>
        </header>

        {/* Hero + mockup */}
        <section className="mt-10 grid flex-1 gap-10 md:mt-16 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center">
          <AnimatedSection>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF88]/30 bg-black/40 px-3 py-1 text-[11px] font-medium text-[#00FF88] shadow-[0_0_25px_rgba(0,255,136,0.25)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
                Built for people who don&apos;t back down.
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                  <span className="block text-slate-200">
                    Dare your friends.
                  </span>
                  <span className="mt-1 block bg-gradient-to-r from-[#00FF88] via-[#FF6B35] to-[#00FF88] bg-clip-text text-transparent">
                    Prove yourself.
                  </span>
                </h1>
                <p className="max-w-xl text-sm text-slate-300 md:text-base">
                  Create challenges, invite friends, post daily proof. Skip a
                  day? Your whole group gets notified. No hiding, no excuses,
                  just competitive energy pushing you forward.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-black/60 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur md:flex-row md:items-center md:gap-2"
              >
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Join the Daree waitlist
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none ring-[#00FF88]/60 placeholder:text-slate-500 focus:border-[#00FF88] focus:ring-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-1 inline-flex items-center justify-center rounded-xl bg-[#00FF88] px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(0,255,136,0.55)] transition hover:bg-[#4dffac] disabled:cursor-not-allowed disabled:opacity-75 md:mt-6"
                >
                  {status === "loading" ? "Joining..." : "Join the Dare"}
                </button>
              </form>

              {message && (
                <p
                  className={`text-sm ${
                    status === "success"
                      ? "text-[#00FF88]"
                      : "text-red-300"
                  }`}
                >
                  {message}
                </p>
              )}

              <p className="text-[11px] text-slate-500">
                Free to use. No credit card needed. We&apos;ll only email you
                when something big is happening.
              </p>

              {/* Social proof mini strip */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00FF88]" />
                  <span>1,200+ people already on the waitlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FF6B35]" />
                  <span>87% complete their first challenge</span>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Mockup / illustration */}
          <AnimatedSection delay={150}>
            <div className="relative mx-auto max-w-sm">
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#00FF88]/10 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-[#FF6B35]/15 blur-3xl" />

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-black/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.95)] backdrop-blur">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    30-Day No Sugar Dare
                  </span>
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#00FF88]">
                    Live
                  </span>
                </div>

                <div className="mb-4 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Day 12 of 30</span>
                  <span className="text-[#00FF88]">Streak: 11 days</span>
                </div>

                <div className="mb-4 h-2 w-full rounded-full bg-slate-800">
                  <div className="h-2 w-2/5 rounded-full bg-gradient-to-r from-[#00FF88] to-[#FF6B35]" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-200">
                      Leaderboard
                    </span>
                    <span>Photo proof every day</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "Ali", streak: "12 days", rank: "#1" },
                      { name: "Zeynep", streak: "11 days", rank: "#2" },
                      { name: "Mert", streak: "9 days", rank: "#3" },
                      { name: "You", streak: "8 days", rank: "#4" }
                    ].map((user, index) => (
                      <div
                        key={user.name}
                        className="flex items-center justify-between rounded-xl bg-slate-900/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-200">
                            {user.name.charAt(0)}
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-100">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {user.streak}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            index === 0
                              ? "text-[#00FF88]"
                              : index === 1
                              ? "text-[#FF6B35]"
                              : "text-slate-400"
                          }`}
                        >
                          {user.rank}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-400">
                    Miss a day and everyone sees it:
                    <span className="ml-1 text-slate-200">
                      &quot;Ali hasn&apos;t posted in 2 days 👀&quot;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* How it works */}
        <section className="mt-16 space-y-6 md:mt-20">
          <AnimatedSection>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-[#00FF88]">
                  How Daree works
                </h2>
                <p className="mt-1 text-sm text-slate-300 md:text-base">
                  Three simple steps to turn pressure into progress.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AnimatedSection>
              <div className="h-full rounded-2xl border border-slate-800 bg-black/60 p-4">
                <p className="text-xs font-semibold text-[#FF6B35]">
                  Step 1
                </p>
                <h3 className="mt-1 text-sm font-semibold text-slate-100">
                  Create a Dare
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  Set your goal: &quot;Lose 4kg in 30 days&quot;, &quot;No
                  smoking for 2 weeks&quot;, &quot;10K steps daily&quot;. Pick
                  the rules, choose the duration, lock in the stakes.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div className="h-full rounded-2xl border border-slate-800 bg-black/60 p-4">
                <p className="text-xs font-semibold text-[#FF6B35]">
                  Step 2
                </p>
                <h3 className="mt-1 text-sm font-semibold text-slate-100">
                  Invite your crew
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  Add 3–10 friends. Everyone joins the same challenge. No
                  strangers, just your circle. The people whose opinion actually
                  matters.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="h-full rounded-2xl border border-slate-800 bg-black/60 p-4">
                <p className="text-xs font-semibold text-[#FF6B35]">
                  Step 3
                </p>
                <h3 className="mt-1 text-sm font-semibold text-slate-100">
                  Prove it or lose it
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  Post daily photo/video proof. Miss a day? The group gets a
                  notification: &quot;Ali hasn&apos;t posted in 2 days 👀&quot;.
                  The leaderboard updates in real-time.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Features grid */}
        <section className="mt-16 space-y-6 md:mt-20">
          <AnimatedSection>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-[#00FF88]">
                Why it works
              </h2>
              <p className="text-xs text-slate-400 md:text-sm">
                Social pressure, streaks, and proof — all in one place.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Streak System",
                emoji: "🔥",
                body: "Build your streak and don’t break it. Every day you post proof, your streak climbs."
              },
              {
                title: "Group Challenges",
                emoji: "👥",
                body: "Compete with friends, not strangers. Your real circle keeps you honest."
              },
              {
                title: "Photo Proof",
                emoji: "📸",
                body: "No lying in spreadsheets. Snap a quick photo or video and log your day."
              },
              {
                title: "Shame Notifications",
                emoji: "🔔",
                body: "Skip a day? Everyone knows. The right kind of pressure to show up tomorrow."
              },
              {
                title: "Leaderboards",
                emoji: "🏆",
                body: "See who’s winning, who’s slipping, and who’s about to overtake you."
              },
              {
                title: "Any Goal",
                emoji: "🎯",
                body: "Weight loss, fitness, study, habits — anything that gets better with daily reps."
              }
            ].map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 60}>
                <div className="h-full rounded-2xl border border-slate-800 bg-black/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{feature.emoji}</span>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{feature.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* Social proof / stats */}
        <section className="mt-16 md:mt-20">
          <AnimatedSection>
            <div className="grid gap-4 rounded-2xl border border-slate-800 bg-black/70 p-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FF88]">
                  Momentum
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Daree already feels like a live arena, not a side project.
                </p>
              </div>
              <div className="space-y-2 text-sm text-slate-100">
                <p>
                  <span className="font-semibold">1,200+</span>{" "}
                  <span className="text-slate-400">
                    people on the waitlist
                  </span>
                </p>
                <p>
                  <span className="font-semibold">87%</span>{" "}
                  <span className="text-slate-400">
                    of users complete their first challenge
                  </span>
                </p>
                <p>
                  <span className="font-semibold">6 friends</span>{" "}
                  <span className="text-slate-400">
                    average group size per dare
                  </span>
                </p>
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  Put your goals where your reputation is. Daree turns your
                  friends into the most effective accountability system you’ve
                  ever had.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* CTA */}
        <section className="mt-16 md:mt-20">
          <AnimatedSection>
            <div className="flex flex-col gap-4 rounded-2xl border border-[#00FF88]/40 bg-gradient-to-r from-black via-slate-950 to-black p-5 shadow-[0_0_55px_rgba(0,255,136,0.35)] md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight text-slate-50 md:text-2xl">
                  Ready to challenge your friends?
                </h2>
                <p className="text-xs text-slate-300 md:text-sm">
                  Join the waitlist and be in the first wave when Daree goes
                  live.
                </p>
                <p className="text-[11px] text-slate-400">
                  Free to use. No credit card needed.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-2 flex w-full flex-col gap-2 md:mt-0 md:w-auto md:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-[#00FF88]/60 placeholder:text-slate-500 focus:border-[#00FF88] focus:ring-2 md:w-64"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(255,107,53,0.55)] transition hover:bg-[#ff8559] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {status === "loading" ? "Joining..." : "Join the Dare"}
                </button>
              </form>
            </div>
          </AnimatedSection>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-slate-900 pt-4 text-xs text-slate-500 md:mt-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-sm font-black text-[#00FF88]">
                D
              </div>
              <span className="font-semibold text-slate-200">Daree</span>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
              <button className="hover:text-slate-200">About</button>
              <button className="hover:text-slate-200">Privacy</button>
              <button className="hover:text-slate-200">Contact</button>
            </div>

            <div className="flex items-center gap-3 text-[13px] text-slate-400">
              <button
                aria-label="Instagram"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 hover:border-[#FF6B35] hover:text-[#FF6B35]"
              >
                IG
              </button>
              <button
                aria-label="Twitter / X"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 hover:border-[#00FF88] hover:text-[#00FF88]"
              >
                X
              </button>
              <button
                aria-label="TikTok"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 hover:border-[#FF6B35] hover:text-[#FF6B35]"
              >
                TT
              </button>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            © {new Date().getFullYear()} Daree. All rights reserved.
          </div>
        </footer>
      </div>
    </main>
  );
}

