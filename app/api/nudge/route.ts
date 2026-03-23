import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const receiverId =
    typeof body.receiver_id === "string" ? body.receiver_id : "";

  if (!receiverId) {
    return NextResponse.json(
      { error: "receiver_id is required." },
      { status: 400 }
    );
  }

  if (receiverId === user.id) {
    return NextResponse.json(
      { error: "You can't nudge yourself." },
      { status: 400 }
    );
  }

  const { data: senderProfile } = await supabase
    .from("users")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const senderName =
    senderProfile?.display_name || senderProfile?.username || "Someone";
  const message = `${senderName} gave you a nudge! ⚡ Post your proof.`;
  const { error } = await supabase.from("notifications").insert({
    user_id: receiverId,
    from_user_id: user.id,
    type: "nudge",
    title: "Loser Radar Nudge",
    message
  });

  if (error) {
    console.error("[api/nudge] notification insert failed", error);
    return NextResponse.json(
      { error: "Database sync issue - check column names." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

