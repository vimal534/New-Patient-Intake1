// Phase 4 — screener eligibility resolver. `screenerEligibility(dob, asOf,
// answers)` returns which screeners from the v1 registry apply to this
// patient/visit, gated by age band and (optionally) a prior answer —
// evaluated through the exact same `evaluateCondition`/`ConditionGroup`
// every field- and module-level condition in this app already uses, not a
// separate eligibility-specific mechanism.

import { evaluateCondition } from "../schema/conditions";
import { AnswerState, ConditionGroup } from "../schema/types";
import { PHQ2_ELIGIBILITY_THRESHOLD } from "./phq";

export type ScreenerId = "asq-3" | "mchat-rf" | "phq-2" | "phq-9";

export type ScreenerRegistryEntry = {
  id: ScreenerId;
  title: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  // Additional gate beyond age — e.g. only if Reason for Visit flagged a
  // relevant concern. Absent = age band alone decides.
  requiresPriorAnswer?: ConditionGroup;
};

// The FINAL prompt's v1 screener set is larger still — ASQ:SE-2,
// Vanderbilt, PSC-17, EPDS remain unbuilt. The registry/resolver shape
// supports adding each without changing this function — one more entry
// plus its own module, not a resolver rewrite. A ~20-month-old is
// eligible for both ASQ-3 and M-CHAT-R/F at once — the resolver returns
// an ordered list precisely so the caller can walk through more than one
// applicable screener in sequence, not just check a single boolean.
//
// PHQ-9's `requiresPriorAnswer` is the concrete prior-answer-gated
// example: it only applies once PHQ-2 has actually been administered
// AND scored >= threshold — not a fixed age band alone. Because that
// depends on an answer that doesn't exist yet when eligibility is first
// computed, the caller (app/page.tsx) re-runs screenerEligibility() after
// every screener completes rather than freezing the list once up front.
export const SCREENER_REGISTRY: ScreenerRegistryEntry[] = [
  {
    id: "asq-3",
    title: "ASQ-3 (developmental screening)",
    minAgeMonths: 1,
    maxAgeMonths: 66,
  },
  {
    id: "mchat-rf",
    title: "M-CHAT-R/F (autism screening)",
    minAgeMonths: 16,
    maxAgeMonths: 30,
  },
  {
    id: "phq-2",
    title: "PHQ-2 (depression screening)",
    minAgeMonths: 144, // 12yo
    maxAgeMonths: 216, // 18yo
  },
  {
    id: "phq-9",
    title: "PHQ-9 (depression screening, full)",
    minAgeMonths: 144,
    maxAgeMonths: 216,
    requiresPriorAnswer: { all: [{ sourceField: "phq2Score", gte: PHQ2_ELIGIBILITY_THRESHOLD }] },
  },
];

export function ageInMonths(dob: string, asOfIsoDate: string): number {
  const dobDate = new Date(dob);
  const asOf = new Date(asOfIsoDate);
  if (isNaN(dobDate.getTime()) || isNaN(asOf.getTime())) return -1;
  let months = (asOf.getFullYear() - dobDate.getFullYear()) * 12 + (asOf.getMonth() - dobDate.getMonth());
  if (asOf.getDate() < dobDate.getDate()) months -= 1;
  return Math.max(0, months);
}

export function screenerEligibility(dob: string, asOfIsoDate: string, answers: AnswerState): ScreenerRegistryEntry[] {
  const ageMonths = ageInMonths(dob, asOfIsoDate);
  return SCREENER_REGISTRY.filter((entry) => {
    if (ageMonths < entry.minAgeMonths || ageMonths > entry.maxAgeMonths) return false;
    if (entry.requiresPriorAnswer && !evaluateCondition(entry.requiresPriorAnswer, answers)) return false;
    return true;
  });
}
