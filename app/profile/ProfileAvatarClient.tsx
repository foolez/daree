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
            className="relative h-14 w-14 overflow-hidden rounded-full border border-transparent bg-[radial-gradient(circle_at_top,_rgba(0,255,136,0.5),_transparent_55%),rgba(15,23,42,1)] p-[2px]"
            aria-label="Change profile photo"
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
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#2A2A2A] bg-black/80 text-[11px] text-white disabled:opacity-60"
            aria-label="Take a photo"
          >
            📷
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

