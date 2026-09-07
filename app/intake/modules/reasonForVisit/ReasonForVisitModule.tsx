"use client";

import { useState } from "react";
import { mockReasonForVisitWriteSource } from "../../lib/data-source/mockAdapter";
import { ChipOtherField } from "../../components/fields/ChipOther";
import { ChipField } from "../../components/fields/Chip";
import { evaluateCondition } from "../../lib/schema/conditions";
import { AnswerState, ModuleConfig } from "../../lib/schema/types";
import { ReasonForVisitDraft } from "../../lib/data-source/types";
import { PrimaryButton, SectionShell, TextField } from "@/app/tap-intake/components/ui";

const REASON_OPTIONS = [
  { value: "Well-child checkup", label: "Well-child checkup" },
  { value: "Sick visit", label: "Sick visit" },
  { value: "Vaccination", label: "Vaccination" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Behavioral/developmental concern", label: "Behavioral/developmental concern" },
  { value: "Injury", label: "Injury" },
];
const BODY_PART_OPTIONS = ["Head", "Arm", "Leg", "Torso", "Other"];

// ChipOtherField's "Other" sentinel isn't exported (it's an internal
// implementation detail of that component) — this literal has to match it
// exactly. See components/fields/ChipOther.tsx.
const OTHER_SENTINEL = "__other__";

// Field-level example (same pattern as Medications' dose/frequency note):
// picking "Injury" reveals a follow-up sub-section, evaluated through the
// same evaluateCondition/ConditionGroup shared types.
const INJURY_CONDITION = { any: [{ sourceField: "reasonForVisit", includes: "Injury" }] };

// Module-level example — the tier the architecture doc flagged as pending
// ("need Reason for Visit + a second module"). These aren't real modules
// yet (Phase 4's screener engine isn't built), but they're genuine
// ModuleConfig objects with real showWhen conditions, evaluated through the
// exact same evaluateCondition() as every field-level condition. What
// today just renders an informational banner is, structurally, the same
// mechanism Phase 4 will use to decide which screener module loads next.
const DOWNSTREAM_MODULE_STUBS: ModuleConfig[] = [
  {
    id: "behavioral-screener",
    title: "A short behavioral/developmental screener (e.g. M-CHAT-R/F)",
    fields: [],
    showWhen: { any: [{ sourceField: "reasonForVisit", includes: "Behavioral/developmental concern" }] },
  },
  {
    id: "vaccine-details",
    title: "Which vaccine(s) you're here for",
    fields: [],
    showWhen: { any: [{ sourceField: "reasonForVisit", includes: "Vaccination" }] },
  },
];

export function ReasonForVisitModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (data: ReasonForVisitDraft) => void;
}) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [bodyPart, setBodyPart] = useState<string[]>([]);
  const [injuryWhen, setInjuryWhen] = useState("");
  const [saving, setSaving] = useState(false);

  const answers: AnswerState = { reasonForVisit: reasons };
  const showInjuryFollowUp = evaluateCondition(INJURY_CONDITION, answers);
  const triggeredStubs = DOWNSTREAM_MODULE_STUBS.filter((m) => evaluateCondition(m.showWhen, answers));

  const otherSelected = reasons.includes(OTHER_SENTINEL);
  const reasonsComplete = reasons.length > 0 && (!otherSelected || otherText.trim() !== "");
  const injuryComplete = !showInjuryFollowUp || (bodyPart.length > 0 && injuryWhen.trim() !== "");
  const canContinue = reasonsComplete && injuryComplete;

  async function handleContinue() {
    setSaving(true);
    const data: ReasonForVisitDraft = {
      reasons: reasons.filter((r) => r !== OTHER_SENTINEL),
      otherText: otherSelected ? otherText.trim() : null,
      injuryDetails: showInjuryFollowUp ? { bodyPart: bodyPart[0] ?? "", when: injuryWhen } : null,
    };
    await mockReasonForVisitWriteSource.saveReasonForVisit(patientId, data);
    setSaving(false);
    onComplete(data);
  }

  return (
    <SectionShell status="active" title="Reason for visit">
      <div className="text-sm text-[var(--color-muted)]">What brings you in today? Pick everything that applies.</div>

      <ChipOtherField
        label="Reason for visit"
        options={REASON_OPTIONS}
        value={reasons}
        otherText={otherText}
        onChange={setReasons}
        onOtherTextChange={setOtherText}
        multi
      />

      {showInjuryFollowUp ? (
        <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-2)]">About the injury</div>
          <ChipField
            label="Where on the body?"
            options={BODY_PART_OPTIONS.map((b) => ({ value: b, label: b }))}
            value={bodyPart}
            onChange={setBodyPart}
            multi={false}
          />
          <TextField label="When did this happen?" value={injuryWhen} onChange={setInjuryWhen} placeholder="e.g. yesterday, 2 days ago" />
        </div>
      ) : null}

      {triggeredStubs.length > 0 ? (
        <div className="rounded-lg border border-[var(--color-teal)] bg-[var(--color-teal)]/10 p-3 text-xs text-[var(--color-teal)]">
          Based on that, we&apos;ll also ask about: {triggeredStubs.map((m) => m.title).join("; ")}.
        </div>
      ) : null}

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
