import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isMissingColumnError(message: string | null | undefined) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("column") && m.includes("does not exist");
}

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
    senderProfile?.username || senderProfile?.display_name || "Someone";
  const message = `${senderName} just nudged you to post your proof! Don't slack.`;

  // Try rich payload first, then gracefully fallback to minimal payload
  // so this works with existing notifications schemas.
  const richPayload = {
    user_id: receiverId,
    sender_id: user.id,
    type: "nudge",
    message,
    is_read: false
  };

  const { error: richError } = await supabase
    .from("notifications")
    .insert(richPayload);

  if (!richError) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (!isMissingColumnError(richError.message)) {
    return NextResponse.json(
      { error: richError.message || "Could not send nudge." },
      { status: 500 }
    );
  }

  const { error: fallbackError } = await supabase
    .from("notifications")
    .insert({
      user_id: receiverId,
      type: "nudge",
      is_read: false
    });

  if (fallbackError) {
    return NextResponse.json(
      { error: fallbackError.message || "Could not send nudge." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

