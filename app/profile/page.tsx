import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
            <div className="h-14 w-14 overflow-hidden rounded-full border border-white/15 bg-[#1A1A1A]">
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
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-xs text-[#888888]">@{profile.username}</p>
            </div>
          </div>

          <form action={handleLogout}>
            <button
              type="submit"
              className="rounded-2xl border border-[#2A2A2A] bg-transparent px-3 py-2 text-xs font-semibold text-[#888888] transition hover:border-[#FF3B3B] hover:text-[#FF3B3B]"
            >
              Log out
            </button>
          </form>
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
                  className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm transition active:scale-[0.99]"
                >
                  <p className="text-sm font-semibold text-white">
                    {c.title}
                  </p>
                  <p className="mt-1 text-xs text-[#888888]">
                    {c.duration_days || 0} days
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

