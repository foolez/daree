"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

function dayNumberFromStart(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const au = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const bu = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(1, Math.floor((bu - au) / day) + 1);
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function IconVideo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCameraPhoto() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
      <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0zM19 9v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
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
            animation: `confettiFall 1100ms ease-out ${i * 35}ms 1 both`
          }}
        />
      ))}
    </div>
  );
}

type Mode = "picker" | "vlog" | "selfie";

export default function RecordVlogPage({ params }: { params: { id: string } }) {
  const challengeId = params.id;

  const previewRef = useRef<HTMLVideoElement | null>(null);

  const [mode, setMode] = useState<Mode>("picker");
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postedStreak, setPostedStreak] = useState<number | null>(null);

  const [vlogFile, setVlogFile] = useState<File | null>(null);
  const [vlogPreviewUrl, setVlogPreviewUrl] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [challengeInfo, setChallengeInfo] = useState<{ dayNumber: number; durationDays: number } | null>(null);

  const toast = useToast();
  const vlogCameraInputRef = useRef<HTMLInputElement>(null);
  const vlogGalleryInputRef = useRef<HTMLInputElement>(null);
  const selfieCameraInputRef = useRef<HTMLInputElement>(null);
  const selfieGalleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!challengeId) return;
    fetch(`/api/challenges/${challengeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.start_date && data.duration_days) {
          setChallengeInfo({ dayNumber: dayNumberFromStart(data.start_date), durationDays: data.duration_days });
        }
      })
      .catch(() => {});
  }, [challengeId]);

  function handleVlogFile(e: React.ChangeEvent<HTMLInputElement>, fromGallery: boolean) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      alert("Please select a video file.");
      e.target.value = "";
      return;
    }
    setVlogFile(f);
    setVlogPreviewUrl(URL.createObjectURL(f));
    setCaption("");
    setError(null);
    setMode("vlog");
    setTimeout(() => previewRef.current?.play().catch(() => {}), 200);
    e.target.value = "";
  }

  function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>, fromGallery: boolean) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }
    setSelfieFile(f);
    setSelfiePreviewUrl(URL.createObjectURL(f));
    setCaption("");
    setError(null);
    setMode("selfie");
    e.target.value = "";
  }

  async function postVlog() {
    if (!vlogFile) return;
    setStatus("uploading");
    setError(null);
    setUploadProgress(0);

    const form = new FormData();
    form.append("file", vlogFile);
    form.append("challenge_id", challengeId);
    form.append("caption", caption.slice(0, 200));
    form.append("duration_seconds", "0");
    form.append("proof_type", "vlog");

    const progTimer = setInterval(() => setUploadProgress((p) => (p < 90 ? p + 3 : p)), 220);

    try {
      const res = await fetch("/api/vlogs/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      clearInterval(progTimer);

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Upload failed.");
        alert(`Upload failed: ${data.error ?? "Unknown error"}`);
        return;
      }

      setUploadProgress(100);
      setPostedStreak(data.current_streak ?? null);
      setStatus("success");
      const streakParam = data.current_streak != null ? `&streak=${data.current_streak}` : "";
      alert("Upload success! Redirecting...");
      window.location.href = `/challenge/${challengeId}?posted=vlog${streakParam}`;
    } catch (err) {
      clearInterval(progTimer);
      setStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      alert(`Upload failed: ${msg}`);
    }
  }

  async function postSelfie() {
    if (!selfieFile) return;
    setStatus("uploading");
    setError(null);
    setUploadProgress(0);

    const form = new FormData();
    form.append("file", selfieFile);
    form.append("challenge_id", challengeId);
    form.append("caption", caption.slice(0, 200));
    form.append("duration_seconds", "0");
    form.append("proof_type", "selfie");

    const progTimer = setInterval(() => setUploadProgress((p) => (p < 90 ? p + 3 : p)), 220);

    try {
      const res = await fetch("/api/vlogs/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      clearInterval(progTimer);

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Upload failed.");
        alert(`Upload failed: ${data.error ?? "Unknown error"}`);
        return;
      }

      setUploadProgress(100);
      setPostedStreak(data.current_streak ?? null);
      setStatus("success");
      const streakParam = data.current_streak != null ? `&streak=${data.current_streak}` : "";
      alert("Upload success! Redirecting...");
      window.location.href = `/challenge/${challengeId}?posted=selfie${streakParam}`;
    } catch (err) {
      clearInterval(progTimer);
      setStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      alert(`Upload failed: ${msg}`);
    }
  }

  function resetVlog() {
    if (vlogPreviewUrl) URL.revokeObjectURL(vlogPreviewUrl);
    setVlogFile(null);
    setVlogPreviewUrl(null);
    setCaption("");
    setMode("picker");
    setStatus("idle");
    setError(null);
  }

  function resetSelfie() {
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    setSelfieFile(null);
    setSelfiePreviewUrl(null);
    setCaption("");
    setMode("picker");
    setStatus("idle");
    setError(null);
  }

  async function submitCheckin() {
    setCheckinModalOpen(false);
    const res = await fetch("/api/vlogs/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: challengeId })
    });
    if (!res.ok) return;
    toast.showToast("Checked in. Your streak is safe — but your ranking isn't.", "warning");
    setTimeout(() => { window.location.href = `/challenge/${challengeId}`; }, 800);
  }

  if (mode === "picker") {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-md px-5 pb-10 pt-8">
          <Link href={`/challenge/${challengeId}`} className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]">
            <span className="text-xl">←</span>
            <span className="text-[14px]">Back</span>
          </Link>

          <h1 className="mb-2 text-[20px] font-bold">Post your proof</h1>
          <p className="mb-6 text-[14px] text-[#6B6B6B]">Choose how you want to check in today</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-5 py-5 transition-colors hover:bg-[#1A1A1A]">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00FF88] text-black">
                    <IconVideo />
                  </span>
                  <div className="text-left">
                    <div className="text-[16px] font-bold text-white">Record a vlog</div>
                    <div className="text-[13px] text-[#6B6B6B]">Opens your camera · +3 pts</div>
                  </div>
                </div>
                <span className="text-[#00FF88]"><IconArrowRight /></span>
                <input
                  ref={vlogCameraInputRef}
                  type="file"
                  accept="video/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleVlogFile(e, false)}
                />
              </label>
              <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] px-4 py-3 text-[14px] text-[#6B6B6B] transition-colors hover:bg-[#111111]">
                Or upload from gallery
                <input
                  ref={vlogGalleryInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVlogFile(e, true)}
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-5 py-4 transition-colors hover:bg-[#1A1A1A]">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4A9EFF] text-white">
                    <IconCameraPhoto />
                  </span>
                  <div className="text-left">
                    <div className="text-[16px] font-bold text-white">Take a selfie</div>
                    <div className="text-[13px] text-[#6B6B6B]">Opens your camera · +2 pts</div>
                  </div>
                </div>
                <span className="text-[#4A9EFF]"><IconArrowRight /></span>
                <input
                  ref={selfieCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleSelfieFile(e, false)}
                />
              </label>
              <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] px-4 py-3 text-[14px] text-[#6B6B6B] transition-colors hover:bg-[#111111]">
                Or upload from gallery
                <input
                  ref={selfieGalleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSelfieFile(e, true)}
                />
              </label>
            </div>

            <button
              onClick={() => setCheckinModalOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] px-5 py-3 transition-colors hover:bg-[#111111]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6B6B6B]">
                  <IconCheckCircle />
                </span>
                <div className="text-left">
                  <div className="text-[15px] text-[#6B6B6B]">I survived today</div>
                  <div className="text-[13px] text-[#3A3A3A]">Keeps streak alive · no points</div>
                </div>
              </div>
              <span className="text-[#6B6B6B]"><IconArrowRight /></span>
            </button>
          </div>
        </div>

        {checkinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
            <div className="w-full max-w-[320px] rounded-[20px] border border-[#1E1E1E] bg-[#111111] p-7">
              <div className="mb-4 flex justify-center text-[40px]">👀</div>
              <h2 className="mb-3 text-center text-[20px] font-bold text-white">Are you sure?</h2>
              <p className="mb-6 text-center text-[15px] leading-relaxed text-[#6B6B6B]">
                This keeps your streak alive, but you&apos;ll earn zero points today. Your ranking won&apos;t move.
                <br /><br />
                Everyone in your group will see you took the easy way out.
                <br /><br />
                A 15-second selfie takes less time than reading this popup.
                <br /><br />
                Still want to check in without proof?
              </p>
              <div className="space-y-3">
                <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[#00FF88] text-[16px] font-semibold text-black">
                  Take a selfie instead
                  <input
                    ref={selfieCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => { setCheckinModalOpen(false); handleSelfieFile(e, false); }}
                  />
                </label>
                <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[#1E1E1E] text-[14px] text-[#6B6B6B] hover:bg-[#1A1A1A]">
                  Upload photo from gallery
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { setCheckinModalOpen(false); handleSelfieFile(e, true); }}
                  />
                </label>
                <button
                  onClick={submitCheckin}
                  className="flex h-10 w-full items-center justify-center rounded-xl text-[14px] text-[#6B6B6B] transition-colors hover:bg-[#1A1A1A]"
                >
                  Yes, just check me in
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (mode === "vlog" && vlogPreviewUrl && vlogFile) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-md px-5 pb-24 pt-6">
          <button onClick={resetVlog} className="mb-6 text-[14px] text-[#6B6B6B] hover:text-white">
            ← Back
          </button>

          <h1 className="mb-4 text-[20px] font-bold">Preview your vlog</h1>
          {challengeInfo && (
            <p className="mb-4 text-[13px] text-[#6B6B6B]">
              Day {challengeInfo.dayNumber} of {challengeInfo.durationDays}
            </p>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-[#1E1E1E] bg-black">
            <video
              ref={previewRef}
              src={vlogPreviewUrl}
              className="w-full"
              playsInline
              loop
              muted={false}
              controls
            />
            {status === "success" && (
              <div className="absolute inset-0">
                <Confetti />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/70 px-4 py-3 text-sm font-semibold text-white">
                  Vlog posted! Streak: {postedStreak ?? "—"} days
                </div>
              </div>
            )}
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            placeholder="How was today?"
            rows={3}
            className="mt-5 w-full resize-none rounded-2xl border border-[#1E1E1E] bg-[#111111] px-4 py-4 text-sm text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#00FF88]"
          />

          {status === "uploading" && (
            <div className="mt-4 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
              <p className="text-sm font-semibold">Posting your vlog...</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[#1A1A1A]">
                <div className="h-2 rounded-full bg-[#00FF88]" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-[#FF4444]">{error}</p>}

          <button
            onClick={postVlog}
            disabled={status === "uploading" || status === "success"}
            className="mt-4 w-full rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black disabled:opacity-60"
          >
            Post Vlog
          </button>
          <button
            onClick={resetVlog}
            disabled={status === "uploading"}
            className="mt-3 w-full rounded-2xl border border-[#1E1E1E] px-4 py-3 text-sm font-medium text-white hover:bg-[#111111] disabled:opacity-60"
          >
            Choose different video
          </button>
        </div>
      </main>
    );
  }

  if (mode === "selfie" && selfiePreviewUrl && selfieFile) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-md px-5 pb-24 pt-6">
          <button onClick={resetSelfie} className="mb-6 text-[14px] text-[#6B6B6B] hover:text-white">
            ← Back
          </button>

          <h1 className="mb-4 text-[20px] font-bold">Preview your selfie</h1>
          {challengeInfo && (
            <p className="mb-4 text-[13px] text-[#6B6B6B]">
              Day {challengeInfo.dayNumber} of {challengeInfo.durationDays}
            </p>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-[#1E1E1E] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfiePreviewUrl} alt="Selfie preview" className="w-full object-cover" style={{ aspectRatio: "4/3" }} />
            {status === "success" && (
              <div className="absolute inset-0">
                <Confetti />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/70 px-4 py-3 text-sm font-semibold text-white">
                  Selfie posted! Streak: {postedStreak ?? "—"} days
                </div>
              </div>
            )}
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
            placeholder="Add a caption (optional)"
            rows={3}
            className="mt-5 w-full resize-none rounded-2xl border border-[#1E1E1E] bg-[#111111] px-4 py-4 text-sm text-white outline-none placeholder:text-[#6B6B6B] focus:border-[#4A9EFF]"
          />

          {status === "uploading" && (
            <div className="mt-4 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
              <p className="text-sm font-semibold">Posting your selfie...</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[#1A1A1A]">
                <div className="h-2 rounded-full bg-[#4A9EFF]" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-[#FF4444]">{error}</p>}

          <button
            onClick={postSelfie}
            disabled={status === "uploading" || status === "success"}
            className="mt-4 w-full rounded-2xl bg-[#4A9EFF] px-4 py-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Post Selfie
          </button>
          <button
            onClick={resetSelfie}
            disabled={status === "uploading"}
            className="mt-3 w-full rounded-2xl border border-[#1E1E1E] px-4 py-3 text-sm font-medium text-white hover:bg-[#111111] disabled:opacity-60"
          >
            Choose different photo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <Link href={`/challenge/${challengeId}`} className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]">
          <span className="text-xl">←</span>
          <span className="text-[14px]">Back</span>
        </Link>

        <h1 className="mb-2 text-[20px] font-bold">Post your proof</h1>
        <p className="mb-6 text-[14px] text-[#6B6B6B]">Choose how you want to check in today</p>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#00FF88] px-5 py-5 text-[16px] font-bold text-black transition-opacity hover:opacity-90">
              Record vlog (opens camera)
              <input
                ref={vlogCameraInputRef}
                type="file"
                accept="video/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleVlogFile(e, false)}
              />
            </label>
            <label className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-[#1E1E1E] bg-[#111111] px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1A1A1A]">
              Upload from gallery
              <input
                ref={vlogGalleryInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleVlogFile(e, true)}
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#4A9EFF] px-5 py-5 text-[16px] font-bold text-white transition-opacity hover:opacity-90">
              Take selfie (opens camera)
              <input
                ref={selfieCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleSelfieFile(e, false)}
              />
            </label>
            <label className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-[#1E1E1E] bg-[#111111] px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1A1A1A]">
              Upload from gallery
              <input
                ref={selfieGalleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSelfieFile(e, true)}
              />
            </label>
          </div>

          <button
            onClick={() => setCheckinModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] px-5 py-3 transition-colors hover:bg-[#111111]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6B6B6B]">
                <IconCheckCircle />
              </span>
              <div className="text-left">
                <div className="text-[15px] text-[#6B6B6B]">I survived today</div>
                <div className="text-[13px] text-[#3A3A3A]">Keeps streak alive · no points</div>
              </div>
            </div>
            <span className="text-[#6B6B6B]"><IconArrowRight /></span>
          </button>
        </div>

        {checkinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
            <div className="w-full max-w-[320px] rounded-[20px] border border-[#1E1E1E] bg-[#111111] p-7">
              <div className="mb-4 flex justify-center text-[40px]">👀</div>
              <h2 className="mb-3 text-center text-[20px] font-bold text-white">Are you sure?</h2>
              <p className="mb-6 text-center text-[15px] leading-relaxed text-[#6B6B6B]">
                This keeps your streak alive, but you&apos;ll earn zero points today.
              </p>
              <div className="space-y-3">
                <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[#00FF88] text-[16px] font-semibold text-black">
                  Take a selfie instead
                  <input
                    ref={selfieCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => { setCheckinModalOpen(false); handleSelfieFile(e, false); }}
                  />
                </label>
                <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[#1E1E1E] text-[14px] text-[#6B6B6B] hover:bg-[#1A1A1A]">
                  Upload photo from gallery
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { setCheckinModalOpen(false); handleSelfieFile(e, true); }}
                  />
                </label>
                <button
                  onClick={submitCheckin}
                  className="flex h-10 w-full items-center justify-center rounded-xl text-[14px] text-[#6B6B6B] hover:bg-[#1A1A1A]"
                >
                  Yes, just check me in
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(420px) rotate(180deg); opacity: 0; }
        }
      `}</style>
    </main>
  );
}
