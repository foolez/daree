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
  const request_id =
    typeof body.request_id === "string" ? body.request_id : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!request_id) {
    return NextResponse.json({ error: "request_id is required" }, { status: 400 });
  }
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: reqRow, error: reqError } = await supabase
    .from("friend_requests")
    .select("id, to_user_id, status, from_user_id")
    .eq("id", request_id)
    .maybeSingle();

  if (reqError) {
    return NextResponse.json({ error: "Could not load request" }, { status: 500 });
  }
  if (!reqRow) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (reqRow.to_user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "Request already handled" }, { status: 409 });
  }

  const newStatus = action === "accept" ? "accepted" : "rejected";

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: newStatus })
    .eq("id", request_id);

  if (updateError) {
    return NextResponse.json({ error: "Could not update request" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

