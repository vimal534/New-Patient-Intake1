// Validated question bank — static, deterministic, clinically-reviewed data.
// This is the single source of truth for what gets asked and when. AI never
// invents or reorders questions at runtime; it only structures free text
// into fields and drafts the plain-language summary line (see mockAi.ts).
//
// Every question here is answerable from direct observation — no guardian
// is ever asked to self-diagnose or score severity in medical terms
// ("Observe, Don't Diagnose").

export type SymptomQuestion = {
  id: string;
  prompt: (name: string) => string;
  // Short, static label for the captured-summary view once this question
  // is answered — never the full question wording repeated back.
  shortLabel: string;
  options: string[];
  multi?: boolean;
  // Only asked when this returns true. Receives what's known so far —
  // still fully deterministic, just data-driven instead of hardcoded true.
  when?: (ctx: { age: number | null; hasCondition: (c: string) => boolean }) => boolean;
};

export const REASON_CHIPS = [
  "Fever",
  "Cough",
  "Ear pain",
  "Rash",
  "Stomach ache",
  "Injury",
  "Something else",
] as const;

// Keyword → reason/tag mapping used by the mock "AI structures free text"
// step. Deliberately simple pattern matching, not a model call — see
// mockAi.ts for the full disclaimer.
export const FREE_TEXT_TAGS: { pattern: RegExp; tag: string; reason?: string }[] = [
  { pattern: /cough/i, tag: "Cough", reason: "Cough" },
  { pattern: /tired|low energy|lethargic|sleepy|worn out/i, tag: "Low energy" },
  { pattern: /fever|hot to touch|temperature|temp\b/i, tag: "Fever", reason: "Fever" },
  { pattern: /rash|hives|spots/i, tag: "Rash", reason: "Rash" },
  { pattern: /ear/i, tag: "Ear pain", reason: "Ear pain" },
  { pattern: /stomach|tummy|nause|vomit|throw(ing)? up/i, tag: "Stomach upset", reason: "Stomach ache" },
  { pattern: /fell|fall|bump|hit|hurt (his|her|their) (arm|leg|head)/i, tag: "Injury", reason: "Injury" },
  { pattern: /breath|wheez/i, tag: "Breathing changes" },
];

const ACTIVITY_QUESTION: SymptomQuestion = {
  id: "activity",
  prompt: (name) => `How is ${name} acting today?`,
  shortLabel: "How your child is acting",
  options: ["Mostly themselves", "Less active", "Very sleepy"],
};

const DURATION_QUESTION: SymptomQuestion = {
  id: "duration",
  prompt: () => "How long has this been going on?",
  shortLabel: "Started",
  options: ["Since today", "1-2 days", "3 or more days"],
};

const BREATHING_QUESTION: SymptomQuestion = {
  id: "breathing",
  prompt: (name) => `Any trouble breathing, or is ${name} breathing faster than usual?`,
  shortLabel: "Breathing",
  options: ["No", "A little faster than usual", "Working hard to breathe"],
};

const GI_QUESTION: SymptomQuestion = {
  id: "gi",
  prompt: (name) => `Has ${name} vomited or had diarrhea?`,
  shortLabel: "Vomiting / diarrhea",
  options: ["Neither", "Vomiting only", "Diarrhea only", "Both"],
};

// Asked regardless of which tag(s) triggered the branch — fever is broadly
// clinically relevant on its own. Skipped when a tag's own branch already
// covers it (the "Fever" tag's `feverHeight` question) so it's never asked
// twice — see the dedup-by-id logic in SymptomsSection.
export const FEVER_BASELINE_QUESTION: SymptomQuestion = {
  id: "feverBaseline",
  prompt: () => "Any fever along with this?",
  shortLabel: "Fever",
  options: ["No fever", "Felt warm", "Measured 100.4°F / 38°C or higher"],
};

// Keyed by TAG (a REASON_CHIPS value or a FREE_TEXT_TAGS tag), not by a
// single "reason" — Today's Concern can confirm more than one tag (e.g.
// "Cough" + "Low energy" from free text), and each contributes its own
// branch. SymptomsSection unions every confirmed tag's branch and dedupes
// by question id, so overlapping questions (e.g. "duration") only render
// once. "Something else" has no branch here on purpose — it's the one
// case with nothing to look up, handled as a free-text escape hatch
// instead of a deterministic branch (see SymptomsSection).
export const SYMPTOM_QUESTIONS_BY_TAG: Record<string, SymptomQuestion[]> = {
  Fever: [
    {
      id: "feverHeight",
      prompt: () => "What did the temperature read, if you measured it?",
      shortLabel: "Temperature",
      options: ["Didn't measure", "Under 100.4°F / 38°C", "100.4–102°F / 38–39°C", "Over 102°F / 39°C"],
    },
    DURATION_QUESTION,
    {
      id: "otherSigns",
      prompt: () => "Any other signs along with the fever?",
      shortLabel: "Other signs",
      options: ["Rash", "Ear pulling", "Cough", "Vomiting", "None that we've noticed"],
      multi: true,
    },
  ],
  Cough: [
    DURATION_QUESTION,
    BREATHING_QUESTION,
    {
      id: "inhalerUse",
      prompt: (name) => `${name} has mild asthma on file. Using the inhaler more than usual?`,
      shortLabel: "Inhaler use",
      options: ["No more than usual", "A little more", "Much more"],
      when: (ctx) => ctx.hasCondition("Asthma"),
    },
  ],
  "Low energy": [ACTIVITY_QUESTION],
  "Ear pain": [
    {
      id: "ear",
      prompt: (name) => `Which ear seems to be bothering ${name}?`,
      shortLabel: "Which ear",
      options: ["Left", "Right", "Both", "Not sure"],
    },
    DURATION_QUESTION,
    {
      id: "drainage",
      prompt: () => "Any fluid coming from the ear?",
      shortLabel: "Drainage",
      options: ["No", "Yes — clear", "Yes — cloudy or bloody"],
    },
    ACTIVITY_QUESTION,
  ],
  Rash: [
    {
      id: "rashLook",
      prompt: () => "What does the rash look like?",
      shortLabel: "Rash looks like",
      options: ["Flat, red patches", "Raised bumps", "Blisters", "Not sure how to describe it"],
    },
    {
      id: "rashSpread",
      prompt: (name) => `Where is it on ${name}'s body?`,
      shortLabel: "Where on the body",
      options: ["Face", "Trunk/torso", "Arms or legs", "All over"],
      multi: true,
    },
    DURATION_QUESTION,
  ],
  "Stomach ache": [GI_QUESTION, DURATION_QUESTION],
  "Stomach upset": [GI_QUESTION, DURATION_QUESTION], // free-text-derived alias of "Stomach ache" — same question ids, dedupes if both are ever present
  Injury: [
    {
      id: "injurySpot",
      prompt: () => "Where is the injury?",
      shortLabel: "Injury location",
      options: ["Head", "Arm/hand", "Leg/foot", "Torso/back"],
    },
    {
      id: "usingIt",
      prompt: (name) => `Is ${name} able to move and use it normally?`,
      shortLabel: "Using it normally",
      options: ["Yes, normally", "Favoring it a little", "Won't use it at all"],
    },
    DURATION_QUESTION,
  ],
  "Breathing changes": [BREATHING_QUESTION],
};

