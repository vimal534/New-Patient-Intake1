// PHQ-2 / PHQ-9 (Kroenke, Spitzer & Williams) — the prior-answer-gated
// eligibility example ("PHQ-2 -> full PHQ-9 only if score >= 3") AND the
// self-harm immediate-flag example, both from the Phase 4 spec.
//
// Same placeholder discipline as M-CHAT-R/F and ASQ-3: PHQ-2/PHQ-9 are
// licensed clinical instruments distributed free for clinical use but
// with fixed wording their publisher requires be reproduced unmodified —
// item PROMPTS below are stand-ins. The 0-3 response scale IS the real
// instrument's actual answer options (generic English, not copyrightable
// instrument content).

import { FieldOption, ValidatedInstrumentQuestion } from "../schema/types";

export const PHQ_OPTIONS: FieldOption[] = [
  { value: "0", label: "Not at all" },
  { value: "1", label: "Several days" },
  { value: "2", label: "More than half the days" },
  { value: "3", label: "Nearly every day" },
];

export const PHQ2_QUESTIONS: ValidatedInstrumentQuestion[] = Array.from({ length: 2 }, (_, i) => {
  const n = i + 1;
  return {
    key: `phq2-${n}`,
    prompt: `Placeholder item ${n} of 2 — replace with the licensed PHQ-2 wording before clinical use`,
    options: PHQ_OPTIONS,
    required: true,
  };
});

// Real PHQ-2 -> PHQ-9 escalation cutoff.
export const PHQ2_ELIGIBILITY_THRESHOLD = 3;

export function scorePhq2(answers: Record<string, string>): number {
  return PHQ2_QUESTIONS.reduce((sum, q) => sum + Number(answers[q.key] ?? 0), 0);
}

// Item 9 is the real PHQ-9's self-harm/suicidal-ideation item — the
// concrete "needs separate immediate-flag routing, not just end-of-form
// scoring" requirement from the spec. Any answer above "Not at all" flags
// it the moment it's given, not only once the whole form is scored.
export const PHQ9_SELF_HARM_ITEM_KEY = "phq9-9";

export const PHQ9_QUESTIONS: ValidatedInstrumentQuestion[] = Array.from({ length: 9 }, (_, i) => {
  const n = i + 1;
  return {
    key: `phq9-${n}`,
    prompt:
      n === 9
        ? "Placeholder item 9 of 9 (self-harm/suicidal-ideation item) — replace with the licensed PHQ-9 wording before clinical use"
        : `Placeholder item ${n} of 9 — replace with the licensed PHQ-9 wording before clinical use`,
    options: PHQ_OPTIONS,
    required: true,
  };
});

export type Phq9Band = "none-minimal" | "mild" | "moderate" | "moderately-severe" | "severe";

export type Phq9ScoreResult = {
  score: number;
  band: Phq9Band;
  selfHarmFlag: boolean;
};

export function scorePhq9(answers: Record<string, string>): Phq9ScoreResult {
  const score = PHQ9_QUESTIONS.reduce((sum, q) => sum + Number(answers[q.key] ?? 0), 0);
  const band: Phq9Band =
    score <= 4 ? "none-minimal" : score <= 9 ? "mild" : score <= 14 ? "moderate" : score <= 19 ? "moderately-severe" : "severe";
  const selfHarmFlag = Number(answers[PHQ9_SELF_HARM_ITEM_KEY] ?? 0) > 0;
  return { score, band, selfHarmFlag };
}
