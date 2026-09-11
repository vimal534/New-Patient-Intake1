import { CatalogItem, DemoScenarioId, FlowKey, Guardian, IntakeState, SavedCard, Scenario, SurgeryItem } from "./types";

// Progress percentages per step — README "Global chrome" table.
export const PCT: Partial<Record<FlowKey, number>> = {
  welcome: 20,
  personal: 30,
  emergency: 38,
  visit: 46,
  coverage: 54,
  ocr: 58,
  payment: 90,
  consent: 99,
  // Scenario 1 (New Patient, Infant) — 26 steps total. "welcome" (the
  // Appointment Landing Page) is the first screen after verification;
  // the six-step Patient Information wizard right after that (see
  // FLOW_NEW_INFANT) — the patient's own basics, the guardian's
  // identity via an ID scan (its own two-screen sub-flow), contact
  // info, demographics, emergency contact, then one combined review.
  patientConfirm: 22,
  guardianIdScan: 28,
  guardianIdReview: 34,
  patientContact: 40,
  patientDemographics: 45,
  patientEmergency: 49,
  patientReview: 52,
  // Health History — 5 separate screens (spec's "duplicate page" fix,
  // one topic per screen, not one long scrolling page): past
  // conditions, surgeries, family history, allergies, medications.
  // Shared with the legacy generic FLOW_NEW/FLOW_RET below.
  health: 50,
  healthSurgeries: 54,
  healthFamily: 58,
  allergies: 61,
  medications: 63,
  pediQuestions: 65,
  // Birth & Prenatal History is one continuous flow (all 4 sections
  // revealed progressively on one screen, each with its own inline
  // "Review your answers" summary — see BirthHistoryFlow.tsx) rather
  // than separate steps, so it only needs one percentage.
  birthHistory: 80,
  consentDisclose: 96,
  // Scenario 2 (New Patient, Adolescent) — 17 steps total.
  socialHistory: 50,
  substanceUse: 68,
  gynHistory: 75,
  // Scenarios 3 & 4 (Returning Patient, Well/Sick Visit) — 8 steps.
  // "health" (shared with the new-patient Health History screens) is
  // reused as-is for the returning-patient Health History summary —
  // see HealthScreen.tsx's isRet branch.
  confirmInfo: 30,
  confirmAdditional: 48,
  consentOnFile: 82,
  // Scenario 5 (Sports Pre-Participation Physical) — 5 steps, the
  // shortest flow on purpose (spec Part 6).
  insuranceManual: 40,
  ppeForm: 75,
};

// Header title per step — replaces the old static "Check-in" label
// with the current section's actual name, mirroring the Eyebrow each
// screen already shows above its own heading. Steps not listed here
// either hide the header entirely (verifyIntro/otp/welcome/success —
// see page.tsx's `showHeader`) or fall back to "Check-in".
export const HEADER_TITLE: Partial<Record<FlowKey, string>> = {
  personal: "Personal information",
  emergency: "Emergency contact",
  patientConfirm: "Patient information",
  guardianIdScan: "Identity verification",
  guardianIdReview: "Identity verification",
  patientContact: "Contact information",
  patientDemographics: "Demographics",
  patientEmergency: "Emergency contact",
  patientReview: "Review",
  visit: "Today's visit",
  coverage: "Coverage",
  ocr: "Coverage",
  // All five Health History categories share one page title (see
  // ListReviewScreen.tsx/HealthScreen.tsx/SurgeriesScreen.tsx/
  // FamilyHistoryScreen.tsx's own Eyebrow, which matches).
  health: "Health history",
  healthSurgeries: "Health history",
  healthFamily: "Health history",
  medications: "Health history",
  allergies: "Health history",
  pediQuestions: "General pediatric questions",
  birthHistory: "Birth & prenatal history",
  consentDisclose: "Consent to disclose",
  socialHistory: "Social history",
  substanceUse: "Substance use",
  gynHistory: "GYN history",
  payment: "Payment",
  consent: "Consent & policies",
  confirmInfo: "Confirm your information",
  confirmAdditional: "Confirm additional information",
  consentOnFile: "Consent on file",
  insuranceManual: "Insurance",
  ppeForm: "Preparticipation physical",
};

