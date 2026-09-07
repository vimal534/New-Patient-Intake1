// Data-source abstraction (adapter pattern) — every coded-search component
// and every module talks to these interfaces, never to a mock array or a
// real EMR client directly. Swapping the mock adapter (data-source/mock.ts)
// for a real FHIR-backed adapter later means writing a new file that
// implements the same interfaces; zero UI/component changes required.

// --- Coded search (medications, allergens, ...) --------------------------

export type CodedEntry = {
  id: string;
  name: string; // e.g. "Aripiprazole (Abilify)"
  detail: string; // full inline label, e.g. "Abilify 20mg tablet"
  category?: string;
  // Pre-resolved option lists for the dependent name -> dose -> frequency
  // (or allergen -> reaction) chain a coded-search-select field walks
  // through after the initial match is picked.
  doses?: string[];
  frequencies?: string[];
  reactions?: string[];
  isCommon?: boolean; // ranked first in results, ties broken by recency
};

export interface CodedSearchSource {
  // Debounced by the component; the adapter just needs to return ranked
  // results for whatever's already been typed. `recentIds`, when passed,
  // are boosted to the top (mocking "recent/common first").
  search(query: string, opts?: { recentIds?: string[]; limit?: number }): Promise<CodedEntry[]>;
  getById(id: string): Promise<CodedEntry | null>;
}

// --- Patient identity (Demographics confirm-don't-reask) ------------------

export type PatientRecord = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  address: { line1: string; city: string; state: string; zip: string };
  guardian?: { name: string; relationship: string; phone: string };
};

export interface PatientLookupSource {
  // TODO(real EMR): replace with an actual identity-match call (name+DOB+
  // phone, or a QR/link token from a scheduling system). Stub here just
  // returns a fixed record or null so Demographics can exercise the
  // confirm-don't-reask pattern end-to-end against something real-shaped.
  findMatch(query: { firstName: string; lastName: string; dob: string }): Promise<PatientRecord | null>;
}

// --- Demographics -----------------------------------------------------------

export type DemographicsRecordDraft = {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  address: { line1: string; city: string; state: string; zip: string };
  race: string[];
  ethnicity: string[];
  preferredLanguage: string;
  consent: { phoneCall: boolean; text: boolean };
};

export interface DemographicsWriteSource {
  saveDemographics(patientId: string, data: DemographicsRecordDraft): Promise<void>;
}

// --- Additional Patient Info / SOGI ------------------------------------------

// null means the guardian opted out of the section entirely — distinct
// from answering every question "Choose not to disclose."
export type SogiRecordDraft = {
  sexAtBirth: string;
  genderIdentity: string;
  pronouns: string;
  sexualOrientation: string;
} | null;

export interface SogiWriteSource {
  saveSogi(patientId: string, data: SogiRecordDraft): Promise<void>;
}

// --- Guardian / dependent read-write ---------------------------------------

export type GuardianInfo = { name: string; relationship: string; phone: string; email: string };

export type GuardianRecordDraft = {
  guardian: GuardianInfo;
  // Whether this guardian is legally authorized to consent to treatment for
  // the patient — a real clinical/legal requirement for a minor's intake,
  // not just an info field. `false` doesn't block Continue (v1: front-desk
  // follows up), but is a flag the provider summary (Phase 5) must surface.
  legalGuardianConsent: boolean;
  secondaryContact: { name: string; relationship: string; phone: string } | null;
};

export interface GuardianWriteSource {
  saveGuardian(patientId: string, data: GuardianRecordDraft): Promise<void>;
}

// --- Device profile (guarantor auto-populate — Pass 14) --------------------
// Whatever contact info the DEVICE itself has cached — a phone's own
// contact-card / autofill data, NOT a patient/EMR record. Deliberately a
// separate concept from PatientRecord.guardian above: a device's cached
// profile can be stale (the person moved, the number changed) or can
// belong to someone other than whoever is actually checking a patient in
// right now (a grandparent's phone used for pickup one day, a shared
// family tablet, etc.) — see GuarantorModule.tsx's explicit "We think
// this is you" confirm gate, which exists specifically because this data
// is a suggestion, never silently trusted.
export type DeviceProfile = {
  name: string;
  phone: string;
  email: string;
  // Surfaced directly in the confirm UI (GuarantorModule.tsx) so whoever's
  // confirming can judge freshness for themselves — see the compliance
  // flag on DeviceProfileSource below.
  lastVerifiedLabel: string;
};

export interface DeviceProfileSource {
  // Returns null when the device has no cached profile at all (a fresh
  // device, or one that's always declined to save contact info) — the
  // confirm gate simply doesn't render in that case, straight to the
  // existing blank/shortcut picker.
  //
  // ⚠️ COMPLIANCE FLAG (also called out in verify's security files and the
  // chat response this shipped in): device-cached profile data can go
  // stale in a way an EMR-backed record wouldn't — this interface returns
  // `lastVerifiedLabel` as a first attempt at making that risk visible to
  // the person confirming, but whether that's sufficient (vs., say,
  // refusing to auto-populate past some staleness threshold, or requiring
  // re-confirmation more often) is a product/compliance decision, not
  // something resolved by adding a label.
  getProfile(): Promise<DeviceProfile | null>;
}

