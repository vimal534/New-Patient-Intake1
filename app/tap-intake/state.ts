"use client";

import { createContext, useContext, useReducer, Dispatch } from "react";
import {
  VisitState,
  SectionKey,
  SECTION_KEYS,
  PatientType,
  MedicalCategoryKey,
  SymptomAnswers,
} from "./types";
import { CONSENT_ITEMS, matchCarrierChip } from "./questionBank";

export const initialVisitState: VisitState = {
  patientType: null,
  child: { name: "", legalFirstName: "", legalLastName: "", preferredName: "", dob: "", age: null, sex: null },
  concern: { reason: null, reasonSource: null, freeText: "", structuredSymptoms: [] },
  symptomAnswers: {},
  medicalHistory: {
    selectedCategories: [],
    detail: { allergies: [], medications: [], conditions: [], surgeries: [], hospitalizations: [], familyHistory: [] },
    reviewed: false,
    changedCategories: [],
  },
  familyHistory: { applicable: [], selected: [], reviewed: false, changed: false },
  guardian: { name: "", relationship: null, phone: "", email: "", isPolicyholder: false, reviewed: false, changed: false },
  coverage: {
    payer: null,
    payerOtherText: "",
    policyNumber: "",
    groupId: "",
    noGroupId: false,
    scannedFromCard: false,
    copay: "",
    reviewed: false,
    changed: false,
  },
  payment: { method: null, cardLast4: "", newCard: { name: "", number: "", exp: "", zip: "" } },
  consents: { signedBy: "", items: CONSENT_ITEMS.map((c) => ({ id: c.id, label: c.label, acknowledged: false })) },
  sectionStatus: Object.fromEntries(SECTION_KEYS.map((k) => [k, "not_started"])) as VisitState["sectionStatus"],
  activeSection: null,
};

export type Action =
  | { type: "SET_PATIENT_TYPE"; patientType: PatientType }
  | { type: "SET_CONCERN_REASON"; reason: string; source: "tapped" | "inferred" }
  | { type: "SET_CONCERN_FREETEXT"; text: string }
  | { type: "SET_STRUCTURED_SYMPTOMS"; tags: string[] }
  | { type: "ANSWER_SYMPTOM"; id: string; value: string | string[] }
  | {
      type: "SET_CHILD_FIELD";
      field: "legalFirstName" | "legalLastName" | "preferredName" | "dob" | "sex";
      value: string;
    }
  | { type: "SET_CHILD_AGE"; age: number }
  | { type: "TOGGLE_MEDICAL_CATEGORY"; category: MedicalCategoryKey }
  | { type: "SET_MEDICAL_DETAIL"; category: MedicalCategoryKey; values: string[] }
  | { type: "CONFIRM_MEDICAL_NO_CHANGE" }
  | { type: "OPEN_MEDICAL_REVIEW" }
  | { type: "FLAG_MEDICAL_CHANGED"; category: MedicalCategoryKey }
  | { type: "SET_FAMILY_APPLICABLE"; ids: string[] }
  | { type: "TOGGLE_FAMILY_ITEM"; id: string }
  | { type: "CONFIRM_FAMILY_NO_CHANGE" }
  | { type: "FLAG_FAMILY_CHANGED" }
  | { type: "SET_GUARDIAN_FIELD"; field: "name" | "phone" | "email"; value: string }
  | { type: "SET_GUARDIAN_RELATIONSHIP"; value: string }
  | { type: "SET_GUARDIAN_POLICYHOLDER"; value: boolean }
  | { type: "CONFIRM_GUARDIAN_NO_CHANGE" }
  | { type: "FLAG_GUARDIAN_CHANGED" }
  | { type: "SET_COVERAGE_FIELD"; field: "policyNumber" | "groupId" | "copay" | "payerOtherText"; value: string }
  | { type: "SET_COVERAGE_PAYER"; value: string }
  | { type: "SET_COVERAGE_NO_GROUP_ID"; value: boolean }
  | { type: "APPLY_SCANNED_COVERAGE"; companyName: string; policyNumber: string; groupId: string | null }
  | { type: "CONFIRM_COVERAGE_NO_CHANGE" }
  | { type: "FLAG_COVERAGE_CHANGED" }
  | { type: "SET_PAYMENT_METHOD"; method: "on_file" | "new_card" | "at_visit" }
  | { type: "SET_NEW_CARD_FIELD"; field: "name" | "number" | "exp" | "zip"; value: string }
  | { type: "TOGGLE_CONSENT"; id: string }
  | { type: "MARK_SECTION_READY"; key: SectionKey }
  | { type: "REOPEN_SECTION"; key: SectionKey }
  | { type: "SET_ACTIVE_SECTION"; key: SectionKey | null }
  | { type: "ADVANCE_TO_FRONTIER"; order: SectionKey[] }
  | { type: "SEED_DEMO_TEXT"; text: string }
  | { type: "PRESET_ON_FILE" }
  | { type: "RESTART" };