// Header title while reviewing a section from the final summary
// (page.tsx's `reviewingFromSuccess`, entered via SuccessScreen's
// checklist) — a plain "Review " + HEADER_TITLE[key] reads redundantly
// for a step whose own title already says "Confirm…" ("Review confirm
// your information"), and "confirmInfo" is also where BOTH the
// "Personal information" and "Insurance & coverage" checklist rows
// land for a returning patient (that one screen covers both — see
// SuccessScreen's CHECKLIST candidates), so its review title covers
// both rather than picking just one. Falls back to "Review " +
// HEADER_TITLE[key] for any reviewable key not listed here.
//
// Every screen that can be reached this way also reads this same map
// for its OWN eyebrow label (the small caps line just above its own
// headline — separate from and rendered below the shared Header this
// table also drives) so the whole screen says "Review …" while
// reviewing, not just the top nav bar.
export const REVIEW_TITLE: Partial<Record<FlowKey, string>> = {
  personal: "Review personal information",
  patientReview: "Review personal information",
  confirmInfo: "Review your information",
  confirmAdditional: "Review your information",
  coverage: "Review insurance & coverage",
  ocr: "Review insurance & coverage",
  health: "Review health history",
  consent: "Review forms & consent",
  consentOnFile: "Review forms & consent",
  payment: "Review payment",
};

// Returning patients review conditions/medications/surgeries/allergies/
// family history as ONE combined Health History screen (see
// HealthScreen.tsx's isRet branch) rather than three separate flow
// steps — so, unlike FLOW_NEW below, `medications` and `allergies` are
// not their own steps here. New patients still build each up from
// scratch on its own screen (unchanged).
export const FLOW_RET: FlowKey[] = [
  "verifyIntro",
  "otp",
  "welcome",
  "personal",
  "emergency",
  "visit",
  "coverage",
  "health",
  "payment",
  "consent",
  "success",
];

export const FLOW_NEW: FlowKey[] = [
  "verifyIntro",
  "otp",
  "welcome",
  "personal",
  "emergency",
  "visit",
  "coverage",
  "ocr",
  "health",
  "medications",
  "allergies",
  "payment",
  "consent",
  "success",
];

// Scenario 1 — New Patient, Infant (Sick Visit). Spec Part 2: Insurance
// is scan-first (coverage capture + OCR confirm, reused as-is), with
// Payment (copay + method + receipt) right after it — insurance is
// confirmed and any due copay collected in the same breath, before
// Health History is 5 separate screens (conditions, surgeries, family,
// allergies, medications — one topic per screen), then the Birth &
// Prenatal wizard — now one continuous flow (BirthHistoryFlow.tsx)
// ending in its own Review summary — then Consent to Disclose and
// consolidated Policies.
//
// Identity verification lands on the Appointment Landing Page
// ("welcome") first — tapping "Start check-in" there is what actually
// begins data collection: the six-step Patient Information wizard
// (patient basics, the guardian's identity verified via an ID scan,
// contact info, demographics, emergency contact, one combined review)
// before the rest of the intake continues.
export const FLOW_NEW_INFANT: FlowKey[] = [
  "verifyIntro",
  "otp",
  "welcome",
  "patientConfirm",
  "guardianIdScan",
  "guardianIdReview",
  "patientContact",
  "patientDemographics",
  "patientEmergency",
  "patientReview",
  "coverage",
  "ocr",
  "payment",
  "health",
  "healthSurgeries",
  "healthFamily",
  "allergies",
  "medications",
  "pediQuestions",
  "birthHistory",
  "consentDisclose",
  "consent",
  "success",
];

// Scenario 2 — New Patient, Adolescent (14, female). Spec Part 3:
// same identity/landing/patient+guardian-info/insurance-scan/
// Health History shape as Scenario 1, but no Birth & Prenatal
// wizard (not a newborn) — instead an entirely-deferrable Social
// History page, then General Pediatric Questions, then age/sex-gated
// Substance Use and GYN History (both apply here: age 14 > 11, sex
// assigned at birth = female). "Additional Patient Information"
// (orientation/gender identity/pronouns, trigger Age >= 18) correctly
// does NOT appear.
export const FLOW_NEW_ADOLESCENT: FlowKey[] = [
  "verifyIntro",
  "otp",
  "welcome",
  "patientConfirm",
  "guardianIdScan",
  "guardianIdReview",
  "patientContact",
  "patientDemographics",
  "patientEmergency",
  "patientReview",
  "coverage",
  "ocr",
  "payment",
  "health",
  "healthSurgeries",
  "healthFamily",
  "allergies",
  "medications",
  "socialHistory",
  "pediQuestions",
  "substanceUse",
  "gynHistory",
  "consentDisclose",
  "consent",
  "success",
];

