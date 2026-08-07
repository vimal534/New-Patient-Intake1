export type InsuranceInfo = {
  provider: string;
  memberId: string;
  planType: string;
  groupNumber: string;
};

export type MoodCheck = "good" | "okay" | "struggling" | null;

export type MedicationEntry = {
  name: string;
  strength: string;
  unit: string;
  frequency: string;
};

export type SavedCard = {
  id: string;
  brand: "visa" | "mastercard";
  last4: string;
  expiry: string; // MM/YY
  expired: boolean;
};

// A patient's saved payment methods — not something they re-enter. The
// rules here are simple: default-select the newest valid card, surface
// expired ones so they're not silently charged, don't ask again otherwise.
export const SAVED_CARDS: SavedCard[] = [
  { id: "mc-4451", brand: "mastercard", last4: "4451", expiry: "09/24", expired: true },
  { id: "visa-0844", brand: "visa", last4: "0844", expiry: "03/28", expired: false },
];

export type NewCardDraft = {
  nameOnCard: string;
  cardNumber: string;
  expiration: string;
  cvv: string;
};

export type PatientData = {
  // Reason for visit is NEVER asked here — it arrives from scheduling and
  // is shown as read-only context on the home screen. `todayNotes` is the
  // one open question the Adaptive Health module asks: not "why are you
  // here" (already known) but "anything new since we last saw you."
  legalFirstName: string;
  legalLastName: string;
  preferredName: string;
  dob: string; // ISO yyyy-mm-dd, for a native date input
  sex: string;
  phone: string;
  streetAddress: string;
  aptSuite: string;
  city: string;
  state: string;
  zip: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  conditions: string[];
  medications: MedicationEntry[];
  allergies: string[];
  todayNotes: string;
  symptomLocation: string;
  moodCheck: MoodCheck;
  screener: string[]; // full PHQ-9/GAD-7 style answers — only ever populated if the mood gate triggers it
  insurance: InsuranceInfo | null;
  payDecision: "paid" | "later" | null;
  paymentMethod: string; // a SAVED_CARDS id, or "new"
  newCard: NewCardDraft;
  saveNewCard: boolean;
  receiptEmail: string;
  consents: { privacy: boolean; treatment: boolean; financial: boolean };
  signature: string;
  // Module 5 — deferred-to-portal. Never blocks check-in; answered now or
  // explicitly pushed to the patient portal.
  deferred: {
    familyHistory: string;
    socialHistory: string;
    advanceDirective: string;
    pushedToPortal: boolean;
  };
};

export const initialPatientData: PatientData = {
  legalFirstName: "Maria",
  legalLastName: "Gonzalez",
  preferredName: "Maria",
  dob: "1970-10-14",
  sex: "Female",
  phone: "(512) 555-0172",
  streetAddress: "2847 Magnolia Way",
  aptSuite: "",
  city: "Austin",
  state: "TX",
  zip: "78704",
  emergencyName: "Carlos Gonzalez",
  emergencyRelationship: "Spouse",
  emergencyPhone: "(512) 555-0173",
  conditions: ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"],
  medications: [
    { name: "Metformin", strength: "1000", unit: "mg", frequency: "Twice daily" },
    { name: "Lisinopril", strength: "10", unit: "mg", frequency: "Once daily" },
    { name: "Atorvastatin", strength: "20", unit: "mg", frequency: "At bedtime" },
  ],
  allergies: ["Penicillin · severe"],
  todayNotes: "",
  symptomLocation: "",
  moodCheck: null,
  screener: [],
  insurance: null,
  payDecision: null,
  // Defaults to the newest valid saved card — paying is a one-tap confirm
  // for the common case, not a re-entry form.
  paymentMethod: "visa-0844",
  newCard: { nameOnCard: "", cardNumber: "", expiration: "", cvv: "" },
  saveNewCard: true,
  receiptEmail: "maria.gonzalez@email.com",
  consents: { privacy: false, treatment: false, financial: false },
  signature: "",
  deferred: {
    familyHistory: "",
    socialHistory: "",
    advanceDirective: "",
    pushedToPortal: false,
  },
};

export type StepId =
  | "home"
  | "ready"
  | "confirm"
  | "health"
  | "insurance"
  | "copay"
  | "consents"
  | "deferred"
  | "done";

// Steps that count toward the overall check-in progress bar, in order.
// "reason" is deliberately absent — Reason for Visit, Provider, Appointment
// Type, Practice, and Date/Time all arrive from scheduling and are shown as
// context on the home screen, never asked again.
export const WIZARD_STEPS: StepId[] = [
  "confirm",
  "health",
  "insurance",
  "copay",
  "consents",
];

export const SECTION_LABEL: Partial<Record<StepId, string>> = {
  health: "Your Health",
  insurance: "Coverage",
  copay: "Coverage",
};

// Local step position within a named section, e.g. "STEP 2 OF 2".
export const SECTION_STEP: Partial<Record<StepId, [number, number]>> = {
  insurance: [1, 2],
  copay: [2, 2],
};

// The Adaptive Health module's internal sub-phases. Most patients only ever
// see "confirm" + "notes" — everything after that is gated by a rule.
export type HealthPhase = "confirm" | "notes" | "crisis" | "symptom" | "mood" | "screener";

export const STORAGE_KEY = "healthpro-checkin-progress";
