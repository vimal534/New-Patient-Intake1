"use client";

import { useVisit } from "../state";

export function Welcome() {
  const { dispatch } = useVisit();

  return (
    <div className="py-10 text-center">
      <h1 className="mb-2 text-2xl font-bold text-[var(--color-ink)]">Let&apos;s get your child checked in</h1>
      <p className="mb-8 text-sm text-[var(--color-muted)]">
        A few quick taps — we&apos;ll only ask what&apos;s relevant to today&apos;s visit.
      </p>
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "SET_PATIENT_TYPE", patientType: "new" });
            dispatch({ type: "SET_ACTIVE_SECTION", key: "concern" });
          }}
          className="cursor-pointer rounded-2xl border-2 border-[var(--color-line-strong)] bg-white p-6 text-left transition hover:border-[var(--color-brand)] active:scale-[0.98]"
        >
          <div className="mb-1 text-base font-bold text-[var(--color-ink)]">New Patient</div>
          <div className="text-sm text-[var(--color-muted)]">First time visiting us. We&apos;ll ask once and reuse it going forward.</div>
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "SET_PATIENT_TYPE", patientType: "returning" });
            dispatch({ type: "PRESET_ON_FILE" });
            // Active section is set once the guardian taps through the
            // personalized ReturningHome screen (see page.tsx), not here —
            // they should see who/what's on file before landing on a
            // question.
          }}
          className="cursor-pointer rounded-2xl border-2 border-[var(--color-line-strong)] bg-white p-6 text-left transition hover:border-[var(--color-brand)] active:scale-[0.98]"
        >
          <div className="mb-1 text-base font-bold text-[var(--color-ink)]">Returning Patient</div>
          <div className="text-sm text-[var(--color-muted)]">We already have Ana&apos;s record — just confirm what&apos;s still accurate.</div>
        </button>
      </div>
    </div>
  );
}
