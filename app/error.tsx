"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold text-slate-100">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-400">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-400"
      >
        Try again
      </button>
    </div>
  );
}
