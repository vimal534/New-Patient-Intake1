"use client";

import { Ctx } from "../../ctx";
import { ETHNICITY_OPTIONS, HOME_LANGUAGE_OPTIONS, RACE_OPTIONS } from "../../constants";
import { Eyebrow, OptionPill, ScreenCopy, ScreenTitle, SelectField } from "../ui";

const SEX_OPTIONS = ["Male", "Female"];

// Patient Information wizard — Step 5 of 6. Entirely deferrable (its
// footer's "I'll complete this later" is as valid as "Continue" — see
// page.tsx's footerFor) — nothing here blocks the rest of the intake,
// unlike Step 1's own sex-assigned-at-birth pill (still required
// there, since that one small fact is needed clinically right away).
export function PatientDemographicsScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{state.reviewingFromPatientReview ? "Review demographics" : "Demographics · Step 5 of 6"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Tell us a little more about you</ScreenTitle>
      <ScreenCopy className="mb-6">These details help us provide the best care. Some may be pre-filled from your records.</ScreenCopy>

      <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">Sex assigned at birth</div>
      <div className="mb-3.5 flex flex-wrap gap-2.5">
        {SEX_OPTIONS.map((opt) => (
          <OptionPill key={opt} label={opt} selected={state.sexAssignedAtBirth === opt} onClick={() => update({ sexAssignedAtBirth: opt })} />
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        <SelectField label="Race" value={state.race} options={RACE_OPTIONS} placeholder="Optional" onChange={(v) => update({ race: v })} />
        <SelectField label="Ethnicity" value={state.ethnicity} options={ETHNICITY_OPTIONS} placeholder="Optional" onChange={(v) => update({ ethnicity: v })} />
        <SelectField
          label="Preferred language"
          value={state.preferredLanguage}
          options={HOME_LANGUAGE_OPTIONS}
          placeholder="Optional"
          onChange={(v) => update({ preferredLanguage: v })}
        />
      </div>
    </div>
  );
}
