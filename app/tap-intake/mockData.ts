// Mocked "on file" patient record + mocked AI helpers.
//
// No real backend/EHR integration and no real model calls — both are
// explicitly out of scope. `structureFreeText` is a small keyword matcher
// standing in for "AI structures free text into fields"; it never drives
// clinical branching (the question bank does that) and never appears as a
// visible chat/assistant persona.

import { FREE_TEXT_TAGS } from "./questionBank";
import { MedicalCategoryKey } from "./types";

// Two quality principles applied to on-file data across AboutYouScreen and
// Health History:
//
// 1. "Show the age" — a silent prefill reads as already handled, which is
//    exactly the wrong signal for something the guardian should actually
//    glance at. A concrete "Updated {Month Year}" label gives them a real
//    reason to look, instead of trusting a value they never saw a date on.
// 2. "Suppress what's fresh" — the flip side: re-asking about something
//    verified two weeks ago trains guardians to tap through confirmations
//    without reading them, which is what then makes them miss the
//    confirmations that actually matter. AboutYouScreen uses `isFresh` to
//    skip showing a card at all when it's within the window — not just
//    skip asking, skip showing, since "hidden" is the only thing that
//    doesn't ALSO get tapped through blind.
//
// Deliberately NOT applied to hiding actual clinical facts (Health
// History's on-file conditions/allergies/etc.) — a diagnosis doesn't stop
// being true because it was reviewed recently. There, only principle 1
// applies (see medicalHistoryUpdatedAt on ON_FILE_RECORD); nothing about
// medical history data is ever suppressed by freshness.
export const FRESHNESS_WINDOW_DAYS = 14;

export function isFresh(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const diffDays = (Date.now() - date.getTime()) / (24 * 3600 * 1000);
  return diffDays >= 0 && diffDays <= FRESHNESS_WINDOW_DAYS;
}

export function formatUpdatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// What a NEW patient's appointment booking already captured, before the
// tap-intake link was ever sent — a scheduling widget (or a front-desk
// call) needs at minimum the child's name and DOB to create the
// appointment, and the guardian's own phone to confirm/remind them. This
// is deliberately a separate, smaller record from ON_FILE_RECORD below:
// a brand-new patient has no chart yet, but they still aren't a total
// stranger to the practice by the time they open this link. Everything
// else (legal last name, sex, address, emergency contact) genuinely
// isn't captured at booking, so AboutYouScreen leaves those blank for new
// patients rather than inventing data that wouldn't really exist yet.
export const MOCK_BOOKING_INFO = {
  childFirstName: "Noah",
  childDob: "2021-11-02",
  guardianName: "Sarah Bennett",
  guardianPhone: "(512) 555-0177",
};

export const ON_FILE_RECORD = {
  // legalLastName matches the guardian ("Elena Marquez") and emergency
  // contact ("Carlos Marquez") below — one consistent family surname.
  child: {
    name: "Ana",
    legalFirstName: "Ana",
    legalLastName: "Marquez",
    preferredName: "Ana",
    dob: "2020-03-14",
    age: 6,
    sex: "Female",
  },
  // Household contact + emergency contact — the two the identity/contact
  // gate (AboutYouScreen, right after ReturningHome, before Today's
  // Concern) asks about specifically, since along with identity they're
  // what's most likely to have changed or need a quick correction since
  // the last visit. Same address as the demo "on file" patient in the
  // /intake build, for a consistent identity across both prototypes.
  contact: { phone: "(512) 555-0148", address: "214 Oakwood Dr, Austin, TX 78701" },
  emergencyContact: { name: "Carlos Marquez", relationship: "Grandparent", phone: "(512) 555-0199" },
  // When each of AboutYouScreen's three confirm-or-edit cards was last
  // verified — not one shared date, since a family might update their
  // phone without touching their legal address. Two deliberately stale
  // (identity ~10 months old, emergency contact ~5.5 months old) so
  // "still needs a look" stays exercisable; contact deliberately recent
  // (8 days before this repo's current-date context) so the
  // freshness-suppression behavior on AboutYouScreen has something real
  // to suppress in the demo, not just a hypothetical.
  verifiedAt: {
    identity: "2025-11-02",
    contact: "2026-08-25",
    emergencyContact: "2026-03-15",
  },
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
    conditions: ["Diabetes", "High blood pressure", "Asthma"],
    surgeries: ["Ear tubes (2024)"],
    hospitalizations: [] as string[],
  },
  // "Show the age" for the on-file list on Health History — a concrete
  // date gives the guardian a real reason to glance it over, instead of a
  // silent prefill reading as already handled. Deliberately stale (~3
  // weeks old): unlike AboutYouScreen's per-card verifiedAt dates, this
  // one is never used to suppress/hide anything — clinical facts (a
  // condition, an allergy) stay visible regardless of how recently
  // they were reviewed; only the confirm-and-reask RITUAL gets
  // suppressed for fresh data, not the data itself. Health History
  // already dropped its per-item confirm step entirely in an earlier
  // pass, so this date is purely informational here.
  medicalHistoryUpdatedAt: "2026-08-10",
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

