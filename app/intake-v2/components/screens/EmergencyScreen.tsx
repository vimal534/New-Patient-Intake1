"use client";

import { Ctx } from "../../ctx";
import { formatPhone } from "../../format";
import { Card, Eyebrow, InputField, ScreenCopy, ScreenTitle } from "../ui";

// Screen 4 — Emergency contact.
export function EmergencyScreen({ ctx }: { ctx: Ctx }) {
  const { state, isRet, update } = ctx;
  const known = isRet && !state.emergencyUpdating;
  const form = !isRet || state.emergencyUpdating;

  return (
    <div className="px-6 py-6">
      <Eyebrow>Emergency contact</Eyebrow>
      <ScreenTitle>{known ? "Is this still your emergency contact?" : "Who should we contact?"}</ScreenTitle>
      <ScreenCopy className="mb-6">
        {known ? "We have this contact on file." : "One person we can reach in an emergency."}
      </ScreenCopy>

      {known ? (
        <Card>
          <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">Linda Doe</div>
          <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Mother</div>
          <div className="mt-2.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">(555) 234-8891</div>
        </Card>
      ) : null}

      {form ? (
        <div className="flex flex-col gap-3">
          <InputField
            label="Full name"
            value={state.emergency.name}
            placeholder="Linda Doe"
            onChange={(v) => update((s) => ({ emergency: { ...s.emergency, name: v } }))}
          />
          <InputField
            label="Relationship"
            value={state.emergency.relation}
            placeholder="Mother"
            onChange={(v) => update((s) => ({ emergency: { ...s.emergency, relation: v } }))}
          />
          <InputField
            label="Mobile"
            value={state.emergency.phone}
            placeholder="(555) 234-8891"
            inputMode="tel"
            onChange={(v) => update((s) => ({ emergency: { ...s.emergency, phone: formatPhone(v) } }))}
          />
        </div>
      ) : null}
    </div>
  );
}
