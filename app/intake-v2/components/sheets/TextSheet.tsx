"use client";

import { BottomSheet } from "../ui";

// Shared shell for the two plain-text info sheets (full consent text,
// "how your information is used") — both are title + scrollable body +
// single Close action, differing only in copy.
export function TextSheet({
  open,
  title,
  body,
  onClose,
  zIndex,
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
  zIndex: number;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} zIndex={zIndex} maxHeight="none">
      <div className="mb-4 text-xl font-bold text-[var(--iv2-text-primary)]">{title}</div>
      <div className="max-h-[280px] overflow-auto text-[15px] leading-[1.65] text-[var(--iv2-text-secondary)]">{body}</div>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 h-[54px] w-full cursor-pointer rounded-2xl border border-[var(--iv2-border)] bg-white text-base font-semibold text-[var(--iv2-text-primary)]"
      >
        Close
      </button>
    </BottomSheet>
  );
}
