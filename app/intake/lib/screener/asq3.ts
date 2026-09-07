// ASQ-3-style developmental screener — the prorate skip-policy example
// (M-CHAT-R/F, built previously, exercises "mandatory"). Same placeholder
// discipline as mchatRf.ts: ASQ-3 (Squires & Bricker) is a licensed
// clinical instrument with exact item wording and per-domain structure
// that shouldn't be reproduced or paraphrased here. `Yes` / `Sometimes` /
// `Not yet` below are the real instrument's generic answer-option labels
// (plain English, not copyrightable instrument content) — the item
// PROMPTS are placeholder text, same as M-CHAT-R/F's.
//
// What's real: the prorate scoring formula itself — up to `maxSkips`
// items may be left blank; the score is prorated
// (sum_answered / count_answered * item_count) rather than treated as a
// true zero; beyond `maxSkips` the domain is invalid and no score is
// sent, rather than a misleadingly precise number. Real ASQ-3 scores five
// independent domains this way; this is a single representative domain,
// not the full five — the resolver/scoring shape generalizes to more
// domains without changes, it just isn't exercised by all five here.

import { SkipPolicy, ValidatedInstrumentQuestion } from "../schema/types";

export const ASQ_YES = "Yes";
export const ASQ_SOMETIMES = "Sometimes";
export const ASQ_NOT_YET = "Not yet";

const ASQ_OPTIONS = [
  { value: ASQ_YES, label: ASQ_YES },
  { value: ASQ_SOMETIMES, label: ASQ_SOMETIMES },
  { value: ASQ_NOT_YET, label: ASQ_NOT_YET },
];

const ASQ_POINTS: Record<string, number> = { [ASQ_YES]: 10, [ASQ_SOMETIMES]: 5, [ASQ_NOT_YET]: 0 };

export const ASQ3_QUESTIONS: ValidatedInstrumentQuestion[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return {
    key: `asq3-${n}`,
    // Individual items aren't marked `required` — the prorate skip policy
    // (not per-item validation) is what decides whether a blank is
    // allowed, up to `maxSkips`.
    prompt: `Placeholder item ${n} of 10 — replace with the licensed ASQ-3 wording before clinical use`,
    options: ASQ_OPTIONS,
    required: false,
  };
});

export const ASQ3_SKIP_POLICY: SkipPolicy = { mode: "prorate", maxSkips: 2 };

export type Asq3ScoreResult =
  | { valid: true; rawSum: number; answeredCount: number; proratedScore: number }
  | { valid: false; reason: "too_many_skips" };

export function scoreAsq3(answers: Record<string, string>, skippedKeys: string[]): Asq3ScoreResult {
  if (ASQ3_SKIP_POLICY.mode === "prorate" && skippedKeys.length > ASQ3_SKIP_POLICY.maxSkips) {
    return { valid: false, reason: "too_many_skips" };
  }
  const totalItems = ASQ3_QUESTIONS.length;
  const answeredKeys = ASQ3_QUESTIONS.map((q) => q.key).filter((k) => !skippedKeys.includes(k));
  const rawSum = answeredKeys.reduce((sum, k) => sum + (ASQ_POINTS[answers[k]] ?? 0), 0);
  const answeredCount = answeredKeys.length;
  const proratedScore = answeredCount > 0 ? Math.round((rawSum / answeredCount) * totalItems) : 0;
  return { valid: true, rawSum, answeredCount, proratedScore };
}
