"use client";

import { Ctx } from "../../ctx";
import { GUARDIAN_RELATIONSHIP_OPTIONS } from "../../constants";
import { CheckIcon, PencilIcon } from "../Icons";
import { DobPickerField, LockedField, SexOptionsField } from "../PatientFields";
import { PhoneField } from "../SmartField";
import { InputField, OptionRow, ScreenCopy, ScreenTitle, ValueRow } from "../ui";

type SectionKey = "identity" | "contact" | "guardian";
const SECTION_ORDER: SectionKey[] = ["identity", "contact", "guardian"];
const SECTION_TITLE: Record<SectionKey, string> = {
  identity: "Patient information",
  contact: "Contact information",
  guardian: "Guardian information",
};

// Confirm Your Information — spec Parts 4-5, item 3. Three sections
// (identity, contact, guardian), confirmed one at a time,
// accordion-style: only the earliest not-yet-confirmed section is
// interactive — and it opens straight into editable fields (no
// read-only view to unlock first), so "Looks right" confirms as-is
// and changing anything is just typing/tapping. The ones before it
// have collapsed to a checkmark summary (tap to reopen), the ones
// after sit as a greyed placeholder until their turn. Confirming the
// last section advances the flow directly; there's nothing left for
// the shared bottom footer to do (see page.tsx's footerFor,
// `key === "confirmInfo"`). Reviewing this screen from the final
// summary (SuccessScreen's checklist) bypasses that gating entirely —
// every section opens at once, since the patient came back to fix
// something specific, not to re-confirm in order — and the summary's
// own "Save and return" footer button is what exits, not a per-section
// "Looks right".
export function ConfirmInfoScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const g = state.guardian1;
  const confirmed = state.confirmInfoConfirmed;
  const reviewing = state.reviewingFromSuccess;

  const openSection: SectionKey | null = SECTION_ORDER.find((k) => !confirmed[k]) ?? null;
  const sectionState = (key: SectionKey): "confirmed" | "open" | "pending" => {
    if (reviewing) return "open";
    if (confirmed[key]) return "confirmed";
    return openSection === key ? "open" : "pending";
  };

  const confirmSection = (key: SectionKey) => {
    update((s) => ({ confirmInfoConfirmed: { ...s.confirmInfoConfirmed, [key]: true } }));
    if (key === SECTION_ORDER[SECTION_ORDER.length - 1]) ctx.next();
  };
  const reopenSection = (key: SectionKey) => update((s) => ({ confirmInfoConfirmed: { ...s.confirmInfoConfirmed, [key]: false } }));
  const setGuardian = (patch: Partial<typeof g>) => update((s) => ({ guardian1: { ...s.guardian1, ...patch } }));

  const summaryFor = (key: SectionKey): string => {
    if (key === "identity") return `${state.scheduling.patientName} · ${state.personal.dob || "DOB not on file"}`;
    if (key === "contact") return state.phoneOnFile;
    return `${g.name} · ${g.relationship || "Guardian"}`;
  };

  return (
    <div className="min-h-full bg-[var(--iv2-surface)] px-6 pt-5 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Is this still accurate?</ScreenTitle>
      <ScreenCopy className="mb-6">We have this on file from your last visit. Confirm each one, or update what&apos;s changed.</ScreenCopy>

      <div className="flex flex-col gap-3">
        {SECTION_ORDER.map((key) => {
          const status = sectionState(key);
          if (status === "confirmed") {
            return (
              <button
                key={key}
                type="button"
                onClick={() => reopenSection(key)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-[var(--iv2-surface)] p-4 text-left shadow-[var(--iv2-card-shadow)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
                  <CheckIcon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--iv2-success)] uppercase">{SECTION_TITLE[key]}</div>
                  <div className="mt-0.5 truncate text-[15px] font-semibold text-[var(--iv2-text-primary)]">{summaryFor(key)}</div>
                </div>
                <PencilIcon size={16} color="var(--iv2-text-muted)" />
              </button>
            );
          }

          if (status === "pending") {
            return (
              <div key={key} className="flex w-full items-center gap-3 rounded-2xl bg-[var(--iv2-surface-muted)] p-4 opacity-60">
                <span className="h-9 w-9 shrink-0 rounded-full border-[1.5px] border-[var(--iv2-border-strong)]" />
                <div className="text-[15px] font-semibold text-[var(--iv2-text-muted)]">{SECTION_TITLE[key]}</div>
              </div>
            );
          }

          return (
            <div key={key} className="py-2">
              <div className="mb-5 text-[11px] font-bold tracking-[0.06em] text-[var(--iv2-brand)] uppercase">{SECTION_TITLE[key]}</div>

              <div className="flex flex-col gap-8">
                {key === "identity" ? (
                  <>
                    <InputField
                      label="Name"
                      value={state.scheduling.patientName}
                      placeholder="Full name"
                      onChange={(v) => update((s) => ({ scheduling: { ...s.scheduling, patientName: v } }))}
                    />
                    <DobPickerField value={state.personal.dob} onChange={(v) => update((s) => ({ personal: { ...s.personal, dob: v } }))} />
                    <SexOptionsField label="Sex" value={state.sexAssignedAtBirth} onChange={(v) => update({ sexAssignedAtBirth: v })} />
                  </>
                ) : null}

                {key === "contact" ? (
                  <>
                    <LockedField label="Mobile" value={state.phoneOnFile} />
                    <InputField
                      label="Email"
                      value={state.personal.email}
                      placeholder="name@email.com"
                      inputMode="email"
                      onChange={(v) => update((s) => ({ personal: { ...s.personal, email: v } }))}
                    />
                    <InputField
                      label="Address"
                      value={state.personal.address}
                      placeholder="123 Main Street, Oakwood NY"
                      onChange={(v) => update((s) => ({ personal: { ...s.personal, address: v } }))}
                    />
                  </>
                ) : null}

                {key === "guardian" ? (
                  <>
                    <InputField label="Name" value={g.name} placeholder="Full name" onChange={(v) => setGuardian({ name: v })} />
                    <OptionRow
                      label="Relationship"
                      value={g.relationship}
                      options={GUARDIAN_RELATIONSHIP_OPTIONS}
                      onChange={(v) => setGuardian({ relationship: v, ...(v !== "Other" ? { relationshipOther: "" } : {}) })}
                    />
                    <PhoneField label="Mobile" value={g.mobile} onChange={(v) => setGuardian({ mobile: v })} />
                    <InputField label="Address" value={g.address} placeholder="123 Main Street, Oakwood NY" onChange={(v) => setGuardian({ address: v })} />
                  </>
                ) : null}
              </div>

              {!reviewing ? (
                <button
                  type="button"
                  onClick={() => confirmSection(key)}
                  className="mt-8 flex h-14 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-none bg-[var(--iv2-success)] text-base font-bold text-white"
                >
                  <CheckIcon size={14} color="#fff" /> Looks right
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => update({ additionalOpen: !state.additionalOpen })}
        className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-2xl border-none bg-[var(--iv2-surface)] p-4 shadow-[var(--iv2-card-shadow)] transition-shadow duration-150"
      >
        <span className="text-base font-semibold text-[var(--iv2-text-primary)]">Additional information</span>
        <span className="text-sm text-[var(--iv2-text-muted)]">{state.additionalOpen ? "−" : "+"}</span>
      </button>

      {state.additionalOpen ? (
        <div className="mt-2 flex flex-col gap-3.5 rounded-2xl bg-[var(--iv2-surface)] p-4 shadow-[var(--iv2-card-shadow)]">
          <ValueRow label="Preferred language" value="English" />
        </div>
      ) : null}
    </div>
  );
}
