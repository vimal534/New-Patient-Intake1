"use client";

import { Ctx } from "../../ctx";
import { InfoIcon } from "../Icons";
import { DobPickerField, SexOptionsField } from "../PatientFields";
import { FORM_LABEL, InfoNote, OptionPill, ScreenCopy, ScreenTitle } from "../ui";

// First + last initial ("Emma Rodriguez" → "ER") for the identity
// avatar — falls back to just the first letter for a single-word name.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Every reason the booking flows use, plus a few common ones, so the
// patient can correct a wrong pre-filled reason by picking another.
const REASON_OPTIONS = ["Sick Visit", "Well Visit", "New Patient Visit", "Follow-up Visit", "Sports Pre-Participation Physical", "Vaccination"];

// Patient Information wizard — Step 1 of 3. Everything here is
// pre-filled from the appointment record, but every field is editable
// in case something is wrong: date of birth opens the wheel picker,
// gender and reason for visit are tap-to-pick options.
export function PatientConfirmScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const reason = state.scheduling.reason;
  // The pre-filled reason always appears as an option, even if it's not
  // one of the stock ones, so it can be re-selected after switching away.
  const reasonOptions = REASON_OPTIONS.includes(reason) || !reason ? REASON_OPTIONS : [reason, ...REASON_OPTIONS];

  return (
    <div className="min-h-full bg-[var(--iv2-surface)] px-6 pt-5 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Let&apos;s confirm the patient&apos;s information</ScreenTitle>
      <ScreenCopy className="mb-6">We&apos;ve pre-filled this from your appointment. Update anything that looks wrong.</ScreenCopy>

      <div>
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[19px] font-bold text-white"
            style={{ background: "var(--iv2-brand-gradient)" }}
            aria-hidden
          >
            {initialsOf(state.scheduling.patientName)}
          </span>
          <div>
            <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.scheduling.patientName}</div>
            <div className="mt-1.5 inline-flex rounded-full bg-[var(--iv2-brand-tint)] px-3 py-1 text-[13px] font-semibold text-[var(--iv2-brand)]">
              New Patient
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8">
          <DobPickerField value={state.personal.dob} onChange={(v) => update((s) => ({ personal: { ...s.personal, dob: v } }))} />

          <SexOptionsField value={state.sexAssignedAtBirth} onChange={(v) => update({ sexAssignedAtBirth: v })} />

          <div>
            <div className={`mb-3 ${FORM_LABEL}`}>Reason for visit</div>
            <div className="grid grid-cols-2 gap-2.5">
              {reasonOptions.map((opt) => (
                <OptionPill
                  key={opt}
                  label={opt}
                  selected={reason === opt}
                  onClick={() => update((s) => ({ scheduling: { ...s.scheduling, reason: opt } }))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <InfoNote>
          <InfoIcon size={26} />
          <div className="text-[15px] leading-[1.5] text-[var(--iv2-brand)]">Tap any field to change it. Your care team will confirm the details at check-in.</div>
        </InfoNote>
      </div>
    </div>
  );
}
