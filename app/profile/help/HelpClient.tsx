"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/Toast";

const FAQ = [
  {
    q: "How do streaks work?",
    a: "Post a vlog or selfie every day to keep your streak alive. If you miss a day, your streak resets. Check-ins (no proof) keep the streak but earn zero points."
  },
  {
    q: "What are points?",
    a: "Vlogs earn 3 points, selfies earn 2 points, check-ins earn 0. Points determine your rank on the leaderboard within each dare."
  },
  {
    q: "How do I delete my account?",
    a: "Contact us at support@daree.app with your account email to request deletion. We'll process it within 7 days."
  },
  {
    q: "Can I leave a challenge?",
    a: "Yes. Open the challenge, go to settings (if available) or contact the creator. Your progress will remain visible to others but you won't get new notifications."
  },
  {
    q: "Is my data private?",
    a: "Your profile and activity follow your privacy settings. You can make your profile private (friends only) and opt out of the global leaderboard in Privacy settings."
  }
];

export function HelpClient({
  profile
}: {
  profile: { username: string; avatarUrl: string | null };
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [bugMessage, setBugMessage] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function submitBug() {
    const msg = bugMessage.trim();
    if (!msg) {
      toast.showToast("Please describe the bug", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bug", message: msg })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showToast(data.error ?? "Could not send", "error");
        return;
      }
      toast.showToast("Thanks, we'll look into it", "success");
      setBugMessage("");
    } catch {
      toast.showToast("Network error", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]">
          <span className="text-xl">←</span>
          <span className="text-[14px]">Back</span>
        </Link>

        <h1 className="mb-6 text-[20px] font-bold">Help & feedback</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-[#6B6B6B]">Frequently asked questions</h2>
          <div className="space-y-1 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
            {FAQ.map((item, i) => (
              <div key={i} className="border-b border-[#1E1E1E] last:border-b-0">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <span className="text-[15px] font-medium text-white">{item.q}</span>
                  <span className="text-[#6B6B6B]">
                    {expanded === i ? "−" : "+"}
                  </span>
                </button>
                {expanded === i && (
                  <div className="border-t border-[#1E1E1E] px-4 pb-4 pt-2">
                    <p className="text-[14px] leading-relaxed text-[#6B6B6B]">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[14px] font-semibold text-[#6B6B6B]">Contact us</h2>
          <div className="space-y-3">
            <a
              href="mailto:support@daree.app"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-[#1E1E1E] bg-[#111111] text-[15px] font-medium text-white hover:bg-[#1A1A1A]"
            >
              Email us
            </a>

            <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
              <p className="mb-2 text-[13px] font-medium text-white">Report a bug</p>
              <textarea
                value={bugMessage}
                onChange={(e) => setBugMessage(e.target.value.slice(0, 500))}
                placeholder="Describe what went wrong..."
                rows={4}
                className="mb-3 w-full resize-none rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] px-4 py-3 text-[14px] text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
              />
              <button
                onClick={submitBug}
                disabled={sending}
                className="w-full rounded-xl bg-[#00FF88] py-3 text-[15px] font-semibold text-black disabled:opacity-60"
              >
                {sending ? "Sending…" : "Submit"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav profile={profile} />
    </main>
  );
}
