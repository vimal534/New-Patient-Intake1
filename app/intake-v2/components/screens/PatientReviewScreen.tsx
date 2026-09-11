"use client";

import { Ctx } from "../../ctx";
import { FlowKey } from "../../types";
import { formatAgeFromDob } from "../../format";
import { ChevronRightIcon } from "../Icons";
import { CheckIcon, Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

function formatDobDisplay(dob: string): string {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Patient Information wizard — the final "You're all set!" screen (its
// own Step 6 of 6, alongside Emergency Contact — this isn't a further
// step so much as where Step 6 actually lands). One row per section
// covered by the six steps before it, each with an "Edit" link that
// jumps back into that step via `reviewPatientSection` — its footer
// there becomes "Save and return to review" (page.tsx's footerFor)
// instead of the normal onward Continue, landing back on this same
// screen rather than carrying on to Step 7's coverage/insurance step.
export function PatientReviewScreen({ ctx }: { ctx: Ctx }) {
  const { state, reviewPatientSection } = ctx;

  const rows: { label: string; lines: string[]; target: FlowKey }[] = [
    {
      label: "Patient information",
      lines: [state.scheduling.patientName, [formatAgeFromDob(state.personal.dob), `DOB ${formatDobDisplay(state.personal.dob)}`].filter(Boolean).join(" · ")],
      target: "patientConfirm",
    },
    {
      label: "Parent / guardian",
      lines: [state.guardian1.name, state.guardian1.relationship].filter(Boolean),
      target: "guardianIdReview",
    },
    {
      label: "Contact information",
      lines: [
        state.phoneOnFile,
        [state.personal.address, [state.personal.city, state.personal.state].filter(Boolean).join(", ")].filter(Boolean).join(", "),
      ].filter(Boolean),
      target: "patientContact",
    },
    {
      label: "Demographics",
      lines: [
        [state.sexAssignedAtBirth, state.race].filter(Boolean).join(" · "),
        state.ethnicity,
        state.preferredLanguage,
      ].filter(Boolean),
      target: "patientDemographics",
    },
    {
      label: "Emergency contact",
      lines: state.emergency.name.trim() ? [state.emergency.name, [state.emergency.relation, state.emergency.phone].filter(Boolean).join(" · ")] : [],
      target: "patientEmergency",
    },
  ];

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Review · Step 6 of 6</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">You&apos;re all set!</ScreenTitle>
      <ScreenCopy className="mb-6">Here&apos;s the information we have on file. You can still make changes by editing a section.</ScreenCopy>

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 rounded-2xl border border-[var(--iv2-border)] bg-white p-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
              <CheckIcon size={13} color="var(--iv2-success)" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">{row.label}</div>
              {row.lines.map((line, i) => (
                <div key={i} className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">
                  {line}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => reviewPatientSection(row.target)}
              className="flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
            >
              Edit
              <ChevronRightIcon size={14} color="var(--iv2-brand)" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
