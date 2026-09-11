"use client";

import { ChevronLeftIcon } from "./Icons";

// Check-in header — README "Global chrome" section. Hidden on
// verification/hub/success (the caller decides that, this component just
// renders the chrome once asked to). No close/restart affordance here —
// dropped on request; resetting the demo scenario still works via the
// DEMO sheet.
export function Header({
  percent,
  timeLeft,
  onBack,
  title = "Check-in",
}: {
  percent: number;
  timeLeft: string;
  onBack: () => void;
  // Per-step section name (Health history, Coverage, Payment, ...) —
  // replaces the old static "Check-in" label so the header always
  // names the page the patient is actually on. Falls back to
  // "Check-in" for any step without one mapped in HEADER_TITLE.
  title?: string;
}) {
  // Compressed further still — no close button to balance against, a
  // smaller back chevron, and tighter padding all around. Target total
  // header height ~105-112px: 12px top padding, a 36px back/Check-in
  // row, 8px gap, the 4px progress bar, an 8px gap, a 20px "About 2 min
  // left" row, 12px bottom padding.
  return (
    <div className="border-b border-[var(--iv2-border-subtle)] bg-white px-6 pt-3 pb-3">
      <div className="mb-2 flex h-9 items-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0"
        >
          <ChevronLeftIcon size={9} />
        </button>
        <div className="ml-2 truncate text-[17px] font-semibold text-[var(--iv2-text-primary)]">{title}</div>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--iv2-border-subtle)]">
          <div
            className="h-1 rounded-full bg-[var(--iv2-brand)] transition-[width] duration-[240ms] ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-[15px] leading-none font-semibold text-[var(--iv2-text-muted)]">{percent}%</div>
      </div>
      <div className="mt-2 h-5 text-[15px] leading-5 text-[var(--iv2-text-secondary)]">{timeLeft} · Progress saved</div>
    </div>
  );
}
