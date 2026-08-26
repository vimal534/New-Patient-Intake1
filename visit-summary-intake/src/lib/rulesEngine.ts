import type { FollowUpQuestion, OnFileCondition } from "../types";

// ---------- Symptom follow-up rules (screens 03 → 04) ----------
// Keyed on `${cause}|${duration}` — swap or extend entries here to change
// what gets asked for a given combination; nothing in the screen
// components needs to change.
const SYMPTOM_FOLLOW_UPS: Record<string, FollowUpQuestion[]> = {
  "After an injury|1–7 days": [
    { type: "chips", id: "walk", question: "Are you able to walk normally?", options: ["Yes", "No", "With difficulty"] },
    { type: "chips", id: "swelling", question: "Any swelling or bruising?", options: ["Yes", "No"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
  "After an injury|<24 hours": [
    { type: "chips", id: "walk", question: "Are you able to walk normally?", options: ["Yes", "No", "With difficulty"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
  "Exercise or lifting|1–7 days": [
    { type: "chips", id: "side", question: "Is the pain on one side or both?", options: ["One side", "Both sides"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
  default: [
    { type: "chips", id: "walk", question: "Are you able to move around normally?", options: ["Yes", "No", "With difficulty"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
};

export function getSymptomFollowUps(cause: string, duration: string): FollowUpQuestion[] {
  return SYMPTOM_FOLLOW_UPS[`${cause}|${duration}`] ?? SYMPTOM_FOLLOW_UPS.default;
}

// ---------- Existing-condition check-in rules (screens 06 → 10) ----------
// Keyed on the on-file condition's `kind` — each on-file condition can
// contribute its own short check-in, so a patient with two conditions on
// file sees two small blocks, not one generic one.
const CONDITION_CHECKINS: Record<OnFileCondition["kind"], FollowUpQuestion[]> = {
  asthma: [
    { type: "chips", id: "rescueInhaler", question: "Rescue inhaler in the last 7 days?", options: ["Yes", "No", "Not sure"] },
    { type: "chips", id: "nighttime", question: "Nighttime symptoms this month?", options: ["Yes", "No", "Not sure"] },
  ],
  other: [{ type: "chips", id: "stable", question: "Is this still stable and unchanged?", options: ["Yes", "No", "Not sure"] }],
};

export function getConditionCheckins(conditions: OnFileCondition[]): { condition: OnFileCondition; questions: FollowUpQuestion[] }[] {
  return conditions.map((c) => ({ condition: c, questions: CONDITION_CHECKINS[c.kind] }));
}