// Scenarios 3 & 4 — Returning Patient, Well/Sick Visit. Spec Parts
// 4-5: no fresh data entry — every screen is confirm-pattern (what's
// on file, "Update" per screen). Well Visit (Office Visit) includes
// Financial Policies; Sick Visit does not — ConsentScreen.tsx filters
// that doc out for "returning-sick" specifically.
// "confirmInfo" is where insurance-on-file is confirmed (it's a
// section within that screen, not its own step) — Payment follows
// right after it, same "insurance confirmed → copay collected" pairing
// as the new-patient flows above, before "confirmAdditional" moves on
// to the rest of what's on file.
export const FLOW_RETURNING_WELL: FlowKey[] = [
  "verifyIntro",
  "otp",
  "welcome",
  "confirmInfo",
  "payment",
  "confirmAdditional",
  "health",
  "consentOnFile",
  "consent",
  "success",
];

export const FLOW_RETURNING_SICK: FlowKey[] = FLOW_RETURNING_WELL;

// Scenario 5 — Sports Pre-Participation Physical. Spec Part 6:
// intentionally the shortest flow — no demographics, health history,
// or policy re-confirmation, since all of that lives in the existing
// record. Just identity, a fresh insurance page (returning/specialty
// pattern — this visit type needs its own coverage on file) with
// Payment right after it, and the PPE form itself.
export const FLOW_RETURNING_SPORTS: FlowKey[] = [
  "verifyIntro",
  "otp",
  "insuranceManual",
  "payment",
  "ppeForm",
  "success",
];

export const SEED_MEDS: CatalogItem[] = [
  { name: "Metformin", dose: "500 mg", frequency: "Twice daily", detail: "500 mg · Twice daily" },
  { name: "Lisinopril", dose: "10 mg", frequency: "Once daily", detail: "10 mg · Once daily" },
];

// Empty on purpose for the returning demo — the Health History summary
// needs to demonstrate its own empty-state copy ("No known allergies"),
// not just the populated rows.
export const SEED_ALLERGIES: CatalogItem[] = [];

export const SEED_SURGERIES: SurgeryItem[] = [{ name: "Appendectomy", occurrences: [{ month: "", day: "", year: "2018" }] }];

export const MED_CATALOG = [
  "Albuterol",
  "Atorvastatin",
  "Levothyroxine",
  "Lisinopril",
  "Metformin",
  "Omeprazole",
  "Sertraline",
  "Amlodipine",
  "Ibuprofen",
  "Vitamin D",
];
export const MED_DETAILS = ["Once daily", "Twice daily", "As needed", "Not sure"];
export const MED_UNITS = ["mg", "mcg", "mL", "g", "tablet", "unit"];

// Pediatric-appropriate catalog for the new-patient Medications screen
// (MedicationsSection.tsx) — a copy-paste of MED_CATALOG's adult list
// (statins, blood pressure meds) wouldn't fit an infant/adolescent
// intake, so this is its own list rather than a shared one. The
// returning-patient Health History editor keeps using MED_CATALOG
// as-is (that demo scenario is an adult).
export const PEDI_MED_CATALOG = [
  "Acetaminophen (Tylenol)",
  "Ibuprofen (Children's)",
  "Amoxicillin",
  "Albuterol",
  "Cetirizine (Zyrtec)",
  "Diphenhydramine (Benadryl)",
  "Azithromycin",
  "Vitamin D drops",
  "Multivitamin",
  "Probiotic drops",
];

export const ALLERGY_CATALOG = [
  "Penicillin",
  "Sulfa drugs",
  "Aspirin",
  "Latex",
  "Peanuts",
  "Shellfish",
  "Eggs",
  "Pollen",
  "Bee stings",
  "Iodine contrast",
];
export const ALLERGY_DETAILS = ["Mild reaction", "Moderate reaction", "Severe reaction", "Not sure"];
export const ALLERGY_REACTIONS = ["Rash", "Hives", "Swelling", "Itching", "Difficulty breathing", "Anaphylaxis", "Nausea or vomiting", "Not sure"];

