// The concrete adapter every component/module actually depends on right
// now. Swapping to a real terminology service / FHIR EMR later means
// writing a new file that implements `CodedSearchSource` /
// `MedicationWriteSource` / `AllergyWriteSource` and pointing the modules
// at it — no changes to CodedSearchSelectField or the Medications module.

import {
  CodedEntry,
  CodedSearchSource,
  DemographicsRecordDraft,
  DemographicsWriteSource,
  SogiRecordDraft,
  SogiWriteSource,
  GuardianRecordDraft,
  GuardianWriteSource,
  DeviceProfile,
  DeviceProfileSource,
  GuarantorRecordDraft,
  GuarantorWriteSource,
  InsuranceOcrResult,
  InsuranceOcrSource,
  InsuranceRecordDraft,
  InsuranceWriteSource,
  IntakeSubmission,
  IntakeSubmissionSource,
  ReasonForVisitDraft,
  ReasonForVisitWriteSource,
  ScreenerWriteSource,
  MedicationWriteSource,
  AllergyWriteSource,
  PatientLookupSource,
  PatientRecord,
} from "./types";
import { searchMedications, getMedicationById } from "./mockMedications";
import { searchAllergens, getAllergenById } from "./mockAllergens";

class MockCodedSearchSource implements CodedSearchSource {
  constructor(
    private searchFn: (query: string, opts?: { recentIds?: string[]; limit?: number }) => CodedEntry[],
    private getByIdFn: (id: string) => CodedEntry | null
  ) {}

  async search(query: string, opts?: { recentIds?: string[]; limit?: number }): Promise<CodedEntry[]> {
    // Simulated latency so loading/debounce states have something real to
    // resolve against instead of firing instantly.
    await new Promise((resolve) => setTimeout(resolve, 120));
    return this.searchFn(query, opts);
  }

  async getById(id: string): Promise<CodedEntry | null> {
    return this.getByIdFn(id);
  }
}

export const medicationSource: CodedSearchSource = new MockCodedSearchSource(searchMedications, getMedicationById);
export const allergenSource: CodedSearchSource = new MockCodedSearchSource(searchAllergens, getAllergenById);

export const mockMedicationWriteSource: MedicationWriteSource = {
  async saveMedications(patientId, meds) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): POST to FHIR MedicationStatement instead of logging.
    console.log(`[mock] saved ${meds.length} medication(s) for patient ${patientId}`, meds);
  },
};

export const mockAllergyWriteSource: AllergyWriteSource = {
  async saveAllergies(patientId, allergies) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): POST to FHIR AllergyIntolerance instead of logging.
    console.log(`[mock] saved ${allergies.length} allergy(ies) for patient ${patientId}`, allergies);
  },
};

// One fixed "on file" identity — matches the same demo patient
// (Ana Marquez, guardian Elena) used elsewhere in this repo's mock data,
// so the confirm-don't-reask path has something realistic to match
// against. Any other name/DOB combination demonstrates the new-patient
// (no match, empty fields) path.
const MOCK_ON_FILE_PATIENT: PatientRecord = {
  id: "demo-patient-ana",
  firstName: "Ana",
  lastName: "Marquez",
  dob: "2020-03-14",
  phone: "(512) 555-0148",
  email: "elena.marquez@example.com",
  address: { line1: "214 Oakwood Dr", city: "Austin", state: "TX", zip: "78701" },
  guardian: { name: "Elena Marquez", relationship: "Parent", phone: "(512) 555-0148" },
};

export const mockDemographicsWriteSource: DemographicsWriteSource = {
  async saveDemographics(patientId: string, data: DemographicsRecordDraft) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): PATCH/POST to FHIR Patient (+ Consent resources for
    // the per-channel contact preferences) instead of logging.
    console.log(`[mock] saved demographics for patient ${patientId}`, data);
  },
};

export const mockSogiWriteSource: SogiWriteSource = {
  async saveSogi(patientId: string, data: SogiRecordDraft) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // TODO(real EMR): PATCH FHIR Patient extensions (US Core
    // sex/gender-identity/sexual-orientation) instead of logging.
    // `null` means the guardian declined to add this section at all —
    // distinct from answering every question "Choose not to disclose."
    console.log(`[mock] saved SOGI for patient ${patientId}`, data);
  },
};

export const mockGuardianWriteSource: GuardianWriteSource = {
  async saveGuardian(patientId: string, data: GuardianRecordDraft) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): PATCH FHIR RelatedPerson (+ a Consent resource for
    // legalGuardianConsent) instead of logging.
    console.log(`[mock] saved guardian info for patient ${patientId}`, data);
  },
};

export const mockReasonForVisitWriteSource: ReasonForVisitWriteSource = {
  async saveReasonForVisit(patientId: string, data: ReasonForVisitDraft) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): POST to a FHIR Encounter.reasonCode list instead of
    // logging. The screener engine (Phase 4) reads this same saved answer
    // through the conditional engine, not a separate query.
    console.log(`[mock] saved reason for visit for patient ${patientId}`, data);
  },
};

