"use client";

import { Ctx } from "../../ctx";
import { GUARDIAN_RELATIONSHIP_OPTIONS } from "../../constants";
import { InfoIcon } from "../Icons";
import { EmailField, PhoneField } from "../SmartField";
import { Card, InfoNote, InputField, OptionRow, ScreenCopy, ScreenTitle } from "../ui";

// Patient Information wizard — Step 2 of 3. A plain guardian-info
// form — guardian1's name/relationship/phone (all already known from
// scheduling, same as Step 1's patient basics) plus the guardian's
// email, directly editable, no separate confirm-then-edit gate.
// There's no ID-scan step anymore (removed per product direction), so
// this is simply "tell us about the parent or guardian," never framed
// as something read off a scanned card. No DOB/ID-number/issuing-state/
// expiration fields either (dropped per product direction — this
// screen is about how to reach the guardian, not verifying their ID).
export function GuardianIdReviewScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const setGuardian1 = (patch: Partial<import("../../types").Guardian>) => update((s) => ({ guardian1: { ...s.guardian1, ...patch } }));
  const setEmail = (email: string) => update((s) => ({ personal: { ...s.personal, email } }));
  const firstName = state.scheduling.patientName.split(" ")[0] || "the patient";

  return (
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Tell us about {firstName}&apos;s guardian</ScreenTitle>
      <ScreenCopy className="mb-6">We&apos;ve pre-filled this from your appointment. Review and update anything that&apos;s changed.</ScreenCopy>

      <Card>
        <div className="flex flex-col gap-4">
          <InputField label="Full name" value={state.guardian1.name} placeholder="Full name" onChange={(v) => setGuardian1({ name: v })} />
          <OptionRow
            label={`Relationship to ${firstName}`}
            value={state.guardian1.relationship}
            options={GUARDIAN_RELATIONSHIP_OPTIONS}
            onChange={(v) => setGuardian1({ relationship: v, ...(v !== "Other" ? { relationshipOther: "" } : {}) })}
          />
          {state.guardian1.relationship === "Other" && (
            <InputField
              label="Please specify"
              value={state.guardian1.relationshipOther || ""}
              placeholder="Relationship"
              onChange={(v) => setGuardian1({ relationshipOther: v })}
            />
          )}
          <PhoneField label="Phone number" value={state.guardian1.mobile} onChange={(v) => setGuardian1({ mobile: v })} />
          <EmailField label="Email address" value={state.personal.email} onChange={setEmail} />
        </div>
      </Card>

      <div className="mt-4">
        <InfoNote>
          <InfoIcon size={22} color="var(--iv2-brand)" />
          <div className="text-sm leading-[1.5] text-[var(--iv2-text-primary)]">
            We&apos;ll use this information to contact you about appointments, care updates, and important notifications.
          </div>
        </InfoNote>
      </div>
    </div>
  );
}
