"use client";

import { useEffect, useRef, useState } from "react";

type VlogMenuProps = {
  isOwnVlog: boolean;
  onDelete: () => void;
  className?: string;
};

function IconMore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function VlogMenu({ isOwnVlog, onDelete, className = "" }: VlogMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside as any);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside as any);
    };
  }, []);

  if (!isOwnVlog) return null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#6B6B6B] transition-colors hover:text-white"
        aria-label="More options"
      >
        <IconMore />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[#1E1E1E] bg-[#1A1A1A] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex h-11 w-full items-center px-4 text-left text-[14px] font-medium text-[#FF4444] transition-colors hover:bg-[#111111]"
          >
            Delete vlog
          </button>
        </div>
      )}
    </div>
  );
}
