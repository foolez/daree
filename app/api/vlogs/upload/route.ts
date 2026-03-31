import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dayNumber(startDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const bu = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(1, Math.floor((bu - au) / day) + 1);
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const challenge_id = String(form.get("challenge_id") || "");
  const captionRaw = String(form.get("caption") || "").slice(0, 200);
  const duration_seconds = Number(form.get("duration_seconds") || 0);
  const proof_type = String(form.get("proof_type") || "vlog");

  if (!challenge_id) {
    return NextResponse.json({ error: "challenge_id is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }

  const isSelfie = proof_type === "selfie";
  const isVideo = file.type.startsWith("video/");

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, start_date, duration_days")
    .eq("id", challenge_id)
    .maybeSingle();

  if (challengeError || !challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const dn = dayNumber(challenge.start_date);
  const ext = isSelfie || !isVideo ? "jpg" : "webm";
  const path = isSelfie
    ? `${challenge_id}/${user.id}/${todayIsoDate()}_selfie.${ext}`
    : `${challenge_id}/${user.id}/${todayIsoDate()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const contentType = isSelfie ? "image/jpeg" : (file.type || "video/webm");

  const { error: uploadError } = await supabase.storage
    .from("vlogs")
    .upload(path, bytes, {
      contentType,
      upsert: true
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: { publicUrl } } = supabase.storage.from("vlogs").getPublicUrl(path);

  const { error: insertError } = await supabase.from("vlogs").insert({
    challenge_id,
    user_id: user.id,
    video_url: publicUrl,
    proof_type: isSelfie ? "selfie" : "vlog",
    caption: captionRaw || null,
    duration_seconds: isSelfie ? null : (Number.isFinite(duration_seconds) ? duration_seconds : null),
    day_number: dn
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not save vlog." }, { status: 500 });
  }

  const pointsToAdd = isSelfie ? 2 : 3;

  const { data: member } = await supabase
    .from("challenge_members")
    .select("id, current_streak, longest_streak, total_vlogs, total_points")
    .eq("challenge_id", challenge_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (member) {
    const nextTotal = (member.total_vlogs ?? 0) + 1;
    const nextStreak = (member.current_streak ?? 0) + 1;
    const nextLongest = Math.max(member.longest_streak ?? 0, nextStreak);
    const nextPoints = (member.total_points ?? 0) + pointsToAdd;
    await supabase
      .from("challenge_members")
      .update({
        total_vlogs: nextTotal,
        current_streak: nextStreak,
        longest_streak: nextLongest,
        total_points: nextPoints
      })
      .eq("id", member.id);
  }

  return NextResponse.json(
    { success: true, video_url: publicUrl, day_number: dn, current_streak: member ? (member.current_streak ?? 0) + 1 : null },
    { status: 200 }
  );
}

