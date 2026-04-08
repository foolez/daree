import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function randomInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const goal_type = typeof body.goal_type === "string" ? body.goal_type : "custom";
  const duration_days =
    typeof body.duration_days === "number" ? body.duration_days : 0;
  const start_date = typeof body.start_date === "string" ? body.start_date : "";
  const is_public = body.is_public === true;
  const parent_challenge_id =
    typeof body.parent_challenge_id === "string" ? body.parent_challenge_id : null;

  if (!title) {
    return NextResponse.json(
      { error: "Challenge title is required." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(duration_days) || duration_days < 1 || duration_days > 365) {
    return NextResponse.json(
      { error: "Duration must be a whole number between 1 and 365." },
      { status: 400 }
    );
  }
  if (!start_date) {
    return NextResponse.json({ error: "Start date is required." }, { status: 400 });
  }

  const start = new Date(`${start_date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }
  const end = addDays(start, duration_days - 1);

  // Retry a few times in case invite_code collides.
  let lastError: any = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const invite_code = randomInviteCode();

    const payload = {
      title,
      description: description || null,
      goal_type,
      duration_days,
      start_date,
      end_date: end.toISOString().slice(0, 10),
      created_by: user.id,
      invite_code,
      is_public: is_public || false,
      status: "active",
      parent_challenge_id: parent_challenge_id || null
    };
    console.log("Inserting challenge with payload:", payload);

    const { data: created, error: challengeError } = await supabase
      .from("challenges")
      .insert(payload)
      .select("id, invite_code")
      .single();

    if (challengeError) {
      lastError = challengeError;
      console.error("Full error:", challengeError);
      const isDuplicate =
        challengeError.code === "23505" ||
        challengeError.message.toLowerCase().includes("duplicate");
      if (isDuplicate) continue;

      return NextResponse.json(
        {
          error: `Error: ${challengeError.message}`,
          details: challengeError
        },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabase.from("challenge_members").insert({
      challenge_id: created.id,
      user_id: user.id,
      role: "creator"
    });

    if (memberError) {
      console.error("Full membership error:", memberError);
      return NextResponse.json(
        {
          error: `Error: ${memberError.message}`,
          details: memberError
        },
        { status: 500 }
      );
    }

    if (parent_challenge_id) {
      const { data: parentMembers } = await supabase
        .from("challenge_members")
        .select("user_id")
        .eq("challenge_id", parent_challenge_id);
      const memberIds = (parentMembers ?? [])
        .map((m: any) => m.user_id as string)
        .filter((id) => id !== user.id);
      if (memberIds.length > 0) {
        await supabase.from("challenge_members").insert(
          memberIds.map((userId) => ({
            challenge_id: created.id,
            user_id: userId,
            role: "member"
          }))
        );
      }
    }

    return NextResponse.json(
      { challenge_id: created.id, invite_code: created.invite_code },
      { status: 200 }
    );
  }

  console.error(lastError);
  return NextResponse.json(
    { error: "Could not generate invite code. Try again." },
    { status: 500 }
  );
}

