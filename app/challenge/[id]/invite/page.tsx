"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

function IconCopy(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={props.className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      <path
        d="M9 9h10v10H9V9z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => i), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-4 rounded-sm opacity-90"
          style={{
            left: `${(i * 37) % 100}%`,
            background:
              i % 2 === 0 ? "rgba(0,255,136,0.9)" : "rgba(255,107,53,0.9)",
            transform: `rotate(${(i * 29) % 180}deg)`,
            animation: `confettiFall 1200ms ease-out ${i * 40}ms 1 both`
          }}
        />
      ))}
    </div>
  );
}

export default function InvitePage({ params }: { params: { id: string } }) {
  const search = useSearchParams();
  const code = (search.get("code") || "").toUpperCase();

  const shareText = `Join my Daree challenge! Code: ${code}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ text: shareText });
      return;
    }
    await copy(shareText);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="relative overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <Confetti />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-black/40 px-3 py-1 text-xs text-[#888888]">
              <span className="h-2 w-2 rounded-full bg-[#00FF88]" />
              Dare created! 🎉
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight">
              Invite your friends
            </h1>
            <p className="mt-2 text-sm text-[#888888]">
              Share the code. Once they join, the pressure begins.
            </p>

            <div className="mt-5 rounded-3xl border border-[#2A2A2A] bg-black/30 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
                Invite code
              </p>
              <div className="mt-2 font-mono text-4xl font-black tracking-[0.28em] text-white">
                {code || "— — — — — —"}
              </div>
              <button
                onClick={() => copy(code)}
                disabled={!code}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <IconCopy />
                Copy code
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#888888]">
                Share with friends
              </p>

              <button
                onClick={() => copy(shareText)}
                disabled={!code}
                className="w-full rounded-2xl border border-[#2A2A2A] bg-black px-4 py-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                Copy link message
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-center text-sm font-semibold text-white"
              >
                Share on WhatsApp
              </a>

              <button
                onClick={share}
                disabled={!code}
                className="w-full rounded-2xl bg-[#FF6B35] px-4 py-4 text-sm font-semibold text-black disabled:opacity-60"
              >
                Share
              </button>
            </div>
          </div>
        </div>

        <Link
          href={`/challenge/${params.id}`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black"
        >
          Go to Challenge →
        </Link>
      </div>

      <style jsx global>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(420px) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}

