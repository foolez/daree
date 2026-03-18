import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["🔥", "💪", "👀", "😤", "❤️"]);

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const vlog_id = typeof body.vlog_id === "string" ? body.vlog_id : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "";

  if (!vlog_id || !ALLOWED.has(emoji)) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("vlog_id", vlog_id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);
  } else {
    const { error } = await supabase.from("reactions").insert({
      vlog_id,
      user_id: user.id,
      emoji
    });
    if (error) {
      return NextResponse.json({ error: "Could not react." }, { status: 500 });
    }
  }

  const { data: reactions } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("vlog_id", vlog_id);

  const reactionCounts: Record<string, number> = {};
  for (const r of (reactions as any) ?? []) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }

  return NextResponse.json({ reactionCounts }, { status: 200 });
}

