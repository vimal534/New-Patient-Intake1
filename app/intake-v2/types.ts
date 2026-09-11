// State shape for the /intake-v2 "Smart Review & Confirm" prototype port.
// Mirrors the `Component.state` object in
// docs/redesign-concepts/design_handoff_patient_intake/Intake Prototype.dc.html
// field-for-field, so the derived-values logic in logic.ts can be checked
// directly against that file during review.

export type Scenario = "new" | "returning";

// The five demo scenarios (DemoSheet.tsx) — 2 new-patient, 3
// returning-patient, per the "Intake Flow — Complete Build Spec".
// `scenario` (new/returning) stays the coarse split every existing
// isRet check reads; `demoScenarioId` drives which exact flow array
// and seed data apply within that split.
export type DemoScenarioId = "new-infant" | "new-adolescent" | "returning-well" | "returning-sick" | "returning-sports";

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
  | "healthSurgeries"
  | "healthFamily"
  | "medications"
  | "allergies"
  | "payment"
  | "consent"
  | "success"
  // Scenario 1 (New Patient, Infant) — see constants.ts's
  // FLOW_NEW_INFANT and the spec's Part 2. Six separate steps (own
  // "Step N of 6" screens) rather than one long confirm screen: the
  // patient's own basics, then the guardian's identity verified via a
  // driver's-license scan (its own two-screen sub-flow — scan capture,
  // then the parsed result to confirm/correct), then contact info,
  // demographics, and emergency contact — ending on one combined
  // review screen with an edit link back into each.
  | "patientConfirm"
  | "guardianIdScan"
  | "guardianIdReview"
  | "patientContact"
  | "patientDemographics"
  | "patientEmergency"
  | "patientReview"
  | "pediQuestions"
  // Birth & Prenatal History — one continuous flow (see
  // BirthHistoryFlow.tsx) covering all 4 sections, not 4 separate
  // flow steps. Each section carries its own inline, collapsible
  // "Review your answers" summary as it's answered — no separate
  // Review screen at the end.
  | "birthHistory"
  | "consentDisclose"
  // Scenario 2 (New Patient, Adolescent) — see constants.ts's
  // FLOW_NEW_ADOLESCENT and the spec's Part 3.
  | "socialHistory"
  | "substanceUse"
  | "gynHistory"
  // Scenarios 3 & 4 (Returning Patient, Well/Sick Visit) — see
  // constants.ts's FLOW_RETURNING_WELL/FLOW_RETURNING_SICK and the
  // spec's Parts 4-5. All confirm-pattern: show what's on file, one
  // screen-level "Everything looks correct" / "Update" toggle each
  // (same convention as the existing PersonalScreen/EmergencyScreen).
  | "confirmInfo"
  | "confirmAdditional"
  | "consentOnFile"
  // Scenario 5 (Sports Pre-Participation Physical) — see
  // constants.ts's FLOW_RETURNING_SPORTS and the spec's Part 6.
  | "insuranceManual"
  | "ppeForm";

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

// `occupation` is only used by the returning-patient "Confirm
// Additional Information" screen (spec Parts 4-5) — new-patient
// Parent/Guardian leaves it blank. `address` holds just the street
// line (constants.ts's `addressParts` splits each demo seed's
// combined "Street, City, State ZIP" string into it plus `city`/
// `state`/`zip` at seed time). `address2` (Apt/Suite/Floor) is
// optional and left off every seed on purpose — undefined until the
// patient fills it in; same for `city`/`state`/`zip` when a seed's
// address didn't parse.
export type Guardian = {
  name: string;
  relationship: string;
  mobile: string;
  address: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  occupation: string;
  // Only ever populated for guardian1, by GuardianIdScanScreen/
  // GuardianIdReviewScreen's ID-scan sub-flow — guardian2 never goes
  // through that flow, so this stays unset for it.
  dob?: string;
};

export type BirthHistory = {
  pregnancyIllness: string;
  pregnancyInfections: string;
  pregnancyMeds: string;
  pregnancyMedsList: string;
  pregnancySubstances: string;
  deliveryGestationalAge: string;
  deliveryHospital: string;
  deliveryType: string;
  deliveryComplications: string;
  deliveryComplicationsDetails: string;
  hospitalizationComplications: string;
  hospitalizationComplicationsDetails: string;
  // Split into separate lb/oz fields (per design review) rather than
  // one free-text "6 lb 14 oz" line — each unit gets its own small
  // input instead of the patient having to type both in one string.
  birthWeightLb: string;
  birthWeightOz: string;
  dischargeWeightLb: string;
  dischargeWeightOz: string;
  jaundice: string;
  hearingTest: string;
  heelPrick: string;
  breastfeeding: string;
  formulaFed: string;
  formulaType: string;
  wetDiapers: string;
  bowelMovements: string;
};