// A small local medication directory for the "Search for a medication"
// picker in Health History — same shape the /intake build's own
// searchMedications() (app/intake/lib/data-source/mockMedications.ts)
// returns (id/name/detail/doses/frequencies), but a standalone copy
// scoped to what this prototype actually needs, not a reach into that
// other build.
//
// tap-intake previously imported /intake's mockMedications.ts directly.
// That resolved fine on a local machine (the folder is still present on
// disk) but broke every single Vercel build from the moment it landed:
// app/intake/ is intentionally never committed to git — it's the
// held-back, PHI/security-sensitive build — so the file simply doesn't
// exist when Vercel clones the repo, and "vercel build" failed with
// Module not found on every deploy since. This directly caused the live
// URL staleness diagnosed earlier in the session.
export type MedicationEntry = {
  id: string;
  name: string;
  detail: string;
  doses: string[];
  frequencies: string[];
};

const MEDICATION_DIRECTORY: MedicationEntry[] = [
  { id: "amoxicillin", name: "Amoxicillin", detail: "Amoxicillin oral suspension", doses: ["125mg/5mL", "250mg/5mL", "400mg/5mL"], frequencies: ["Twice daily", "Three times daily"] },
  { id: "albuterol", name: "Albuterol inhaler", detail: "Albuterol HFA 90mcg inhaler", doses: ["90mcg"], frequencies: ["As needed", "Every 4-6 hours as needed"] },
  { id: "azithromycin", name: "Azithromycin (Zithromax)", detail: "Zithromax oral suspension", doses: ["100mg/5mL", "200mg/5mL"], frequencies: ["Once daily", "Once (single dose)"] },
  { id: "acetaminophen", name: "Acetaminophen (Tylenol)", detail: "Tylenol children's suspension", doses: ["160mg/5mL"], frequencies: ["Every 4-6 hours as needed"] },
  { id: "ibuprofen", name: "Ibuprofen (Motrin/Advil)", detail: "Motrin children's suspension", doses: ["100mg/5mL"], frequencies: ["Every 6-8 hours as needed"] },
  { id: "amoxicillin-clav", name: "Amoxicillin-Clavulanate (Augmentin)", detail: "Augmentin oral suspension", doses: ["200mg/5mL", "400mg/5mL"], frequencies: ["Twice daily"] },
  { id: "cetirizine", name: "Cetirizine (Zyrtec)", detail: "Zyrtec children's syrup", doses: ["5mg", "10mg"], frequencies: ["Once daily"] },
  { id: "montelukast", name: "Montelukast (Singulair)", detail: "Singulair chewable tablet", doses: ["4mg", "5mg"], frequencies: ["Once daily, in the evening"] },
  { id: "prednisolone", name: "Prednisolone", detail: "Prednisolone oral solution", doses: ["15mg/5mL"], frequencies: ["Once daily", "Twice daily"] },
  { id: "insulin", name: "Insulin (Humalog)", detail: "Humalog injection", doses: ["As directed"], frequencies: ["With meals"] },
  { id: "metformin", name: "Metformin", detail: "Metformin tablet", doses: ["500mg", "850mg", "1000mg"], frequencies: ["Once daily", "Twice daily"] },
  { id: "fluticasone", name: "Fluticasone (Flonase)", detail: "Flonase nasal spray", doses: ["50mcg/spray"], frequencies: ["Once daily", "Twice daily"] },
  { id: "omeprazole", name: "Omeprazole (Prilosec)", detail: "Prilosec oral suspension", doses: ["2mg/mL"], frequencies: ["Once daily"] },
  { id: "melatonin", name: "Melatonin", detail: "Melatonin chewable", doses: ["1mg", "3mg", "5mg"], frequencies: ["Once daily, at bedtime"] },
];

