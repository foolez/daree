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

  console.log("[friends/request] lookup", {
    username,
    from_user_id: user.id
  });

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const { data: target, error: targetError } = await supabase
    .from("users")
    .select("id, username")
    // usernames should be lowercased on insert, but keep lookup case-insensitive
    .ilike("username", username)
    .maybeSingle();

  console.log("[friends/request] target", {
    found: !!target,
    targetId: target?.id ?? null,
    targetUsername: target?.username ?? null,
    error: targetError?.message ?? null
  });

  if (targetError) {
    return NextResponse.json(
      { error: "Could not find user." },
      { status: 500 }
    );
  }

  if (!target) {
    return NextResponse.json(
      { error: "User not found. Check the spelling." },
      { status: 404 }
    );
  }

  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You can't add yourself!" },
      { status: 400 }
    );
  }

  // Prevent duplicates (any status, same direction) to avoid unique constraint errors.
  const { data: existingSame } = await supabase
    .from("friend_requests")
    .select("id,status")
    .eq("from_user_id", user.id)
    .eq("to_user_id", target.id)
    .maybeSingle();

  const { data: existingOther } = await supabase
    .from("friend_requests")
    .select("id,status")
    .eq("from_user_id", target.id)
    .eq("to_user_id", user.id)
    .maybeSingle();

  if (existingSame) {
    if (existingSame.status === "pending") {
      return NextResponse.json(
        { error: "You already sent a pending request to this user." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "A friend request already exists between you two." },
      { status: 409 }
    );
  }

  if (existingOther) {
    if (existingOther.status === "pending") {
      return NextResponse.json(
        { error: "This user already has a pending request for you." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "A friend request already exists between you two." },
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

  return NextResponse.json(
    { success: true, message: `Request sent to ${target.username}! 🔥` },
    { status: 200 }
  );
}

