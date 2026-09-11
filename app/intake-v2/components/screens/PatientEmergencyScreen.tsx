"use client";

import { Ctx } from "../../ctx";
import { EMERGENCY_RELATIONSHIP_OPTIONS } from "../../constants";
import { PhoneField } from "../SmartField";
import { Eyebrow, InputField, ScreenCopy, ScreenTitle, SelectField } from "../ui";

// Patient Information wizard — Step 6 of 6. Same as Demographics —
// fully deferrable, "I'll add this later" is as valid as "Continue".
export function PatientEmergencyScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const firstName = state.scheduling.patientName.split(" ")[0] || "the patient";

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{state.reviewingFromPatientReview ? "Review emergency contact" : "Emergency contact · Step 6 of 6"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Emergency contact</ScreenTitle>
      <ScreenCopy className="mb-6">Who should we contact in an emergency for {firstName}?</ScreenCopy>

      <div className="flex flex-col gap-3.5">
        <InputField
          label="Full name"
          value={state.emergency.name}
          placeholder="Carlos Gonzalez"
          onChange={(v) => update((s) => ({ emergency: { ...s.emergency, name: v } }))}
        />
        <SelectField
          label={`Relationship to ${firstName}`}
          value={state.emergency.relation}
          options={EMERGENCY_RELATIONSHIP_OPTIONS}
          placeholder="Select"
          onChange={(v) => update((s) => ({ emergency: { ...s.emergency, relation: v } }))}
        />
        <PhoneField
          label="Phone"
          placeholder="(555) 123-4567"
          value={state.emergency.phone}
          onChange={(v) => update((s) => ({ emergency: { ...s.emergency, phone: v } }))}
        />
      </div>
    </div>
  );
}
