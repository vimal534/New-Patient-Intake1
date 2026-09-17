"use client";

import { useEffect, useRef } from "react";
import { Ctx } from "../../ctx";
import { POLICYHOLDER_RELATIONSHIPS, POLICYHOLDER_SCENARIOS } from "../../constants";
import { formatDob } from "../../format";
import { InsuranceBrandIcon } from "../Icons";
import { CheckIcon, InputField, OptionPill, ScreenCopy, ScreenTitle, SelectField } from "../ui";

// Apple-style wheel-picker feel via the app's own shared dropdown
// trigger (SelectField) — three short lists (Month/Day/Year) instead
// of the free-text SplitDobField, since a policyholder is filled in
// rarely enough that recognizing a value beats typing digits.
// Abbreviated (not full month names) — this select sits in a
// three-column row next to Day/Year, and a full name like "September"
// truncates inside that narrow a trigger.
const DOB_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOB_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
// Static range (not derived from `new Date()`) so server and client
// render the same list — same anchor/length as the surgery date
// picker (HealthCategoryEditors.tsx), which covers any patient alive
// today.
const DOB_YEARS = Array.from({ length: 111 }, (_, i) => String(2030 - i));

function PolicyholderDobFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  const month = mm && Number(mm) >= 1 && Number(mm) <= 12 ? DOB_MONTHS[Number(mm) - 1] : "";
  const day = dd ? String(Number(dd)) : "";

  const combine = (nextMonth: string, nextDay: string, nextYear: string) => {
    const mmDigits = nextMonth ? String(DOB_MONTHS.indexOf(nextMonth) + 1).padStart(2, "0") : "";
    const ddDigits = nextDay ? nextDay.padStart(2, "0") : "";
    return formatDob(`${mmDigits}${ddDigits}${nextYear}`);
  };

  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">Date of birth</div>
      <div className="grid grid-cols-3 gap-2">
        <SelectField ariaLabel="Birth month" value={month} onChange={(v) => onChange(combine(v, day, yyyy))} options={DOB_MONTHS} placeholder="Month" />
        <SelectField ariaLabel="Birth day" value={day} onChange={(v) => onChange(combine(month, v, yyyy))} options={DOB_DAYS} placeholder="Day" />
        <SelectField ariaLabel="Birth year" value={yyyy} onChange={(v) => onChange(combine(month, day, v))} options={DOB_YEARS} placeholder="Year" />
      </div>
    </div>
  );
}

// Is the policyholder question (new-patient minors only) answered
// enough to actually run an eligibility check with? "Yes" needs
// nothing further — the guardian is already on file. "No" needs the
// policyholder's own name/DOB/relationship, since eligibility can't
// be checked against an unknown person.
function policyholderResolved(state: Ctx["state"]) {
  if (state.policyholderIsGuardian === true) return true;
  if (state.policyholderIsGuardian === false) {
    return state.policyholderName.trim().length > 0 && state.policyholderDob.length === 10 && state.policyholderRelationship.trim().length > 0;
  }
  return false;
}

