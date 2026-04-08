"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Page1Opening } from "./Page1Opening";
import { Page2Stats } from "./Page2Stats";
import { Page3Ranking } from "./Page3Ranking";
import { Page4Winner } from "./Page4Winner";
import { Page5FunFacts } from "./Page5FunFacts";
import { Page6Close } from "./Page6Close";

export function WrappedClient(props: {
  userId: string;
  challengeId: string;
  challengeTitle: string;
  durationDays: number;
  challenge: {
    id: string;
    title: string;
    description: string | null;
    goal_type: string;
    duration_days: number;
    is_public: boolean;
  };
  yourRank: number;
  memberCount: number;
  yourPoints: number;
  yourDaysCompleted: number;
  yourTotalPosts: number;
  yourLongestStreak: number;
  winner: { name: string; avatarUrl: string | null; points: number; isYou: boolean };
  funFacts: {
    mostPostsInADay: number;
    mostPostsUser: string;
    totalReactions: number;
    mostConsistentDay: string;
    longestGroupStreak: number;
  };
}) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 6;
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (currentPage !== 0) return;
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#00FF88", "#FFFFFF", "#FF6B35"]
    });
    const timeout = setTimeout(() => {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [currentPage]);

  useEffect(() => {
    if (currentPage < totalPages - 1) {
      const timer = setTimeout(() => setCurrentPage((p) => p + 1), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    fetch("/api/challenges/wrapped-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: props.challengeId })
    }).catch(() => {});
  }, [props.challengeId]);

  const pages = useMemo(
    () => [
      <Page1Opening key="p1" title={props.challengeTitle} />,
      <Page2Stats
        key="p2"
        totalPosts={props.yourTotalPosts}
        daysCompleted={props.yourDaysCompleted}
        longestStreak={props.yourLongestStreak}
      />,
      <Page3Ranking
        key="p3"
        rank={props.yourRank}
        memberCount={props.memberCount}
        points={props.yourPoints}
      />,
      <Page4Winner key="p4" winner={props.winner} />,
      <Page5FunFacts key="p5" funFacts={props.funFacts} />,
      <Page6Close
        key="p6"
        userId={props.userId}
        challenge={props.challenge}
        challengeId={props.challengeId}
        title={props.challengeTitle}
      />
    ],
    [props]
  );

  function handleTapLeft() {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }
  function handleTapRight() {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white"
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const startX = touchStartX.current;
        const endX = e.changedTouches[0]?.clientX ?? 0;
        if (startX == null) return;
        const dx = endX - startX;
        if (dx > 40) handleTapLeft();
        if (dx < -40) handleTapRight();
      }}
    >
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 px-4 pt-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded bg-white/20">
            <div
              className="h-1 rounded bg-white transition-all duration-300"
              style={{ width: i <= currentPage ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      <button
        aria-label="Close wrapped"
        className="absolute right-4 top-8 z-30 rounded-full border border-white/20 px-3 py-1 text-xs"
        onClick={() => router.push("/dashboard")}
      >
        X
      </button>

      <div
        key={currentPage}
        className="relative z-20 h-screen w-screen animate-[wrappedIn_200ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        {pages[currentPage]}
      </div>

      <button
        aria-label="Previous"
        className="absolute inset-y-0 left-0 z-10 w-1/2"
        onClick={handleTapLeft}
      />
      <button
        aria-label="Next"
        className="absolute inset-y-0 right-0 z-10 w-1/2"
        onClick={handleTapRight}
      />
      <style jsx>{`
        @keyframes wrappedIn {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </main>
  );
}
