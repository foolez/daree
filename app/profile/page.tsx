import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileAvatarClient } from "./ProfileAvatarClient";
import FriendRequestsClient from "./FriendRequestsClient";
import AddFriendClient from "./AddFriendClient";

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

  // Pending friend requests (to current user)
  let pendingRequests: {
    id: string;
    fromUser: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }[] = [];

  const { data: requestRows, error: requestError } = await supabase
    .from("friend_requests")
    .select("id, sender_id")
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (!requestError && requestRows && requestRows.length > 0) {
    const fromIds = requestRows.map((r: any) => r.sender_id);
    const { data: fromUsers, error: fromUsersError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", fromIds);

    if (!fromUsersError && fromUsers) {
      const byId = new Map(
        fromUsers.map((u: any) => [
          u.id as string,
          {
            id: u.id as string,
            username: (u.username ?? "") as string,
            displayName: (u.display_name ?? null) as string | null,
            avatarUrl: (u.avatar_url ?? null) as string | null
          }
        ])
      );

      pendingRequests = requestRows
        .map((r: any) => {
          const from = byId.get(r.sender_id as string);
          if (!from) return null;
          return { id: r.id as string, fromUser: from };
        })
        .filter(Boolean) as any;
    }
  }

  // Pending friend requests (sent by current user)
  let sentRequests: {
    id: string;
    toUser: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }[] = [];

  const { data: sentRows, error: sentError } = await supabase
    .from("friend_requests")
    .select("id, receiver_id")
    .eq("sender_id", user.id)
    .eq("status", "pending");

  if (!sentError && sentRows && sentRows.length > 0) {
    const toIds = sentRows.map((r: any) => r.receiver_id);
    const { data: toUsers, error: toUsersError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", toIds);

    if (!toUsersError && toUsers) {
      const byId = new Map(
        toUsers.map((u: any) => [
          u.id as string,
          {
            id: u.id as string,
            username: (u.username ?? "") as string,
            displayName: (u.display_name ?? null) as string | null,
            avatarUrl: (u.avatar_url ?? null) as string | null
          }
        ])
      );

      sentRequests = sentRows
        .map((r: any) => {
          const to = byId.get(r.receiver_id as string);
          if (!to) return null;
          return { id: r.id as string, toUser: to };
        })
        .filter(Boolean) as any;
    }
  }

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
        <header className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center rounded-full border border-[#1E1E1E] bg-[#111111] px-2 py-1 text-[11px] font-semibold text-[#00FF88]">
                {rank.label}
              </span>
              <ProfileAvatarClient
                initialAvatarUrl={profile.avatar_url}
                displayName={profile.display_name || profile.username}
                username={profile.username}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-[-0.02em] text-white">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-[12px] text-[#6B6B6B]">@{profile.username}</p>
              <p className="mt-1 text-[12px] text-[#6B6B6B]">
                You are {rank.remaining} vlog
                {rank.remaining === 1 ? "" : "s"} away from{" "}
                <span className="text-[#00FF88]">Warrior</span> rank.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A] hover:text-white"
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </header>

        {/* Stats grid */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Your stats
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-colors hover:bg-[#1A1A1A]">
              <p className="text-[12px] text-[#6B6B6B]">Total dares</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[#00FF88]">
                {totalDares}
              </p>
            </div>
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-colors hover:bg-[#1A1A1A]">
              <p className="text-[12px] text-[#6B6B6B]">Current streak</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[#00FF88]">
                {currentStreak}
              </p>
            </div>
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-colors hover:bg-[#1A1A1A]">
              <p className="text-[12px] text-[#6B6B6B]">Total vlogs</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[#00FF88]">
                {totalVlogs}
              </p>
            </div>
          </div>
        </section>

        {/* Add Friend */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Add friend
          </h2>
          <div className="mt-3">
            <AddFriendClient />
          </div>
        </section>

        {/* Friend Requests */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Friend requests
          </h2>

          <div className="mt-3 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
            <h3 className="text-[13px] font-semibold text-white">
              Received
            </h3>
            <FriendRequestsClient
              initialRequests={pendingRequests}
              currentUserId={user.id}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
            <h3 className="text-[13px] font-semibold text-white">Sent</h3>

            {sentRequests.length === 0 ? (
              <div className="mt-3 text-sm text-[#888888]">
                No pending sent requests.
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {sentRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#1E1E1E] bg-[#0A0A0A]">
                        {r.toUser.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.toUser.avatarUrl}
                            alt={r.toUser.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-[#00FF88]">
                            {r.toUser.username.trim()[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {r.toUser.displayName ?? r.toUser.username}
                        </div>
                        <div className="text-[11px] text-[#888888]">
                          @{r.toUser.username}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#00FF88]/20 px-3 py-1 text-[11px] font-semibold text-[#00FF88]">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Weekly consistency */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Weekly consistency
          </h2>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-4 py-3">
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
            <div className="ml-3 text-right text-[12px] text-[#6B6B6B]">
              Keep the row green to grow your streak.
            </div>
          </div>
        </section>

        {/* Personal best */}
        <section className="mt-8">
          <div className="flex items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
                Personal best
              </p>
              <p className="mt-1 text-[15px] text-white">
                Longest streak:{" "}
                <span className="font-semibold text-[#00FF88] tabular-nums">
                  {longestStreak} days
                </span>
              </p>
            </div>
            <button className="rounded-xl border border-[#2A2A2A] bg-transparent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1A1A1A]">
              Share profile
            </button>
          </div>
        </section>

        {/* Active challenges */}
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
            Active dares
          </h2>
          {activeChallenges.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 text-[15px] text-[#6B6B6B]">
              You&apos;re not in any dares yet. Create one from the dashboard and
              start your streak.
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {activeChallenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}`}
                  className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 transition-colors hover:bg-[#1A1A1A] active:scale-[0.97]"
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
        <section className="mt-8 border-t border-[#1E1E1E] pt-6">
          <form action={handleLogout}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-[#1E1E1E] bg-transparent text-[15px] font-semibold text-[#FF4444] transition-colors hover:bg-[#1A1A1A] active:scale-[0.97]"
            >
              Log out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

