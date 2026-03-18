"use client";

import { useRef, useState } from "react";

type Props = {
  initialAvatarUrl: string | null;
  displayName: string;
  username: string;
};

export function ProfileAvatarClient({
  initialAvatarUrl,
  displayName,
  username
}: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    if (uploading) return;
    fileInputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch {
      // ignore for now
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const initials =
    displayName?.trim()[0]?.toUpperCase() ??
    username?.trim()[0]?.toUpperCase() ??
    "?";

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="relative h-14 w-14 overflow-hidden rounded-full border border-transparent bg-[radial-gradient(circle_at_top,_rgba(0,255,136,0.5),_transparent_55%),rgba(15,23,42,1)] p-[2px]"
      >
        <div className="h-full w-full overflow-hidden rounded-full border border-[#00FF88]/40 bg-[#020617]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-[#00FF88]">
              {initials}
            </div>
          )}
        </div>
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-[11px] text-white ring-1 ring-black/80">
          📷
        </span>
        {uploading && (
          <span className="pointer-events-none absolute inset-0 rounded-full bg-black/50 text-[10px] text-white">
            <span className="flex h-full w-full items-center justify-center">
              ...
            </span>
          </span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onChange}
      />
    </>
  );
}