export const SURGERY_CATALOG = [
  "Appendectomy",
  "Tonsillectomy",
  "Gallbladder removal",
  "Hernia repair",
  "Knee replacement",
  "Hip replacement",
  "C-section",
  "Cataract surgery",
  "Wisdom teeth removal",
  "Other",
];

export const FAMILY_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Maternal Grandmother",
  "Maternal Grandfather",
  "Paternal Grandmother",
  "Paternal Grandfather",
];

// Standard OMB race/ethnicity categories — PatientInfoScreen.tsx's
// "Additional information" card uses these as dropdown options rather
// than a free-text field.
export const RACE_OPTIONS = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or more races",
  "Prefer not to say",
];

export const ETHNICITY_OPTIONS = ["Hispanic or Latino", "Not Hispanic or Latino", "Prefer not to say"];

// Parent/Guardian "Relationship to patient" — PatientInfoScreen.tsx,
// both the primary guardian card and the optional second guardian
// (previously free text for both).
export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Step-parent",
  "Grandparent",
  "Legal guardian",
  "Foster parent",
  "Other relative",
  "Other",
];

// Emergency contact "Relationship to patient" — PatientEmergencyScreen.tsx.
// Broader than GUARDIAN_RELATIONSHIP_OPTIONS above since an emergency
// contact need not be a parent/guardian at all (spouse, sibling, friend
// are all common answers here).
export const EMERGENCY_RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Spouse",
  "Sibling",
  "Grandparent",
  "Other relative",
  "Friend",
  "Other",
];

// Standard USPS two-letter codes — used by the Street address block's
// State dropdown (PatientInfoScreen.tsx, both the patient/guardian1
// card and the optional second guardian).
export const US_STATE_OPTIONS = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// ZIP → City/State autofill — a small fixed lookup rather than a real
// geocoding service, since this is a self-contained demo with no
// backend. Covers every ZIP used by the scenario seeds below (so a
// pre-filled address round-trips through the split fields correctly)
// plus a handful of other well-known ZIPs so the autofill still feels
// real when a patient types one of their own. An unrecognized ZIP
// simply leaves City/State exactly as they were — never an error,
// since those fields stay hand-editable either way.
export const ZIP_LOOKUP: Record<string, { city: string; state: string }> = {
  "33131": { city: "Miami", state: "FL" },
  "33134": { city: "Miami", state: "FL" },
  "33101": { city: "Miami", state: "FL" },
  "10001": { city: "Oakwood", state: "NY" },
  "10002": { city: "New York", state: "NY" },
  "10016": { city: "New York", state: "NY" },
  "90210": { city: "Beverly Hills", state: "CA" },
  "94102": { city: "San Francisco", state: "CA" },
  "60601": { city: "Chicago", state: "IL" },
  "02108": { city: "Boston", state: "MA" },
  "75201": { city: "Dallas", state: "TX" },
  "30301": { city: "Atlanta", state: "GA" },
  "98101": { city: "Seattle", state: "WA" },
  "85001": { city: "Phoenix", state: "AZ" },
  "80202": { city: "Denver", state: "CO" },
};

// Splits a demo seed's combined "Street, City, State ZIP" string into
// the separate fields the Street address block now uses — so each
// scenario's address stays a single readable literal below instead of
// four parallel ones that could drift out of sync. Falls back to
// putting the whole string in `address` (street) with everything else
// blank if it doesn't match that shape.
export function addressParts(full: string): { address: string; city: string; state: string; zip: string } {
  const m = full.match(/^(.*),\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5})$/);
  if (!m) return { address: full, city: "", state: "", zip: "" };
  return { address: m[1].trim(), city: m[2].trim(), state: m[3].trim().toUpperCase(), zip: m[4].trim() };
}

// New-patient minor scenarios (Scenario 1 & 2) — OcrScreen.tsx's
// "Is [guardian] the policyholder?" follow-up.
export const POLICYHOLDER_SCENARIOS = ["new-infant", "new-adolescent"];

export const POLICYHOLDER_RELATIONSHIPS = ["Parent", "Grandparent", "Legal guardian", "Other relative", "Other"];

// PediQuestionsScreen.tsx — fixed value lists from the source config
// (both were built as free text; the config lists them as dropdowns).
export const ACCOMPANYING_OPTIONS = [
  "Mother",
  "Father",
  "Both parents",
  "Self",
  "Step-parent",
  "Grandparent",
  "Sibling",
  "Nanny/babysitter",
  "Other, related",
  "Other, non-related",
];
export const HOME_LANGUAGE_OPTIONS = ["English", "Spanish", "English + Spanish", "Creole", "French", "Other"];