// Screen 7 — Coverage read (OCR review), step 2 of 2. A blurry photo
// is caught at capture time (CoverageScreen.tsx's "Retake photo"
// prompt) rather than here — by the time the patient reaches this
// screen every field, Group included, renders as a plain read-only
// row (README: "do not ask the patient to re-verify fields the OCR
// was confident about"). "Update" still flips all of them into
// editable inputs at once if something genuinely needs a correction.
//
// Order matters for new-patient minors: card read → "Is [guardian]
// the policyholder?" → eligibility check. We only know who to check
// eligibility for once that question is answered, so the "Coverage
// verified" panel doesn't start (or render) until then — asking a
// question that's needed for verification AFTER already declaring
// coverage verified would read as contradictory. Reuse known data
// first (the guardian is already on file), ask only for what's
// actually missing (a different policyholder's info), and don't run
// (or show) a check that isn't ready to run yet.
export function OcrScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const manual = state.manualEntry;
  const needsPolicyholder = POLICYHOLDER_SCENARIOS.includes(state.demoScenarioId);
  const readyForEligibility = !needsPolicyholder || policyholderResolved(state);
  const eligibilityRef = useRef<HTMLDivElement | null>(null);
  const wasReadyRef = useRef(readyForEligibility);

  useEffect(() => {
    if (!manual && readyForEligibility && state.eligibility === "idle") ctx.startEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, readyForEligibility, state.eligibility]);

  // The moment the policyholder question is answered (e.g. picking
  // the last field — Relationship — on the "No" branch), the
  // "Coverage verified" panel appears below the fold. Scroll it into
  // view automatically rather than leaving the patient to notice and
  // scroll down themselves.
  useEffect(() => {
    if (!manual && needsPolicyholder && readyForEligibility && !wasReadyRef.current) {
      requestAnimationFrame(() => eligibilityRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    }
    wasReadyRef.current = readyForEligibility;
  }, [manual, needsPolicyholder, readyForEligibility]);

  return (
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle>{manual ? "Enter your insurance details" : "Insurance"}</ScreenTitle>
      <ScreenCopy className="mb-6">
        {manual
          ? "Add the details from the front of your card."
          : "We read your card and are checking the coverage with your payer while you finish the rest of the form."}
      </ScreenCopy>

      {manual ? (
        <div>
          <div className="flex flex-col gap-3.5 rounded-[20px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] p-6 transition-shadow duration-150 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <InputField label="Insurance carrier" value={state.carrier} placeholder="Blue Shield" onChange={(v) => update({ carrier: v })} />
            <InputField label="Member ID" value={state.memberId} placeholder="VZ48213" onChange={(v) => update({ memberId: v })} />
            <InputField label="Group number" value={state.groupValue} placeholder="00921" onChange={(v) => update({ groupValue: v })} />
          </div>
          {needsPolicyholder ? <PolicyholderQuestion ctx={ctx} /> : null}
        </div>
      ) : (
        <div>
          <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] transition-shadow duration-150 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="p-5">
              <div className="flex items-center gap-3.5">
                <InsuranceBrandIcon />
                {state.ocrFieldsEditing ? (
                  <div className="min-w-0 flex-1">
                    <InputField
                      ariaLabel="Insurance carrier"
                      value={state.carrier}
                      placeholder="Blue Shield PPO"
                      onChange={(v) => update({ carrier: v })}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-[var(--iv2-text-primary)]">{state.carrier || "Blue Shield PPO"}</div>
                    <div className="text-[15px] text-[var(--iv2-text-secondary)]">Medical Insurance</div>
                  </div>
                )}
              </div>

              <div className="my-4 h-px bg-[var(--iv2-border-subtle)]" />

              <div className="flex flex-col gap-3.5">
                {state.ocrFieldsEditing ? (
                  <InputField label="Member" value={state.memberName} placeholder="Jane Doe" onChange={(v) => update({ memberName: v })} />
                ) : (
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="shrink-0 text-[15px] text-[var(--iv2-text-secondary)]">Member</div>
                    <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.memberName || "Jane Doe"}</div>
                  </div>
                )}
                {state.ocrFieldsEditing ? (
                  <InputField label="Member ID" value={state.memberId} placeholder="VZ48213" onChange={(v) => update({ memberId: v })} />
                ) : (
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="shrink-0 text-[15px] text-[var(--iv2-text-secondary)]">Member ID</div>
                    <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.memberId || "VZ48213"}</div>
                  </div>
                )}

                {state.ocrFieldsEditing ? (
                  <InputField label="Group number" value={state.groupValue} placeholder="00921" onChange={(v) => update({ groupValue: v })} />
                ) : (
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="shrink-0 text-[15px] text-[var(--iv2-text-secondary)]">Group number</div>
                    <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.groupValue || "00921"}</div>
                  </div>
                )}
              </div>

              <div className="my-4.5 h-px bg-[var(--iv2-border-subtle)]" />
              <button
                type="button"
                onClick={() => {
                  update({ groupFixed: false, scanBlurry: false, scanRetried: false });
                  ctx.go("coverage");
                }}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[var(--iv2-brand)]"
              >
                Re-scan card
              </button>
            </div>
          </div>

          {needsPolicyholder ? <PolicyholderQuestion ctx={ctx} /> : null}

          {readyForEligibility ? (
            <div ref={eligibilityRef} className="mt-3 flex items-start gap-3 rounded-2xl bg-[var(--iv2-success-surface)] p-4">
              {state.eligibility === "done" ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)]">
                  <CheckIcon size={13} color="#fff" strokeWidth={3} />
                </span>
              ) : (
                <span className="mt-0.5 h-6 w-6 shrink-0 animate-spin rounded-full border-[2.5px] border-[var(--iv2-success-border)] border-t-[var(--iv2-success)]" />
              )}
              <div>
                <div className="text-base font-bold text-[var(--iv2-success)]">
                  {state.eligibility === "done" ? "Coverage verified" : "Checking with Blue Shield…"}
                </div>
                <div className="mt-0.5 text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
                  {state.eligibility === "done"
                    ? "Blue Shield PPO is active for this visit. $40 office visit copay."
                    : "A few seconds. You can keep going with the rest of your check-in."}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// "Is [guardian] the policyholder?" — spec's Insurance Screen B for
// new-patient minors. "Yes" needs nothing further (the guardian is
// already on file from ParentGuardianScreen); "No" opens a
// "Policyholder information" section collecting that person's own
// name, date of birth, and relationship to the patient.
function PolicyholderQuestion({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const guardianName = state.guardian1.name.trim() || "your guardian";

  return (
    <div className="mt-3 rounded-2xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] p-4 transition-shadow duration-150 hover:shadow-[0_6px_16px_rgba(27,38,36,0.10)]">
      <div className="mb-2.5 text-base font-bold text-[var(--iv2-text-primary)]">Is {guardianName} the policyholder?</div>
      <div className="grid grid-cols-2 gap-2.5">
        <OptionPill
          label="Yes"
          selected={state.policyholderIsGuardian === true}
          onClick={() => update({ policyholderIsGuardian: true, policyholderName: "", policyholderDob: "", policyholderRelationship: "" })}
        />
        <OptionPill label="No" selected={state.policyholderIsGuardian === false} onClick={() => update({ policyholderIsGuardian: false })} />
      </div>
      {state.policyholderIsGuardian === false ? (
        <div className="mt-4">
          <div className="mb-3 text-sm font-bold text-[var(--iv2-text-primary)]">Policyholder information</div>
          <div className="flex flex-col gap-3.5">
            <InputField label="Full name" value={state.policyholderName} placeholder="Enter full name" onChange={(v) => update({ policyholderName: v })} />
            <PolicyholderDobFields value={state.policyholderDob} onChange={(v) => update({ policyholderDob: v })} />
            <div>
              <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">Relationship</div>
              <div className="grid grid-cols-2 gap-2.5">
                {POLICYHOLDER_RELATIONSHIPS.map((opt) => (
                  <OptionPill
                    key={opt}
                    label={opt}
                    selected={state.policyholderRelationship === opt}
                    onClick={() => update({ policyholderRelationship: opt })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
