// M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised, with
// Follow-Up) — the concrete result-triggered-module example the Phase 4
// spec calls out by name.
//
// IMPORTANT: `MCHAT_RF_QUESTIONS` below is PLACEHOLDER item text, not the
// real M-CHAT-R/F. The actual instrument (Robins, Fein & Barton) is a
// licensed clinical tool distributed free for clinical use but with exact
// wording its publisher requires be reproduced unmodified — dropping it
// into a prototype isn't appropriate, and a paraphrase would be clinically
// inaccurate. What's real here is the ENGINE: 20 mandatory yes/no items,
// 3 reverse-scored (matching the real instrument's item COUNT and
// reverse-scored-item count, not its actual item numbers/content), the
// 0-2/3-7/8+ band cutoffs, and the follow-up-module trigger. Swap
// `MCHAT_RF_QUESTIONS` for the licensed item set (exact order, exact
// reverse-scored items) before this is ever used clinically.

import { FieldOption, ValidatedInstrumentQuestion } from "../schema/types";

export const YES = "Yes";
export const NO = "No";
const YES_NO: FieldOption[] = [
  { value: YES, label: YES },
  { value: NO, label: NO },
];

export type MchatItem = ValidatedInstrumentQuestion & { reverseScored: boolean };

// Real M-CHAT-R/F: 20 items, 3 reverse-scored (items 2, 5, 12). Stand-in
// item text below; reverse-scored positions kept at the same 3-of-20 ratio
// so the scoring mechanic is exercised faithfully.
export const MCHAT_RF_QUESTIONS: MchatItem[] = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1;
  const reverseScored = n === 2 || n === 5 || n === 12;
  return {
    key: `mchat-${n}`,
    prompt: `Placeholder item ${n} of 20 — replace with the licensed M-CHAT-R/F wording before clinical use`,
    options: YES_NO,
    required: true,
    reverseScored,
  };
});

export type MchatBand = "low" | "medium" | "high";

export type MchatScoreResult = {
  score: number;
  band: MchatBand; // low: 0-2 (done); medium: 3-7 (Follow-Up); high: 8-20 (refer, no Follow-Up)
  atRiskKeys: string[]; // exactly the items the Follow-Up module re-asks
};

export function scoreMchatRf(answers: Record<string, string>): MchatScoreResult {
  const atRiskKeys: string[] = [];
  for (const q of MCHAT_RF_QUESTIONS) {
    const answer = answers[q.key];
    // Most items: "No" is the at-risk response. Reverse-scored items flip
    // that — "Yes" is at-risk instead.
    const atRisk = q.reverseScored ? answer === YES : answer === NO;
    if (atRisk) atRiskKeys.push(q.key);
  }
  const score = atRiskKeys.length;
  const band: MchatBand = score <= 2 ? "low" : score <= 7 ? "medium" : "high";
  return { score, band, atRiskKeys };
}