export const MEDICAL_CATEGORY_LABELS: Record<string, string> = {
  allergies: "Allergies",
  medications: "Medications",
  conditions: "Conditions",
  surgeries: "Surgeries",
  hospitalizations: "Hospitalizations",
  familyHistory: "Family history",
};

export const MEDICAL_CATEGORY_OPTIONS: Record<string, string[]> = {
  allergies: ["Penicillin", "Peanuts", "Tree nuts", "Latex", "Bee stings", "Other"],
  medications: ["Albuterol inhaler", "Amoxicillin", "Daily vitamin", "Other"],
  conditions: ["Asthma", "Eczema", "ADHD", "Diabetes", "Other"],
  surgeries: ["Ear tubes", "Tonsillectomy", "Appendectomy", "Other"],
  hospitalizations: ["Birth/NICU stay", "Respiratory illness", "Other"],
  // Simple condition names, not FAMILY_HISTORY_BANK's fuller sentences
  // ("Asthma in the immediate family") — these are meant as quick-add
  // chips the guardian can pair with a typed "— Mother" / "— Father" etc.,
  // matching how the free-text extractor formats its own family-history
  // entries (see structureHealthHistoryText in mockData.ts).
  familyHistory: ["Diabetes", "Asthma", "Heart disease", "High blood pressure", "Cancer", "Other"],
};

// Family-history bank, tagged with which concerns/risk-flags they're
// relevant for — only the applicable subset is ever shown, never the full
// generic questionnaire.
export const FAMILY_HISTORY_BANK: {
  id: string;
  label: string;
  relevantFor: string[]; // reason chips this applies to
}[] = [
  { id: "asthma", label: "Asthma in the immediate family", relevantFor: ["Cough", "Fever"] },
  { id: "allergies", label: "Severe allergies in the immediate family", relevantFor: ["Rash", "Fever", "Cough"] },
  { id: "eczema", label: "Eczema in the immediate family", relevantFor: ["Rash"] },
  { id: "earInfections", label: "Frequent ear infections in the immediate family", relevantFor: ["Ear pain"] },
  { id: "gi", label: "GI conditions (reflux, IBD) in the immediate family", relevantFor: ["Stomach ache"] },
  { id: "bleeding", label: "Bleeding or clotting disorders in the immediate family", relevantFor: ["Injury"] },
];

export const CONSENT_ITEMS = [
  { id: "treat", label: "Consent to treat a minor" },
  { id: "financial", label: "Financial responsibility agreement" },
  { id: "privacy", label: "Privacy practices notice" },
  { id: "records", label: "Release of records for care coordination" },
];

export const PAYER_CHIPS = ["BlueCross BS", "Aetna", "UnitedHealth", "Cigna", "Other / not sure"];

// The broader searchable list behind Coverage's "Search for your carrier"
// box — PAYER_CHIPS minus "Other / not sure" is still the "Most common"
// quick-pick grid shown above the search results; this is just what
// typing can additionally find. A name here that isn't one of the 4 known
// chips still resolves through matchCarrierChip() same as any typed/OCR'd
// name — picking "Kaiser Permanente" behaves exactly like scanning a card
// and getting an unmatched name back.
export const CARRIER_DIRECTORY = [
  "BlueCross BS",
  "Aetna",
  "UnitedHealth",
  "Cigna",
  "Kaiser Permanente",
  "Humana",
  "Anthem",
];

// Matches a scanned/typed carrier name against the known chip list. Simple
// substring/keyword matching, deliberately — this is what "AI-assisted OCR
// only fills form fields, never decides logic" means in practice: matching
// a string to a chip isn't a clinical or coverage decision.
export function matchCarrierChip(name: string): string | null {
  const normalized = name.toLowerCase();
  const known: Record<string, string> = {
    "bluecross bs": "BlueCross BS",
    "blue cross": "BlueCross BS",
    bcbs: "BlueCross BS",
    aetna: "Aetna",
    unitedhealth: "UnitedHealth",
    "united health": "UnitedHealth",
    uhc: "UnitedHealth",
    cigna: "Cigna",
  };
  for (const [key, chip] of Object.entries(known)) {
    if (normalized.includes(key)) return chip;
  }
  return null;
}
