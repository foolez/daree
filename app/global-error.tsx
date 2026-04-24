"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="bg-slate-950 text-slate-50">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-400">Please reload the app.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-slate-950"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