function withStatus(state: VisitState, key: SectionKey, status: VisitState["sectionStatus"][SectionKey]): VisitState {
  return { ...state, sectionStatus: { ...state.sectionStatus, [key]: status } };
}

export function visitReducer(state: VisitState, action: Action): VisitState {
  switch (action.type) {
    case "SET_PATIENT_TYPE":
      return { ...state, patientType: action.patientType };

    case "SET_CONCERN_REASON":
      return withStatus(
        { ...state, concern: { ...state.concern, reason: action.reason, reasonSource: action.source } },
        "concern",
        "in_progress"
      );

    case "SET_CONCERN_FREETEXT":
      return withStatus({ ...state, concern: { ...state.concern, freeText: action.text } }, "concern", "in_progress");

    case "SET_STRUCTURED_SYMPTOMS":
      return { ...state, concern: { ...state.concern, structuredSymptoms: action.tags } };

    case "ANSWER_SYMPTOM": {
      const next: SymptomAnswers = { ...state.symptomAnswers, [action.id]: action.value };
      return withStatus({ ...state, symptomAnswers: next }, "symptoms", "in_progress");
    }

    // Not tied to any sectionStatus — the identity card lives on the
    // standalone AboutYouScreen gate, not in SECTION_KEYS (see the comment
    // on ChildInfo). `name` is kept in sync here as the derived
    // `preferredName || legalFirstName` display value every existing
    // "childName" read around the app already relies on.
    case "SET_CHILD_FIELD": {
      const nextChild = { ...state.child, [action.field]: action.value };
      if (action.field === "legalFirstName" || action.field === "preferredName") {
        nextChild.name = nextChild.preferredName.trim() || nextChild.legalFirstName.trim();
      }
      return { ...state, child: nextChild };
    }

    case "SET_CHILD_AGE":
      return { ...state, child: { ...state.child, age: action.age } };

    case "TOGGLE_MEDICAL_CATEGORY": {
      const has = state.medicalHistory.selectedCategories.includes(action.category);
      const selectedCategories = has
        ? state.medicalHistory.selectedCategories.filter((c) => c !== action.category)
        : [...state.medicalHistory.selectedCategories, action.category];
      return withStatus(
        { ...state, medicalHistory: { ...state.medicalHistory, selectedCategories } },
        "medicalHistory",
        "in_progress"
      );
    }

    case "SET_MEDICAL_DETAIL":
      return withStatus(
        {
          ...state,
          medicalHistory: {
            ...state.medicalHistory,
            detail: { ...state.medicalHistory.detail, [action.category]: action.values },
          },
        },
        "medicalHistory",
        "in_progress"
      );

    case "CONFIRM_MEDICAL_NO_CHANGE":
      return withStatus(
        { ...state, medicalHistory: { ...state.medicalHistory, reviewed: true, changedCategories: [] } },
        "medicalHistory",
        "ready"
      );

    case "OPEN_MEDICAL_REVIEW":
      return withStatus(
        { ...state, medicalHistory: { ...state.medicalHistory, reviewed: true } },
        "medicalHistory",
        "in_progress"
      );

    case "FLAG_MEDICAL_CHANGED": {
      const changedCategories = state.medicalHistory.changedCategories.includes(action.category)
        ? state.medicalHistory.changedCategories
        : [...state.medicalHistory.changedCategories, action.category];
      return withStatus(
        { ...state, medicalHistory: { ...state.medicalHistory, reviewed: true, changedCategories } },
        "medicalHistory",
        "in_progress"
      );
    }

    case "SET_FAMILY_APPLICABLE":
      return { ...state, familyHistory: { ...state.familyHistory, applicable: action.ids } };

    // These three no longer have a "familyHistory" SectionKey to attach a
    // status to — Family History was folded into Health History (see
    // types.ts) as a MEDICAL_CATEGORY_KEY, driven entirely by
    // SET_MEDICAL_DETAIL now. Kept only so nothing that still dispatches
    // these (there is none, but this is a prototype, not a guarantee)
    // throws; they update state.familyHistory but touch no section status.
    case "TOGGLE_FAMILY_ITEM": {
      const has = state.familyHistory.selected.includes(action.id);
      const selected = has
        ? state.familyHistory.selected.filter((i) => i !== action.id)
        : [...state.familyHistory.selected, action.id];
      return { ...state, familyHistory: { ...state.familyHistory, selected } };
    }

    case "CONFIRM_FAMILY_NO_CHANGE":
      return { ...state, familyHistory: { ...state.familyHistory, reviewed: true, changed: false } };

    case "FLAG_FAMILY_CHANGED":
      return { ...state, familyHistory: { ...state.familyHistory, reviewed: true, changed: true } };

    case "SET_GUARDIAN_FIELD":
      return withStatus(
        { ...state, guardian: { ...state.guardian, [action.field]: action.value } },
        "guardian",
        "in_progress"
      );

    case "SET_GUARDIAN_RELATIONSHIP":
      return withStatus(
        { ...state, guardian: { ...state.guardian, relationship: action.value } },
        "guardian",
        "in_progress"
      );

    case "SET_GUARDIAN_POLICYHOLDER":
      return { ...state, guardian: { ...state.guardian, isPolicyholder: action.value } };

    case "CONFIRM_GUARDIAN_NO_CHANGE":
      return withStatus({ ...state, guardian: { ...state.guardian, reviewed: true, changed: false } }, "guardian", "ready");

    case "FLAG_GUARDIAN_CHANGED":
      return withStatus(
        { ...state, guardian: { ...state.guardian, reviewed: true, changed: true } },
        "guardian",
        "in_progress"
      );

    case "SET_COVERAGE_FIELD":
      // Any hand edit after a scan means the guardian is now the source of
      // truth for this field, not the scan — drop the "scanned" banner as
      // soon as they touch anything.
      return withStatus(
        { ...state, coverage: { ...state.coverage, [action.field]: action.value, scannedFromCard: false } },
        "coverage",
        "in_progress"
      );

    case "SET_COVERAGE_PAYER":
      return withStatus(
        { ...state, coverage: { ...state.coverage, payer: action.value, scannedFromCard: false } },
        "coverage",
        "in_progress"
      );

    case "SET_COVERAGE_NO_GROUP_ID":
      return withStatus(
        { ...state, coverage: { ...state.coverage, noGroupId: action.value, groupId: action.value ? "" : state.coverage.groupId } },
        "coverage",
        "in_progress"
      );

    case "APPLY_SCANNED_COVERAGE": {
      const matched = matchCarrierChip(action.companyName);
      return withStatus(
        {
          ...state,
          coverage: {
            ...state.coverage,
            payer: matched ?? "Other / not sure",
            payerOtherText: matched ? "" : action.companyName,
            policyNumber: action.policyNumber,
            // Leave blank when the card didn't show one — never assume
            // "not found" means "doesn't have one." The guardian confirms
            // that explicitly via the checkbox if it's true.
            groupId: action.groupId ?? "",
            noGroupId: false,
            scannedFromCard: true,
          },
        },
        "coverage",
        "in_progress"
      );
    }

    case "CONFIRM_COVERAGE_NO_CHANGE":
      return withStatus({ ...state, coverage: { ...state.coverage, reviewed: true, changed: false } }, "coverage", "ready");

    case "FLAG_COVERAGE_CHANGED":
      return withStatus(
        { ...state, coverage: { ...state.coverage, reviewed: true, changed: true } },
        "coverage",
        "in_progress"
      );

    case "SET_PAYMENT_METHOD":
      return withStatus({ ...state, payment: { ...state.payment, method: action.method } }, "payment", "in_progress");

    case "SET_NEW_CARD_FIELD":
      return withStatus(
        { ...state, payment: { ...state.payment, newCard: { ...state.payment.newCard, [action.field]: action.value } } },
        "payment",
        "in_progress"
      );

    case "TOGGLE_CONSENT": {
      const items = state.consents.items.map((it) =>
        it.id === action.id ? { ...it, acknowledged: !it.acknowledged } : it
      );
      return withStatus({ ...state, consents: { ...state.consents, items } }, "consents", "in_progress");
    }

    case "MARK_SECTION_READY":
      return withStatus(state, action.key, "ready");

    case "REOPEN_SECTION":
      return withStatus({ ...state, activeSection: action.key }, action.key, "in_progress");

    case "SET_ACTIVE_SECTION":
      return { ...state, activeSection: action.key };

    // Computed against THIS reducer call's `state` — always the true
    // latest, even when this is dispatched immediately after
    // MARK_SECTION_READY/CONFIRM_*_NO_CHANGE in the same event handler.
    // Reading `state.sectionStatus` from a component closure at that point
    // would still show the pre-update value (React hasn't re-rendered
    // yet); computing the frontier here instead of in the component is
    // what keeps it correct regardless of render timing.
    case "ADVANCE_TO_FRONTIER": {
      const frontier = action.order.find((k) => state.sectionStatus[k] !== "ready") ?? null;
      return { ...state, activeSection: frontier };
    }

    case "SEED_DEMO_TEXT":
      return withStatus({ ...state, concern: { ...state.concern, freeText: action.text } }, "concern", "in_progress");

    case "PRESET_ON_FILE":
      // Wire up the guardian/coverage/payment shape so Confirm-first cards
      // have something real to show; medical/family history are read
      // straight from ON_FILE_RECORD by the section components themselves.
      return {
        ...state,
        child: {
          name: "Ana",
          legalFirstName: "Ana",
          legalLastName: "Marquez",
          preferredName: "Ana",
          dob: "2020-03-14",
          age: 6,
          sex: "Female",
        },
        guardian: {
          name: "Elena Marquez",
          relationship: "Parent",
          phone: "(512) 555-0148",
          email: "elena.marquez@example.com",
          isPolicyholder: true,
          reviewed: false,
          changed: false,
        },
        coverage: {
          payer: "BlueCross BlueShield PPO",
          payerOtherText: "",
          policyNumber: "BXP440291847",
          groupId: "GRP-7734",
          noGroupId: false,
          scannedFromCard: false,
          copay: "$25 for this visit type",
          reviewed: false,
          changed: false,
        },
        payment: { method: null, cardLast4: "4242", newCard: { name: "", number: "", exp: "", zip: "" } },
      };

    case "RESTART":
      return initialVisitState;

    default:
      return state;
  }
}

export const VisitContext = createContext<{ state: VisitState; dispatch: Dispatch<Action> } | null>(null);

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisit must be used within VisitProvider");
  return ctx;
}

export function useVisitReducer() {
  return useReducer(visitReducer, initialVisitState);
}

// Section order per flow — the sole source of truth for sequencing. Both
// flows are identical now that identity lives on AboutYouScreen instead of
// a "Child Details" section here.
export const SECTION_ORDER: Record<PatientType, SectionKey[]> = {
  new: ["concern", "symptoms", "medicalHistory", "guardian", "coverage", "payment", "consents"],
  returning: ["concern", "symptoms", "medicalHistory", "guardian", "coverage", "payment", "consents"],
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  concern: "Today's Concern",
  symptoms: "A Few Details",
  medicalHistory: "Health History",
  guardian: "Guardian Details",
  coverage: "Coverage",
  payment: "Payment",
  consents: "Consents",
};
