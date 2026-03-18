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
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const { data: target, error: targetError } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: "Could not find user." }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json(
      { error: "No user found with this username." },
      { status: 404 }
    );
  }

  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You cannot send a friend request to yourself." },
      { status: 400 }
    );
  }

  const { data: sentPending } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user_id", user.id)
    .eq("to_user_id", target.id)
    .eq("status", "pending")
    .maybeSingle();

  const { data: receivedPending } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user_id", target.id)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (sentPending || receivedPending) {
    return NextResponse.json(
      { error: "You already have a pending request with this user." },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase
    .from("friend_requests")
    .insert({
      from_user_id: user.id,
      to_user_id: target.id,
      status: "pending"
    });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message || "Could not send request." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

