"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className ?? "h-5 w-5"}>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function IconCompass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? "h-5 w-5"}>
      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? "h-7 w-7"}>
      <path d="M7 7h10l1.5 2H21v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9h2.5L7 7z" strokeLinejoin="round" />
      <path d="M12 18a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({ url, username }: { url: string | null; username: string }) {
  const initial = (username || "U").trim().charAt(0).toUpperCase();
  if (url) {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={username} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-[10px] font-semibold text-white">
      {initial}
    </span>
  );
}

export function BottomNav(props: { profile: { avatarUrl: string | null; username: string } }) {
  const pathname = usePathname();
  const onProfile = pathname?.startsWith("/profile");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#1E1E1E] bg-[#0A0A0A]/90 backdrop-blur-[20px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div
        className="mx-auto grid max-w-md grid-cols-4 items-center justify-items-center"
        style={{ height: 68 }}
      >
        <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2" aria-label="Home">
          <IconHome className={pathname === "/dashboard" ? "text-white" : "text-[#6B6B6B]"} />
          {pathname === "/dashboard" && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1 py-2" aria-label="Explore">
          <IconCompass className={pathname === "/explore" ? "text-white" : "text-[#6B6B6B]"} />
          {pathname === "/explore" && <span className="h-1 w-1 rounded-full bg-[#00FF88]" />}
        </Link>
        <Link
          href="/record"
          className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#00FF88] text-black"
          aria-label="Record"
        >
          <IconCamera className="h-6 w-6" />
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 py-2" aria-label="Profile">
          {onProfile ? (
            <>
              <Avatar url={props.profile.avatarUrl} username={props.profile.username} />
              <span className="h-1 w-1 rounded-full bg-[#00FF88]" />
            </>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-[#6B6B6B]">
              <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          )}
        </Link>
      </div>
    </nav>
  );
}
