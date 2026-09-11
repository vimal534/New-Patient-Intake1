"use client";

import { useRef } from "react";
import { Ctx } from "../../ctx";
import { US_STATE_OPTIONS } from "../../constants";
import { formatDob } from "../../format";
import { UserIcon } from "../Icons";
import { SplitDobField } from "../SmartField";
import { Card, Eyebrow, InputField, ScreenCopy, ScreenTitle, SelectField } from "../ui";

// Patient Information wizard — Step 3 of 6, the parsed result of Step
// 2's ID scan (or, if the patient chose "Enter details manually"
// there, the same fields simply start blank with no "From ID" badge).
// Every field stays directly editable — no separate confirm-then-edit
// gate, same as every other step in this wizard.
export function GuardianIdReviewScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const setGuardian1 = (patch: Partial<import("../../types").Guardian>) => update((s) => ({ guardian1: { ...s.guardian1, ...patch } }));
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{state.reviewingFromPatientReview ? "Review identity verification" : "Identity verification · Step 3 of 6"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">We found this information</ScreenTitle>
      <ScreenCopy className="mb-6">
        {state.guardianIdManual ? "Enter the parent or guardian's details below." : "Please confirm the details from Maria's ID. You can edit anything that's incorrect."}
      </ScreenCopy>

      <div ref={cardRef}>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
              <UserIcon size={20} color="var(--iv2-brand)" />
            </span>
            <div>
              <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Parent / guardian</div>
              <div className="mt-0.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.guardian1.name}</div>
            </div>
          </div>
          {!state.guardianIdManual ? (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: "var(--iv2-success-surface)", color: "var(--iv2-success)" }}>
              From ID
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3.5">
          <InputField label="Full name" value={state.guardian1.name} placeholder="Full name" onChange={(v) => setGuardian1({ name: v })} />
          <SplitDobField label="Date of birth" value={state.guardian1.dob ?? ""} onChange={(v) => setGuardian1({ dob: v })} />
          <InputField
            label="ID number (optional)"
            value={state.guardianIdNumber}
            placeholder="TX-D447091523"
            onChange={(v) => update({ guardianIdNumber: v })}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <SelectField
                label="Issuing state"
                value={state.guardianIdIssuingState}
                options={US_STATE_OPTIONS}
                placeholder="Select"
                onChange={(v) => update({ guardianIdIssuingState: v })}
              />
            </div>
            <div className="flex-1">
              <InputField
                label="Expiration date"
                value={state.guardianIdExpiration}
                placeholder="MM/DD/YYYY"
                inputMode="numeric"
                onChange={(v) => update({ guardianIdExpiration: formatDob(v) })}
              />
            </div>
          </div>
        </div>
      </Card>
      </div>

      <button
        type="button"
        onClick={() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="mt-4 cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
      >
        I&apos;ll update this information
      </button>
    </div>
  );
}
