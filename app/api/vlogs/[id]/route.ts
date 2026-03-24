import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const vlogId = params.id;
  if (!vlogId) {
    return NextResponse.json({ error: "Vlog ID required" }, { status: 400 });
  }

  const { data: vlog, error: vlogError } = await supabase
    .from("vlogs")
    .select("id, user_id, challenge_id, video_url, proof_type, created_at")
    .eq("id", vlogId)
    .maybeSingle();

  if (vlogError || !vlog) {
    return NextResponse.json({ error: "Vlog not found" }, { status: 404 });
  }

  if (vlog.user_id !== user.id) {
    return NextResponse.json({ error: "Can only delete your own vlogs" }, { status: 403 });
  }

  if (vlog.video_url) {
    const created = new Date(vlog.created_at);
    const yyyy = created.getFullYear();
    const mm = String(created.getMonth() + 1).padStart(2, "0");
    const dd = String(created.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const ext = vlog.proof_type === "selfie" ? "jpg" : "webm";
    const storagePath = `${vlog.challenge_id}/${vlog.user_id}/${dateStr}${vlog.proof_type === "selfie" ? "_selfie" : ""}.${ext}`;
    await supabase.storage.from("vlogs").remove([storagePath]);
  }

  const { error: deleteError } = await supabase
    .from("vlogs")
    .delete()
    .eq("id", vlogId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Could not delete vlog" },
      { status: 500 }
    );
  }

  const { data: member } = await supabase
    .from("challenge_members")
    .select("id, total_vlogs")
    .eq("challenge_id", vlog.challenge_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (member && (member.total_vlogs ?? 0) > 0) {
    await supabase
      .from("challenge_members")
      .update({ total_vlogs: (member.total_vlogs ?? 1) - 1 })
      .eq("id", member.id);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