export const COMMON_CONDS = [
  "High blood pressure",
  "Diabetes",
  "Asthma",
  "Thyroid condition",
  "Depression or anxiety",
  "PCOS",
  "Endometriosis",
  "Uterine fibroids",
];

export const MORE_CONDS = [
  "Migraine",
  "Arthritis",
  "High cholesterol",
  "Sleep apnea",
  "Acid reflux",
  "Anemia",
  "Kidney disease",
  "Heart disease",
  "Epilepsy",
  "Chronic pain",
  "COPD",
  "Eczema",
];

export const SEED_CARDS: SavedCard[] = [
  { id: "v1", brand: "VISA", name: "Visa •••• 4545", last4: "4545", exp: "03/28", expired: false, isDefault: true },
];

// One row per demo scenario — see DemoSheet.tsx's picker. Only
// "new-infant" (Scenario 1) has a fully built flow so far; the other
// four seed rows exist so their Scheduling Recap/identity copy is
// ready as each scenario gets built out.
export const SCENARIO_LABEL: Record<DemoScenarioId, { title: string; subtitle: string; built: boolean }> = {
  "new-infant": { title: "Infant, Sick Visit", subtitle: "New patient, 3 months old", built: true },
  "new-adolescent": { title: "Adolescent, 14 (female)", subtitle: "New patient, first visit", built: true },
  "returning-well": { title: "Well Visit, 6yo", subtitle: "Returning patient, office visit", built: true },
  "returning-sick": { title: "Infant, Sick Visit", subtitle: "Returning patient, 3 months old", built: true },
  "returning-sports": { title: "Sports Physical, 16yo", subtitle: "Returning patient", built: true },
};

const EMPTY_GUARDIAN: Guardian = { name: "", relationship: "", mobile: "", address: "", occupation: "" };

export const SCENARIO_SEEDS: Record<
  DemoScenarioId,
  {
    scheduling: IntakeState["scheduling"];
    phoneOnFile: string;
    guardian1: Guardian;
    patientDob?: string;
    patientSex?: string;
    patientAddress?: string;
    patientEmail?: string;
    carrier: string;
    memberId: string;
    groupValue: string;
  }
