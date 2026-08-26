export type Step = "visit" | "health" | "details" | "coverage" | "finish";

// A single structured field the AI parsing step extracted from free text —
// rendered as an editable card, never as raw chat text.
export type ParsedField = {
  id: string;
  kind: "medication" | "symptom" | "allergy" | "condition";
  label: string; // e.g. "NEW MEDICATION"
  value: string; // e.g. "Inhaler"
};

// One adaptive follow-up question, as produced by the pain rules engine.
export type FollowUpQuestion =
  | { type: "chips"; id: string; question: string; options: string[] }
  | { type: "slider"; id: string; question: string; min: number; max: number };
