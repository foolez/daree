import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeUsername(raw: string) {
  const typedName = raw.replace(/^@/, "").trim();
  const searchTerm = typedName.toLowerCase().replace(/\s+/g, "");
  return { typedName, searchTerm };
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
    sender_id: user.id
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

  // Prevent duplicates (unique(sender_id, receiver_id)).
  const { data: existing, error: existingError } = await supabase
    .from("friend_requests")
    .select("id,status")
    .eq("sender_id", user.id)
    .eq("receiver_id", target.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message || "Could not validate existing requests." },
      { status: 409 }
    );
  }

  if (existing) {
    return NextResponse.json(
      { error: "A friend request already exists between you two." },
      { status: 409 }
    );
  }

  try {
    // Verify the insert succeeded (including RLS). If it fails, surface the real DB error.
    const { error } = await supabase
      .from("friend_requests")
      .insert([
        {
          // sender_id = current user, receiver_id = found user
          sender_id: user.id,
          receiver_id: target.id,
          status: "pending",
        },
      ]);
    if (error) throw error;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Could not send request." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: `Request sent to ${typedName}! 🚀` },
    { status: 200 }
  );
}

