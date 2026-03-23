import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrivacyClient } from "./PrivacyClient";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("username, avatar_url, is_profile_public, show_in_leaderboard, allow_friend_requests")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <PrivacyClient
      profile={{ username: (data?.username as string) ?? "", avatarUrl: (data?.avatar_url as string | null) ?? null }}
      initialPublic={(data?.is_profile_public as boolean) ?? true}
      initialLeaderboard={(data?.show_in_leaderboard as boolean) ?? true}
      initialFriendRequests={(data?.allow_friend_requests as boolean) ?? true}
    />
  );
}
