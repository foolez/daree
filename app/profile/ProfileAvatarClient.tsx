"use client";

import { useRef, useState } from "react";

const INITIAL_COLORS = ["#2D5A3D", "#5A2D4D", "#2D3D5A", "#5A4D2D", "#3D2D5A", "#2D5A5A"] as const;

function avatarColor(username: string): string {
  let hash = 0;
  const s = username || "u";
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash = hash & hash;
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    if (uploading) return;
    setError(null);
    fileInputRef.current?.click();
  }

  function openCamera() {
    if (uploading) return;
    setError(null);
    cameraInputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Never sign out / redirect from client. Just show a friendly message.
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
    } catch {
      setError("Network error. Please try again.");
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
      <div className="flex flex-col items-start gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={openPicker}
            className="relative h-14 w-14 overflow-hidden rounded-full border border-[#1E1E1E] bg-[#111111]"
            aria-label="Change profile photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-xl font-semibold text-white"
                style={{ backgroundColor: avatarColor(username) }}
              >
                {initials}
              </div>
            )}
            {uploading && (
              <span className="pointer-events-none absolute inset-0 rounded-full bg-black/50 text-[10px] text-white">
                <span className="flex h-full w-full items-center justify-center">
                  Uploading…
                </span>
              </span>
            )}
          </button>

          {/* Camera quick action (mobile friendly) */}
          <button
            type="button"
            onClick={openCamera}
            disabled={uploading}
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#1E1E1E] bg-[#111111] text-[11px] text-white disabled:opacity-60"
            aria-label="Take a photo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {error && <p className="text-[11px] text-[#FF3B3B]">{error}</p>}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        // No `capture` here so desktop/mobile can choose from library easily.
        className="hidden"
        onChange={onChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onChange}
      />
    </>
  );
}

