"use client";

import { useRef } from "react";
import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { formatAgeFromDob } from "../../format";
import { UserIcon } from "../Icons";
import { SplitDobField } from "../SmartField";
import { Card, Divider, Eyebrow, OptionPill, ScreenCopy, ScreenTitle } from "../ui";

const SEX_OPTIONS = ["Male", "Female"];

// "MM/DD/YYYY" → "Jun 12, 2026" — deterministic given the string
// itself (not the current date), so safe to call during render.
function formatDobDisplay(dob: string): string {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Patient Information wizard — Step 1 of 6. Just the patient's own two
// basics (date of birth, sex assigned at birth), both pre-filled from
// the appointment record and both editable right on this screen — no
// separate "Update" tap first, matching the read-and-correct-in-place
// pattern the rest of this wizard uses too.
export function PatientConfirmScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const dobRef = useRef<HTMLInputElement | null>(null);
  const age = formatAgeFromDob(state.personal.dob);
  const dobDisplay = formatDobDisplay(state.personal.dob);
  const summaryLine = [age, dobDisplay ? `DOB ${dobDisplay}` : ""].filter(Boolean).join(" · ");

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>
        {state.reviewingFromPatientReview ? "Review patient information" : state.reviewingFromSuccess ? REVIEW_TITLE.patientReview : "Patient information · Step 1 of 6"}
      </Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Let&apos;s confirm the patient&apos;s information</ScreenTitle>
      <ScreenCopy className="mb-6">We&apos;ve pre-filled what we have from your appointment. Review and update anything that&apos;s changed.</ScreenCopy>

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

        <SplitDobField value={state.personal.dob} onChange={(v) => update((s) => ({ personal: { ...s.personal, dob: v } }))} fieldRef={dobRef} />

        <div className="mt-4">
          <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">
            Sex assigned at birth <span className="text-[var(--iv2-danger)]">*</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SEX_OPTIONS.map((opt) => (
              <OptionPill key={opt} label={opt} selected={state.sexAssignedAtBirth === opt} onClick={() => update({ sexAssignedAtBirth: opt })} />
            ))}
          </div>
        </div>
      </Card>

      <button
        type="button"
        onClick={() => dobRef.current?.focus()}
        className="mt-4 cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
      >
        Edit patient information
      </button>
    </div>
  );
}
