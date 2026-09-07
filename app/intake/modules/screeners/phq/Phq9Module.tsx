"use client";

import { useEffect, useState } from "react";
import { ValidatedInstrumentField } from "../../../components/fields/ValidatedInstrument";
import { mockScreenerWriteSource } from "../../../lib/data-source/mockAdapter";
import { evaluateCondition } from "../../../lib/schema/conditions";
import { AnswerState } from "../../../lib/schema/types";
import { PHQ9_QUESTIONS, PHQ9_SELF_HARM_ITEM_KEY, Phq9ScoreResult, scorePhq9 } from "../../../lib/screener/phq";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// Item 9 needs "separate immediate-flag routing, not just end-of-form
// scoring" per the spec — a real clinical-safety requirement. Evaluated
// through the same evaluateCondition()/ConditionGroup every other
// conditional reveal in this app uses; what's different here is WHEN it
// fires (the instant the concerning answer is given, via a dedicated save
// call in the effect below) and that it's saved as its own distinct
// event, not folded silently into the end-of-form score.
const SELF_HARM_CONDITION = {
  any: [
    { sourceField: PHQ9_SELF_HARM_ITEM_KEY, equals: "1" },
    { sourceField: PHQ9_SELF_HARM_ITEM_KEY, equals: "2" },
    { sourceField: PHQ9_SELF_HARM_ITEM_KEY, equals: "3" },
  ],
};

export function Phq9Module({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (result: Phq9ScoreResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const conditionAnswers: AnswerState = { [PHQ9_SELF_HARM_ITEM_KEY]: answers[PHQ9_SELF_HARM_ITEM_KEY] };
  const showSelfHarmFlag = evaluateCondition(SELF_HARM_CONDITION, conditionAnswers);

  // Fires the moment the flag becomes true — not deferred to Continue.
  // v1 simplification: this can re-fire if the answer is changed away and
  // back; a real system would dedupe/rate-limit a repeat alert for the
  // same visit rather than re-notify every time.
  useEffect(() => {
    if (showSelfHarmFlag) {
      mockScreenerWriteSource.saveScreenerResult(patientId, "phq9-self-harm-flag", {
        itemKey: PHQ9_SELF_HARM_ITEM_KEY,
        value: answers[PHQ9_SELF_HARM_ITEM_KEY],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelfHarmFlag]);

  const canContinue = PHQ9_QUESTIONS.every((q) => answers[q.key] !== undefined);

  async function handleContinue() {
    setSaving(true);
    const result = scorePhq9(answers);
    await mockScreenerWriteSource.saveScreenerResult(patientId, "phq-9", { answers, ...result });
    setSaving(false);
    onComplete(result);
  }

  return (
    <SectionShell status="active" title="Wellbeing check-in">
      <div className="text-sm text-[var(--color-muted)]">
        A few more questions, since your last answers suggested it&apos;s worth a closer look.
      </div>

      {showSelfHarmFlag ? (
        <div className="rounded-lg border border-[var(--color-orange)] bg-[var(--color-orange)]/10 p-3 text-xs font-medium text-[var(--color-orange)]">
          Thank you for sharing that. A staff member will follow up with you directly before your visit.
        </div>
      ) : null}

      <ValidatedInstrumentField
        title="PHQ-9"
        questions={PHQ9_QUESTIONS}
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