// Case-insensitive, starts-with-ranked-above-contains — deliberately
// simpler than /intake's own ranking (no recentIds/isCommon boosting):
// this picker doesn't track recency, so there was nothing for that
// machinery to do here.
export function searchMedications(query: string, opts?: { limit?: number }): MedicationEntry[] {
  const limit = opts?.limit ?? 6;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const starts: MedicationEntry[] = [];
  const contains: MedicationEntry[] = [];
  for (const entry of MEDICATION_DIRECTORY) {
    const name = entry.name.toLowerCase();
    if (name.startsWith(trimmed)) starts.push(entry);
    else if (name.includes(trimmed)) contains.push(entry);
  }
  return [...starts, ...contains].slice(0, limit);
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

// Mocked "AI structures free text into health-history categories" — same
// convention as structureFreeText() above: a small keyword matcher, never
// the only way to enter data (the quick-select chips below the box always
// work), and the guardian reviews/fixes whatever it finds afterward —
// exactly the framing in the free-text box's own helper copy ("you'll
// review and fix anything after").
export function structureHealthHistoryText(text: string): Partial<Record<MedicalCategoryKey, string[]>> {
  const lower = text.toLowerCase();
  const result: Partial<Record<MedicalCategoryKey, string[]>> = {};

  function add(category: MedicalCategoryKey, value: string) {
    const existing = result[category] ?? [];
    if (!existing.includes(value)) result[category] = [...existing, value];
  }

  const conditionKeywords: Record<string, string> = {
    diabetes: "Diabetes",
    asthma: "Asthma",
    eczema: "Eczema",
    adhd: "ADHD",
    cancer: "Cancer",
  };
  for (const [kw, label] of Object.entries(conditionKeywords)) {
    if (lower.includes(kw)) add("conditions", label);
  }

  const medicationKeywords: Record<string, string> = {
    metformin: "Metformin",
    albuterol: "Albuterol inhaler",
    amoxicillin: "Amoxicillin",
    insulin: "Insulin",
  };
  for (const [kw, label] of Object.entries(medicationKeywords)) {
    if (lower.includes(kw)) add("medications", label);
  }

  if (/appendix|appendectomy/.test(lower)) add("surgeries", "Appendectomy");
  if (/ear tubes?/.test(lower)) add("surgeries", "Ear tubes");
  if (/tonsil/.test(lower)) add("surgeries", "Tonsillectomy");

  if (lower.includes("peanut")) add("allergies", "Peanuts");
  if (lower.includes("penicillin")) add("allergies", "Penicillin");
  if (lower.includes("latex")) add("allergies", "Latex");

  // Family history: a condition keyword mentioned alongside a relative —
  // formatted "Label — Relative" to match how the on-file summary and the
  // quick-select category display family-history entries elsewhere.
  const relativeMatch = lower.match(/\b(mother|father|mom|dad|sister|brother|grandmother|grandfather)\b/);
  if (relativeMatch) {
    const relative = relativeMatch[1];
    const capitalized = relative[0].toUpperCase() + relative.slice(1);
    for (const [kw, label] of Object.entries(conditionKeywords)) {
      if (lower.includes(kw)) add("familyHistory", `${label} — ${capitalized}`);
    }
  }

  return result;
}

// Mock plain-language summary line generator for the Visit Summary — AI
// drafts the sentence, deterministic data supplies every fact in it.
export function summarizeConcern(name: string, reason: string | null, tags: string[]) {
  const bits = [reason, ...tags.filter((t) => t !== reason)].filter(Boolean);
  if (!bits.length) return `${name}'s visit reason is being described.`;
  return `${name} is being seen today for ${bits.join(" and ").toLowerCase()}.`;
}
