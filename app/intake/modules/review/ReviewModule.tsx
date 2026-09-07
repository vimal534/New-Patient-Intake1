"use client";

import { useState } from "react";
import { mockIntakeSubmissionSource } from "../../lib/data-source/mockAdapter";
import {
  AllergyIntoleranceDraft,
  DemographicsRecordDraft,
  GuarantorRecordDraft,
  GuardianRecordDraft,
  InsuranceRecordDraft,
  MedicationStatementDraft,
  ReasonForVisitDraft,
  SogiRecordDraft,
} from "../../lib/data-source/types";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";
import { SummaryCard } from "../../components/shared/SummaryCard";

// The step keys this Review screen can send the guardian back to. A subset
// of app/page.tsx's own Step union — TypeScript's structural typing lets
// page.tsx's setStep (which accepts the full Step union, a superset) fill
// this prop without either file importing the other's types.
export type EditableStep =
  | "demographics"
  | "sogi"
  | "guardian"
  | "insurance"
  | "guarantor"
  | "reasonForVisit"
  | "medications"
  | "allergies";

// Known v1 limitation (flagged here and in docs/architecture.md): jumping
// back to a section via Edit re-mounts that module fresh — none of the
// eight modules accept an initialValue/prefill prop yet, so the section
// restarts blank rather than reopening with what was already entered.
// Retrofitting every module with resumable state is real, cross-cutting
// work; this pass ships the review/summary/submit flow itself (the part
// the spec actually asked for) and flags the gap explicitly rather than
// silently pretending Edit resumes in place.

export function ReviewModule({
  patientId,
  demographics,
  demographicsMatched,
  sogi,
  guardian,
  guardianMatched,
  insurance,
  guarantor,
  reasonForVisit,
  medications,
  allergies,
  onEdit,
  onSubmit,
}: {
  patientId: string;
  demographics: DemographicsRecordDraft | null;
  demographicsMatched: boolean;
  sogi: SogiRecordDraft;
  guardian: GuardianRecordDraft | null;
  guardianMatched: boolean;
  insurance: InsuranceRecordDraft | null;
  guarantor: GuarantorRecordDraft | null;
  reasonForVisit: ReasonForVisitDraft | null;
  medications: MedicationStatementDraft[];
  allergies: AllergyIntoleranceDraft[];
  onEdit: (step: EditableStep) => void;
  onSubmit: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    await mockIntakeSubmissionSource.submitIntake(patientId, {
      demographics,
      sogi,
      guardian,
      insurance,
      guarantor,
      reasonForVisit,
      medications,
      allergies,
    });
    setSubmitting(false);
    onSubmit();
  }

  return (
    <SectionShell status="active" title="Review & submit">
      <div className="text-sm text-[var(--color-muted)]">
        Take a look before you submit — tap Edit on anything that needs a change.
      </div>

      <div className="space-y-2">
        <SummaryCard title="Demographics" onFile={demographicsMatched} onEdit={() => onEdit("demographics")}>
          {demographics ? (
            <>
              {demographics.firstName} {demographics.lastName} · DOB {demographics.dob}
              <br />
              {demographics.phone} · {demographics.email}
              <br />
              {demographics.address.line1}, {demographics.address.city}, {demographics.address.state}{" "}
              {demographics.address.zip}
              <br />
              {demographics.race.join(", ") || "—"} · {demographics.ethnicity.join(", ") || "—"} ·{" "}
              {demographics.preferredLanguage || "—"}
              <br />
              Contact: call {demographics.consent.phoneCall ? "OK" : "not OK"}, text {demographics.consent.text ? "OK" : "not OK"}
            </>
          ) : (
            "Not completed"
          )}
        </SummaryCard>

        <SummaryCard title="Additional patient info" onEdit={() => onEdit("sogi")}>
          {sogi ? (
            <>
              Sex assigned at birth: {sogi.sexAtBirth}
              <br />
              Gender identity: {sogi.genderIdentity}
              <br />
              Pronouns: {sogi.pronouns}
              <br />
              Sexual orientation: {sogi.sexualOrientation}
            </>
          ) : (
            "Skipped"
          )}
        </SummaryCard>

        <SummaryCard title="Guardian" onFile={guardianMatched} onEdit={() => onEdit("guardian")}>
          {guardian ? (
            <>
              {guardian.guardian.name} · {guardian.guardian.relationship} · {guardian.guardian.phone}
              <br />
              Authorized to consent to treatment: {guardian.legalGuardianConsent ? "Yes" : "No"}
              <br />
              Secondary contact:{" "}
              {guardian.secondaryContact
                ? `${guardian.secondaryContact.name} (${guardian.secondaryContact.relationship})`
                : "None"}
            </>
          ) : (
            "Not completed"
          )}
        </SummaryCard>

        <SummaryCard title="Insurance" onEdit={() => onEdit("insurance")}>
          {insurance ? (
            <>
              {insurance.payerName.notProvided ? "Insurance company: not provided" : `Insurance company: ${insurance.payerName.value}`}
              <br />
              {insurance.memberId.notProvided ? "Member ID: not provided" : `Member ID: ${insurance.memberId.value}`}
              <br />
              {insurance.groupId.notProvided ? "Group ID: not provided" : `Group ID: ${insurance.groupId.value}`}
              <br />
              Subscriber: {insurance.subscriberName} ({insurance.patientRelationToSubscriber})
              {insurance.ocrConfidence !== null ? (
                <>
                  <br />
                  Scanned from card ({Math.round(insurance.ocrConfidence * 100)}% confidence)
                </>
              ) : null}
            </>
          ) : (
            "Not completed"
          )}
        </SummaryCard>

        <SummaryCard title="Guarantor" onEdit={() => onEdit("guarantor")}>
          {guarantor ? (
            <>
              {guarantor.guarantor.name} · {guarantor.guarantor.relationship} · {guarantor.guarantor.phone}
              <br />
              Billing address: {guarantor.billingSameAsHousehold ? "same as on file" : "separate address on file"}
            </>
          ) : (
            "Not completed"
          )}
        </SummaryCard>

        <SummaryCard title="Reason for visit" onEdit={() => onEdit("reasonForVisit")}>
          {reasonForVisit ? (
            <>
              {[...reasonForVisit.reasons, reasonForVisit.otherText ? `Other: ${reasonForVisit.otherText}` : null]
                .filter(Boolean)
                .join(", ") || "—"}
              {reasonForVisit.injuryDetails ? (
                <>
                  <br />
                  Injury: {reasonForVisit.injuryDetails.bodyPart}, {reasonForVisit.injuryDetails.when}
                </>
              ) : null}
            </>
          ) : (
            "Not completed"
          )}
        </SummaryCard>

        <SummaryCard title="Medications" onEdit={() => onEdit("medications")}>
          {medications.length > 0
            ? medications.map((m) => `${m.medicationName} (${m.dose ?? "dose not sure"}, ${m.frequency ?? "frequency not sure"})`).join("; ")
            : "None reported"}
        </SummaryCard>

        <SummaryCard title="Allergies" onEdit={() => onEdit("allergies")}>
          {allergies.length > 0
            ? allergies.map((a) => `${a.allergenName} (${a.reaction ?? "reaction not sure"}, ${a.severity ?? "severity not sure"})`).join("; ")
            : "None known"}
        </SummaryCard>
      </div>

      <PrimaryButton disabled={submitting} onClick={handleSubmit}>
        {submitting ? "Submitting…" : "Confirm & submit"}
      </PrimaryButton>
    </SectionShell>
  );
}
