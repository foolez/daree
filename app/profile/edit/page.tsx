import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EditProfileClient } from "./EditProfileClient";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  return (
    <EditProfileClient
      profile={{
        id: profile.id,
        username: (profile.username ?? "") as string,
        displayName: (profile.display_name ?? null) as string | null,
        avatarUrl: (profile.avatar_url ?? null) as string | null,
        bio: (profile.bio ?? null) as string | null
      }}
    />
  );
}
