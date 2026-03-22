"use client";

type DeleteVlogDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteVlogDialog({
  open,
  onClose,
  onConfirm,
  loading = false
}: DeleteVlogDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-[#1E1E1E] bg-[#111111] p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-white">
          Delete this vlog?
        </h3>
        <p className="mt-2 text-[15px] text-[#6B6B6B]">
          If you delete this vlog and don&apos;t post a new one before midnight,
          your streak will reset to 0.
        </p>
        <p className="mt-2 flex items-center gap-2 text-[14px] font-medium text-[#FF4444]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0">
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Streak at risk
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#2A2A2A] py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1A1A1A] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#FF4444] py-3 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