// Deliberately a DIFFERENT phone number from MOCK_ON_FILE_PATIENT.guardian
// above (and an older-sounding "last verified" label) — this is the
// point: device-cached contact info is its own source, not a copy of the
// patient record, and can plausibly be stale by the time someone actually
// checks a patient in. Makes the staleness risk (flagged on
// DeviceProfileSource in types.ts) something a reviewer can actually see
// on screen, not just read about in a comment.
const MOCK_DEVICE_PROFILE: DeviceProfile = {
  name: "Elena Marquez",
  phone: "(512) 555-0199",
  email: "elena.marquez@example.com",
  lastVerifiedLabel: "4 months ago",
};

export const mockDeviceProfileSource: DeviceProfileSource = {
  async getProfile(): Promise<DeviceProfile | null> {
    await new Promise((resolve) => setTimeout(resolve, 150)); // simulated device-profile read latency
    // TODO(real deployment): read whatever the platform actually exposes
    // (e.g. a native contact-picker result, browser autofill data handed
    // over on submit, or nothing at all on web — there's no standard API
    // for "read the device owner's own contact card" from a browser).
    // Returning a fixed profile here for every device is itself a
    // simplification — a real implementation would return null far more
    // often than this stub does.
    return MOCK_DEVICE_PROFILE;
  },
};

export const mockGuarantorWriteSource: GuarantorWriteSource = {
  async saveGuarantor(patientId: string, data: GuarantorRecordDraft) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): POST to FHIR Account.guarantor (+ Coverage.subscriber
    // stays a separate reference even when the two people are the same)
    // instead of logging.
    console.log(`[mock] saved guarantor info for patient ${patientId}`, data);
  },
};

export const mockInsuranceOcrSource: InsuranceOcrSource = {
  async extract(frontImage: Blob, backImage: Blob): Promise<InsuranceOcrResult> {
    await new Promise((resolve) => setTimeout(resolve, 900)); // simulated OCR call latency
    // TODO(real OCR): wire to an actual vision/extraction pipeline, reading
    // both `frontImage` and `backImage` (a real card scan needs both sides
    // — group ID is often back-only). Stub convention (no real image
    // content to inspect here): a front-image File named containing
    // "test-low" simulates a card the OCR can't read clearly, so the
    // confidence-gated manual-fallback path is exercisable without a real
    // camera/OCR call. Every other capture "succeeds".
    void backImage;
    const frontName = frontImage instanceof File ? frontImage.name.toLowerCase() : "";
    if (frontName.includes("test-low")) {
      return { payerName: null, memberId: null, groupId: null, confidence: 0.35 };
    }
    return { payerName: "Sunbeam Health Plan", memberId: "SHP-88213940", groupId: "GRP-4471", confidence: 0.92 };
  },
};

export const mockInsuranceWriteSource: InsuranceWriteSource = {
  async saveInsurance(patientId: string, data: InsuranceRecordDraft) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // TODO(real EMR): POST to FHIR Coverage (+ the subscriber as a
    // RelatedPerson/Patient reference) instead of logging.
    console.log(`[mock] saved insurance for patient ${patientId}`, data);
  },
};

export const mockScreenerWriteSource: ScreenerWriteSource = {
  async saveScreenerResult(patientId: string, screenerId: string, data: Record<string, unknown>) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    // TODO(real EMR): POST to a FHIR QuestionnaireResponse (+ Observation
    // for the score/band) instead of logging. The provider summary
    // (Phase 5) reads this same saved result, not a separate query.
    console.log(`[mock] saved screener result "${screenerId}" for patient ${patientId}`, data);
  },
};

export const mockIntakeSubmissionSource: IntakeSubmissionSource = {
  async submitIntake(patientId: string, data: IntakeSubmission) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    // TODO(real EMR): flip the encounter from draft to ready-for-check-in
    // (or notify front desk) — every section's own data was already
    // persisted by its own *WriteSource as it was completed; this is the
    // "the guardian reviewed everything and confirmed" event, not the
    // first save of any of it.
    console.log(`[mock] intake submitted for patient ${patientId}`, data);
  },
};

export const mockPatientLookupSource: PatientLookupSource = {
  async findMatch(query) {
    await new Promise((resolve) => setTimeout(resolve, 400)); // simulated identity-match call latency
    // TODO(real EMR): replace with an actual FHIR Patient $match / MPI call.
    const isMatch =
      query.firstName.trim().toLowerCase() === MOCK_ON_FILE_PATIENT.firstName.toLowerCase() &&
      query.lastName.trim().toLowerCase() === MOCK_ON_FILE_PATIENT.lastName.toLowerCase();
    return isMatch ? MOCK_ON_FILE_PATIENT : null;
  },
};
