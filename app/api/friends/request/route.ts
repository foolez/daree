import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeUsername(raw: string) {
  const typedName = raw.replace(/^@/, "").trim();
  const searchTerm = typedName.toLowerCase().replace(/\s+/g, "");
  return { typedName, searchTerm };
}

function looksLikeMissingColumn(message: string | null | undefined) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("column") && m.includes("does not exist");
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
  const usernameRaw =
    typeof body.username === "string" ? body.username.trim() : "";

  const { typedName, searchTerm } = normalizeUsername(usernameRaw);

  console.log("[friends/request] lookup", {
    typedName,
    searchTerm,
    from_user_id: user.id
  });

  if (!typedName || !searchTerm) {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 400 }
    );
  }

  // EXACT query logic you requested:
  // supabase.from('users').select('id, username').ilike('username', searchTerm).single()
  const { data: target, error: lookupError } = await supabase
    .from("users")
    .select("id, username")
    .ilike("username", searchTerm)
    .single();

  console.log("[friends/request] target", {
    found: !!target,
    targetId: target?.id ?? null,
    targetUsername: target?.username ?? null,
    error: lookupError?.message ?? null
  });

  if (!target || lookupError) {
    return NextResponse.json(
      { error: `User '${typedName}' not found in database.` },
      { status: 404 }
    );
  }

  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You can't add yourself, bro! 😂" },
      { status: 400 }
    );
  }

  const candidates: Array<{ sender: string; receiver: string }> = [
    { sender: "from_user_id", receiver: "to_user_id" },
    { sender: "sender_id", receiver: "receiver_id" }
  ];

  let columns: { sender: string; receiver: string } = candidates[0];
  let existingSame: any = null;
  let existingOther: any = null;

  for (const c of candidates) {
    const { data: same, error: sameErr } = await supabase
      .from("friend_requests")
      .select("id,status")
      .eq(c.sender, user.id)
      .eq(c.receiver, target.id)
      .maybeSingle();

    const { data: other, error: otherErr } = await supabase
      .from("friend_requests")
      .select("id,status")
      .eq(c.sender, target.id)
      .eq(c.receiver, user.id)
      .maybeSingle();

    if (sameErr || otherErr) {
      if (looksLikeMissingColumn(sameErr?.message) || looksLikeMissingColumn(otherErr?.message)) {
        continue;
      }
      return NextResponse.json(
        { error: "Could not validate existing friend requests." },
        { status: 500 }
      );
    }

    existingSame = same;
    existingOther = other;
    columns = c;
    break;
  }

  if (existingSame) {
    return NextResponse.json(
      { error: "A friend request already exists between you two." },
      { status: 409 }
    );
  }
  if (existingOther) {
    return NextResponse.json(
      { error: "A friend request already exists between you two." },
      { status: 409 }
    );
  }

  const payload: any = {
    status: "pending",
    [columns.sender]: user.id,
    [columns.receiver]: target.id
  };

  const { error: insertError } = await supabase
    .from("friend_requests")
    .insert(payload);

  if (insertError) {
    // If we guessed wrong column names, fail gracefully.
    return NextResponse.json(
      { error: insertError.message || "Could not send request." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: `Request sent to ${typedName}! 🚀` },
    { status: 200 }
  );
}

