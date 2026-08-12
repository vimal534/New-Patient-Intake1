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

export type AllergyEntry = {
  name: string;
  severity: string;
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

export type CopayLineItem = { id: string; label: string; amount: number };

// The copay isn't always one flat number — a visit can bill separately for
// the office visit itself vs. services rendered during it. The patient can
// choose to pay some of these now and leave the rest for the front desk.
export const COPAY_LINE_ITEMS: CopayLineItem[] = [
  { id: "visit", label: "Office visit copay", amount: 25 },
  { id: "labs", label: "Lab work copay", amount: 15 },
];

export const COPAY_TOTAL = COPAY_LINE_ITEMS.reduce((sum, i) => sum + i.amount, 0);

export function copayPayingNow(selectedIds: string[]): number {
  return COPAY_LINE_ITEMS.filter((i) => selectedIds.includes(i.id)).reduce((sum, i) => sum + i.amount, 0);
}

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
  allergies: AllergyEntry[];
  todayNotes: string;
  symptomLocation: string;
  // Populated only when free text matches a symptom with a validated
  // structured follow-up set (e.g. dizziness) — the rules engine picked
  // this question set, the AI didn't invent it.
  symptomOnset: string;
  symptomTriggers: string[];
  symptomSeverity: string;
  // What's already on file — used to decide whether a follow-up is a fresh
  // question or a "is this still right?" confirmation of something known.
  smokingStatus: string;
  smokingStatusUpdate: string;
  smokingQuitWhen: string;
  moodCheck: MoodCheck;
  screener: string[]; // full PHQ-9/GAD-7 style answers — only ever populated if the mood gate triggers it
  insurance: InsuranceInfo | null;
  payDecision: "paid" | "later" | null;
  paymentMethod: string; // a SAVED_CARDS id, or "new"
  newCard: NewCardDraft;
  saveNewCard: boolean;
  receiptEmail: string;
  selectedCopayItems: string[]; // which COPAY_LINE_ITEMS to pay now
  // The CVV for whichever payment method is currently selected — cleared
  // whenever the selection changes, since re-verifying it per-transaction
  // is the point, even for a card already on file.
  paymentCvv: string;
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
  allergies: [{ name: "Penicillin", severity: "Severe" }],
  todayNotes: "",
  symptomLocation: "",
  symptomOnset: "",
  symptomTriggers: [],
  symptomSeverity: "",
  // A returning patient's chart already says this — the follow-up should
  // read as "is this still right?", not "do you smoke?" from scratch.
  smokingStatus: "Current smoker",
  smokingStatusUpdate: "",
  smokingQuitWhen: "",
  moodCheck: null,
  screener: [],
  // Insurance is already on file for a returning patient — the default
  // experience is confirming it's still current, not scanning a card.
  insurance: {
    provider: "Blue Cross Blue Shield",
    memberId: "BXP77214832",
    planType: "PPO",
    groupNumber: "BCBS-77291",
  },
  payDecision: null,
  // Defaults to the newest valid saved card — paying is a one-tap confirm
  // for the common case, not a re-entry form.
  paymentMethod: "visa-0844",
  newCard: { nameOnCard: "", cardNumber: "", expiration: "", cvv: "" },
  saveNewCard: true,
  receiptEmail: "maria.gonzalez@email.com",
  // Default to paying everything now — partial payment is an opt-out via
  // unchecking an item, not the default state.
  selectedCopayItems: COPAY_LINE_ITEMS.map((i) => i.id),
  paymentCvv: "",
  // For a returning patient with no policy changes, consents are already
  // affirmed — the UX shouldn't force reopening documents that haven't
  // changed. A practice whose documents *did* change, or a first-time
  // patient, would have this default to false via configuration instead.
  consents: { privacy: true, treatment: true, financial: true },
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
  confirm: "About You",
  health: "Your Health",
  insurance: "Coverage",
  copay: "Coverage",
  consents: "Almost Done",
};

// Rough minutes budgeted per step — patients care about time remaining,
// not "step 7 of 15". Total is ~5 min, matching the home screen's estimate.
export const STEP_TIME_BUDGET_MIN: Record<StepId, number> = {
  home: 0,
  ready: 0,
  confirm: 1,
  health: 2,
  insurance: 0.5,
  copay: 0.5,
  consents: 1,
  deferred: 0,
  done: 0,
};

export const TOTAL_CHECKIN_MINUTES = WIZARD_STEPS.reduce(
  (sum, s) => sum + STEP_TIME_BUDGET_MIN[s],
  0
);

export function minutesRemaining(fromStep: StepId, fromStepFraction = 1): number {
  const idx = WIZARD_STEPS.indexOf(fromStep);
  if (idx === -1) return 0;
  let total = STEP_TIME_BUDGET_MIN[fromStep] * fromStepFraction;
  for (let i = idx + 1; i < WIZARD_STEPS.length; i++) {
    total += STEP_TIME_BUDGET_MIN[WIZARD_STEPS[i]];
  }
  return total;
}

export function formatTimeLeft(minutes: number): string {
  if (minutes <= 0.25) return "Almost done";
  if (minutes < 1) return "~1 min";
  return `~${Math.round(minutes)} min`;
}

// The Adaptive Health module's internal sub-phases. Most patients only ever
// see "confirm" + "notes" — everything after that is gated by a rule, and
// each gate only fires for information that isn't already known:
// "symptomOnset"/"symptomTriggers"/"breathingContext" are validated
// structured question sets the rules engine selects for a specific symptom
// (dizziness / respiratory) — but only when free text didn't already state
// it (e.g. "for three days" answers "when did it start?" without asking).
// "smokingCheck"/"smokingSince" are the "connect existing history" step —
// confirming what's on file, not re-collecting it from zero.
// "symptom" is the generic fallback (body location) for symptoms without
// their own dedicated set yet.
export type HealthPhase =
  | "confirm"
  | "notes"
  | "crisis"
  | "symptom"
  | "symptomOnset"
  | "symptomTriggers"
  | "breathingContext"
  | "smokingCheck"
  | "smokingSince"
  | "mood"
  | "screener";

export const STORAGE_KEY = "healthpro-checkin-progress";
