import type { ParsedField } from "../types";

let counter = 0;
function nextId() {
  counter += 1;
  return "field-" + counter;
}

/**
 * STUB — swap this for a real LLM call.
 *
 * Pattern-matches known keywords in free text (or a voice transcript) into
 * structured fields, so the UI can render them as editable cards instead
 * of a raw chat transcript. The only contract the rest of the app depends
 * on is the return shape (ParsedField[]) — replace the body with an API
 * call that returns the same shape and nothing else needs to change.
 */
export function parseFreeText(text: string): ParsedField[] {
  const t = text.toLowerCase();
  const found: ParsedField[] = [];

  if (t.includes("inhaler") || t.includes("medication") || t.includes("prescri")) {
    found.push({ id: nextId(), kind: "medication", label: "New medication", value: t.includes("inhaler") ? "Inhaler" : "Reported medication" });
  }
  if (t.includes("cough")) {
    found.push({ id: nextId(), kind: "symptom", label: "New symptom", value: t.includes("night") ? "Nighttime cough" : "Cough" });
  }
  if (t.includes("fever")) {
    found.push({ id: nextId(), kind: "symptom", label: "New symptom", value: "Fever" });
  }
  if (t.includes("allerg")) {
    found.push({ id: nextId(), kind: "allergy", label: "New allergy", value: "Reported allergy — needs detail" });
  }
  if (t.includes("surgery") || t.includes("operation")) {
    found.push({ id: nextId(), kind: "condition", label: "New surgical history", value: "Reported surgery — needs detail" });
  }

  if (found.length === 0) {
    found.push({ id: nextId(), kind: "symptom", label: "Noted", value: text.trim() });
  }
  return found;
}