export type AuthorizedPerson = { name: string; relationship: string; phone: string; access: string; otherSpecify: string };

// Social History — spec Part 3, item 10. The ENTIRE page is
// "can wait until well visit" for a same-day sick visit; every field
// here is optional.
export type SocialHistory = {
  familySocialChanges: string;
  childCareType: string;
  pets: string;
  smokeDetectors: string;
  passiveSmokeExposure: string;
  sunscreenUse: string;
  parentsMaritalStatus: string;
  seatbeltCarSeat: string;
};

// Substance Use — spec Part 3, item 12 (Age > 11 only).
export type SubstanceUse = {
  tobaccoUse: string;
  otherTobaccoProducts: string;
  tobaccoScreeningDate: string;
  alcoholLevel: string;
  illicitDrugUse: string;
};

// GYN History — spec Part 3, item 13 (Age > 11 AND sex = female only).
export type GynHistory = {
  hasStartedPeriods: string;
  ageAtFirstPeriod: string;
  regularCycle: string;
  periodsOverSevenDays: string;
  severeCramping: string;
  lastPeriodDate: string;
  birthControlMethod: string;
};

export type IntakeState = {
  scenario: Scenario;
  demoScenarioId: DemoScenarioId;
  idx: number;
  demoOpen: boolean;
  // DemoSheet's own two-level picker — which top-level category
  // (New Patient / Returning Patient) is currently expanded to show
  // its scenario submenu. `null` = category list showing.
  demoCategoryOpen: "new" | "returning" | null;

  // Appointment/scheduling details — sourced from the appointment
  // request, used by VerifyIntroScreen, WelcomeScreen and others.
  // Never re-asked anywhere in the flow.
  scheduling: { patientName: string; age: string; reason: string; providerName: string; providerEmail: string };

  otp: string;
  acked: boolean;

  // Phone + OTP is the only verification path (VerifyIntroScreen.tsx)
  // — the phone on file is read-only there, no in-flow way to change
  // it before identity is confirmed.
  phoneOnFile: string;

  // "That's not me" — the identified PATIENT is wrong (not "I can't
  // access this number," which would mean the right patient just can't
  // use that phone; that's a different, not-yet-built recovery path and
  // must not be conflated with this one). Deliberately does not let the
  // visitor edit the phone number on file — an unverified visitor
  // shouldn't be able to redirect the OTP to a number of their choosing.
  // Instead it drops them into IdentityFallbackScreen, a fully separate
  // verification pathway (DOB-based here) that page.tsx renders in
  // place of the normal `key`-driven screen while this is true, without
  // otherwise touching `idx`/`flow` — so returning to the phone flow
  // (or continuing once staff can confirm identity another way) never
  // has to unwind a skipped flow step.
  identityFallbackOpen: boolean;

  // True while the patient is inside a section they jumped to directly
  // from the final "You're ready" summary (SuccessScreen's checklist
  // row taps, via page.tsx's `reviewSection`) rather than reached in
  // the normal forward sequence — page.tsx reads this to swap that
  // section's footer to "Save and return" (instead of the normal
  // onboarding Continue) and its header to "Review …", and to route
  // both that button and the header's back arrow to `returnToSummary`
  // (back to the summary, not the next step in flow order) instead of
  // `next`/`back`.
  reviewingFromSuccess: boolean;

  // Same idea as `reviewingFromSuccess`, scoped to the smaller
  // Patient Information wizard's own review screen (PatientReviewScreen)
  // instead of the final one — its "Edit" links jump into one of that
  // wizard's own steps via `reviewPatientSection`, and that step's
  // footer becomes "Save and return to review" → `returnToPatientReview`
  // instead of the normal `next`.
  reviewingFromPatientReview: boolean;

  // GuardianIdScanScreen/GuardianIdReviewScreen — the driver's-license
  // scan sub-flow inside the Patient Information wizard's "Identity
  // verification" step. `guardianIdScanning` drives the camera-capture
  // visual state; `guardianIdManual` records that the patient chose
  // "Enter details manually" instead of scanning (skips straight to
  // the review step, empty, no "From ID" badge).
  guardianIdScanning: boolean;
  guardianIdManual: boolean;
  guardianIdNumber: string;
  guardianIdIssuingState: string;
  guardianIdExpiration: string;

  additionalOpen: boolean;
  editingPersonal: boolean;
  personal: { dob: string; email: string; address: string; address2?: string; city?: string; state?: string; zip?: string };

  emergencyUpdating: boolean;
  emergency: { name: string; relation: string; phone: string };

  visitConfirmed: boolean;
  visitAnswer: string | null;
  // Free-text detail — only shown/collected when visitAnswer is
  // "Something else" (VisitScreen.tsx).
  visitOtherText: string;

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
  // CoverageScreen.tsx — catches a blurry photo at capture time rather
  // than letting the patient continue and flagging it later: the first
  // scan attempt always comes back blurry (demo script) and blocks
  // continuing with a "Retake photo" prompt; `scanRetried` remembers
  // that so the next attempt succeeds instead of looping forever.
  scanBlurry: boolean;
  scanRetried: boolean;
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
  // Exclusive "None" state per Health History category — checking one
  // disables (and, per the common interaction pattern, is disabled by)
  // every other selectable option and the search box in that section.
  // Distinct from the list merely being empty, so a section only greys
  // out once the patient has actually said "none of these", not just
  // because nothing's been added yet.
  medsNone: boolean;
  allergiesNone: boolean;
  surgeriesNone: boolean;
  familyNone: boolean;

  privacyOpen: boolean;

  hv: HealthViewMode;
  onFileConds: string[];
  noneConds: boolean;
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

  // Parent/Guardian (ParentGuardianScreen.tsx) — replaces the old
  // 3-page demographic/guardian spread with one screen.
  guardian1: Guardian;
  guardian2Adding: boolean;
  guardian2: Guardian;

  // Insurance — Scan-first, Screen B's "Is [guardian] the
  // policyholder?" follow-up (OcrScreen.tsx, new-patient minors only).
  // "Yes" needs no further fields (already on file via guardian1);
  // "No" collects the policyholder's own name/DOB/relationship — see
  // that file's PolicyholderQuestion.
  policyholderIsGuardian: boolean | null;
  policyholderDob: string;
  policyholderName: string;
  policyholderRelationship: string;

  // Sex Assigned at Birth, Race, Ethnicity, Preferred Language, and
  // Marital Status (PatientInfoScreen.tsx's Demographics accordion
  // section). Sex Assigned at Birth is required; the rest are optional.
  sexAssignedAtBirth: string;
  race: string;
  ethnicity: string;
  preferredLanguage: string;

  // General Pediatric Questions (PediQuestionsScreen.tsx).
  pediAccompanying: string;
  pediHomeLanguage: string;
  pediPoolFenced: string;
  pediGunsSafe: string;

  // Birth & Prenatal History (BirthHistoryFlow.tsx) — all 4 sections
  // share this one object. `birthSection` is the furthest section
  // revealed (0-3; 4 once all are complete and "Continue" shows).
  // Every revealed section stays visible and directly editable in
  // place, so there's no separate "reopen a section" mode to track.
  birth: BirthHistory;
  birthSection: number;

  // Consent to Disclose (ConsentDiscloseScreen.tsx) — card-based,
  // starts empty (never pre-filled).
  consentDiscloseYes: boolean | null;
  authorizedPersons: AuthorizedPerson[];
  authPersonAdding: boolean;
  authPersonEditingIndex: number | null;
  authPersonDraft: AuthorizedPerson;

  // Scenario 2 (New Patient, Adolescent) — Social History, Substance
  // Use, GYN History (SocialHistoryScreen.tsx, SubstanceUseScreen.tsx,
  // GynHistoryScreen.tsx).
  social: SocialHistory;
  substance: SubstanceUse;
  gyn: GynHistory;

  // Scenarios 3 & 4 (Returning Patient, Well/Sick Visit) — confirm-
  // pattern screens, each one screen-level edit toggle (see
  // ConfirmInfoScreen.tsx, ConfirmAdditionalScreen.tsx,
  // ConsentOnFileScreen.tsx). The returning-patient Health History
  // step reuses HealthScreen.tsx (key "health") instead — see its own
  // hhEditing/hhConfirmed state below.
  confirmInfoEditing: boolean;
  confirmAdditionalEditing: boolean;
  consentOnFileEditing: boolean;
  policiesEditing: boolean;
  completedBy: string;

  // Scenario 5 (Sports Pre-Participation Physical) — Insurance single
  // manual page reuses carrier/memberId/groupValue/policyholderName/
  // policyholderDob (already used by the new-patient Insurance flows);
  // only the address is new.
  policyholderAddress: string;
  ppeSigned: boolean;

  // Brief bottom toast (ctx.showToast) — `toastId` increments on every
  // call so the same message shown twice in a row still re-triggers the
  // enter animation instead of being a no-op state update.
  toastMessage: string | null;
  toastId: number;

  // Set once the patient reaches Success and taps "Done" (see
  // SuccessScreen.tsx) — WelcomeScreen.tsx's readiness ring reads this
  // to jump to 100% once back on the landing/hub screen.
  intakeCompleted: boolean;
};

export type Patch = Partial<IntakeState> | ((s: IntakeState) => Partial<IntakeState>);
