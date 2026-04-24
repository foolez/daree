"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav(props: { profile: { avatarUrl: string | null; username: string } }) {
  const pathname = usePathname();
  const onHome = pathname === "/dashboard";
  const onExplore = pathname === "/explore";
  const onRecord = pathname === "/record";
  const onStats = pathname === "/stats";
  const onProfile = pathname?.startsWith("/profile");

  const iconColor = (active: boolean) => (active ? "white" : "#6B6B6B");

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t border-[#1E1E1E] backdrop-blur-[16px]"
      style={{
        background: "rgba(10,10,10,0.85)",
        height: "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)"
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2" style={{ height: 64 }}>
        {/* Home */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center gap-1 py-2 min-h-[44px] min-w-[44px]"
          aria-label="Home"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor(onHome)}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
          {onHome && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>

        {/* Explore */}
        <Link
          href="/explore"
          className="flex flex-col items-center justify-center gap-1 py-2 min-h-[44px] min-w-[44px]"
          aria-label="Explore"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor(onExplore)}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" />
          </svg>
          {onExplore && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>

        {/* Record - center, raised green circle (-14px above nav) */}
        <Link
          href="/record"
          className="-mt-[14px] flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#00FF88] min-h-[48px] min-w-[48px]"
          aria-label="Record"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0"
          >
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </Link>

        {/* Stats */}
        <Link
          href="/stats"
          className="flex flex-col items-center justify-center gap-1 py-2 min-h-[44px] min-w-[44px]"
          aria-label="Stats"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor(onStats)}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0"
          >
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          {onStats && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center gap-1 py-2 min-h-[44px] min-w-[44px]"
          aria-label="Profile"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor(onProfile)}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {onProfile && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>
      </div>
    </nav>
  );
}
