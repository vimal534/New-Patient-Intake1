// ---------- Shared primitives ----------

// One structured field the AI parsing step extracted from free text or a
// voice transcript — rendered as an editable field in an AIInterpretation
// card, never as chat text.
export type ParsedField = {
  id: string;
  label: string; // e.g. "NEW ALLERGY"
  value: string; // e.g. "Latex"
  detail?: string; // e.g. "Reaction: Rash"
};

export type FollowUpQuestion =
  | { type: "chips"; id: string; question: string; options: string[]; multi?: boolean }
  | { type: "slider"; id: string; question: string; min: number; max: number };

export type HealthAddedItem = {
  id: string;
  category: "Allergy" | "Medication" | "Condition" | "Surgery" | "Hospitalization" | "Something else";
  fields: ParsedField[];
};

// ---------- On-file (existing EHR) data ----------

export type OnFileAllergy = { id: string; label: string; detail: string };
export type OnFileCondition = { id: string; label: string; detail: string; kind: "asthma" | "other" };
export type OnFileInsurance = { payer: string; plan: string; memberId: string; group: string };

// ---------- The Visit Summary store ----------
// Every step reads from and writes to one slice of this. Screen 23 (Final
// Visit Summary) is purely a read + "jump back to edit" view over exactly
// this shape — it never holds its own copy of the data.

export type VisitConcernState = {
  reason: string | null;
  reasonPreCaptured: boolean;
  worse: string[];
  cause: string | null;
  duration: string | null;
  freeTextNotes: string[];
  followUpAnswers: Record<string, string | number>;
  confirmed: boolean;
};

export type HealthState = {
  changed: "unknown" | "no" | "yes";
  changedCategories: string[];
  addedItems: HealthAddedItem[];
  checkinAnswers: Record<string, string>;
  confirmed: boolean;
};

export type DetailsState = {
  confirmed: boolean;
  updated: boolean;
};

export type CoverageState = {
  changed: boolean | null;
  scanned: boolean;
  verifying: boolean;
  extracted: OnFileInsurance | null;
  uncertainField: keyof OnFileInsurance | null;
  verified: boolean;
};

export type PaymentState = {
  amountDue: number;
  method: "onFile" | "new" | null;
  processing: boolean;
  paid: boolean;
};

export type ConsentsState = {
  agreedAll: boolean;
};

export type Store = {
  patient: {
    name: string;
    dob: string;
    guardianName: string;
    guardianRelationship: string;
    phoneMasked: string;
    email: string;
  };
  appointment: { time: string; doctor: string; visitType: string };
  onFile: {
    allergies: OnFileAllergy[];
    conditions: OnFileCondition[];
    insurance: OnFileInsurance;
  };
  visitConcern: VisitConcernState;
  health: HealthState;
  details: DetailsState;
  coverage: CoverageState;
  payment: PaymentState;
  consents: ConsentsState;
  completed: boolean;
};
