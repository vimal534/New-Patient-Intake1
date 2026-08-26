import type { Store } from "../types";

// Mock EHR snapshot for the demo patient — this is the "already on file"
// data the whole flow is built around never re-asking for.
export const INITIAL_STORE: Store = {
  patient: {
    name: "Ana Marquez",
    dob: "Mar 12, 2018",
    guardianName: "Elena Marquez",
    guardianRelationship: "Mother",
    phoneMasked: "(•••) •••-4821",
    email: "elena.marquez@example.com",
  },
  appointment: { time: "Tomorrow · 10:20 AM", doctor: "Dr. Reyes", visitType: "Sick visit" },
  onFile: {
    allergies: [{ id: "allergy-penicillin", label: "Penicillin", detail: "Confirmed 14 Mar 2026" }],
    conditions: [{ id: "asthma-plan", label: "Asthma action plan", detail: "Reviewed 8 Jan 2026", kind: "asthma" }],
    insurance: { payer: "BlueShield PPO", plan: "Gold 1500", memberId: "BXP440291847", group: "BCBS-77291" },
  },
  visitConcern: {
    reason: null,
    reasonPreCaptured: false,
    worse: [],
    cause: null,
    duration: null,
    freeTextNotes: [],
    followUpAnswers: {},
    confirmed: false,
  },
  health: {
    changed: "unknown",
    changedCategories: [],
    addedItems: [],
    checkinAnswers: {},
    confirmed: false,
  },
  details: { confirmed: false, updated: false },
  coverage: {
    changed: null,
    scanned: false,
    verifying: false,
    extracted: null,
    uncertainField: null,
    verified: false,
  },
  payment: { amountDue: 35, method: "onFile", processing: false, paid: false },
  consents: { agreedAll: false },
  completed: false,
};
