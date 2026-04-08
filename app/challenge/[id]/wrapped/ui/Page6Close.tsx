"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function randomInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function Page6Close(props: {
  challengeId: string;
  userId: string;
  title: string;
  challenge: {
    id: string;
    title: string;
    description: string | null;
    goal_type: string;
    duration_days: number;
    is_public: boolean;
  };
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleRematch() {
    try {
      const start = new Date();
      const end = new Date(
        Date.now() + Number(props.challenge.duration_days) * 86400000
      );
      const payload = {
        title: props.challenge.title,
        description: props.challenge.description,
        goal_type: props.challenge.goal_type,
        duration_days: props.challenge.duration_days,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        created_by: props.userId,
        invite_code: randomInviteCode(),
        is_public: props.challenge.is_public,
        status: "active",
        parent_challenge_id: props.challenge.id
      };
      console.log("Creating rematch payload:", payload);

      const { data: newChallenge, error } = await supabase
        .from("challenges")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Rematch failed:", error);
        alert("Rematch failed: " + error.message);
        return;
      }

      const { error: memberError } = await supabase
        .from("challenge_members")
        .insert({
          challenge_id: newChallenge.id,
          user_id: props.userId,
          role: "creator"
        });
      if (memberError) {
        console.error("Rematch member insert failed:", memberError);
        alert("Rematch member insert failed: " + memberError.message);
        return;
      }

      router.push("/challenge/" + newChallenge.id);
      router.refresh();
    } catch (err) {
      console.error("Rematch error:", err);
      alert("Error: " + (err as Error).message);
    }
  }

  async function handleLeaveDare() {
    const ok = window.confirm("Leave this dare? It will be removed from your dashboard.");
    if (!ok) return;
    try {
      const { error: leaveError } = await supabase
        .from("challenge_members")
        .delete()
        .eq("challenge_id", props.challenge.id)
        .eq("user_id", props.userId);
      if (leaveError) {
        console.error("Leave failed:", leaveError);
        alert("Leave failed: " + leaveError.message);
        return;
      }

      const { error: viewError } = await supabase.from("wrapped_views").upsert(
        {
          challenge_id: props.challenge.id,
          user_id: props.userId
        },
        { onConflict: "challenge_id,user_id", ignoreDuplicates: true }
      );
      if (viewError) {
        console.error("Wrapped view mark failed:", viewError);
        alert("Wrapped view mark failed: " + viewError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Leave error:", err);
      alert("Error: " + (err as Error).message);
    }
  }

  return (
    <section className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h2 className="text-4xl font-black">See you on the next one</h2>
      <div className="mt-6 h-24 w-24 animate-pulse overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-new.png" alt="Daree" className="h-full w-full object-cover" />
      </div>
      <p className="mt-3 text-sm text-[#A3A3A3]">{props.title}</p>
      <button
        onClick={() => handleRematch().catch(() => {})}
        className="mt-8 w-full max-w-xs rounded-xl bg-[#00FF88] px-5 py-3 font-semibold text-black"
      >
        Rematch — Same crew, new dare
      </button>
      <button
        onClick={() => handleLeaveDare().catch(() => {})}
        className="mt-3 w-full max-w-xs rounded-xl border border-[#FF4444] bg-[#2A0F12] px-5 py-3 font-semibold text-[#FF4444]"
      >
        Leave Dare
      </button>
    </section>
  );
}
