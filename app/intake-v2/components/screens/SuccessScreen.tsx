"use client";

import { Ctx } from "../../ctx";
import { CheckIcon } from "../ui";

// Screen 15 — Success. No header. Restyled to match a reference:
// centered hero (solid-green circle, centered title/subtitle), a plain
// muted-surface appointment card (no divider, no checklist inside it),
// a flat checklist below with light-green check badges and row
// dividers, and a solid-green pill "Done" CTA — the one screen in the
// whole flow that deliberately leans on --iv2-success instead of
// --iv2-brand, since this is the "you're done, not just confirmed"
// moment.
export function SuccessScreen({ ctx }: { ctx: Ctx }) {
  const { reset, state } = ctx;

  const items = ["Check-in complete", "Coverage ready", "Health information reviewed", "Forms signed"];

  return (
    <div className="px-6 pt-14 pb-6 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--iv2-success)]">
        <CheckIcon size={34} color="#fff" strokeWidth={3} />
      </div>
      <div className="mb-2 text-[28px] leading-[1.2] font-bold text-[var(--iv2-text-primary)]">You&apos;re ready for your visit</div>
      <div className="mb-7 text-base leading-[1.55] text-[var(--iv2-text-secondary)]">Your care team has what they need.</div>

      <div className="rounded-2xl bg-[var(--iv2-surface-muted)] p-5 text-left">
        <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">Tomorrow · 8:00 AM</div>
        <div className="mt-1 text-[17px] font-bold text-[var(--iv2-text-primary)]">Dr. Sarah Jenkins</div>
        <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">Main St. Clinic</div>
      </div>

      <div className="mt-2 text-left">
        {items.map((label) => (
          <div key={label} className="flex items-center gap-3 border-b border-[var(--iv2-border-subtle)] py-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
              <CheckIcon size={12} color="var(--iv2-success)" strokeWidth={3} />
            </span>
            <span className="text-base font-semibold text-[var(--iv2-text-primary)]">{label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => reset(state.scenario)}
        className="mt-6 h-14 w-full cursor-pointer rounded-full border-none bg-[var(--iv2-success)] text-base font-bold text-white"
      >
        Done
      </button>
    </div>
  );
}
