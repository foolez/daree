"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/Toast";

export function PrivacyClient({
  profile,
  initialPublic,
  initialLeaderboard,
  initialFriendRequests
}: {
  profile: { username: string; avatarUrl: string | null };
  initialPublic: boolean;
  initialLeaderboard: boolean;
  initialFriendRequests: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [showInLeaderboard, setShowInLeaderboard] = useState(initialLeaderboard);
  const [allowFriendRequests, setAllowFriendRequests] = useState(initialFriendRequests);
  const toast = useToast();

  async function update(field: string, value: boolean) {
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_profile_public: field === "public" ? value : isPublic,
          show_in_leaderboard: field === "leaderboard" ? value : showInLeaderboard,
          allow_friend_requests: field === "friendRequests" ? value : allowFriendRequests
        })
      });
      if (!res.ok) toast.showToast("Could not save", "error");
    } catch {
      toast.showToast("Network error", "error");
      if (field === "public") setIsPublic(isPublic);
      else if (field === "leaderboard") setShowInLeaderboard(showInLeaderboard);
      else setAllowFriendRequests(allowFriendRequests);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]">
          <span className="text-xl">←</span>
          <span className="text-[14px]">Back</span>
        </Link>

        <h1 className="mb-6 text-[20px] font-bold">Privacy</h1>

        <div className="space-y-1 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#111111]">
          <div className="flex h-14 items-center justify-between border-b border-[#1E1E1E] px-4">
            <div>
              <p className="text-[15px] font-medium text-white">Profile visibility</p>
              <p className="text-[12px] text-[#6B6B6B]">
                {isPublic ? "Public" : "Private"} — {isPublic ? "Anyone can see your activity" : "Only friends can see"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isPublic}
              onClick={() => {
                setIsPublic(!isPublic);
                update("public", !isPublic);
              }}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                isPublic ? "bg-[#00FF88]" : "bg-[#1E1E1E]"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                  isPublic ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex h-14 items-center justify-between border-b border-[#1E1E1E] px-4">
            <div>
              <p className="text-[15px] font-medium text-white">Show in global leaderboard</p>
              <p className="text-[12px] text-[#6B6B6B]">
                {showInLeaderboard ? "ON" : "OFF"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={showInLeaderboard}
              onClick={() => {
                setShowInLeaderboard(!showInLeaderboard);
                update("leaderboard", !showInLeaderboard);
              }}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                showInLeaderboard ? "bg-[#00FF88]" : "bg-[#1E1E1E]"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                  showInLeaderboard ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex h-14 items-center justify-between px-4">
            <div>
              <p className="text-[15px] font-medium text-white">Allow friend requests from anyone</p>
              <p className="text-[12px] text-[#6B6B6B]">
                {allowFriendRequests ? "ON" : "OFF"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={allowFriendRequests}
              onClick={() => {
                setAllowFriendRequests(!allowFriendRequests);
                update("friendRequests", !allowFriendRequests);
              }}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                allowFriendRequests ? "bg-[#00FF88]" : "bg-[#1E1E1E]"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                  allowFriendRequests ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <BottomNav profile={profile} />
    </main>
  );
}
