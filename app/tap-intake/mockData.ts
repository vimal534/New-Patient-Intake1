// Mocked "on file" patient record + mocked AI helpers.
//
// No real backend/EHR integration and no real model calls — both are
// explicitly out of scope. `structureFreeText` is a small keyword matcher
// standing in for "AI structures free text into fields"; it never drives
// clinical branching (the question bank does that) and never appears as a
// visible chat/assistant persona.

import { FREE_TEXT_TAGS } from "./questionBank";

export const ON_FILE_RECORD = {
  child: { name: "Ana", dob: "2020-03-14", age: 6, sex: "Female" },
  nextVisit: {
    date: "Tomorrow",
    time: "10:20 AM",
    provider: "Dr. Reyes",
    visitType: "Annual physical",
    location: "Brightline Pediatrics",
  },
  // Surfaced on the returning-patient home screen as quick, scannable
  // context before the guardian even starts the check-in — not the full
  // chart, just what's worth knowing at a glance. `dot` is a status read
  // (confirmed/notable/current), not a severity score.
  goodToKnow: [
    { id: "allergy", dot: "amber" as const, title: "Penicillin allergy on file", status: "Confirmed" },
    { id: "earPain", dot: "gray" as const, title: "Ear pain reported in March", status: "14 Mar" },
    { id: "asthma", dot: "teal" as const, title: "Asthma plan up to date", status: "8 Jan" },
  ],
  medicalHistory: {
    allergies: ["Penicillin"],
    medications: ["Albuterol inhaler"],
    conditions: ["Asthma (mild)"],
    surgeries: ["Ear tubes (2024)"],
    hospitalizations: [] as string[],
  },
  familyHistory: [{ id: "asthma", label: "Asthma", relative: "mother" }],
  guardian: {
    name: "Elena Marquez",
    relationship: "Parent",
    phone: "(512) 555-0148",
    email: "elena.marquez@example.com",
    isPolicyholder: true,
  },
  coverage: {
    payer: "BlueCross BlueShield PPO",
    policyNumber: "BXP440291847",
    groupId: "GRP-7734",
    copay: "$25 for this visit type",
  },
  payment: { cardLast4: "4242" },
};

// Suggested free-text seed for the demo, per the brief: "cough and low
// energy for 2 days" — used for both flows so Confirm-vs-Ask-Once is
// visibly comparable on the same underlying concern.
export const DEMO_CONCERN_TEXT = "She's had a cough and low energy for about 2 days now.";

// Mocked vision-call result for "Scan card instead" — no real OCR/camera.
// Contract matches the spec exactly: exactly these 3 fields, `groupId`
// explicitly `null` (not "", not omitted) when the card doesn't show one —
// that distinction is what lets APPLY_SCANNED_COVERAGE leave the field
// blank without assuming "not found" means "doesn't have one."
export function mockScanCard(): { companyName: string; policyNumber: string; groupId: string | null } {
  return { companyName: "Aetna", policyNumber: "W123456789", groupId: null };
}

// Mocked "scan a medication label" result — no real camera/OCR, same
// convention as mockScanCard() above. Always returns the same 2 items so
// the demo is repeatable, one with an uncertain dose, so the "flag what
// we're not sure about" UX is directly exercisable without a real photo.
export function mockScanMedicationLabel(): { name: string; dose: string; frequency: string; doseUncertain: boolean }[] {
  return [
    { name: "Albuterol inhaler", dose: "90mcg", frequency: "As needed", doseUncertain: false },
    { name: "Amoxicillin", dose: "250mg/5mL", frequency: "Twice daily", doseUncertain: true },
  ];
}

export function hasOnFileCondition(name: string) {
  return ON_FILE_RECORD.medicalHistory.conditions.some((c) => c.toLowerCase().includes(name.toLowerCase()));
}

export function structureFreeText(text: string): { tags: string[]; inferredReason: string | null } {
  const tags: string[] = [];
  let inferredReason: string | null = null;
  for (const { pattern, tag, reason } of FREE_TEXT_TAGS) {
    if (pattern.test(text)) {
      if (!tags.includes(tag)) tags.push(tag);
      if (reason && !inferredReason) inferredReason = reason;
    }
  }
  return { tags, inferredReason };
}

// Mock plain-language summary line generator for the Visit Summary — AI
// drafts the sentence, deterministic data supplies every fact in it.
export function summarizeConcern(name: string, reason: string | null, tags: string[]) {
  const bits = [reason, ...tags.filter((t) => t !== reason)].filter(Boolean);
  if (!bits.length) return `${name}'s visit reason is being described.`;
  return `${name} is being seen today for ${bits.join(" and ").toLowerCase()}.`;
}