> = {
  "new-infant": {
    scheduling: {
      patientName: "Emma Rodriguez",
      age: "3 months old (DOB 06/12/2026)",
      reason: "Sick Visit, New Patient",
      providerName: "Dr. Sarah Jenkins",
      providerEmail: "s.jenkins@healthproclinic.com",
    },
    phoneOnFile: "(***) ***-4471",
    guardian1: { name: "Maria Rodriguez", relationship: "Mother", mobile: "(305) 555-4471", address: "42 Palm Ave, Miami, FL 33131", occupation: "" },
    patientDob: "06/12/2026",
    patientSex: "Female",
    patientAddress: "42 Palm Ave, Miami, FL 33131",
    patientEmail: "maria.rodriguez@email.com",
    carrier: "Blue Shield PPO",
    memberId: "VZ48213",
    groupValue: "00921",
  },
  "new-adolescent": {
    scheduling: {
      patientName: "Ava Thompson",
      age: "14 years old (DOB 03/22/2012)",
      reason: "New Patient Visit",
      providerName: "Dr. Sarah Jenkins",
      providerEmail: "s.jenkins@healthproclinic.com",
    },
    phoneOnFile: "(***) ***-2290",
    guardian1: { name: "Karen Thompson", relationship: "Mother", mobile: "(305) 555-2290", address: "88 Coral Way, Miami, FL 33134", occupation: "" },
    patientDob: "03/22/2012",
    patientSex: "Female",
    patientAddress: "88 Coral Way, Miami, FL 33134",
    patientEmail: "ava.thompson@email.com",
    carrier: "Aetna PPO",
    memberId: "AE93217",
    groupValue: "44102",
  },
  "returning-well": {
    scheduling: {
      patientName: "Lily Doe",
      age: "",
      reason: "Well Visit, Office Visit",
      providerName: "Dr. Sarah Jenkins",
      providerEmail: "s.jenkins@healthproclinic.com",
    },
    phoneOnFile: "(***) ***-0172",
    guardian1: { name: "Jane Doe", relationship: "Mother", mobile: "(555) 123-4567", address: "123 Main Street, Oakwood, NY 10001", occupation: "Teacher" },
    patientDob: "04/11/2020",
    patientAddress: "123 Main Street, Oakwood, NY 10001",
    patientEmail: "jane.doe@email.com",
    carrier: "Blue Shield PPO",
    memberId: "VZ48213",
    groupValue: "00921",
  },
  "returning-sick": {
    scheduling: {
      patientName: "Leo Lee",
      age: "3 months old (DOB 07/02/2026)",
      reason: "Sick Visit",
      providerName: "Dr. Sarah Jenkins",
      providerEmail: "s.jenkins@healthproclinic.com",
    },
    phoneOnFile: "(***) ***-7734",
    guardian1: { name: "David Lee", relationship: "Father", mobile: "(555) 774-4901", address: "56 Birchwood Ln, Oakwood, NY 10001", occupation: "Software Engineer" },
    patientDob: "07/02/2026",
    patientAddress: "56 Birchwood Ln, Oakwood, NY 10001",
    patientEmail: "david.lee@email.com",
    carrier: "UnitedHealthcare",
    memberId: "UH77341",
    groupValue: "11780",
  },
  "returning-sports": {
    scheduling: {
      patientName: "Alex Kim",
      age: "",
      reason: "Sports Pre-Participation Physical",
      providerName: "Dr. Sarah Jenkins",
      providerEmail: "s.jenkins@healthproclinic.com",
    },
    phoneOnFile: "(***) ***-5588",
    guardian1: { name: "Susan Kim", relationship: "Mother", mobile: "(555) 558-2210", address: "9 Maple Ct, Oakwood, NY 10001", occupation: "Nurse" },
    patientDob: "01/17/2010",
    patientAddress: "9 Maple Ct, Oakwood, NY 10001",
    patientEmail: "alex.kim@email.com",
    carrier: "Cigna PPO",
    memberId: "CG55829",
    groupValue: "33902",
  },
};

// "Confirm Additional Information" (Scenarios 3 & 4) always shows both
// parents on file — the second one isn't collected anywhere in these
// returning flows, so it's seeded directly rather than left blank.
export const SCENARIO_GUARDIAN2: Partial<Record<DemoScenarioId, Guardian>> = {
  "returning-well": { name: "John Doe", relationship: "Father", mobile: "(555) 891-2234", address: "123 Main Street, Oakwood, NY 10001", occupation: "Accountant" },
  "returning-sick": { name: "Michelle Lee", relationship: "Mother", mobile: "(555) 774-9021", address: "56 Birchwood Ln, Oakwood, NY 10001", occupation: "Physician" },
};