// --- Guarantor (billing-responsible party — separate from the insurance ---
// subscriber; often the same person, but never assumed to be) -------------

export type GuarantorInfo = { name: string; relationship: string; phone: string; email: string };

export type GuarantorRecordDraft = {
  // Which shortcut prefilled this, for audit/debug — not billing logic.
  // "device" = confirmed off the device's own cached contact profile via
  // the "We think this is you" gate (Pass 14) — distinct from "guardian"
  // (this same pass's guardian answers) since a device-profile match
  // means a HUMAN judgment call ("yes, that's me") happened, not a data
  // shortcut off answers already given.
  source: "guardian" | "subscriber" | "device" | "other";
  guarantor: GuarantorInfo;
  billingSameAsHousehold: boolean;
  billingAddress: { line1: string; city: string; state: string; zip: string } | null;
};

export interface GuarantorWriteSource {
  saveGuarantor(patientId: string, data: GuarantorRecordDraft): Promise<void>;
}

// --- Reason for visit -------------------------------------------------------

export type ReasonForVisitDraft = {
  reasons: string[]; // fixed-option values only — "Other" text lives in otherText
  otherText: string | null;
  injuryDetails: { bodyPart: string; when: string } | null;
};

export interface ReasonForVisitWriteSource {
  saveReasonForVisit(patientId: string, data: ReasonForVisitDraft): Promise<void>;
}

// --- Medication / allergy read-write (FHIR-shaped stubs) -------------------

export type MedicationStatementDraft = {
  medicationId: string;
  medicationName: string;
  dose: string | null; // null = "Not sure"
  frequency: string | null; // null = "Not sure"
  note?: string;
};

export type AllergyIntoleranceDraft = {
  allergenId: string;
  allergenName: string;
  reaction: string | null;
  severity: "mild" | "moderate" | "severe" | null;
};

export interface MedicationWriteSource {
  // TODO(real EMR): POST to a FHIR MedicationStatement endpoint. Stub
  // resolves immediately and is the only thing the Medications module
  // calls to persist — swapping this one function is the entire
  // integration surface.
  saveMedications(patientId: string, meds: MedicationStatementDraft[]): Promise<void>;
}

export interface AllergyWriteSource {
  // TODO(real EMR): POST to a FHIR AllergyIntolerance endpoint.
  saveAllergies(patientId: string, allergies: AllergyIntoleranceDraft[]): Promise<void>;
}

// --- Insurance card OCR (extension point only — no pipeline yet) ----------

export type InsuranceOcrResult = {
  payerName: string | null;
  memberId: string | null;
  groupId: string | null;
  confidence: number; // 0-1; UI auto-fills only above a threshold, see intake/lib/schema/config
};

export interface InsuranceOcrSource {
  // TODO(real OCR): wire to a vision/OCR call. Not implemented this pass —
  // the UI flow (capture front/back -> confidence-gated auto-fill ->
  // manual fallback with "I don't have this value") is the deliverable;
  // this interface is the seam where a real pipeline drops in.
  extract(frontImage: Blob, backImage: Blob): Promise<InsuranceOcrResult>;
}

export type InsuranceFieldEntry = { value: string; notProvided: boolean };

export type InsuranceRecordDraft = {
  ocrConfidence: number | null; // null = card capture was skipped entirely
  payerName: InsuranceFieldEntry;
  memberId: InsuranceFieldEntry;
  groupId: InsuranceFieldEntry;
  subscriberName: string;
  patientRelationToSubscriber: string;
};

export interface InsuranceWriteSource {
  saveInsurance(patientId: string, data: InsuranceRecordDraft): Promise<void>;
}

// --- Screener results (Phase 4) ----------------------------------------------
// Deliberately loosely typed (`Record<string, unknown>`) — an initial
// M-CHAT-R/F pass saves {answers, score, band, atRiskKeys}, its Follow-Up
// saves {confirmed, stillConcerning}, and later instruments (PHQ-9, ASQ-3,
// ...) will each have their own shape again. A real system would give each
// instrument its own typed draft, same as every other module here; this
// stays generic until more than one instrument exists to generalize from.

export interface ScreenerWriteSource {
  saveScreenerResult(patientId: string, screenerId: string, data: Record<string, unknown>): Promise<void>;
}

// --- Review & Submit ---------------------------------------------------------
// Every module already persists its own section as soon as it's completed
// (see each *WriteSource above) — this is a final "the guardian reviewed
// everything and confirmed" event, not the first time any of this data is
// saved. A real EMR integration might use this to flip an encounter from
// draft to ready-for-check-in, or notify front desk, rather than writing
// patient data itself.

export type IntakeSubmission = {
  demographics: DemographicsRecordDraft | null;
  sogi: SogiRecordDraft;
  guardian: GuardianRecordDraft | null;
  insurance: InsuranceRecordDraft | null;
  guarantor: GuarantorRecordDraft | null;
  reasonForVisit: ReasonForVisitDraft | null;
  medications: MedicationStatementDraft[];
  allergies: AllergyIntoleranceDraft[];
};

export interface IntakeSubmissionSource {
  submitIntake(patientId: string, data: IntakeSubmission): Promise<void>;
}
