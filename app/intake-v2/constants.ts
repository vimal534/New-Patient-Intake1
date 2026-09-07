import { CatalogItem, FlowKey, IntakeState, SavedCard, Scenario, SurgeryItem } from "./types";

// Progress percentages per step — README "Global chrome" table.
export const PCT: Partial<Record<FlowKey, number>> = {
  welcome: 20,
  personal: 30,
  emergency: 38,
  visit: 46,
  coverage: 54,
  ocr: 58,
  health: 66,
  medications: 72,
  allergies: 78,
  screener: 84,
  payment: 90,
  consent: 95,
  review: 99,
};

// Returning patients review conditions/medications/surgeries/allergies/
// family history as ONE combined Health History screen (see
// HealthScreen.tsx's isRet branch) rather than three separate flow
// steps — so, unlike FLOW_NEW below, `medications` and `allergies` are
// not their own steps here. New patients still build each up from
// scratch on its own screen (unchanged).
export const FLOW_RET: FlowKey[] = [
  "otp",
  "welcome",
  "personal",
  "emergency",
  "visit",
  "coverage",
  "health",
  "screener",
  "payment",
  "consent",
  "review",
  "success",
];

export const FLOW_NEW: FlowKey[] = [
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
  "screener",
  "payment",
  "consent",
  "review",
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

export const SEED_SURGERIES: SurgeryItem[] = [{ name: "Appendectomy", year: "2018" }];

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

export const SCREENERS: { q: string; opts: string[] }[] = [
  {
    q: "Over the last two weeks, how often have you felt down, depressed or hopeless?",
    opts: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  {
    q: "How often have you had little interest or pleasure in doing things?",
    opts: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
  },
  { q: "Do you feel safe at home?", opts: ["Yes", "No", "Prefer not to answer"] },
];

export const SEED_CARDS: SavedCard[] = [
  { id: "v1", brand: "VISA", name: "Visa •••• 4545", last4: "4545", exp: "03/28", expired: false, isDefault: true },
];

export function initialState(scenario: Scenario): IntakeState {
  return {
    scenario,
    idx: 0,
    demoOpen: false,

    otp: "",
    acked: false,

    additionalOpen: false,
    editingPersonal: false,
    personal: { dob: "", email: "", address: "" },

    emergencyUpdating: false,
    emergency: { name: "", relation: "", phone: "" },

    visitConfirmed: false,
    visitAnswer: null,

    coverageChanging: false,
    coverageEditing: false,
    manualEntry: false,
    carrier: "",
    memberId: "",
    scanning: false,
    groupFixed: false,
    groupValue: "",
    backScanned: false,

    eligibility: "idle",

    meds: scenario === "returning" ? [...SEED_MEDS] : [],
    allergies: scenario === "returning" ? [...SEED_ALLERGIES] : [],
    medsEditing: scenario !== "returning",
    allergiesEditing: scenario !== "returning",

    privacyOpen: false,

    addSheet: null,
    addQuery: "",
    addPicks: [],
    addDetail: null,

    hv: scenario === "returning" ? "review" : "pick",
    onFileConds: scenario === "returning" ? ["High blood pressure", "Diabetes"] : [],
    selectedConds: [],
    noneConds: false,
    showMore: false,
    condSearch: "",
    pendingRemove: null,
    lastConfirmed: "Aug 18, 2026",

    surgeries: scenario === "returning" ? [...SEED_SURGERIES] : [],
    familyHistory: [],
    hhEditing: null,
    hhConfirmed: { conditions: false, medications: false, surgeries: false, allergies: false, family: false },
    hhCondAdding: false,
    medEditingIndex: null,
    medDraftName: "",
    medDraftDose: "",
    medDraftFrequency: "",
    surgeryDraftName: "",
    surgeryDraftYear: "",
    familyDraft: "",

    screenerIdx: 0,
    screenerAnswers: [],

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
    agreed: false,
    signed: false,

    passport: "offer",

    toastMessage: null,
    toastId: 0,
  };
}