export function initialState(scenario: Scenario, demoScenarioId?: DemoScenarioId): IntakeState {
  const demoId: DemoScenarioId = demoScenarioId ?? (scenario === "returning" ? "returning-well" : "new-infant");
  const seed = SCENARIO_SEEDS[demoId];
  return {
    scenario,
    demoScenarioId: demoId,
    idx: 0,
    demoOpen: false,
    demoCategoryOpen: null,

    scheduling: seed.scheduling,

    otp: "",
    acked: false,

    phoneOnFile: seed.phoneOnFile,
    identityFallbackOpen: false,
    reviewingFromSuccess: false,
    reviewingFromPatientReview: false,

    guardianIdScanning: false,
    guardianIdManual: false,
    guardianIdNumber: "",
    guardianIdIssuingState: "",
    guardianIdExpiration: "",

    additionalOpen: false,
    editingPersonal: false,
    personal: { dob: seed.patientDob ?? "", email: seed.patientEmail ?? "", ...addressParts(seed.patientAddress ?? "") },

    emergencyUpdating: false,
    emergency: { name: "", relation: "", phone: "" },

    // Skip the "Is this what you're coming in for?" confirm gate — land
    // directly on the "A few details" reason-card + symptom question.
    visitConfirmed: true,
    visitAnswer: null,
    visitOtherText: "",

    coverageChanging: false,
    manualEntry: false,
    carrier: seed.carrier,
    memberId: seed.memberId,
    memberName: seed.guardian1.name,
    scanning: false,
    groupFixed: false,
    groupValue: seed.groupValue,
    scanBlurry: false,
    scanRetried: false,
    ocrFieldsEditing: false,
    backScanned: false,

    eligibility: "idle",

    meds: scenario === "returning" ? [...SEED_MEDS] : [],
    allergies: scenario === "returning" ? [...SEED_ALLERGIES] : [],
    medsEditing: scenario !== "returning",
    allergiesEditing: scenario !== "returning",
    medsNone: false,
    allergiesNone: false,
    surgeriesNone: false,
    familyNone: false,

    privacyOpen: false,

    hv: scenario === "returning" ? "review" : "pick",
    onFileConds: scenario === "returning" ? ["High blood pressure", "Diabetes"] : [],
    noneConds: false,
    pendingRemove: null,
    lastConfirmed: "Aug 18, 2026",

    surgeries: scenario === "returning" ? [...SEED_SURGERIES] : [],
    familyHistory: [],
    hhEditing: null,
    hhConfirmed: { conditions: false, medications: false, surgeries: false, allergies: false, family: false },

    cardSheetOpen: false,
    cardNumber: "",
    paid: false,

    cards: scenario === "returning" ? [...SEED_CARDS] : [],
    selectedCardId: scenario === "returning" ? "v1" : null,
    methodsOpen: false,
    authSheetOpen: false,
    cardExp: "",
    cardCvc: "",
    cardName: "",
    saveCardChecked: true,

    consentFullOpen: false,
    financialOpen: false,
    agreed: false,
    signed: false,

    passport: "offer",

    guardian1: { ...seed.guardian1, ...addressParts(seed.guardian1.address) },
    guardian2Adding: false,
    guardian2: SCENARIO_GUARDIAN2[demoId]
      ? { ...SCENARIO_GUARDIAN2[demoId], ...addressParts(SCENARIO_GUARDIAN2[demoId]!.address) }
      : { ...EMPTY_GUARDIAN },

    policyholderIsGuardian: null,
    policyholderDob: "",
    policyholderName: "",
    policyholderRelationship: "",
    policyholderAddress: "",

    sexAssignedAtBirth: seed.patientSex ?? "",
    race: "",
    ethnicity: "",
    preferredLanguage: "",

    pediAccompanying: "",
    pediHomeLanguage: "",
    pediPoolFenced: "",
    pediGunsSafe: "",

    birth: {
      pregnancyIllness: "",
      pregnancyInfections: "",
      pregnancyMeds: "",
      pregnancyMedsList: "",
      pregnancySubstances: "",
      deliveryGestationalAge: "39",
      deliveryHospital: "Mount Sinai Miami",
      deliveryType: "Vaginal",
      deliveryComplications: "No",
      deliveryComplicationsDetails: "",
      hospitalizationComplications: "No",
      hospitalizationComplicationsDetails: "",
      birthWeightLb: "",
      birthWeightOz: "",
      dischargeWeightLb: "",
      dischargeWeightOz: "",
      jaundice: "",
      hearingTest: "",
      heelPrick: "",
      breastfeeding: "",
      formulaFed: "",
      formulaType: "",
      wetDiapers: "",
      bowelMovements: "",
    },
    birthSection: 0,

    consentDiscloseYes: null,
    authorizedPersons: [],
    authPersonAdding: false,
    authPersonEditingIndex: null,
    authPersonDraft: { name: "", relationship: "", phone: "", access: "", otherSpecify: "" },

    social: {
      familySocialChanges: "",
      childCareType: "",
      pets: "",
      smokeDetectors: "",
      passiveSmokeExposure: "",
      sunscreenUse: "",
      parentsMaritalStatus: "",
      seatbeltCarSeat: "",
    },
    substance: {
      tobaccoUse: "",
      otherTobaccoProducts: "",
      tobaccoScreeningDate: "",
      alcoholLevel: "",
      illicitDrugUse: "",
    },
    gyn: {
      hasStartedPeriods: "",
      ageAtFirstPeriod: "",
      regularCycle: "",
      periodsOverSevenDays: "",
      severeCramping: "",
      lastPeriodDate: "",
      birthControlMethod: "",
    },

    confirmInfoEditing: false,
    confirmAdditionalEditing: false,
    consentOnFileEditing: false,
    policiesEditing: false,
    completedBy: seed.guardian1.name ? `${seed.guardian1.name} (Patient Portal)` : "",
    ppeSigned: false,

    toastMessage: null,
    toastId: 0,

    intakeCompleted: false,
  };
}
