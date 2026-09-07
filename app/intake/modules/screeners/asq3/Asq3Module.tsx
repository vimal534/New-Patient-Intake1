"use client";

import { useState } from "react";
import { ValidatedInstrumentField } from "../../../components/fields/ValidatedInstrument";
import { mockScreenerWriteSource } from "../../../lib/data-source/mockAdapter";
import { ASQ3_QUESTIONS, ASQ3_SKIP_POLICY, Asq3ScoreResult, scoreAsq3 } from "../../../lib/screener/asq3";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// skipPolicy: "prorate" — the example the FINAL spec calls out for
// ASQ-3/ASQ:SE-2 specifically. ValidatedInstrumentField renders a per-item
// "Skip" link in this mode (no per-item required-ness) and an inline
// "will be marked incomplete" note once skips exceed the limit; the actual
// prorated-vs-invalid scoring decision happens here in scoreAsq3(), not in
// the field component (per that component's own doc comment).
export function Asq3Module({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (result: Asq3ScoreResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skippedKeys, setSkippedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const unresolved = ASQ3_QUESTIONS.filter((q) => !skippedKeys.includes(q.key) && answers[q.key] === undefined);
  const canContinue = unresolved.length === 0;

  async function handleContinue() {
    setSaving(true);
    const result = scoreAsq3(answers, skippedKeys);
    await mockScreenerWriteSource.saveScreenerResult(patientId, "asq-3", {
      answers,
      skippedKeys,
      ...result,
    });
    setSaving(false);
    onComplete(result);
  }

  return (
    <SectionShell status="active" title="Developmental screening">
      <div className="text-sm text-[var(--color-muted)]">
        A few more questions about your child&apos;s skills — it&apos;s fine to skip anything you&apos;re not sure
        about.
      </div>

      <ValidatedInstrumentField
        title="ASQ-3"
        questions={ASQ3_QUESTIONS}
        answers={answers}
        onAnswer={(key, value) => setAnswers((prev) => ({ ...prev, [key]: value }))}
        onMarkSkipped={(key) => setSkippedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))}
        skippedKeys={skippedKeys}
        skipPolicy={ASQ3_SKIP_POLICY}
      />

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
