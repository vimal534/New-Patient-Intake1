"use client";

import { Ctx } from "../../ctx";
import { EMERGENCY_RELATIONSHIP_OPTIONS } from "../../constants";
import { PhoneField } from "../SmartField";
import { Card, InputField, OptionRow, ScreenCopy, ScreenTitle } from "../ui";

// Patient Information wizard — Step 3 of 3, the wizard's last step —
// fully deferrable, "I'll add this later" is as valid as "Continue".
// Leads straight into Health History once done (see FLOW_NEW_INFANT/
// FLOW_NEW_ADOLESCENT in constants.ts — no Demographics step, no
// separate wizard-ending review screen).
export function PatientEmergencyScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const firstName = state.scheduling.patientName.split(" ")[0] || "the patient";

  return (
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Emergency contact</ScreenTitle>
      <ScreenCopy className="mb-6">Who should we contact in an emergency for {firstName}?</ScreenCopy>

      <Card>
        <div className="flex flex-col gap-3.5">
          <InputField
            label="Full name"
            value={state.emergency.name}
            placeholder="Carlos Gonzalez"
            onChange={(v) => update((s) => ({ emergency: { ...s.emergency, name: v } }))}
          />
          <OptionRow
            label={`Relationship to ${firstName}`}
            value={state.emergency.relation}
            options={EMERGENCY_RELATIONSHIP_OPTIONS}
            onChange={(v) => update((s) => ({ emergency: { ...s.emergency, relation: v } }))}
          />
          <PhoneField
            label="Phone"
            placeholder="(555) 123-4567"
            value={state.emergency.phone}
            onChange={(v) => update((s) => ({ emergency: { ...s.emergency, phone: v } }))}
          />
        </div>
      </Card>
    </div>
  );
}
