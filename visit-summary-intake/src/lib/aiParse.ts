import type { ParsedField } from "../types";

let counter = 0;
function nextId() {
  counter += 1;
  return "field-" + counter;
}

/**
 * STUB — swap this for a real LLM call.
 *
 * Pattern-matches known keywords in free text (or a mocked voice
 * transcript) into structured fields, so the UI can render them in an
 * AIInterpretation card instead of a chat transcript. The only contract
 * the rest of the app depends on is the return shape (ParsedField[]).
 */
export function parseHealthText(text: string): ParsedField[] {
  const t = text.toLowerCase();
  const found: ParsedField[] = [];

  if (t.includes("latex")) {
    found.push({ id: nextId(), label: "NEW ALLERGY", value: "Latex", detail: t.includes("rash") ? "Reaction: Rash" : "Reaction: not specified" });
  } else if (t.includes("allerg")) {
    found.push({ id: nextId(), label: "NEW ALLERGY", value: "Reported allergy", detail: "Needs detail" });
  }
  if (t.includes("inhaler") || t.includes("medication") || t.includes("prescri")) {
    found.push({ id: nextId(), label: "NEW MEDICATION", value: t.includes("inhaler") ? "Inhaler" : "Reported medication" });
  }
  if (t.includes("cough")) {
    found.push({ id: nextId(), label: "NEW SYMPTOM", value: t.includes("night") ? "Nighttime cough" : "Cough" });
  }
  if (t.includes("surgery") || t.includes("operation")) {
    found.push({ id: nextId(), label: "NEW SURGERY", value: "Reported surgery", detail: "Needs detail" });
  }
  if (t.includes("hospital")) {
    found.push({ id: nextId(), label: "NEW HOSPITALIZATION", value: "Reported hospitalization", detail: "Needs detail" });
  }

  if (found.length === 0) {
    found.push({ id: nextId(), label: "NOTED", value: text.trim() });
  }
  return found;
}
