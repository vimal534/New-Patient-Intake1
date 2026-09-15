"use client";

import { ChevronLeftIcon } from "./Icons";

// Check-in header — README "Global chrome" section. Hidden on
// verification/hub/success (the caller decides that, this component just
// renders the chrome once asked to). No close/restart affordance here —
// dropped on request; resetting the demo scenario still works via the
// DEMO sheet.
//
// One layout everywhere — a text "‹ Back" on the left and the
// percentage complete on the right, sitting in their own row first,
// with the progress bar underneath (8px gap) — per design-panel spec —
// colors/sizes match that spec exactly (#64748B/15px for Back,
// #94A3B8/13.5px for the percentage; #E7EDF4 track/#2563EB fill, 6px
// tall, for the bar itself) rather than the app's usual muted-text/
// brand tokens, since this treatment intentionally reads the same on
// every screen, wizard included — no "Step N of total" text anywhere.
// `title`/`timeLeft` stay accepted (every call site still passes them)
// but are no longer rendered. No static bottom border under the header
// — instead `elevated` (the caller's own scroll-position check) fades
// in a soft shadow once the screen's content has scrolled out from
// under it, so the header reads as a fixed surface without ever
// drawing a hard line at rest.
export function Header({
  percent,
  onBack,
  elevated = false,
}: {
  percent: number;
  timeLeft: string;
  onBack: () => void;
  // Per-step section name (Health history, Coverage, Payment, ...) — no
  // longer rendered here, kept accepted so callers don't need to change.
  title?: string;
  elevated?: boolean;
}) {
  return (
    <div
      className="bg-[var(--iv2-surface)] px-6 pt-3 pb-2 transition-shadow duration-200 ease-out"
      style={{ boxShadow: elevated ? "0 4px 12px rgba(27,38,36,0.06)" : "0 0 0 rgba(27,38,36,0)" }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-1 flex cursor-pointer items-center gap-2 border-none bg-transparent p-1 text-[15px] font-bold"
          style={{ color: "#64748b" }}
        >
          <ChevronLeftIcon size={7} />
          Back
        </button>
        <div className="text-[13.5px] font-bold" style={{ color: "#94a3b8" }}>{percent}%</div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#e7edf4" }}>
        <div className="h-full rounded-full transition-[width] duration-[240ms] ease-out" style={{ width: `${percent}%`, background: "#2563eb" }} />
      </div>
    </div>
  );
}
