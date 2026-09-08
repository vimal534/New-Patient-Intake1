"use client";

import { Ctx } from "../../ctx";
import { BottomSheet, Eyebrow } from "../ui";

// Prototype-only scenario switcher — README: "This control and its sheet
// must not appear in the production patient UI; the real app derives the
// scenario from the patient record." Kept here, same as /tap-intake's
// own DemoScenarioSwitcher.tsx, purely so this route can be reviewed in
// both scenarios without a real patient-record backend.
export function DemoButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      // `absolute`, not `fixed` — the page column is capped at 430px and
      // centered with a `relative` wrapper (see page.tsx), so this needs
      // to stay pinned to that column's own bottom-right corner rather
      // than the full browser viewport's, which is much wider on desktop.
      // Sits at the true bottom-right corner of the screen, below the
      // primary CTA, rather than overlapping it.
      className="absolute right-4 bottom-4 z-[80] h-[34px] cursor-pointer rounded-full border-none bg-[var(--iv2-text-primary)] px-4 text-xs font-extrabold tracking-[0.08em] text-white shadow-[0_4px_14px_rgba(16,24,43,0.2)]"
    >
      DEMO
    </button>
  );
}

export function DemoSheet({ ctx }: { ctx: Ctx }) {
  const { state, reset, update } = ctx;

  return (
    <BottomSheet open={state.demoOpen} onClose={() => update({ demoOpen: false })} zIndex={80} maxHeight="none">
      <Eyebrow>Demo scenario</Eyebrow>
      <button
        type="button"
        onClick={() => reset("new")}
        className="mb-2.5 w-full cursor-pointer rounded-2xl border-[1.5px] p-4 text-left"
        style={{
          borderColor: state.scenario !== "returning" ? "var(--iv2-brand)" : "var(--iv2-border)",
          backgroundColor: state.scenario !== "returning" ? "var(--iv2-brand-tint)" : "#fff",
        }}
      >
        <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">New patient</div>
        <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">First visit — build health history</div>
      </button>
      <button
        type="button"
        onClick={() => reset("returning")}
        className="w-full cursor-pointer rounded-2xl border-[1.5px] p-4 text-left"
        style={{
          borderColor: state.scenario === "returning" ? "var(--iv2-brand)" : "var(--iv2-border)",
          backgroundColor: state.scenario === "returning" ? "var(--iv2-brand-tint)" : "#fff",
        }}
      >
        <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">Returning patient</div>
        <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">Review what&apos;s already on file</div>
      </button>
      <button
        type="button"
        onClick={() => update({ demoOpen: false })}
        className="mt-3 h-11 w-full cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-text-muted)]"
      >
        Close
      </button>
    </BottomSheet>
  );
}
