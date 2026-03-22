"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav(props: { profile: { avatarUrl: string | null; username: string } }) {
  const pathname = usePathname();
  const onHome = pathname === "/dashboard";
  const onExplore = pathname === "/explore";
  const onRecord = pathname === "/record";
  const onProfile = pathname?.startsWith("/profile");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#1E1E1E] bg-[#0A0A0A] backdrop-blur-[20px]"
      style={{
        height: "calc(68px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0)"
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2" style={{ height: 68 }}>
        {/* Home */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center gap-1 py-2"
          aria-label="Home"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={onHome ? "white" : "#6B6B6B"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
          {onHome && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>

        {/* Explore */}
        <Link
          href="/explore"
          className="flex flex-col items-center justify-center gap-1 py-2"
          aria-label="Explore"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={onExplore ? "white" : "#6B6B6B"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M14.828 9.172l-1.414 5.656-5.656 1.414 1.414-5.656z" />
          </svg>
          {onExplore && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>

        {/* Record - center, raised green circle */}
        <Link
          href="/record"
          className="-mt-6 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF88]"
          aria-label="Record"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center gap-1 py-2"
          aria-label="Profile"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={onProfile ? "white" : "#6B6B6B"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {onProfile && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>
      </div>
    </nav>
  );
}
