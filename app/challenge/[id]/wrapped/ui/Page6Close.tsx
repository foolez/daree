"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function Page6Close(props: { challengeId: string; title: string }) {
  const router = useRouter();

  async function leaveDare() {
    const ok = window.confirm(
      "Leave this dare? Your progress will be kept but you won't see it again."
    );
    if (!ok) return;

    await fetch("/api/challenges/wrapped-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: props.challengeId })
    }).catch(() => {});

    const res = await fetch(`/api/challenges/${props.challengeId}/leave`, {
      method: "POST"
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(
        "Error: " +
          (data.error ?? "Could not leave dare.") +
          "\n\nDetails: " +
          JSON.stringify(data.details ?? data)
      );
      return;
    }
    router.push("/dashboard");
  }

  return (
    <section className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h2 className="text-4xl font-black">See you on the next one</h2>
      <div className="mt-6 h-24 w-24 animate-pulse overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-new.png" alt="Daree" className="h-full w-full object-cover" />
      </div>
      <p className="mt-3 text-sm text-[#A3A3A3]">{props.title}</p>
      <Link
        href={`/create?rematch=${props.challengeId}`}
        className="mt-8 w-full max-w-xs rounded-xl bg-[#00FF88] px-5 py-3 font-semibold text-black"
      >
        Rematch — Same crew, new dare
      </Link>
      <button
        onClick={() => leaveDare().catch(() => {})}
        className="mt-3 w-full max-w-xs rounded-xl border border-[#FF4444] bg-[#2A0F12] px-5 py-3 font-semibold text-[#FF4444]"
      >
        Leave Dare
      </button>
    </section>
  );
}
