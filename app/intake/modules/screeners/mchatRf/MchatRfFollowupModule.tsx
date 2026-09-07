"use client";

import { useState } from "react";
import { ChipField } from "../../../components/fields/Chip";
import { mockScreenerWriteSource } from "../../../lib/data-source/mockAdapter";
import { MCHAT_RF_QUESTIONS, YES, NO } from "../../../lib/screener/mchatRf";
import { PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

// This is the concrete "3-7 = second follow-up module" example from the
// Phase 4 spec. v1 simplification of the real M-CHAT-R/F Follow-Up
// interview (a structured, branching interview a clinician conducts item
// by item) — here it's one re-ask per at-risk item, "does this still
// describe your child?" That's enough to prove the real mechanic (an
// initial result triggers a second module scoped to exactly the at-risk
// items, and THAT module's own result decides refer-vs-clear) without
// reproducing the actual F/U interview's clinical branching logic.
export function MchatRfFollowupModule({
  patientId,
  atRiskKeys,
  onComplete,
}: {
  patientId: string;
  atRiskKeys: string[];
  onComplete: (stillConcerning: boolean) => void;
}) {
  const [confirmed, setConfirmed] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canContinue = atRiskKeys.every((key) => confirmed[key] === YES || confirmed[key] === NO);

  async function handleContinue() {
    setSaving(true);
    const stillConcerning = atRiskKeys.some((key) => confirmed[key] === YES);
    await mockScreenerWriteSource.saveScreenerResult(patientId, "mchat-rf-followup", {
      confirmed,
      stillConcerning,
    });
    setSaving(false);
    onComplete(stillConcerning);
  }

  return (
    <SectionShell status="active" title="Developmental screening — follow-up">
      <div className="text-sm text-[var(--color-muted)]">
        A few of your earlier answers need a closer look — for each one, does this still describe your child today?
      </div>

      <div className="space-y-4">
        {atRiskKeys.map((key) => {
          const item = MCHAT_RF_QUESTIONS.find((q) => q.key === key);
          return (
            <ChipField
              key={key}
              label={item?.prompt ?? key}
              options={[
                { value: YES, label: YES },
                { value: NO, label: NO },
              ]}
              value={confirmed[key] ? [confirmed[key]] : []}
              onChange={(v) => setConfirmed((prev) => ({ ...prev, [key]: v[0] ?? "" }))}
              multi={false}
            />
          );
        })}
      </div>

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
