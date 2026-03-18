import Link from "next/link";

export default function RecordPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-md px-5 py-8">
        <h1 className="text-2xl font-black tracking-tight">Record</h1>
        <p className="mt-2 text-sm text-[#888888]">
          Choose a challenge to record today’s vlog.
        </p>

        <div className="mt-6 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
          <p className="text-sm text-[#888888]">
            Recording will live inside each challenge. For now, go to your
            dashboard and enter a dare.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#00FF88] px-4 py-4 text-sm font-semibold text-black"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

