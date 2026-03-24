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

type Mode = "picker" | "vlog" | "selfie";
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

export default function RecordVlogPage({ params }: { params: { id: string } }) {
  const challengeId = params.id;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("picker");
  const [phase, setPhase] = useState<Phase>("record");
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "preparing" | "recording" | "paused" | "uploading" | "success" | "error"
  >("preparing");
  const [error, setError] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [segments, setSegments] = useState<Blob[]>([]);
  const [segmentMs, setSegmentMs] = useState<number[]>([]);
  const [currentStart, setCurrentStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [combinedUrl, setCombinedUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postedStreak, setPostedStreak] = useState<number | null>(null);

  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [selfieFacingMode, setSelfieFacingMode] = useState<"user" | "environment">("user");
  const [selfieCaptured, setSelfieCaptured] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [challengeInfo, setChallengeInfo] = useState<{ dayNumber: number; durationDays: number } | null>(null);
  const [showUploadFallback, setShowUploadFallback] = useState(false);
  const toast = useToast();
  const vlogFileInputRef = useRef<HTMLInputElement>(null);
  const selfieFileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!challengeId) return;
    console.log("[Record] Fetching challenge info for", challengeId);
    fetch(`/api/challenges/${challengeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.start_date && data.duration_days) {
          const dn = dayNumberFromStart(data.start_date);
          setChallengeInfo({ dayNumber: dn, durationDays: data.duration_days });
          console.log("[Record] Challenge info:", dn, "of", data.duration_days);
        }
      })
      .catch((err) => console.error("[Record] Failed to fetch challenge:", err));
  }, [challengeId]);

  async function startCamera(cameraMode: "user" | "environment") {
    console.log("[Record] startCamera called, facingMode:", cameraMode);
    setStatus("preparing");
    setError(null);
    try {
      console.log("[Record] Requesting getUserMedia...");
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraMode },
        audio: true
      });
      console.log("[Record] getUserMedia success, stream:", s.id);
      streamRef.current = s;
      setStream(s);
      setFacingMode(cameraMode);
      if (videoRef.current) {
        console.log("[Record] Setting video srcObject and play");
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch((err) => console.error("[Record] video.play error:", err));
      } else {
        console.warn("[Record] videoRef.current is null, cannot attach stream");
      }
      setStatus("idle");
    } catch (e: unknown) {
      console.error("[Record] Camera error:", e);
      const msg = e instanceof Error ? e.message : "Could not access camera/mic.";
      let friendly = "Camera access denied. Please allow camera access in your browser settings.";
      if (msg.includes("NotFoundError") || msg.includes("not found")) friendly = "No camera found.";
      else if (msg.includes("NotAllowedError") || msg.includes("Permission denied")) friendly = "Camera access denied. Please allow camera access in your browser settings.";
      else if (msg.includes("secure")) friendly = "Camera requires HTTPS. Use localhost for development.";
      setError(friendly);
      setStatus("error");
    }
  }

  function handleRecordVlogClick() {
    setMode("vlog");
  }

  useEffect(() => {
    if (!mediaSupported || mode !== "vlog") return;
    startCamera(facingMode);
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, mediaSupported, facingMode]);

  useEffect(() => {
    if (mode !== "vlog" || phase !== "record") return;
    const t = setTimeout(() => setShowUploadFallback(true), 3000);
    return () => clearTimeout(t);
  }, [mode, phase]);

  useEffect(() => {
    if (mode !== "selfie" || selfieCaptured) return;
    let s: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: selfieFacingMode } })
      .then((stream) => {
        s = stream;
        selfieStreamRef.current = stream;
        setSelfieStream(stream);
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
          selfieVideoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {});
    return () => { s?.getTracks().forEach((t) => t.stop()); selfieStreamRef.current = null; };
  }, [mode, selfieCaptured, selfieFacingMode]);

  function startSegment() {
    const s = streamRef.current ?? stream;
    if (!s) {
      setError("Camera not ready. Use 'Or upload from gallery' below.");
      return;
    }
    if (reachedMax) return;
    if (status === "recording") return;

    const tracks = s.getTracks();
    const allLive = tracks.every((t) => t.readyState === "live");
    if (!allLive) return;

    setError(null);
    const chunks: BlobPart[] = [];
    const mimeOptions = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mimeType = mimeOptions.find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
    const recorder = new MediaRecorder(s, { mimeType });
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

    try {
      setCurrentStart(Date.now());
      setStatus("recording");
      recorder.start(1000);
    } catch (err) {
      setStatus("paused");
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Recording failed: ${msg}`);
    }
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
    const fileToUpload = uploadedVideoFile ?? (segments.length > 0 ? new File([combineSegments(segments)], `${todayIsoDate()}.webm`, { type: "video/webm" }) : null);
    if (!fileToUpload) return;
    setStatus("uploading");
    setError(null);
    setUploadProgress(0);

    const form = new FormData();
    form.append("file", fileToUpload);
    form.append("challenge_id", challengeId);
    form.append("caption", caption.slice(0, 200));
    form.append("duration_seconds", uploadedVideoFile ? "0" : String(Math.round(totalRecordedMs / 1000)));
    form.append("proof_type", "vlog");

    const progTimer = setInterval(() => setUploadProgress((p) => (p < 90 ? p + 3 : p)), 220);

    try {
      const res = await fetch("/api/vlogs/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      clearInterval(progTimer);

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Upload failed.");
        setUploadProgress(0);
        alert(`Upload failed: ${data.error ?? "Unknown error"}`);
        return;
      }

      setUploadProgress(100);
      const streak = data.current_streak ?? null;
      setPostedStreak(streak);
      setStatus("success");
      const streakParam = streak != null ? `&streak=${streak}` : "";
      alert("Upload success! Redirecting...");
      window.location.href = `/challenge/${challengeId}?posted=vlog${streakParam}`;
    } catch (err) {
      clearInterval(progTimer);
      setStatus("error");
      setUploadProgress(0);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      alert(`Upload failed: ${msg}`);
    }
  }

  function rerecord() {
    setPhase("record");
    setSegments([]);
    setSegmentMs([]);
    setCurrentStart(null);
    setCombinedUrl(null);
    setUploadedVideoFile(null);
    setCaption("");
    setStatus("idle");
    setUploadProgress(0);
    setError(null);
  }

  function handleVlogFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }
    try {
      setUploadedVideoFile(f);
      setCombinedUrl(URL.createObjectURL(f));
      setPhase("preview");
      setCaption("");
      setError(null);
      setStatus("idle");
      setTimeout(() => previewRef.current?.play().catch(() => {}), 200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error: ${msg}`);
    }
    e.target.value = "";
  }

  function handleSelfieFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    try {
      selfieStreamRef.current?.getTracks().forEach((t) => t.stop());
      selfieStreamRef.current = null;
      setSelfieStream(null);
      setSelfieBlob(f);
      setSelfieCaptured(URL.createObjectURL(f));
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error: ${msg}`);
    }
    e.target.value = "";
  }

  async function submitCheckin() {
    setCheckinModalOpen(false);
    const res = await fetch("/api/vlogs/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: challengeId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return;
    }
    toast.showToast("Checked in. Your streak is safe — but your ranking isn't.", "warning");
    setTimeout(() => {
      window.location.href = `/challenge/${challengeId}`;
    }, 800);
  }

  async function postSelfie() {
    if (!selfieBlob) {
      alert("No image to upload.");
      return;
    }
    setStatus("uploading");
    setError(null);
    setUploadProgress(0);

    const file = selfieBlob instanceof File ? selfieBlob : new File([selfieBlob], `${todayIsoDate()}_selfie.jpg`, { type: "image/jpeg" });
    const form = new FormData();
    form.append("file", file);
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
      const streak = data.current_streak ?? null;
      setPostedStreak(streak);
      setStatus("success");
      const streakParam = streak != null ? `&streak=${streak}` : "";
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

  const progressPct = clamp((totalRecordedMs / maxMs) * 100, 0, 100);

  if (mode === "picker") {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-md px-5 pb-10 pt-8">
          <Link
            href={`/challenge/${challengeId}`}
            className="mb-6 inline-flex items-center gap-2 text-[#6B6B6B]"
          >
            <span className="text-xl">←</span>
            <span className="text-[14px]">Back</span>
          </Link>

          <h1 className="mb-2 text-[20px] font-bold">Post your proof</h1>
          <p className="mb-6 text-[14px] text-[#6B6B6B]">Choose how you want to check in today</p>

          <div className="space-y-4">
            <button
              onClick={handleRecordVlogClick}
              className="flex w-full items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-5 py-5 transition-colors hover:bg-[#1A1A1A]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00FF88] text-black">
                  <IconVideo />
                </span>
                <div className="text-left">
                  <div className="text-[16px] font-bold text-white">Record a vlog</div>
                  <div className="text-[13px] text-[#6B6B6B]">Talk about your day · +3 pts</div>
                </div>
              </div>
              <span className="text-[#00FF88]"><IconArrowRight /></span>
            </button>

            <button
              onClick={() => setMode("selfie")}
              className="flex w-full items-center justify-between rounded-2xl border border-[#1E1E1E] bg-[#111111] px-5 py-4 transition-colors hover:bg-[#1A1A1A]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4A9EFF] text-white">
                  <IconCameraPhoto />
                </span>
                <div className="text-left">
                  <div className="text-[16px] font-bold text-white">Take a selfie</div>
                  <div className="text-[13px] text-[#6B6B6B]">Quick photo proof · +2 pts</div>
                </div>
              </div>
              <span className="text-[#4A9EFF]"><IconArrowRight /></span>
            </button>

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
                <button
                  onClick={() => { setCheckinModalOpen(false); setMode("selfie"); }}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#00FF88] text-[16px] font-semibold text-black"
                >
                  Take a selfie instead
                </button>
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

  if (mode === "selfie") {
    const showPreview = !!selfieCaptured;
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="fixed left-0 right-0 top-0 z-20 mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <button
            onClick={() => { setMode("picker"); selfieStreamRef.current?.getTracks().forEach((t) => t.stop()); selfieStreamRef.current = null; setSelfieStream(null); setSelfieCaptured(null); setSelfieBlob(null); }}
            className="rounded-2xl border border-[#2A2A2A] bg-black/40 px-3 py-2 text-xs text-white"
          >
            Back
          </button>
          <button
            onClick={async () => {
              const next = selfieFacingMode === "user" ? "environment" : "user";
              selfieStreamRef.current?.getTracks().forEach((t) => t.stop());
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next } });
              selfieStreamRef.current = stream;
              setSelfieFacingMode(next);
              setSelfieStream(stream);
              if (selfieVideoRef.current) { selfieVideoRef.current.srcObject = stream; selfieVideoRef.current.play().catch(() => {}); }
            }}
            className="rounded-2xl border border-[#2A2A2A] bg-black/40 p-2 text-white"
            aria-label="Flip camera"
          >
            <IconFlip />
          </button>
        </div>

        {!showPreview ? (
          <div className="mx-auto flex min-h-screen max-w-md flex-col">
            <div className="relative flex-1">
              <video
                ref={selfieVideoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="border-t border-[#2A2A2A] bg-black/80 px-5 py-8 backdrop-blur">
              <div className="mb-4">
                <label className="block w-full rounded-xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[#1A1A1A]">
                  Upload photo from gallery
                  <input
                    ref={selfieFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelfieFileSelect}
                  />
                </label>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const v = selfieVideoRef.current;
                    const c = canvasRef.current;
                    if (!v || !c || !v.videoWidth) return;
                    c.width = v.videoWidth;
                    c.height = v.videoHeight;
                    const ctx = c.getContext("2d");
                    if (!ctx) return;
                    ctx.translate(c.width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(v, 0, 0);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    c.toBlob(
                      (blob) => {
                        if (!blob) return;
                        setSelfieBlob(blob);
                        setSelfieCaptured(URL.createObjectURL(blob));
                        selfieStreamRef.current?.getTracks().forEach((t) => t.stop());
                        selfieStreamRef.current = null;
                        setSelfieStream(null);
                      },
                      "image/jpeg",
                      0.9
                    );
                  }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20"
                >
                  <div className="h-14 w-14 rounded-full bg-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-20">
            <button
              onClick={() => { selfieStreamRef.current?.getTracks().forEach((t) => t.stop()); selfieStreamRef.current = null; setSelfieStream(null); setSelfieCaptured(null); setSelfieBlob(null); setMode("picker"); }}
              className="mb-4 self-start text-sm text-[#6B6B6B] hover:text-white"
            >
              ← Back
            </button>
            <div className="relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfieCaptured} alt="Selfie" className="w-full object-cover" style={{ aspectRatio: "4/3", transform: "scaleX(-1)" }} />
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="Add a caption (optional)"
              rows={3}
              className="mt-5 w-full resize-none rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-4 text-sm outline-none focus:border-[#4A9EFF]"
            />
            {status === "uploading" && (
              <div className="mt-4 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <p className="text-sm font-semibold">Posting your selfie...</p>
                <div className="mt-3 h-2 w-full rounded-full bg-black/40">
                  <div className="h-2 rounded-full bg-[#4A9EFF]" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setSelfieCaptured(null); setSelfieBlob(null); setSelfieFacingMode("user"); navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then((s) => { selfieStreamRef.current = s; setSelfieStream(s); if (selfieVideoRef.current) { selfieVideoRef.current.srcObject = s; selfieVideoRef.current.play(); } }); }}
                className="flex-1 rounded-2xl border border-[#2A2A2A] px-4 py-3 text-sm font-semibold text-white"
              >
                Retake
              </button>
              <button
                onClick={postSelfie}
                disabled={status === "uploading"}
                className="flex-1 rounded-2xl bg-[#4A9EFF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Post Selfie
              </button>
            </div>
          </div>
        )}

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* top overlay */}
      <div className="fixed left-0 right-0 top-0 z-20 mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <button
          onClick={() => {
            if (status === "recording") {
              const ok = window.confirm("Cancel recording?");
              if (ok) {
                setMode("picker");
                setPhase("record");
                setSegments([]);
                setSegmentMs([]);
                setCombinedUrl(null);
                setUploadedVideoFile(null);
                setCaption("");
              }
            } else {
              setMode("picker");
              setPhase("record");
              setSegments([]);
              setSegmentMs([]);
              setCombinedUrl(null);
              setUploadedVideoFile(null);
              setCaption("");
            }
          }}
          className="rounded-2xl border border-[#2A2A2A] bg-black/40 px-3 py-2 text-xs text-white"
        >
          Back
        </button>

        <div className="text-xs text-[#888888]">
          {phase === "record" ? "Recording" : "Preview"}
        </div>

        <button
          onClick={() => {
            const next = facingMode === "user" ? "environment" : "user";
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setStream(null);
            setFacingMode(next);
          }}
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
            {mediaSupported && status !== "error" ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0A0A0A] px-6 text-center">
                {/* Error/camera fallback */}
                {status === "error" && error && (
                  <p className="text-sm text-[#FF4444]">{error}</p>
                )}
                <p className="text-sm text-[#888888]">
                  {!mediaSupported
                    ? "Your browser doesn't support in-app recording."
                    : "Camera couldn't start."}{" "}
                  Upload a video instead.
                </p>
              </div>
            )}

            <div className="absolute left-4 top-16 rounded-2xl border border-[#2A2A2A] bg-black/40 px-3 py-2 text-xs font-semibold">
              Day {challengeInfo ? `${challengeInfo.dayNumber} of ${challengeInfo.durationDays}` : "? of ?"}
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
                  if (status === "recording") {
                    pauseSegment();
                  } else {
                    startSegment();
                  }
                }}
                disabled={status === "uploading" || reachedMax}
                className={`flex h-20 w-20 items-center justify-center rounded-full disabled:opacity-60 ${
                  status === "recording"
                    ? "bg-[#FF3B3B] animate-pulse"
                    : "bg-[#FF3B3B]"
                }`}
                aria-label="Record"
              >
                <div
                  className={`h-8 w-8 rounded-full bg-white/30 ${
                    status === "recording" ? "scale-90" : ""
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

            <div className="mt-4">
              <label className="flex h-20 w-full items-center justify-center rounded-2xl border border-[#1E1E1E] bg-[#111111] text-center text-sm font-semibold text-white transition-colors hover:bg-[#1A1A1A]">
                Or upload from gallery
                <input
                  ref={vlogFileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVlogFileSelect}
                />
              </label>
              {showUploadFallback && (status === "error" || status === "preparing") && (
                <p className="mt-2 text-center text-[12px] text-[#6B6B6B]">
                  Recording not available? Use upload above.
                </p>
              )}
            </div>

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

