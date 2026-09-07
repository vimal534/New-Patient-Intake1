// Returning-patient "welcome back" fast path — device-local memory of the
// last completed intake. Unlike every other file in lib/data-source/,
// this is NOT a mock standing in for a future real EMR call: "does this
// device remember completing intake before" is itself the feature, so
// it genuinely reads/writes localStorage rather than stubbing a network
// call. A real deployment might additionally sync this server-side (so
// "welcome back" works from a different device too), but the device-local
// version is a real, complete feature on its own, not a stand-in.

import {
  DemographicsRecordDraft,
  GuarantorRecordDraft,
  GuardianRecordDraft,
  InsuranceRecordDraft,
  SogiRecordDraft,
} from "./types";

export type IntakeSnapshot = {
  savedAt: string; // ISO timestamp
  patientId: string;
  demographics: DemographicsRecordDraft;
  sogi: SogiRecordDraft;
  guardian: GuardianRecordDraft;
  insurance: InsuranceRecordDraft;
  guarantor: GuarantorRecordDraft;
};

const STORAGE_KEY = "intake_last_snapshot_v1";

export function saveIntakeSnapshot(snapshot: IntakeSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private/incognito browsing can throw on localStorage access. Losing
    // the "welcome back" fast path next time is a safe, silent fallback —
    // not an error worth surfacing to whoever's filling out the form.
  }
}

export function loadIntakeSnapshot(patientId: string): IntakeSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntakeSnapshot;
    if (parsed.patientId !== patientId) return null;
    return parsed;
  } catch {
    return null;
  }
}
