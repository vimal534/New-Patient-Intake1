"use client";

import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { formatAgeFromDob } from "../../format";
import { UserIcon } from "../Icons";
import { Card, Divider, Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

// "MM/DD/YYYY" → "Jun 12, 2026" — deterministic given the string
// itself (not the current date), so safe to call during render.
function formatDobDisplay(dob: string): string {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Patient Information wizard — Step 1 of 6. Both basics (date of
// birth, sex assigned at birth) already came in on the appointment
// record itself, not something the patient is expected to correct
// here — so this is a plain read-only confirmation, not an editable
// form: no split date inputs, no selectable pills, just the two facts
// laid out the same label-above-value-below way the header block
// already shows the patient's name, and one "Looks right" CTA.
export function PatientConfirmScreen({ ctx }: { ctx: Ctx }) {
  const { state } = ctx;
  const age = formatAgeFromDob(state.personal.dob);
  const dobDisplay = formatDobDisplay(state.personal.dob);
  const summaryLine = [age, dobDisplay ? `DOB ${dobDisplay}` : ""].filter(Boolean).join(" · ");

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>
        {state.reviewingFromPatientReview ? "Review patient information" : state.reviewingFromSuccess ? REVIEW_TITLE.patientReview : "Patient information · Step 1 of 6"}
      </Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Let&apos;s confirm the patient&apos;s information</ScreenTitle>
      <ScreenCopy className="mb-6">We&apos;ve pre-filled this from your appointment. Let us know if anything looks wrong.</ScreenCopy>

      <Card>
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
            <UserIcon size={20} color="var(--iv2-brand)" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Patient (Minor)</div>
            <div className="mt-0.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.scheduling.patientName}</div>
            <div className="text-[13px] text-[var(--iv2-text-secondary)]">{summaryLine}</div>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Date of birth</div>
            <div className="mt-0.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{dobDisplay || state.personal.dob}</div>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Sex assigned at birth</div>
            <div className="mt-0.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.sexAssignedAtBirth || "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
