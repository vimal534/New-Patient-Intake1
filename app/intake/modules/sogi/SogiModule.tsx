"use client";

import { useState } from "react";
import { ChipField } from "../../components/fields/Chip";
import { mockSogiWriteSource } from "../../lib/data-source/mockAdapter";
import { SogiRecordDraft } from "../../lib/data-source/types";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// Every question below carries "Don't know" and "Choose not to disclose"
// as regular options — same chip styling as every other answer, not
// visually de-emphasized. They're valid, equal-weight answers, not an
// escape hatch bolted on afterward.
const EQUAL_WEIGHT_TAIL = ["Don't know", "Choose not to disclose"];

const SEX_AT_BIRTH_OPTIONS = ["Male", "Female", "Intersex", ...EQUAL_WEIGHT_TAIL];
const GENDER_IDENTITY_OPTIONS = ["Male", "Female", "Transgender male", "Transgender female", "Non-binary", "Other", ...EQUAL_WEIGHT_TAIL];
const PRONOUN_OPTIONS = ["He/him", "She/her", "They/them", "Other", ...EQUAL_WEIGHT_TAIL];
const ORIENTATION_OPTIONS = ["Heterosexual", "Gay or lesbian", "Bisexual", "Other", ...EQUAL_WEIGHT_TAIL];

// Gated behind an explicit opt-in — this whole module is skippable in one
// tap, not just each question within it. Reuses tap-intake's
// SectionShell/PrimaryButton, same visual system as every other module.
export function SogiModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (data: SogiRecordDraft) => void;
}) {
  const [wantsToAdd, setWantsToAdd] = useState<"Yes" | "No" | null>(null);
  const [sexAtBirth, setSexAtBirth] = useState<string[]>([]);
  const [genderIdentity, setGenderIdentity] = useState<string[]>([]);
  const [pronouns, setPronouns] = useState<string[]>([]);
  const [orientation, setOrientation] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const allAnswered = sexAtBirth.length > 0 && genderIdentity.length > 0 && pronouns.length > 0 && orientation.length > 0;
  const canContinue = wantsToAdd === "No" || (wantsToAdd === "Yes" && allAnswered);

  async function handleContinue() {
    setSaving(true);
    const data: SogiRecordDraft =
      wantsToAdd === "Yes"
        ? {
            sexAtBirth: sexAtBirth[0] ?? "",
            genderIdentity: genderIdentity[0] ?? "",
            pronouns: pronouns[0] ?? "",
            sexualOrientation: orientation[0] ?? "",
          }
        : null;
    await mockSogiWriteSource.saveSogi(patientId, data);
    setSaving(false);
    onComplete(data);
  }

  return (
    <SectionShell status="active" title="Additional patient info">
      <div className="text-sm text-[var(--color-muted)]">
        This is optional and helps us provide more personalized care. You can skip it entirely.
      </div>

      <ChipField
        label="Would you like to add this information?"
        options={[
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No, skip this" },
        ]}
        value={wantsToAdd ? [wantsToAdd] : []}
        onChange={(v) => setWantsToAdd((v[0] as "Yes" | "No") ?? null)}
        multi={false}
      />

      {wantsToAdd === "Yes" ? (
        <>
          <ChipField
            label="Sex assigned at birth"
            options={SEX_AT_BIRTH_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={sexAtBirth}
            onChange={setSexAtBirth}
            multi={false}
          />
          <ChipField
            label="Gender identity"
            options={GENDER_IDENTITY_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={genderIdentity}
            onChange={setGenderIdentity}
            multi={false}
          />
          <ChipField
            label="Pronouns"
            options={PRONOUN_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={pronouns}
            onChange={setPronouns}
            multi={false}
          />
          <ChipField
            label="Sexual orientation"
            options={ORIENTATION_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={orientation}
            onChange={setOrientation}
            multi={false}
          />
        </>
      ) : null}

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
