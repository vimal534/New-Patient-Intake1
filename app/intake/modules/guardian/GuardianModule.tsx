"use client";

import { useState } from "react";
import { mockGuardianWriteSource } from "../../lib/data-source/mockAdapter";
import { GuardianRecordDraft, PatientRecord } from "../../lib/data-source/types";
import { ChipField } from "../../components/fields/Chip";
import { ConfirmOrEditSection, initialSectionState, SectionState } from "../../components/shared/ConfirmOrEditSection";
import { PrimaryButton, SectionShell, TextField } from "@/app/tap-intake/components/ui";

const RELATIONSHIP_OPTIONS = ["Parent", "Legal Guardian", "Grandparent", "Other"];

// Reuses the matched record Demographics already looked up — guardian info
// arrives bundled with the patient match, so this module doesn't re-query.
// `matchedPatient` is null on the no-match path, same "always editable, no
// dead end" behavior as Demographics' own sections.
export function GuardianModule({
  patientId,
  matchedPatient,
  onComplete,
}: {
  patientId: string;
  matchedPatient: PatientRecord | null;
  // Hands back this module's full saved answers — Guarantor reads
  // `.guardian` for its "Same as guardian" shortcut, Review reads the
  // whole thing for its summary.
  onComplete: (data: GuardianRecordDraft) => void;
}) {
  const guardianOnFile = matchedPatient?.guardian ?? null;

  const [name, setName] = useState(guardianOnFile?.name ?? "");
  const [relationship, setRelationship] = useState<string[]>(guardianOnFile ? [guardianOnFile.relationship] : []);
  const [phone, setPhone] = useState(guardianOnFile?.phone ?? "");
  const [email, setEmail] = useState("");

  const [guardianState, setGuardianState] = useState<SectionState>(initialSectionState(!!guardianOnFile));

  const [legalConsent, setLegalConsent] = useState<string | null>(null);
  const [wantsSecondary, setWantsSecondary] = useState<"Yes" | "No" | null>(null);
  const [secName, setSecName] = useState("");
  const [secRelationship, setSecRelationship] = useState<string[]>([]);
  const [secPhone, setSecPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const guardianDone = guardianState === "confirmed" || guardianState === "not_applicable";
  const canContinue = guardianDone && !!legalConsent && wantsSecondary !== null;

  async function handleContinue() {
    setSaving(true);
    const data: GuardianRecordDraft = {
      guardian: { name, relationship: relationship[0] ?? "", phone, email },
      legalGuardianConsent: legalConsent === "Yes",
      secondaryContact:
        wantsSecondary === "Yes" ? { name: secName, relationship: secRelationship[0] ?? "", phone: secPhone } : null,
    };
    await mockGuardianWriteSource.saveGuardian(patientId, data);
    setSaving(false);
    onComplete(data);
  }

  return (
    <SectionShell status="active" title="Guardian / dependent">
      <div className="text-sm text-[var(--color-muted)]">
        Who&apos;s completing this check-in, and how can we reach you if we need to?
      </div>

      <ConfirmOrEditSection
        title="Guardian info"
        state={guardianState}
        onLooksRight={() => setGuardianState("confirmed")}
        onEdit={() => setGuardianState("editing")}
        summary={`${name} · ${relationship[0] ?? ""} · ${phone}`}
      >
        <TextField label="Full name" value={name} onChange={setName} />
        <ChipField
          label="Relationship to patient"
          options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r }))}
          value={relationship}
          onChange={setRelationship}
          multi={false}
        />
        <TextField label="Phone" value={phone} onChange={setPhone} inputMode="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
      </ConfirmOrEditSection>

      {guardianDone ? (
        <>
          <ChipField
            label="Are you the legal guardian authorized to consent to treatment for this patient?"
            options={[
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No" },
            ]}
            value={legalConsent ? [legalConsent] : []}
            onChange={(v) => setLegalConsent(v[0] ?? null)}
            multi={false}
          />
          {legalConsent === "No" ? (
            <div className="rounded-lg border border-[var(--color-orange)] bg-[var(--color-orange)]/10 p-3 text-xs text-[var(--color-orange)]">
              A staff member will need to confirm consent-to-treat with an authorized guardian before the visit.
            </div>
          ) : null}

          <ChipField
            label="Add a secondary emergency contact?"
            options={[
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No, skip this" },
            ]}
            value={wantsSecondary ? [wantsSecondary] : []}
            onChange={(v) => setWantsSecondary((v[0] as "Yes" | "No") ?? null)}
            multi={false}
          />
          {wantsSecondary === "Yes" ? (
            <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-3">
              <TextField label="Full name" value={secName} onChange={setSecName} />
              <ChipField
                label="Relationship to patient"
                options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r }))}
                value={secRelationship}
                onChange={setSecRelationship}
                multi={false}
              />
              <TextField label="Phone" value={secPhone} onChange={setSecPhone} inputMode="tel" />
            </div>
          ) : null}
        </>
      ) : null}

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
