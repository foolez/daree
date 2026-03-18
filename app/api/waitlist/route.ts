import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 }
    );
  }

  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Please provide a valid email." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("waitlist")
    .insert({ email: email.toLowerCase().trim() });

  if (error) {
    const isDuplicate =
      error.code === "23505" || error.message.toLowerCase().includes("duplicate");

    if (isDuplicate) {
      return NextResponse.json(
        { message: "You’re already on the waitlist!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "You're in! We'll notify you when Daree launches. 🔥" },
    { status: 200 }
  );
}

