"use client";

import { Ctx } from "../../ctx";
import { CalendarIcon } from "../Icons";
import { Eyebrow, RadioRow, ScreenCopy, ScreenTitle } from "../ui";

const SYMPTOM_OPTIONS = ["No new symptoms", "Mild cough or congestion", "Fever", "Something else"];

// Screen 5 — Today's visit. Goes straight to the reason card + symptom
// question — no separate "Is this what you're coming in for?" confirm
// gate (dropped on request; `visitConfirmed` now starts `true` and
// nothing sets it back to `false` — see constants.ts).
export function VisitScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Today&apos;s visit</Eyebrow>
      <ScreenTitle className="mb-3.5 leading-[1.28]">A few details</ScreenTitle>
      <ScreenCopy className="mb-7">Just a couple quick questions to help us prepare for your visit.</ScreenCopy>

      <div className="flex items-center gap-4 rounded-[18px] border border-[var(--iv2-border)] bg-white p-4.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
          <CalendarIcon size={22} color="#1677E8" />
        </div>
        <div>
          <div className="text-[15px] text-[var(--iv2-text-secondary)]">Reason for visit</div>
          <div className="mt-0.5 text-lg font-semibold text-[var(--iv2-text-primary)]">Annual physical</div>
        </div>
      </div>

      <div className="mt-9">
        <Eyebrow>A few details</Eyebrow>
        <div className="mb-5 text-[21px] leading-[1.35] font-bold text-[var(--iv2-text-primary)]">
          Have you had any new symptoms in the last two weeks?
        </div>
        <div className="flex flex-col gap-2.5">
          {SYMPTOM_OPTIONS.map((opt) => (
            <RadioRow
              key={opt}
              label={opt}
              selected={state.visitAnswer === opt}
              onClick={() => update({ visitAnswer: opt })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
