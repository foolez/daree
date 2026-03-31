import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const type = body.type === "bug" ? "bug" : "feedback";

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    type,
    message
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
