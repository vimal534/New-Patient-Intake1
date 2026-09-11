"use client";

import { Ctx } from "../../ctx";
import { DocumentIcon } from "../Icons";
import { Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

// Preparticipation Physical Evaluation form — spec Part 6, item 4. The
// patient/guardian only reviews and signs the form itself here; the
// clinical section is completed by the provider at the visit — no
// demographics, health history, or policy screens in this scenario on
// purpose (spec: "the shortest flow").
export function PpeFormScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Form</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Preparticipation Physical Evaluation</ScreenTitle>
      <ScreenCopy className="mb-6">Review the form below and sign. Your provider completes the clinical section at the visit.</ScreenCopy>

      <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-white p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
          <DocumentIcon size={22} color="#1677E8" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-[var(--iv2-text-primary)]">PPE-Form-2026.pdf</div>
          <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">History section, 2 pages</div>
        </div>
      </div>

      <div className="mt-6 mb-2 text-[13px] text-[var(--iv2-text-muted)]">Signature</div>
      <button
        type="button"
        onClick={() => update({ ppeSigned: !state.ppeSigned })}
        className="flex h-[110px] w-full cursor-pointer items-center justify-center rounded-2xl border-[1.5px] bg-white"
        style={{ borderColor: state.ppeSigned ? "var(--iv2-brand)" : "var(--iv2-border)" }}
      >
        {state.ppeSigned ? (
          <span className="text-[38px] text-[var(--iv2-text-primary)]" style={{ fontFamily: "var(--font-caveat), cursive" }}>
            {state.guardian1.name.trim() || state.scheduling.patientName}
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-[var(--iv2-text-muted)]">Tap to sign</span>
        )}
      </button>
    </div>
  );
}
