import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HelpClient } from "./HelpClient";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <HelpClient
      profile={{ username: (data?.username as string) ?? "", avatarUrl: (data?.avatar_url as string | null) ?? null }}
    />
  );
}
