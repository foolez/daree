import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./ui/DashboardClient";

export default async function DashboardPage() {
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
      challenge_id,
      role,
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

  const challenges =
    memberships
      ?.map((m: any) => ({
        id: m.challenges?.id ?? m.challenge_id,
        title: m.challenges?.title ?? "Untitled Dare",
        duration_days: m.challenges?.duration_days ?? 0,
        start_date: m.challenges?.start_date ?? null,
        end_date: m.challenges?.end_date ?? null,
        member_count: null as number | null, // filled later
        your_streak: m.current_streak ?? 0
      }))
      .filter((c) => !!c.id) ?? [];

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <DashboardClient
      profile={{
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url ?? null
      }}
      initialChallenges={challenges}
      initialUnreadCount={unreadCount ?? 0}
    />
  );
}

