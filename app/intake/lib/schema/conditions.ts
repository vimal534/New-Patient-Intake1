// Conditional-field engine — one evaluator, reused for every tier the
// brief calls out: field-level (a value reveals child fields), module-level
// (chief complaint determines which question set loads), practice-level
// (which modules apply per specialty), and screener eligibility (a prior
// screener's score gates a follow-on one — e.g. PHQ-2 >= 3 triggers
// PHQ-9, via `gte`). All of these read the same ConditionGroup shape
// against the same AnswerState; there is no separate per-tier code path.

import { AnswerState, ConditionGroup, ConditionRule } from "./types";

function ruleMatches(rule: ConditionRule, answers: AnswerState): boolean {
  const current = answers[rule.sourceField];
  if (rule.equals !== undefined) {
    return current === rule.equals;
  }
  if (rule.includes !== undefined) {
    return Array.isArray(current) && current.includes(rule.includes);
  }
  if (rule.gte !== undefined) {
    return typeof current === "number" && current >= rule.gte;
  }
  return false;
}

export function evaluateCondition(condition: ConditionGroup | undefined, answers: AnswerState): boolean {
  if (!condition) return true; // no condition = always visible
  if (condition.all) return condition.all.every((r) => ruleMatches(r, answers));
  if (condition.any) return condition.any.some((r) => ruleMatches(r, answers));
  return true;
}
