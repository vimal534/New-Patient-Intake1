"use client";

import { Ctx } from "../../ctx";
import { InfoIcon } from "../Icons";
import { Card, Divider, InfoNote, LabelValueRow, ScreenCopy, ScreenTitle } from "../ui";

const DIVIDER_COLOR = "#dde5f0";

// "MM/DD/YYYY" → "Jun 12, 2026" — deterministic given the string
// itself (not the current date), so safe to call during render.
function formatDobDisplay(dob: string): string {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// First + last initial ("Emma Rodriguez" → "ER") for the identity
// avatar — falls back to just the first letter for a single-word name.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Patient Information wizard — Step 1 of 3. Everything on this card is
// already known before the patient ever sees it — the basics from the
// appointment record, the guarantor from scheduling, and (once set
// later in the wizard) the emergency contact — so it's one combined
// read-only confirmation card, each fact its own label-left/value-right
// row, rather than a form the patient fills in field by field.
// Guarantor is always known by this point; emergency contact is
// collected later in the wizard (Step 3) and simply reads "Not added
// yet" here until it is.
export function PatientConfirmScreen({ ctx }: { ctx: Ctx }) {
  const { state } = ctx;
  const dobDisplay = formatDobDisplay(state.personal.dob);
  const guarantorValue = state.guardian1.name || "—";
  const emergencyValue = state.emergency.name.trim() ? (
    state.emergency.name
  ) : (
    <span className="text-[15px] font-normal normal-case text-[var(--iv2-text-muted)]">Not added yet</span>
  );

  return (
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Let&apos;s confirm the patient&apos;s information</ScreenTitle>
      <ScreenCopy className="mb-6">We&apos;ve pre-filled this from your appointment. Let us know if anything looks wrong.</ScreenCopy>

      <Card>
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
            <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">New Patient</div>
          </div>
        </div>

        <Divider className="my-4" style={{ backgroundColor: DIVIDER_COLOR }} />

        <div className="flex flex-col">
          <LabelValueRow label="Date of birth" value={dobDisplay || state.personal.dob} />
          <Divider className="my-3" style={{ backgroundColor: DIVIDER_COLOR }} />
          <LabelValueRow label="Sex assigned at birth" value={state.sexAssignedAtBirth || "—"} />
          <Divider className="my-3" style={{ backgroundColor: DIVIDER_COLOR }} />
          <LabelValueRow label="Guarantor" value={guarantorValue} />
          <Divider className="my-3" style={{ backgroundColor: DIVIDER_COLOR }} />
          <LabelValueRow label="Emergency contact" value={emergencyValue} />
        </div>
      </Card>

      <div className="mt-4">
        <InfoNote>
          <InfoIcon size={28} color="var(--iv2-brand)" />
          <div className="text-[15px] leading-[1.5] text-[var(--iv2-text-primary)]">
            This information is read-only here. Let your care team know at check-in if anything needs to change.
          </div>
        </InfoNote>
      </div>
    </div>
  );
}
