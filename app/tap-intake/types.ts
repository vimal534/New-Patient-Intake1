// Data model for the tap-first pediatric intake experience.
//
// Deliberate separation (per spec): input data (what was answered) vs.
// section completion status (whether a section is done). The summary panel
// and section shells render off `sectionStatus` only — never off guessing
// whether a field happens to be non-empty. `sectionStatus` is only ever
// flipped by the reducer's MARK_SECTION_READY / REOPEN_SECTION actions, each
// fired by an explicit user action (a "Continue" tap, a "Nothing changed"
// tap, etc.), never inferred.

export type PatientType = "new" | "returning";

export const SECTION_KEYS = [
  "concern",
  "symptoms",
  "childDetails",
  "medicalHistory",
  "familyHistory",
  "guardian",
  "coverage",
  "payment",
  "consents",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionStatus = "not_started" | "in_progress" | "ready";

export type ChildInfo = {
  name: string;
  dob: string; // free text, e.g. "2020-03-14" — kept simple for the prototype
  age: number | null; // null until known (new patient, before Child Details)
  sex: string | null;
};

export type ConcernState = {
  reason: string | null; // a REASON_CHIPS value, or "Something else"
  reasonSource: "tapped" | "inferred" | null; // "inferred" = pulled from free text, tier-1 style
  freeText: string;
  structuredSymptoms: string[]; // mock-AI tags extracted from freeText
};

export const MEDICAL_CATEGORY_KEYS = [
  "allergies",
  "medications",
  "conditions",
  "surgeries",
  "hospitalizations",
] as const;

export type MedicalCategoryKey = (typeof MEDICAL_CATEGORY_KEYS)[number];

export type MedicalHistoryState = {
  // New-patient mode: which categories the guardian flagged as relevant.
  selectedCategories: MedicalCategoryKey[];
  detail: Record<MedicalCategoryKey, string[]>;
  // Returning-patient mode: confirm-first. `reviewed` flips true on either
  // "Nothing changed" or after at least one changed category is saved.
  reviewed: boolean;
  changedCategories: MedicalCategoryKey[]; // categories the guardian opened via "Something changed"
};

export type FamilyHistoryItem = { id: string; label: string; relative?: string };

export type FamilyHistoryState = {
  applicable: string[]; // ids of items relevant to this visit (concern/age/risk-flag filtered)
  selected: string[]; // new-patient: ids guardian confirmed apply
  reviewed: boolean; // returning-patient: confirmed via Nothing/Something changed
  changed: boolean;
};

export type GuardianState = {
  name: string;
  relationship: string | null;
  phone: string;
  email: string;
  isPolicyholder: boolean;
  reviewed: boolean; // returning-patient confirm
  changed: boolean;
};

export type CoverageState = {
  payer: string | null;
  // Free text for the carrier name when `payer` is "Other / not sure" —
  // typed directly, or the raw scanned text when a card scan doesn't match
  // any known carrier chip.
  payerOtherText: string;
  policyNumber: string;
  groupId: string;
  // "I don't have this value" — Group ID is frequently absent from cards,
  // so an empty field must never silently read as "not answered."
  noGroupId: boolean;
  // True right after a scan fills these fields, so the UI can show the
  // same "here's what we found, edit if it's off" banner used for other
  // reused/confirmed data — cleared the moment the guardian edits a field
  // by hand, since at that point it's their entry, not the scan's.
  scannedFromCard: boolean;
  copay: string;
  reviewed: boolean;
  changed: boolean;
};

export type PaymentState = {
  method: "on_file" | "new_card" | "at_visit" | null;
  cardLast4: string;
  newCard: { number: string; exp: string; zip: string };
};

export type ConsentItemState = { id: string; label: string; acknowledged: boolean };

export type ConsentsState = {
  signedBy: string; // reused from guardian.name — never re-asked
  items: ConsentItemState[];
};

export type SymptomAnswers = Record<string, string | string[]>;

export type VisitState = {
  patientType: PatientType | null;
  child: ChildInfo;
  concern: ConcernState;
  symptomAnswers: SymptomAnswers;
  medicalHistory: MedicalHistoryState;
  familyHistory: FamilyHistoryState;
  guardian: GuardianState;
  coverage: CoverageState;
  payment: PaymentState;
  consents: ConsentsState;
  sectionStatus: Record<SectionKey, SectionStatus>;
  activeSection: SectionKey | null; // which section is currently expanded/interactive
};
