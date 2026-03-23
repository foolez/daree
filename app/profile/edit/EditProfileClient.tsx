"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ProfileAvatarClient } from "../ProfileAvatarClient";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/Toast";

type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export function EditProfileClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const checkUsername = useCallback(async () => {
    const val = username.trim().replace(/^@/, "").toLowerCase();
    if (val.length < 2) {
      setUsernameAvailable(null);
      return;
    }
    if (val === profile.username) {
      setUsernameAvailable(true);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/profile/username-check?username=${encodeURIComponent(val)}`);
      const data = await res.json().catch(() => ({}));
      setUsernameAvailable(data.available ?? false);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setChecking(false);
    }
  }, [username, profile.username]);

  useEffect(() => {
    const t = setTimeout(checkUsername, 400);
    return () => clearTimeout(t);
  }, [checkUsername]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          username: username.trim().replace(/^@/, "").toLowerCase() || profile.username,
          bio: bio.trim().slice(0, 150) || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showToast(data.error ?? "Could not save", "error");
        return;
      }
      toast.showToast("Profile updated", "success");
      router.push("/profile");
    } catch {
      toast.showToast("Network error. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]"
        >
          <span className="text-xl">←</span>
          <span className="text-[14px]">Back</span>
        </Link>

        <h1 className="mb-6 text-[20px] font-bold">Edit profile</h1>

        <div className="mb-6 flex justify-center">
          <ProfileAvatarClient
            initialAvatarUrl={profile.avatarUrl}
            displayName={displayName || profile.username}
            username={username || profile.username}
            size={80}
            centered
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#6B6B6B]">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#6B6B6B]">
              Username
            </label>
            <div className="relative">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                placeholder="username"
                className="w-full rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3 pr-10 text-[15px] text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
                autoCapitalize="none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px]">
                {checking ? (
                  <span className="text-[#6B6B6B]">…</span>
                ) : usernameAvailable === true ? (
                  <span className="text-[#00FF88]">✓</span>
                ) : usernameAvailable === false ? (
                  <span className="text-[#FF4444]">✕</span>
                ) : null}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#6B6B6B]">2+ chars, lowercase, numbers, underscore</p>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#6B6B6B]">
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={150}
              className="w-full resize-none rounded-xl border border-[#1E1E1E] bg-[#111111] px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
            />
            <p className="mt-1 text-[11px] text-[#6B6B6B]">{bio.length}/150</p>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || usernameAvailable === false}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] text-[16px] font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <BottomNav
        profile={{
          avatarUrl: profile.avatarUrl,
          username: profile.username
        }}
      />
    </main>
  );
}
