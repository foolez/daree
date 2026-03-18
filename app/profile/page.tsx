import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildRank(totalVlogs: number) {
  if (totalVlogs >= 30) {
    return { label: "Warrior", remaining: 0 };
  }
  if (totalVlogs >= 10) {
    return { label: "Rookie", remaining: 30 - totalVlogs };
  }
  return { label: "Seedling", remaining: 10 - totalVlogs };
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const { data: memberships } = await supabase
    .from("challenge_members")
    .select(
      `
      id,
      current_streak,
      longest_streak,
      total_vlogs,
      challenges (
        id,
        title,
        duration_days,
        start_date,
        end_date
      )
    `
    )
    .eq("user_id", user.id);

  const totalDares = memberships?.length ?? 0;
  const currentStreak = memberships
    ? memberships.reduce(
        (max, m: any) => Math.max(max, m.current_streak ?? 0),
        0
      )
    : 0;
  const longestStreak = memberships
    ? memberships.reduce(
        (max, m: any) => Math.max(max, m.longest_streak ?? 0),
        0
      )
    : 0;

  const totalVlogsFromMemberships = memberships
    ? memberships.reduce(
        (sum, m: any) => sum + (m.total_vlogs ?? 0),
        0
      )
    : 0;

  const { count: totalVlogsDirect } = await supabase
    .from("vlogs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalVlogs = totalVlogsDirect ?? totalVlogsFromMemberships ?? 0;

  const activeChallenges =
    memberships
      ?.map((m: any) => ({
        id: m.challenges?.id ?? null,
        title: m.challenges?.title ?? "Untitled Dare",
        duration_days: m.challenges?.duration_days ?? 0,
        start_date: m.challenges?.start_date ?? null,
        end_date: m.challenges?.end_date ?? null
      }))
      .filter((c) => c.id) ?? [];

  const today = new Date();
  const sevenDaysAgo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 6
  );

  const { data: recentVlogs } = await supabase
    .from("vlogs")
    .select("id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString());

  const postedByDay = new Set<string>();
  for (const v of recentVlogs ?? []) {
    const d = new Date(v.created_at as string);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    postedByDay.add(key);
  }

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (6 - i)
    );
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    return {
      label,
      posted: postedByDay.has(key)
    };
  });

  const rank = buildRank(totalVlogs);

  async function handleLogout() {
    "use server";
    const supa = createSupabaseServerClient();
    await supa.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-6">
        <header className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center rounded-full border border-[#2A2A2A] bg-black/50 px-2 py-1 text-[11px] font-semibold text-[#00FF88]">
                {rank.label}
              </span>
              <div className="h-14 w-14 overflow-hidden rounded-full border border-transparent bg-[radial-gradient(circle_at_top,_rgba(0,255,136,0.5),_transparent_55%),rgba(15,23,42,1)] p-[2px]">
                <div className="h-full w-full overflow-hidden rounded-full border border-[#00FF88]/40 bg-[#020617]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name ?? profile.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-[#00FF88]">
                      {profile.display_name?.[0]?.toUpperCase() ??
                        profile.username?.[0]?.toUpperCase() ??
                        "?"}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-xs text-[#888888]">@{profile.username}</p>
              <p className="mt-1 text-[11px] text-[#888888]">
                You are {rank.remaining} vlog
                {rank.remaining === 1 ? "" : "s"} away from{" "}
                <span className="text-[#00FF88]">Warrior</span> rank.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-[#2A2A2A] bg-black/40 px-2 py-1 text-xs text-[#888888] hover:text-white"
            aria-label="Back to dashboard"
          >
            ✕
          </Link>
        </header>

        {/* Stats grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
            Your stats
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-3">
              <p className="text-[11px] text-[#888888]">Total dares</p>
              <p className="mt-1 text-lg font-black text-[#00FF88]">
                {totalDares}
              </p>
            </div>
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-3">
              <p className="text-[11px] text-[#888888]">Current streak</p>
              <p className="mt-1 text-lg font-black text-[#00FF88]">
                🔥 {currentStreak}
              </p>
            </div>
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-3">
              <p className="text-[11px] text-[#888888]">Total vlogs</p>
              <p className="mt-1 text-lg font-black text-[#00FF88]">
                {totalVlogs}
              </p>
            </div>
          </div>
        </section>

        {/* Weekly consistency */}
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
            Weekly consistency
          </h2>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#050816] px-4 py-3">
            <div className="flex flex-1 items-center gap-2">
              {last7Days.map((d) => (
                <div
                  key={d.label}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={`h-4 w-4 rounded-full ${
                      d.posted ? "bg-[#00FF88]" : "bg-[#1F2937]"
                    }`}
                  />
                  <span className="text-[10px] text-[#6B7280]">
                    {d.label[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="ml-3 text-right text-[11px] text-[#9CA3AF]">
              Keep the row green to grow your streak.
            </div>
          </div>
        </section>

        {/* Personal best */}
        <section className="mt-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#020617] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                Personal best
              </p>
              <p className="mt-1 text-sm text-[#D1D5DB]">
                Longest Streak:{" "}
                <span className="font-semibold text-[#00FF88]">
                  🔥 {longestStreak} days
                </span>
              </p>
            </div>
            <button className="rounded-2xl border border-[#2A2A2A] bg-transparent px-3 py-2 text-xs text-[#E5E7EB] hover:border-[#00FF88]/60 hover:text-[#00FF88]">
              Share profile
            </button>
          </div>
        </section>

        {/* Active challenges */}
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
            Active dares
          </h2>
          {activeChallenges.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm text-[#888888]">
              You&apos;re not in any dares yet. Create one from the dashboard and
              start your streak.
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {activeChallenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}`}
                  className="rounded-2xl border border-[#2A2A2A] bg-[#020617] p-4 text-sm transition hover:border-[#00FF88]/40 active:scale-[0.99]"
                >
                  <p className="text-sm font-semibold text-white">
                    {c.title}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {c.duration_days || 0} days
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Logout at bottom */}
        <section className="mt-8 border-t border-[#111827] pt-4">
          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-[#4B5563] bg-transparent px-4 py-3 text-sm font-semibold text-[#FF3B3B] transition hover:border-[#FF3B3B] hover:bg-[#111827]"
            >
              Log out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

