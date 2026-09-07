"use client";

import { useState } from "react";
import { ValidatedInstrumentField } from "../../../components/fields/ValidatedInstrument";
import { mockScreenerWriteSource } from "../../../lib/data-source/mockAdapter";
import { PHQ2_QUESTIONS, scorePhq2 } from "../../../lib/screener/phq";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// The short first-pass screener — its own score is what gates whether the
// full PHQ-9 applies at all (`requiresPriorAnswer: {gte: 3}` in the
// eligibility registry), not a fixed age band alone. `onComplete` hands
// the raw score back so app/page.tsx can write it into the shared
// screener-answers bag before re-checking eligibility.
export function Phq2Module({ patientId, onComplete }: { patientId: string; onComplete: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canContinue = PHQ2_QUESTIONS.every((q) => answers[q.key] !== undefined);

  async function handleContinue() {
    setSaving(true);
    const score = scorePhq2(answers);
    await mockScreenerWriteSource.saveScreenerResult(patientId, "phq-2", { answers, score });
    setSaving(false);
    onComplete(score);
  }

  return (
    <SectionShell status="active" title="Wellbeing check-in">
      <div className="text-sm text-[var(--color-muted)]">
        A couple of quick questions about how you&apos;ve been feeling lately.
      </div>

      <ValidatedInstrumentField
        title="PHQ-2"
        questions={PHQ2_QUESTIONS}
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
