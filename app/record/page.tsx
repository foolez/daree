import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecordClient } from "./RecordClient";

function startOfTodayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

function daysBetweenUtc(a: Date, b: Date) {
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bu - au) / day);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default async function RecordPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("challenge_members")
    .select(
      `
      challenge_id,
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

  const todayStart = startOfTodayIso();
  const { data: todayVlogs } = await supabase
    .from("vlogs")
    .select("id, challenge_id")
    .eq("user_id", user.id)
    .gte("created_at", todayStart);

  const postedByChallenge = new Map<string, string>();
  for (const v of todayVlogs ?? []) {
    postedByChallenge.set(v.challenge_id as string, v.id as string);
  }

  const challengesList =
    memberships
      ?.map((m: any) => {
        const c = m.challenges;
        if (!c?.id) return null;
        const start = c.start_date ? new Date(c.start_date) : new Date();
        const today = new Date();
        const dayNumber = clamp(
          daysBetweenUtc(start, today) + 1,
          1,
          c.duration_days ?? 999
        );
        const vlogId = postedByChallenge.get(c.id) ?? null;
        return {
          id: c.id,
          title: c.title ?? "Untitled Dare",
          duration_days: c.duration_days ?? 0,
          start_date: c.start_date,
          end_date: c.end_date,
          dayNumber,
          postedToday: !!vlogId,
          todayVlogId: vlogId
        };
      })
      .filter(Boolean) ?? [];

  return (
    <RecordClient
      profile={{
        username: profile?.username ?? "",
        avatarUrl: profile?.avatar_url ?? null
      }}
      challenges={
        challengesList as {
          id: string;
          title: string;
          duration_days: number;
          start_date: string | null;
          end_date: string | null;
          dayNumber: number;
          postedToday: boolean;
          todayVlogId: string | null;
        }[]
      }
    />
  );
}
