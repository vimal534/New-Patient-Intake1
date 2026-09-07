"use client";

import { useState } from "react";
import { ValidatedInstrumentField } from "../../../components/fields/ValidatedInstrument";
import { mockScreenerWriteSource } from "../../../lib/data-source/mockAdapter";
import { MCHAT_RF_QUESTIONS, MchatScoreResult, scoreMchatRf } from "../../../lib/screener/mchatRf";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// skipPolicy: "mandatory" — per the FINAL spec, every v1 screener except
// ASQ-3/ASQ:SE-2 is mandatory (no partial-score fallback). ValidatedInstrumentField
// renders no Skip affordance at all in this mode and shows an inline "N
// questions still need an answer" indicator instead of a silently disabled
// button.
export function MchatRfModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (result: MchatScoreResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canContinue = MCHAT_RF_QUESTIONS.every((q) => answers[q.key] !== undefined);

  async function handleContinue() {
    setSaving(true);
    const result = scoreMchatRf(answers);
    await mockScreenerWriteSource.saveScreenerResult(patientId, "mchat-rf", {
      answers,
      score: result.score,
      band: result.band,
      atRiskKeys: result.atRiskKeys,
    });
    setSaving(false);
    onComplete(result);
  }

  return (
    <SectionShell status="active" title="Developmental screening">
      <div className="text-sm text-[var(--color-muted)]">
        A few quick questions about how your child plays, learns, and communicates. This is a standard screening
        asked at this age, not something specific to today&apos;s visit.
      </div>

      <ValidatedInstrumentField
        title="M-CHAT-R/F"
        questions={MCHAT_RF_QUESTIONS}
        answers={answers}
        onAnswer={(key, value) => setAnswers((prev) => ({ ...prev, [key]: value }))}
        onMarkSkipped={() => {}}
        skippedKeys={[]}
        skipPolicy={{ mode: "mandatory" }}
      />

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
