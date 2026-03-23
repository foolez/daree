import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("username, avatar_url, notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (data?.notification_preferences as Record<string, boolean>) ?? {
    vlogs: true,
    reactions: true,
    comments: true,
    nudges: true,
    streaks: true,
    weekly_recap: true
  };

  return (
    <NotificationsClient
      profile={{ username: (data?.username as string) ?? "", avatarUrl: (data?.avatar_url as string | null) ?? null }}
      initialPrefs={{
        vlogs: prefs.vlogs ?? true,
        reactions: prefs.reactions ?? true,
        comments: prefs.comments ?? true,
        nudges: prefs.nudges ?? true,
        streaks: prefs.streaks ?? true,
        weekly_recap: prefs.weekly_recap ?? true
      }}
    />
  );
}
