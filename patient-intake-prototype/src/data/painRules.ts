import type { FollowUpQuestion } from "../types";

// The adaptive-follow-up decision table for the Pain screen, keyed on
// `${location}|${cause}`. Add or edit an entry here to change what gets
// asked for a given combination — nothing in PainScreen.tsx needs to
// change. `default` covers any combination without a specific entry.
const PAIN_RULES: Record<string, FollowUpQuestion[]> = {
  "Pelvis|After an injury": [
    { type: "chips", id: "walk", question: "Are you able to walk normally?", options: ["Yes", "No", "With difficulty"] },
    { type: "chips", id: "swelling", question: "Any swelling or bruising?", options: ["Yes", "No"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
  "Pelvis|Exercise or lifting": [
    { type: "chips", id: "walk", question: "Are you able to walk normally?", options: ["Yes", "No", "With difficulty"] },
    { type: "chips", id: "side", question: "Is the pain on one side or both?", options: ["One side", "Both sides"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
  "Pelvis|Gradually over time": [
    { type: "chips", id: "pattern", question: "Is it worse at a particular time of day?", options: ["Morning", "Evening", "No pattern"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
  default: [
    { type: "chips", id: "walk", question: "Are you able to move around normally?", options: ["Yes", "No", "With difficulty"] },
    { type: "slider", id: "intensity", question: "How would you rate the pain right now?", min: 1, max: 10 },
  ],
};

export function getPainFollowUps(location: string, cause: string): FollowUpQuestion[] {
  return PAIN_RULES[`${location}|${cause}`] ?? PAIN_RULES.default;
}
