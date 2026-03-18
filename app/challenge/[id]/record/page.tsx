"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "record" | "preview";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function IconFlip() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 7h4V3m0 4l-3-3a8 8 0 10-2 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6 7h12m-10 0l1-2h6l1 2m-9 0v13a1 1 0 001 1h6a1 1 0 001-1V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export default function RecordVlogPage({ params }: { params: { id: string } }) {
  const challengeId = params.id;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const [phase, setPhase] = useState<Phase>("record");
  const [status, setStatus] = useState<
    "idle" | "preparing" | "recording" | "paused" | "uploading" | "success" | "error"
  >("preparing");
  const [error, setError] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [segments, setSegments] = useState<Blob[]>([]);
  const [segmentMs, setSegmentMs] = useState<number[]>([]);
  const [currentStart, setCurrentStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [combinedUrl, setCombinedUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postedStreak, setPostedStreak] = useState<number | null>(null);

  const mediaSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const maxMs = 60_000;
  const minMs = 5_000;

  const totalRecordedMs =
    segmentMs.reduce((a, b) => a + b, 0) +
    (currentStart ? Date.now() - currentStart : 0);

  const canDone = totalRecordedMs >= minMs;
  const reachedMax = totalRecordedMs >= maxMs;

  useEffect(() => {
    let t: any;
    if (status === "recording") {
      t = setInterval(() => setElapsedMs(Date.now()), 100);
    }
    return () => clearInterval(t);
  }, [status]);

  async function startCamera(mode: "user" | "environment") {
    setStatus("preparing");
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("idle");
    } catch (e: any) {
      setError(e?.message ?? "Could not access camera/mic.");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!mediaSupported) {
      setStatus("idle");
      return;
    }
    startCamera(facingMode).catch(() => {});
    return () => {
      recorderRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  function startSegment() {
    if (!stream) return;
    if (reachedMax) return;

    setError(null);
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const startedAt = currentStart ?? Date.now();
      const dur = Math.max(0, Date.now() - startedAt);
      setSegments((prev) => [...prev, blob]);
      setSegmentMs((prev) => [...prev, dur]);
      setCurrentStart(null);
      setStatus("paused");
    };

    setCurrentStart(Date.now());
    setStatus("recording");
    recorder.start(250);
  }

  function pauseSegment() {
    if (status !== "recording") return;
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
  }

  function deleteLast() {
    if (status === "recording") return;
    setSegments((prev) => prev.slice(0, -1));
    setSegmentMs((prev) => prev.slice(0, -1));
  }

  function combineSegments(blobs: Blob[]) {
    return new Blob(blobs, { type: "video/webm" });
  }

  async function done() {
    if (!canDone) return;
    if (status === "recording") pauseSegment();

    const combined = combineSegments(segments);
    const url = URL.createObjectURL(combined);
    setCombinedUrl(url);
    setPhase("preview");
    setTimeout(() => previewRef.current?.play().catch(() => {}), 200);
  }

  async function post() {
    if (!combinedUrl) return;
    setStatus("uploading");
    setError(null);
    setUploadProgress(0);

    const combined = combineSegments(segments);
    const file = new File([combined], `${todayIsoDate()}.webm`, { type: "video/webm" });

    const form = new FormData();
    form.append("file", file);
    form.append("challenge_id", challengeId);
    form.append("caption", caption.slice(0, 200));
    form.append("duration_seconds", String(Math.round(totalRecordedMs / 1000)));

    // Fake progress (fetch doesn't expose upload progress). Keeps UI alive.
    const progTimer = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 3 : p));
    }, 220);

    const res = await fetch("/api/vlogs/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    clearInterval(progTimer);

    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Upload failed.");
      setUploadProgress(0);
      return;
    }

    setUploadProgress(100);
    setPostedStreak(data.current_streak ?? null);
    setStatus("success");
    setTimeout(() => {
      window.location.href = `/challenge/${challengeId}`;
    }, 1100);
  }

  function rerecord() {
    setPhase("record");
    setSegments([]);
    setSegmentMs([]);
    setCurrentStart(null);
    setCombinedUrl(null);
    setCaption("");
    setStatus("idle");
    setUploadProgress(0);
    setError(null);
  }

  async function fallbackUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus("uploading");
    setError(null);
    setUploadProgress(10);

    const form = new FormData();
    form.append("file", f);
    form.append("challenge_id", challengeId);
    form.append("caption", caption.slice(0, 200));
    form.append("duration_seconds", "0");

    const res = await fetch("/api/vlogs/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploadProgress(100);

    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Upload failed.");
      return;
    }

    setPostedStreak(data.current_streak ?? null);
    setStatus("success");
    setTimeout(() => {
      window.location.href = `/challenge/${challengeId}`;
    }, 1100);
  }

  const progressPct = clamp((totalRecordedMs / maxMs) * 100, 0, 100);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* top overlay */}
      <div className="fixed left-0 right-0 top-0 z-20 mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <Link
          href={`/challenge/${challengeId}`}
          className="rounded-2xl border border-[#2A2A2A] bg-black/40 px-3 py-2 text-xs text-white"
          onClick={(e) => {
            if (status === "recording") {
              e.preventDefault();
              const ok = window.confirm("Cancel recording?");
              if (ok) window.location.href = `/challenge/${challengeId}`;
            }
          }}
        >
          Cancel
        </Link>

        <div className="text-xs text-[#888888]">
          {phase === "record" ? "Recording" : "Preview"}
        </div>

        <button
          onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
          className="rounded-2xl border border-[#2A2A2A] bg-black/40 p-2 text-white"
          aria-label="Flip camera"
          disabled={!mediaSupported || status === "uploading"}
        >
          <IconFlip />
        </button>
      </div>

      {phase === "record" ? (
        <div className="mx-auto flex min-h-screen max-w-md flex-col">
          <div className="relative flex-1">
            {mediaSupported ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#0A0A0A] px-6 text-center text-sm text-[#888888]">
                Your browser doesn’t support in-app recording. Upload a video or
                photo instead.
              </div>
            )}

            <div className="absolute left-4 top-16 rounded-2xl border border-[#2A2A2A] bg-black/40 px-3 py-2 text-xs font-semibold">
              Day ? of ?
            </div>
          </div>

          {/* controls */}
          <div className="border-t border-[#2A2A2A] bg-black/80 px-5 py-5 backdrop-blur">
            <div className="mb-3 h-2 w-full rounded-full bg-[#1A1A1A]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#00FF88] to-[#FF6B35]"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="mb-3 flex items-center justify-between text-xs text-[#888888]">
              <span>{Math.round(totalRecordedMs / 1000)}s / 60s</span>
              <span>
                Segments:{" "}
                <span className="text-white">{segments.length}</span>
              </span>
            </div>

            <div className="mb-4 flex items-center gap-1">
              {segments.map((_, i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-[#00FF88]"
                  aria-hidden="true"
                />
              ))}
              {status === "recording" && (
                <span className="h-2 w-2 rounded-full bg-[#FF3B3B]" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={deleteLast}
                disabled={segments.length === 0 || status === "recording"}
                className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-white disabled:opacity-50"
                aria-label="Delete last segment"
              >
                <IconTrash />
              </button>

              <button
                onClick={() => {
                  if (!mediaSupported) return;
                  if (status === "recording") pauseSegment();
                  else startSegment();
                }}
                disabled={!mediaSupported || status === "uploading" || reachedMax}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF3B3B] text-black disabled:opacity-60"
                aria-label="Record"
              >
                <div
                  className={`h-8 w-8 ${
                    status === "recording" ? "rounded-lg bg-black/30" : "rounded-full bg-black/30"
                  }`}
                />
              </button>

              <button
                onClick={done}
                disabled={!canDone || status === "uploading"}
                className="rounded-2xl bg-[#00FF88] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
              >
                Done ✓
              </button>
            </div>

            {!mediaSupported && (
              <div className="mt-4">
                <label className="block w-full rounded-2xl bg-[#00FF88] px-4 py-4 text-center text-sm font-semibold text-black">
                  Upload video/photo
                  <input
                    type="file"
                    accept="video/*,image/*"
                    className="hidden"
                    onChange={fallbackUpload}
                  />
                </label>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-[#FF3B3B]">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-20">
          <div className="relative overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#0A0A0A]">
            <video
              ref={previewRef}
              src={combinedUrl ?? undefined}
              className="w-full"
              playsInline
              loop
              muted={false}
              onClick={() => {
                const v = previewRef.current;
                if (!v) return;
                if (v.paused) v.play().catch(() => {});
                else v.pause();
              }}
            />
            {status === "success" && (
              <div className="absolute inset-0">
                <Confetti />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/70 px-4 py-3 text-sm font-semibold text-white">
                  Vlog posted! 🔥 Streak: {postedStreak ?? "—"} days
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="How was today? 💭"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm outline-none focus:border-[#00FF88]"
            />

            {status === "uploading" && (
              <div className="rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <p className="text-sm font-semibold">Posting your vlog... 🚀</p>
                <div className="mt-3 h-2 w-full rounded-full bg-black/40">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00FF88] to-[#FF6B35]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-[#FF3B3B]">{error}</p>}

            <button
              onClick={post}
              disabled={status === "uploading" || status === "success"}
              className="w-full rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black disabled:opacity-60"
            >
              Post Vlog 🔥
            </button>
            <button
              onClick={rerecord}
              disabled={status === "uploading"}
              className="w-full rounded-2xl border border-[#2A2A2A] bg-black px-4 py-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Re-record
            </button>
          </div>

          <style jsx global>{`
            @keyframes confettiFall {
              0% {
                transform: translateY(-20px) rotate(0deg);
                opacity: 0;
              }
              20% {
                opacity: 1;
              }
              100% {
                transform: translateY(420px) rotate(180deg);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </main>
  );
}

