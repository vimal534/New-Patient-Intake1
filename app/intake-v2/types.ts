// State shape for the /intake-v2 "Smart Review & Confirm" prototype port.
// Mirrors the `Component.state` object in
// docs/redesign-concepts/design_handoff_patient_intake/Intake Prototype.dc.html
// field-for-field, so the derived-values logic in logic.ts can be checked
// directly against that file during review.

export type Scenario = "new" | "returning";

export type FlowKey =
  | "verifyIntro"
  | "otp"
  | "welcome"
  | "personal"
  | "emergency"
  | "visit"
  | "coverage"
  | "ocr"
  | "health"
  | "medications"
  | "allergies"
  | "screener"
  | "payment"
  | "consent"
  | "success";

export type CardBrand = "VISA" | "MC" | "AMEX";

export type SavedCard = {
  id: string;
  brand: CardBrand;
  name: string;
  last4: string;
  exp: string;
  expired: boolean;
  isDefault: boolean;
};

// `dose`/`frequency` are optional — only medications carry them (kept on
// the same shared shape as allergies rather than a separate type so
// ListReviewScreen/AddItemSheet, which only ever read `name`/`detail`,
// don't need to know the difference). `detail` stays the source of truth
// for display everywhere except the returning-patient Health History
// summary's per-field medication editor, which reads/writes `dose` and
// `frequency` directly and recomputes `detail` from them on save.
export type CatalogItem = { name: string; detail: string; dose?: string; frequency?: string };

// A single occurrence's date, entered with whatever precision the
// patient actually remembers — any of the three may be blank. `month`/
// `year` hold display strings ("April"/"2011"), `day` holds a plain
// number string ("7") — see HealthCategoryEditors.tsx's
// formatOccurrence/occurrenceHint for how partial dates render.
export type SurgeryOccurrence = { month: string; day: string; year: string };

// One card per surgery TYPE (not per occurrence) — "C-Section" with
// three occurrences is one SurgeryItem, not three. Matches the
// "Saved history" reference: one card, occurrence count badge, numbered
// dates inside it.
export type SurgeryItem = { name: string; occurrences: SurgeryOccurrence[] };

// "review"/"edit"/"add"/"empty" are dead for returning patients now that
// their Health History lives on one merged screen (see HealthCategory
// above) — this only ever holds "pick" for a new patient building their
// list from scratch, plus "review" as returning's inert initial value.
export type HealthViewMode = "review" | "pick";

// The five categories the returning-patient Health History screen
// reviews in one pass (see WelcomeScreen's sibling, HealthScreen.tsx).
// `null` = summary showing; anything else = that category's own focused
// page is showing in its place.
export type HealthCategory = "conditions" | "medications" | "surgeries" | "allergies" | "family";

export type EligibilityState = "idle" | "pending" | "done";

export type PassportState = "offer" | "saved" | "dismissed";

export type IntakeState = {
  scenario: Scenario;
  idx: number;
  demoOpen: boolean;

  otp: string;
  acked: boolean;

  // VerifyIntroScreen's own inline state — editing the phone on file
  // before a code is sent. Phone + OTP is the only verification path
  // (no DOB/last-name fallback — once OTP succeeds we already know
  // which appointment to check the patient into).
  phoneOnFile: string;
  phoneEditOpen: boolean;
  phoneDraft: string;

  additionalOpen: boolean;
  editingPersonal: boolean;
  personal: { dob: string; email: string; address: string };

  emergencyUpdating: boolean;
  emergency: { name: string; relation: string; phone: string };

  visitConfirmed: boolean;
  visitAnswer: string | null;

  coverageChanging: boolean;
  manualEntry: boolean;
  carrier: string;
  memberId: string;
  memberName: string;
  scanning: boolean;
  // Once true, Group renders as a plain read-only row (like Member/
  // Member ID) for the rest of the session — never re-prompts "please
  // check" on a later visit to this screen. Only "Re-scan card" resets
  // it back to false.
  groupFixed: boolean;
  groupValue: string;
  // "Update" on the card-read view (OcrScreen) flips Carrier/Member/
  // Member ID/Group into editable inputs all at once, instead of only
  // Group ever being interactive.
  ocrFieldsEditing: boolean;
  backScanned: boolean;

  eligibility: EligibilityState;

  meds: CatalogItem[];
  allergies: CatalogItem[];
  medsEditing: boolean;
  allergiesEditing: boolean;

  privacyOpen: boolean;

  // Shared medications/allergies add flow (MedAllergyAddSection.tsx) —
  // used by both the new-patient ListReviewScreen and the
  // returning-patient HealthCategoryEditors. A catalog row expands in
  // place showing Drug name/Dose/Unit/Frequency, one item at a time.
  addQuery: string;
  addExpandedName: string | null;
  addEditingIndex: number | null;
  addCatalogShowMore: boolean;
  addDraftName: string;
  addDraftDose: string;
  addDraftUnit: string;
  addDraftFrequency: string;
  // Allergies only — the reaction type, kept separate from severity
  // (addDraftFrequency doubles as severity for allergies).
  addDraftReaction: string;
  noneMeds: boolean;
  noneAllergies: boolean;

  hv: HealthViewMode;
  onFileConds: string[];
  noneConds: boolean;
  showMore: boolean;
  condSearch: string;
  pendingRemove: string | null;
  lastConfirmed: string;

  // Returning-patient Health History summary (HealthScreen.tsx, isRet
  // branch) — see that file's header comment.
  surgeries: SurgeryItem[];
  familyHistory: string[];
  hhEditing: HealthCategory | null;
  // Per-category "has this been actively confirmed or updated THIS
  // session" — drives each summary card's status line ("✓ Reviewed" for
  // untouched-but-populated vs. "✓ Confirmed today" once the patient has
  // actually looked at it this visit).
  hhConfirmed: Record<HealthCategory, boolean>;
  // Surgeries — same catalog-search-inline-panel pattern as
  // MedAllergyAddSection (see HealthCategoryEditors.tsx's
  // SurgeriesEditor): tap "+" on a catalog/search row to expand its own
  // panel in place. That panel can hold more than one occurrence (a
  // patient may have had the same surgery more than once) — each with
  // its own flexible-precision Month/Day/Year date.
  surgeryQuery: string;
  surgeryCatalogShowMore: boolean;
  surgeryExpandedName: string | null;
  surgeryEditingIndex: number | null;
  surgeryDraftName: string;
  surgeryDraftOccurrences: SurgeryOccurrence[];
  // Family history — same pattern; tap "+" on a condition row to
  // expand its own relationship-checklist panel in place.
  familyQuery: string;
  familyCatalogShowMore: boolean;
  familyExpandedCondition: string | null;
  familyEditingIndex: number | null;
  familyDraftCondition: string;
  familyDraftRelations: string[];

  screenerIdx: number;
  screenerAnswers: (string | null)[];

  cardSheetOpen: boolean;
  cardNumber: string;
  paid: boolean;

  cards: SavedCard[];
  selectedCardId: string | null;
  methodsOpen: boolean;
  authSheetOpen: boolean;
  cardExp: string;
  cardCvc: string;
  cardName: string;
  saveCardChecked: boolean;

  consentFullOpen: boolean;
  financialOpen: boolean;
  agreed: boolean;
  signed: boolean;

  passport: PassportState;

  // Brief bottom toast (ctx.showToast) — `toastId` increments on every
  // call so the same message shown twice in a row still re-triggers the
  // enter animation instead of being a no-op state update.
  toastMessage: string | null;
  toastId: number;
};

export type Patch = Partial<IntakeState> | ((s: IntakeState) => Partial<IntakeState>);
