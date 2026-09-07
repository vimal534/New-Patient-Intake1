"use client";

import { IntakeSnapshot } from "../../lib/data-source/localSnapshot";
import { SummaryCard } from "../../components/shared/SummaryCard";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// The returning-patient fast path: recognized on this device (via
// lib/data-source/localSnapshot.ts) as having completed intake before.
// Confirming here skips Demographics/SOGI/Guardian/Insurance/Guarantor
// entirely and jumps straight to Reason for Visit — the parts of intake
// that are genuinely visit-specific (why you're here today, current
// medications/allergies) still get asked fresh every time, same as any
// real front-desk check-in; only the administrative/billing data that
// rarely changes gets a "still accurate?" shortcut.
export function WelcomeBackModule({
  snapshot,
  onConfirm,
  onStartFresh,
}: {
  snapshot: IntakeSnapshot;
  onConfirm: () => void;
  onStartFresh: () => void;
}) {
  const { demographics, guardian, insurance, guarantor } = snapshot;

  return (
    <SectionShell status="active" title={`Welcome back, ${demographics.firstName}!`}>
      <div className="text-sm text-[var(--color-muted)]">
        Here&apos;s what we have on file from your last visit. Still accurate?
      </div>

      <div className="space-y-2">
        <SummaryCard title="Demographics">
          {demographics.firstName} {demographics.lastName} · DOB {demographics.dob}
          <br />
          {demographics.phone} · {demographics.email}
          <br />
          {demographics.address.line1}, {demographics.address.city}, {demographics.address.state}{" "}
          {demographics.address.zip}
        </SummaryCard>

        {guardian ? (
          <SummaryCard title="Guardian">
            {guardian.guardian.name} · {guardian.guardian.relationship} · {guardian.guardian.phone}
          </SummaryCard>
        ) : null}

        {insurance ? (
          <SummaryCard title="Insurance">
            {insurance.payerName.notProvided ? "Insurance company: not provided" : `Insurance company: ${insurance.payerName.value}`}
            <br />
            Subscriber: {insurance.subscriberName} ({insurance.patientRelationToSubscriber})
          </SummaryCard>
        ) : null}

        {guarantor ? (
          <SummaryCard title="Guarantor">
            {guarantor.guarantor.name} · {guarantor.guarantor.relationship}
          </SummaryCard>
        ) : null}
      </div>

      <PrimaryButton onClick={onConfirm}>Yes, this is still accurate</PrimaryButton>

      <button
        type="button"
        onClick={onStartFresh}
        className="min-h-[44px] w-full cursor-pointer text-center text-sm font-medium text-[var(--color-brand)]"
      >
        Something&apos;s changed — let&apos;s update it
      </button>
    </SectionShell>
  );
}
