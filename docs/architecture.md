# Tap-Intake — Schema-Driven Intake Architecture

Status: **Pass 14 of N — reworked Phase 1's security gate from a shared
front-desk/kiosk PIN into a personal-device trust model (strong initial
verification via email/SMS/login, THEN a personal PIN for later visits on
that same device — see "Phase 1b" below), and added device-profile
guarantor auto-populate to the Guarantor module. Both verified live,
including the 5-attempt forced-reverify lockout and the "We think this is
you" confirm gate. NOT compliance-signed-off — see Phase 1b's own
callout. Everything from Pass 13 (Phase 1 original + all 9 of Phase 3's
modules + Phase 4's eligibility resolver, M-CHAT-R/F, ASQ-3, PHQ-2/PHQ-9 +
the returning-patient Welcome Back fast path) is unchanged except where
Phase 1b explicitly reworks it. Stopped here for confirmation before
continuing.**

This doc reflects the **FINAL** build prompt (5 phases: security gate,
field-component library + conditional engine, 9 core patient modules,
screener engine, provider summary). An earlier "v1" prompt covered a
narrower scope (no SOGI/Insurance-OCR/Guarantor/screener phases) — that
prompt is superseded; this doc is the current plan of record.

## Why `/intake` instead of extending `/tap-intake` directly

`/tap-intake` is a single client-rendered page driven by one `useReducer`
state machine — screens are React state, not URLs. This build needs:

- middleware/route-guard PIN protection ("can't be accidentally bypassed as
  new screens get added") — meaningful only if protected screens are real
  routes, not client state inside one page.
- a provider summary as a **separate route** (Phase 5).
- a schema-driven module system where modules can be added/reordered by
  config.

So the PIN gate, schema engine, and modules live at `/intake/*` as their
own route tree — `/tap-intake` itself is untouched, zero risk to the live
production app.

**Visual language is shared, not duplicated.** Per explicit instruction
("preserve the existing visual/tap-first design language... this is about
the data and logic layer, not a redesign"), every `/intake` screen imports
and reuses tap-intake's actual components directly —
`@/app/tap-intake/components/PhoneFrame`, `.../ui` (`SectionShell`,
`Chip`, `PrimaryButton`, `Checkbox`, `TextField`, etc.) — not a parallel
design system with matching colors. The Medications screen renders inside
the same `SectionShell status="active"` blue-bordered card used by every
`/tap-intake` section. This was confirmed as the right call (vs. merging
into `/tap-intake`'s actual routes/reducer) — revisit that decision once
more modules exist, if the duplication of "which route owns state" starts
to hurt.

## Directory map

```
proxy.ts                               # route guard (Next 16 renamed middleware.ts -> proxy.ts — see AGENTS.md)
app/intake/
  page.tsx                             # PUBLIC welcome screen (no PHI) — reuses PhoneFrame
  verify/
    page.tsx                           # PIN entry screen — reuses PhoneFrame
    actions.ts                         # "use server" verifyPin() — PIN check, lockout, sets device cookie
  app/
    page.tsx                           # PROTECTED — the module step machine (Demographics -> ... -> Review)
  provider/                            # PROTECTED — provider summary (NOT built yet, Phase 5)
  components/
    shared/VerifyScreen.tsx            # (Pass 14) picks PinPad vs. FullVerificationScreen off getDeviceVerificationState
    shared/PinPad.tsx                  # (Pass 14: reworked) 4-digit CodeInput, no more standalone lockout UI — see Phase 1b
    shared/FullVerificationScreen.tsx  # (Pass 14, new) email/SMS code or login -> optional PIN setup
    shared/ConfirmOrEditSection.tsx    # confirm-don't-reask shell, shared by Demographics + Guardian
    shared/SummaryCard.tsx             # read-only summary row, shared by Review & Submit + Welcome Back
    fields/                            # the 7 reusable field-type components (Phase 2)
      Chip.tsx
      ChipOther.tsx
      SearchableDropdown.tsx
      CodedSearchSelect.tsx
      StructuredFreeText.tsx
      BulkNegativeSection.tsx
      ValidatedInstrument.tsx          # supports skipPolicy: "mandatory" | "prorate" (see Phase 2/4 notes)
  lib/
    security/
      deviceToken.ts                   # (Pass 14: reworked) 3 separate HMAC-signed tokens — trust / PIN / session — see Phase 1b
      attempts.ts                      # (Pass 14: reworked) simple 5-strike counter, no more escalating timed lockout
    schema/
      types.ts                         # FieldConfig / ModuleConfig / PracticeConfig / ConditionGroup (equals/includes/gte) / SkipPolicy
      resolver.ts                      # SchemaResolver — practice -> modules -> fields
      conditions.ts                    # evaluateCondition() — one evaluator for every tier, incl. screener eligibility
    data-source/
      types.ts                         # CodedSearchSource / PatientLookupSource / Guardian|Guarantor|Insurance|ReasonForVisit|Medication|Allergy|Screener|IntakeSubmission write sources / InsuranceOcrSource / DeviceProfileSource (Pass 14)
      mockMedications.ts               # 82 entries
      mockAllergens.ts                 # 60 entries
      mockAdapter.ts                   # concrete mock implementations of the interfaces above
      localSnapshot.ts                 # the ONE genuinely-real (not mocked) data-source file — device-local "welcome back" memory
    screener/
      eligibility.ts                   # SCREENER_REGISTRY + screenerEligibility() — age band + prior-answer gate, returns an ORDERED LIST
      mchatRf.ts                       # M-CHAT-R/F item config (placeholder text) + scoreMchatRf() — mandatory skip policy example
      asq3.ts                          # ASQ-3-style item config (placeholder text) + scoreAsq3() — prorate skip policy example
      phq.ts                           # PHQ-2/PHQ-9 item config (placeholder text) + scorePhq2/scorePhq9() — prior-answer gate + self-harm flag examples
  modules/
    welcomeBack/WelcomeBackModule.tsx    # returning-patient fast path — see "Returning-patient welcome" section below
    demographics/DemographicsModule.tsx # confirm-don't-reask + Race/Ethnicity/Language + per-channel consent
    sogi/SogiModule.tsx                 # opt-in gated, equal-weight "Don't know"/"Choose not to disclose"
    guardian/GuardianModule.tsx         # confirm-don't-reask + legal-consent flag + optional secondary contact
    insurance/InsuranceModule.tsx       # OCR-first capture -> confidence-gated auto-fill -> manual fallback
    guarantor/GuarantorModule.tsx       # "same as guardian/subscriber" shortcuts, separate billing address
    reasonForVisit/ReasonForVisitModule.tsx # field-level + module-level conditional-engine examples
    medications/MedicationsModule.tsx   # coded search-select + editable list
    allergies/AllergiesModule.tsx       # same coded-search + editable-list pattern, severity instead of dose/frequency
    review/ReviewModule.tsx             # per-section summary + Edit links + "on file" badges + final submit
    screeners/mchatRf/
      MchatRfModule.tsx                 # initial 20-item instrument, mandatory skip policy
      MchatRfFollowupModule.tsx         # triggered only on a "medium" (3-7) result
    screeners/asq3/Asq3Module.tsx        # 10-item instrument, prorate skip policy (maxSkips: 2)
    screeners/phq/
      Phq2Module.tsx                    # 2-item first pass; its own score gates PHQ-9's eligibility
      Phq9Module.tsx                    # 9-item full instrument; item 9 flags immediately, not just at scoring
```

## Phase 1 — Security gate (built, Pass 1) — superseded by Phase 1b below

- `proxy.ts` matches `/intake/:path*`. Only `/intake` and `/intake/verify`
  are public; every other path checks the `intake_device_verified` cookie
  via `isValidDeviceToken()` and redirects to `/intake/verify?next=<path>`
  if missing/invalid/expired.
- Verification is **per-device**, not per-session: a signed cookie
  (HMAC-SHA256 over `verified:<issuedAtMs>`, Web Crypto so the same code
  runs on both the middleware/Proxy runtime and the Node server-action
  runtime), `httpOnly`, 180-day `maxAge`.
- PIN entry is a client `PinPad` (numeric keypad, 64px targets, shake +
  error text) calling the `verifyPin` Server Action.
- Lockout: 5 wrong attempts trigger an escalating lock (30s, 60s, 120s, ...
  capped at 15 min) — **verified live**: countdown ticks down correctly,
  stays locked mid-window, re-enables on schedule.

**Known v1 limitation (flagged in-code):** the PIN (`INTAKE_DEVICE_PIN` env
var, default `1234`) and the lockout-attempt counter (a cookie) are
stand-ins. Real deployment needs the PIN in a per-practice secret store and
attempt-tracking server-side (device fingerprint/IP), since a cookie-based
counter resets if the device clears cookies.

**Superseded (Pass 14 — see Phase 1b immediately below):** this model had
every device — new or previously seen — go through the exact same shared
PIN, with no strong identity check ever required and no distinction
between "trusted" and "new." That's precisely the anti-pattern a follow-up
spec explicitly called out ("PIN alone must never be the sole verification
method for a new/untrusted device"). Phase 1b replaces this section's
model; kept here only as a historical record of what Pass 1-13 actually
shipped.

## Phase 1b — Personal-device trust model (built, Pass 14)

Reworks Phase 1 above from a front-desk/kiosk shared-PIN model into a
personal-device model: a guardian's own phone, verified once via a STRONG
method, then a personal PIN for speed on later visits — never the PIN
alone establishing trust.

**Three separate signed tokens/cookies** (HMAC-SHA256, same Web Crypto
primitives as Pass 1 — see `lib/security/deviceToken.ts`'s header comment
for the full rationale), each answering a different question:

1. `intake_device_trusted` (180 days) — "has this device ever proven who
   it belongs to via a STRONG method?" Set ONLY by full verification
   succeeding, never by a PIN check.
2. `intake_device_pin` (180 days) — "has a personal PIN been set up on
   this device?" Stores an HMAC of the PIN, never the PIN itself. Optional
   — skipping leaves this absent, which means the next visit falls back to
   full verification again (no lightweight credential was established).
3. `intake_session_verified` (a true session cookie, no `maxAge`) — "has
   THIS visit actually been unlocked?" The ONLY token `proxy.ts` checks
   for PHI gating. Holding a valid device-trust token is necessary but not
   sufficient — it only unlocks the PIN *path*, matching the spec's
   sequencing requirement (PIN/full verification succeeds -> THEN PHI is
   reachable).

**Flow** (`verify/actions.ts`, `components/shared/VerifyScreen.tsx` +
`PinPad.tsx` + `FullVerificationScreen.tsx`):

- `verify/page.tsx` (Server Component) reads `getDeviceVerificationState()`
  — device trust + PIN configured, both required — and renders `PinPad`
  (device already has a fast path) or `FullVerificationScreen` (new/
  unrecognized device, or one that never set up a PIN). The decision is
  made server-side before any client JS runs, so a new device never even
  flashes a PIN screen it would immediately fail.
- `FullVerificationScreen`: choose Email code / Text code / "Log in to
  your account instead" -> enter the 6-digit code (mock: `000000`, or set
  `INTAKE_DEMO_VERIFICATION_CODE`) or log in (mock: any non-empty email +
  password) -> on success, device trust + this session are both granted ->
  optional "Create a PIN" step (`setDevicePin`), skippable.
- `PinPad`: a 4-digit `CodeInput` (added to tap-intake's shared `ui.tsx` —
  a fixed-length numeric-code box row, reused for both the PIN and the
  OTP entry) calling `verifyPin`. Wrong PIN decrements a remaining-
  attempts counter; the 5th wrong attempt clears BOTH the device-trust and
  device-PIN cookies and returns `reason: "reverify_required"` — no timed
  cooldown, straight to forced full re-verification, per spec ("5
  attempts, then forced full re-verification" — not the escalating-
  timeout-then-retry-the-PIN-forever model Pass 1 shipped).

**Real Next.js 16 behavior this pass had to work around, not a bug:**
verifying via the browser, the "too many attempts" UI never appeared —
the screen jumped straight from "1 attempt left" to the full-verification
"choose a method" screen with no visible transition. Root cause, confirmed
against `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`:
*"Mutates cookies through `cookies()`. Setting or deleting a cookie
automatically re-renders the current page."* `verifyPin`'s 5th-failure
branch clears device-trust cookies as part of its OWN response, which
Next.js turns into an immediate, automatic server-side re-render of
`verify/page.tsx` — swapping `PinPad` for `FullVerificationScreen` before
any state a client event handler sets afterward (a local "too many
attempts, tap to continue" screen) ever gets a chance to paint. Fix: a
short-lived, self-expiring, non-secret `intake_lockout_notice` cookie
(30s) set in that same branch, read by `getDeviceVerificationState()`
(read-only there — `cookies().set()` can only run inside a Server Action
or Route Handler, not a plain Server Component render, which is why this
cookie self-expires instead of being explicitly cleared) and threaded down
to `FullVerificationScreen` as `justLockedOut`, which shows a "Too many
attempts" banner instead of the generic new-device copy. Verified live:
5 wrong PIN attempts in a row correctly shows the banner on the very next
render, and a fresh device (no prior lockout) never shows it.

**⚠️ Compliance flag — NOT resolved by this pass, required before launch
(also called out in-code on `deviceToken.ts`, `verify/actions.ts`, and the
chat response this shipped in):**
- Security/compliance has not reviewed or approved this PIN-based
  re-authentication model against HIPAA requirements. This pass implements
  the FLOW correctly (real HMAC-signed tokens, real per-device separation,
  real forced-reverify-on-lockout, PHI never reachable pre-verification)
  — it does not constitute that sign-off, which is a human/process
  requirement, not something a code change can satisfy.
- EHR alignment is unconfirmed: does "device trusted + PIN verified this
  session" map cleanly onto whatever access-control model the real EHR
  integration expects, or does this flow's audit trail (there isn't a real
  one yet — see the mock-adapter TODOs throughout) need to reconcile with
  the EHR's own access logs? Unanswered.
- Device-profile staleness (Guarantor auto-populate, below) has the same
  open question: is showing a "last verified" label sufficient, or does a
  real deployment need to refuse auto-populating past some staleness
  threshold?

**Copy updated:** `/intake`'s welcome screen (`app/intake/page.tsx`) no
longer says "ask a staff member for today's device PIN" — that framing
described the retired kiosk model. Now: "we need to verify it's you — a
quick one-time check the first time on this device, then just a PIN after
that."

## Phase 2 — Field-component library + conditional engine (built)

All 7 field-type components exist as standalone, reusable components under
`components/fields/`. `Chip`, `ChipOther`, and `CodedSearchSelect` are now
exercised by real modules (Medications, and now Reason for Visit for both
`Chip` and `ChipOther`). `ValidatedInstrument` implements the new
`skipPolicy` contract (`{mode: "mandatory"}` blocks submission with an
inline "N questions still need an answer" indicator; `{mode: "prorate",
maxSkips}` allows per-item skip up to the limit, then shows an "will be
marked incomplete" note) — not yet driven by a real instrument, since no
screener module exists yet (Phase 4).

`lib/schema/conditions.ts` — `evaluateCondition(group, answers)` is the
**one** evaluator for field-level, module-level, and practice-level
conditions. Two working end-to-end examples now, both verified live:
- **Field-level**: in `MedicationsModule`, picking "Not sure" for either
  dose or frequency reveals an optional note field. In
  `ReasonForVisitModule`, picking "Injury" reveals a body-part + "when did
  this happen" follow-up.
- **Module-level**: `ReasonForVisitModule` also defines real `ModuleConfig`
  objects (`DOWNSTREAM_MODULE_STUBS`) with genuine `showWhen` conditions —
  e.g. selecting "Behavioral/developmental concern" makes a stub
  "behavioral-screener" module's condition evaluate true — filtered
  through the exact same `evaluateCondition()`, not a parallel mechanism.
  Verified live that selecting "Injury" + "Behavioral/developmental
  concern" (not "Vaccination") triggers only the behavioral-screener stub,
  not the vaccine-details one. These aren't real modules yet — Phase 4's
  screener engine will replace the informational banner with actually
  rendering the triggered module — but the config shape and evaluation
  path are the real thing Phase 4 will consume, not a placeholder.

Practice-level is still pending (needs a second practice/specialty config
to demonstrate against — v1 only has one implicit practice).

`lib/data-source/` is the adapter-pattern abstraction — `mockAdapter.ts` is
the only concrete implementation; a real EMR/FHIR integration means a new
file implementing the same interfaces, no UI changes.

## Phase 3 — Core patient modules (9 of 9 built — complete)

Built, in order, both verified live end-to-end:

- **Demographics** (`modules/demographics/DemographicsModule.tsx`) — a
  name+DOB search step calls `mockPatientLookupSource.findMatch()`
  (`lib/data-source/mockAdapter.ts`). Matched → two independent
  "ON FILE" confirm sections (Identity; Contact & address), each with
  "✓ Looks right" / "Edit" — tapping Edit reveals that section's fields
  inline, tapping Looks right collapses it to a summary row. Verified live
  for both paths: `Ana Marquez` (matches the mock record, both sections
  confirm correctly) and an arbitrary name (no match → "No existing record
  found" → straight to empty fields, no dead end). Race, Ethnicity, and
  Preferred Language (chip fields) and both per-channel consent questions
  (phone call / text, required Yes/No) only reveal once both sections are
  resolved, and gate `Continue` — confirmed via console log that the saved
  payload includes all of it.
- **Additional Patient Info / SOGI** (`modules/sogi/SogiModule.tsx`) — the
  whole section is gated behind one explicit opt-in chip
  ("Would you like to add this information?" Yes / "No, skip this");
  choosing "No" saves `null` and moves on immediately — verified live.
  Choosing "Yes" reveals all 4 questions (Sex assigned at birth, Gender
  identity, Pronouns, Sexual orientation) together, each carrying
  "Don't know" and "Choose not to disclose" as regular, equal-weight chip
  options (same styling as every other answer, not de-emphasized).
  Verified live end-to-end: all 4 fields answer independently with no
  cross-field bleed (confirmed via a per-field-scoped DOM scan after an
  earlier naive index-based test script produced a misleading result —
  root-caused to the test script, not the component); `Continue` stays
  disabled until all 4 are answered; the saved payload
  (`{sexAtBirth, genderIdentity, pronouns, sexualOrientation}`) matched
  the selections exactly, including "Don't know" and "Choose not to
  disclose" values.
- **Guardian/Dependent** (`modules/guardian/GuardianModule.tsx`) — reuses
  the shared `ConfirmOrEditSection` (same confirm-don't-reask shell as
  Demographics, now extracted to `components/shared/`), seeded from the
  matched `PatientRecord.guardian` that Demographics hands back through
  `onComplete` — no separate lookup call, since guardian info arrives
  bundled with the patient match. Matched path shows "On file" +
  "✓ Looks right"/"Edit"; no-match path is always-editable, no dead end —
  both verified live. Adds a required "Are you the legal guardian
  authorized to consent to treatment?" flag (answering "No" doesn't block
  `Continue` — v1: front desk follows up — but shows an inline warning
  banner and is a flag the Phase 5 provider summary must surface) and an
  optional secondary emergency contact gated behind its own opt-in chip
  (same pattern as SOGI's opt-in gate). Verified live for both paths, the
  warning banner, and the secondary-contact reveal; saved payload
  (`{guardian, legalGuardianConsent, secondaryContact}`) checked via
  console for both.
- **Insurance** (`modules/insurance/InsuranceModule.tsx`) — capture step
  with two tap targets (front/back of card, real `<input type="file"
  capture="environment">` so it opens the camera on a phone), plus an "I
  don't have my insurance card" escape hatch straight to manual entry. On
  scan, `mockInsuranceOcrSource.extract()` (`lib/data-source/mockAdapter.ts`)
  returns a confidence score; ≥0.7 auto-fills payer/member/group ID with a
  "Scanned from your card — please confirm" banner, <0.7 leaves them empty
  with a "couldn't read clearly, enter manually" banner — same 3 fields
  either way, each with its own "I don't have this value" checkbox
  (`Checkbox` from tap-intake's own `ui.tsx`) so a wrong OCR read or a
  missing value is always correctable. (Stub convention, documented
  in-code: a front-image file named containing "test-low" simulates a
  low-confidence scan, since there's no real image content to inspect —
  the seam a real OCR pipeline replaces entirely.) Always-required:
  subscriber's name and the patient's relationship to the subscriber
  (Self/Child/Spouse/Other) — a minor's guardian is very often the
  subscriber, not the patient. All three paths (skip-capture manual entry,
  high-confidence auto-fill, low-confidence fallback with a mix of typed
  values and "not provided") verified live end-to-end, saved payload
  checked via console for each.
- **Guarantor** (`modules/guarantor/GuarantorModule.tsx`) — asked as its
  own question per the spec's explicit "separate from the insurance
  subscriber" requirement, even though it's very often the same person.
  Three shortcuts, all derived purely from data already given earlier this
  same pass (no EMR lookup): "Same as guardian" prefills name/relationship
  /phone/email from Guardian's `onComplete` payload; "Same as insurance
  subscriber" prefills name/relationship from Insurance's `onComplete`
  payload but leaves phone/email blank (Insurance never collected them —
  verified live, not silently duplicated from elsewhere); "Someone else"
  starts blank. A required "bill to the address on file?" Yes/No gate
  reveals a separate billing address only on "No". `GuardianModule` and
  `InsuranceModule` both now hand data back through `onComplete` instead
  of a bare callback, threaded through `app/page.tsx` state — this is the
  first working example of a later module reusing earlier answers instead
  of an EMR match (module-level data reuse, not the conditional *engine*
  itself). All three source shortcuts and both billing-address branches
  verified live, saved payload (`{source, guarantor, billingSameAsHousehold,
  billingAddress}`) checked via console for two of the three (the third,
  "Someone else", is the unexercised default-empty branch already covered
  by every other module's blank-field path this session).

  **Pass 14 addition — device-profile auto-populate:** a 4th source,
  `"device"`, from a new `DeviceProfileSource` (`mockDeviceProfileSource`
  in `mockAdapter.ts`) — whatever contact info the device itself has
  cached, deliberately modeled as its OWN thing, not a copy of
  `guardianInfo`: the mock's phone number `(512) 555-0199` intentionally
  differs from the guardian's on-file `(512) 555-0148`, and carries a
  `lastVerifiedLabel: "4 months ago"`, so the staleness/shared-device risk
  the spec flagged is something a reviewer can actually SEE on screen, not
  just read about in a comment. Shown once, before the existing shortcut
  picker, as its own `DeviceProfileConfirmCard` ("We think this is you —
  Elena Marquez, is that right?" + the last-verified label + "✓ Yes,
  that's me" / "That's not me") — deliberately not the shared
  `ConfirmOrEditSection` shell, since that component's "On file"/"Edit"
  copy is about confirming DATA is accurate, not confirming an IDENTITY
  match. "Yes, that's me" pre-fills the guarantor fields and skips the
  shortcut picker entirely (redundant once identity's confirmed) but still
  lands on the same always-editable form + explicit Continue every other
  path uses — never silently committed. "That's not me" answers the gate
  and falls through to the existing picker, untouched. Verified live both
  paths: confirming shows the pre-filled editable fields and saves with
  `source: "device"`; the whole gate is skipped correctly for a device
  with no cached profile (this mock always returns one — a real
  implementation would return `null` far more often, per the source's own
  comment).
- **Reason for Visit** (`modules/reasonForVisit/ReasonForVisitModule.tsx`)
  — multi-select `ChipOtherField` (its first real usage) so "Other" never
  dead-ends into a bare free-text form. Doubles as the field-level +
  module-level conditional-engine demonstration flagged as pending in
  Phase 2 above — see that section for what's actually proven. Answer key
  is `reasonForVisit: string[]`, the exact shape a later screener-gating
  `ConditionRule.sourceField` will read. Verified live: Injury's follow-up
  section, the module-level banner (correctly excluding an untriggered
  stub), the "Other" free-text requirement, and the plain
  no-conditions-triggered path — saved payload checked via console for
  each.
- **Medications** — debounced ranked coded search (confirmed "amox"
  correctly excludes non-matches like Acetaminophen), dose/frequency chips
  with "Not sure" fallback, editable list (edit re-opens prefilled, delete
  removes precisely), "not currently taking any" fast path, write call
  lands with the correct payload (checked via console).
- **Allergies** (`modules/allergies/AllergiesModule.tsx`) — same
  coded-search-select + editable-list pattern as Medications, against
  `allergenSource` (60 mock entries) instead of `medicationSource`; asks
  reaction + severity instead of dose/frequency, both with a "Not sure"
  fallback (`AllergyIntoleranceDraft.severity` allows `null` for exactly
  this). "No known allergies" fast path mirrors Medications' "not
  currently taking any". Add/edit/delete on the list, write call lands
  with the correct payload — all verified live.

**Bug found and fixed during Allergies verification, in both modules:**
`editEntry` in both `MedicationsModule` and `AllergiesModule` was
reconstructing the picker's `pending` entry as a bare `{id, name, detail}`
instead of keeping the original matched `CodedEntry` — which silently
dropped `doses`/`frequencies` (Medications) and `reactions` (Allergies),
leaving only "Not sure" selectable when re-opening an existing entry to
edit it. Fixed in both by storing the full original `CodedEntry` on each
list entry (`codedEntry` field) and restoring it directly in `editEntry`
instead of reconstructing a partial one. Re-verified live in both modules
after the fix — editing now shows the complete option list and saves the
edited value correctly. This shipped in the very first Medications pass
and went unnoticed until Allergies' own edit-path check surfaced the same
pattern a second time.

- **Review & Submit** (`modules/review/ReviewModule.tsx`) — the last
  Phase 3 module. Required threading every module's own save-payload up
  through `app/page.tsx` state (each module's `onComplete` now hands back
  its full saved answers, not just a bare "done" signal) so Review has
  something real to summarize instead of re-querying eight write sources.
  Also added proper types for Demographics and SOGI's save payloads
  (`DemographicsRecordDraft`, `SogiRecordDraft`) — both were previously
  typed as loose `Record<string, unknown>` in `mockAdapter.ts`, the only
  two write sources that hadn't gotten a real type yet. One summary card
  per section, "On file" badges on Demographics/Guardian when seeded from
  a matched record, an Edit link per card, and a final "Confirm & submit"
  that calls a new `mockIntakeSubmissionSource.submitIntake()` with the
  full aggregated payload — a distinct "guardian reviewed and confirmed"
  event, since every section already persisted itself via its own
  write source as it was completed. Verified live end-to-end: all 8
  summaries render correctly (including "On file" badges for a matched
  Ana Marquez), Edit navigates back to a section, submitting lands the
  complete correct payload.

  **Known v1 limitation (flagged in-code and here):** Edit re-mounts the
  target module fresh — none of the 8 modules accept an
  initialValue/prefill prop yet, so the section restarts blank rather than
  reopening with what was already entered (the other sections' data is
  unaffected and Review still reflects them correctly once you return).
  Retrofitting all 8 modules with resumable/prefilled state is real,
  cross-cutting work on top of what's already been built pass-by-pass;
  this pass shipped the review/summary/submit flow itself — the part the
  spec asked for — and calls out the gap explicitly rather than silently
  under-delivering it, the same way the PIN-lockout-cookie limitation is
  flagged in Phase 1.

## Phase 4 — Screener engine (started: eligibility resolver + M-CHAT-R/F + ASQ-3 + PHQ-2/PHQ-9)

**Eligibility resolver** (`lib/screener/eligibility.ts`) — `screenerEligibility(dob, asOfIsoDate, answers)`
filters a `SCREENER_REGISTRY` by age band (month-level, via `ageInMonths()`)
and an optional prior-answer gate (`ConditionGroup`, evaluated through the
same `evaluateCondition()` every field/module-level condition in this app
already uses — now a fourth tier of the same one mechanism) and returns
an **ordered list**, not a single yes/no. `app/page.tsx` **re-runs** this
resolver after every screener completes (`goToNextScreener()`) rather
than freezing a queue once at Reason for Visit — required because PHQ-9's
eligibility depends on PHQ-2's own score, an answer that doesn't exist
until PHQ-2 has actually been administered. Verified live: a ~20-month-old
is eligible for both ASQ-3 and M-CHAT-R/F at once and is correctly routed
through both in registry order, then Medications.

`ConditionRule` gained a `gte?: number` comparator (alongside the existing
`equals`/`includes`) to express "PHQ-2 scored >= 3" — a real gap the
string-only comparators couldn't express, not a hypothetical one. Small,
additive, backward-compatible (every existing `equals`/`includes` usage
is untouched); `AnswerValue` widened to include `number` so a screener
score can live in the same answer bag as everything else.

**M-CHAT-R/F** (`modules/screeners/mchatRf/`) — the concrete
result-triggered-module example the spec calls out by name, fully wired:

- Age-gated 16-30 months. Verified live: a ~6.5-year-old demo patient
  (Ana Marquez) skips it entirely and goes straight to Medications (no
  regression from the pre-Phase-4 flow); a ~20-month-old patient is
  correctly routed into it.
- 20-item instrument via `ValidatedInstrumentField` (Phase 2's component,
  first real exercise — `skipPolicy: {mode: "mandatory"}`, no skip
  affordance, inline "N questions still need an answer" indicator).
- Real reverse-scoring mechanic (3 of 20 items flip which answer counts as
  "at risk") and the exact 0-2 (low) / 3-7 (medium) / 8-20 (high) band
  cutoffs from the spec.
- Low band → straight to Medications, verified live (score 0 → `atRiskKeys: []`).
- Medium band → `MchatRfFollowupModule` renders, scoped to *exactly* the
  at-risk items (not all 20 again) — verified live with a 5-item at-risk
  set; its own Yes/No re-ask determines `stillConcerning`, then proceeds
  to Medications either way.
- High band (8+, refer) uses the same "skip Follow-Up, proceed" branch as
  low — not separately live-tested (identical code path to the verified
  low-band branch, only the saved `band`/`score` values differ, which the
  scoring function's own logic already covers) — but the flag is saved for
  Phase 5's provider summary to surface.

**ASQ-3** (`modules/screeners/asq3/Asq3Module.tsx`) — the prorate
skip-policy example the spec calls out for ASQ-3/ASQ:SE-2. 10-item
representative single domain (real ASQ-3 has five, independently scored
the same way — this proves the mechanic, not the full instrument),
`skipPolicy: {mode: "prorate", maxSkips: 2}`. `ValidatedInstrumentField`
renders a per-item "Skip" link in this mode instead of the mandatory
mode's blocking indicator; `scoreAsq3()` (not the field component, per its
own doc comment) does the actual prorated-vs-invalid decision:

- Within the skip limit → `proratedScore = round(sum_answered / count_answered * item_count)`.
  Verified live: 8 items answered "Yes" (10pts) + 2 skipped →
  `rawSum: 80, answeredCount: 8, proratedScore: 100`, matching the formula
  exactly.
- Over the skip limit → `{valid: false, reason: "too_many_skips"}`, no
  score sent. Verified live: 7 answered + 3 skipped shows the "will be
  marked incomplete" note, still lets Continue proceed (skip policy never
  blocks submission — it decides whether to score, not whether to
  submit), and saves the invalid result correctly.

**PHQ-2 → PHQ-9** (`modules/screeners/phq/`) — the prior-answer-gated
eligibility example and the self-harm immediate-flag example, both from
the spec, in one instrument pair:

- PHQ-2 (`Phq2Module.tsx`) is a 2-item mandatory screener; `onComplete`
  hands its raw score to `goToNextScreener({ phq2Score: score }, ...)`,
  writing it into the shared answer bag *before* eligibility is
  re-checked. PHQ-9's registry entry
  (`requiresPriorAnswer: {all: [{sourceField: "phq2Score", gte: 3}]}`)
  then correctly sees it. Verified live both directions: score 0 skips
  PHQ-9 entirely (straight to Medications); score 4 (>= 3) correctly
  triggers it.
- PHQ-9 (`Phq9Module.tsx`) is the concrete self-harm-flag example. Item 9
  (`PHQ9_SELF_HARM_ITEM_KEY`) is watched by its own `ConditionGroup`
  (`evaluateCondition()` again, a fifth real usage) in a `useEffect` that
  fires the instant the condition goes true — not deferred to Continue: an
  inline banner appears immediately, and a *separate* save
  (`"phq9-self-harm-flag"`) fires right then, distinct from the
  end-of-form `"phq-9"` result. Verified live: answering item 9 "Several
  days" (score 1) shows the banner and fires the immediate save before
  anything else is answered; the final result for that run
  (`score: 1, band: "none-minimal", selfHarmFlag: true`) is exactly the
  case the requirement exists for — the aggregate score alone reads as
  completely unremarkable, and only the immediate, separately-flagged
  item-9 answer surfaces the actual concern.

**Known, explicitly flagged limitation (all three instruments):**
`MCHAT_RF_QUESTIONS` (`lib/screener/mchatRf.ts`), `ASQ3_QUESTIONS`
(`lib/screener/asq3.ts`), and `PHQ2_QUESTIONS`/`PHQ9_QUESTIONS`
(`lib/screener/phq.ts`) are placeholder item text, not the real
instruments. All three are licensed clinical tools (M-CHAT-R/F: Robins,
Fein & Barton; ASQ-3: Squires & Bricker; PHQ-2/9: Kroenke, Spitzer &
Williams) distributed free for clinical use but with exact wording their
publishers require be reproduced unmodified — neither appropriate nor
accurate to drop into a prototype or paraphrase. Real generic answer
labels are used as-is where they're not copyrightable content
(`Yes`/`Sometimes`/`Not yet` for ASQ-3; the 0-3 "Not at all" ... "Nearly
every day" scale for PHQ-2/9) — only the item prompts are stand-ins.
What's real is the engine: item counts, M-CHAT's reverse-scoring, ASQ-3's
prorate formula, PHQ-2's escalation threshold, PHQ-9's self-harm
immediate flag, mandatory vs. prorate skip policy, band cutoffs, and the
follow-up-trigger mechanic. Swap all three question sets for the licensed
item text before any clinical use. The M-CHAT Follow-Up module is also a
deliberate v1 simplification of the real (branching, clinician-
administered) F/U interview — one re-ask per at-risk item, enough to
prove the trigger mechanic without reproducing that interview's clinical
complexity.

**Not built yet:** ASQ:SE-2, Vanderbilt, PSC-17, EPDS. EPDS has the same
self-harm-item immediate-flag requirement PHQ-9 now demonstrates — same
pattern, different instrument, once built.

## Returning-patient welcome (outside the original 5-phase plan)

Not part of the FINAL prompt's phase breakdown — added on request, as a
device-local fast path for a family checking in for a *later* visit on
the same device.

- `lib/data-source/localSnapshot.ts` is the **one file in this whole
  build that isn't a mock.** Every other `data-source/*` file stubs a
  future real EMR/OCR/terminology call; "does this device remember
  completing intake before" genuinely IS the feature, so it really reads
  and writes `localStorage` (wrapped in try/catch — private/incognito
  browsing can throw on access; that just silently forfeits the fast
  path next time, not an error worth surfacing).
- On successful Review & Submit, `app/page.tsx` writes an `IntakeSnapshot`
  (Demographics, SOGI, Guardian, Insurance, Guarantor — the
  administrative/billing data that rarely changes) to that storage.
  Reason for Visit, screener results, Medications, and Allergies are
  deliberately **not** snapshotted — those are genuinely visit-specific
  (why you're here *today*, current medications/allergies) and get
  collected fresh every time, same as any real front-desk check-in.
- On mount, before Demographics even renders, `app/page.tsx` checks for a
  snapshot (client-only, in an effect — `localStorage` isn't available
  during server render, and the state update lives in a `.then()`
  callback rather than synchronously in the effect body, the same
  `react-hooks/set-state-in-effect` fix pattern already used for PinPad's
  lockout tick and the coded-search debounce). Found → opens on
  `WelcomeBackModule` instead of Demographics' cold-start search.
- `WelcomeBackModule` shows "Welcome back, {name}!" with `SummaryCard`s
  (extracted from Review & Submit into `components/shared/SummaryCard.tsx`
  so both screens share it) for what's on file, then two actions:
  **"Yes, this is still accurate"** pre-loads all five sections'
  state and jumps straight to Reason for Visit, skipping
  Demographics/SOGI/Guardian/Insurance/Guarantor entirely; **"Something's
  changed"** falls through to the normal full flow, untouched. A
  `usedWelcomeBackFastPath` flag keeps Review's "On file" badges accurate
  for data that came from the snapshot rather than a fresh Demographics
  match.
- All three paths verified live: no snapshot → cold-start Demographics
  as before (no regression); confirmed fast path → skips straight to
  Reason for Visit, and Review later shows the correct pre-loaded data
  with "On file" badges on Demographics/Guardian; "something's changed"
  → falls through to full Demographics search, ignoring the snapshot.

## Phase 5 — Provider summary

**Not started.** Route reserved at `app/intake/provider/`, gated by the
same proxy matcher. Must NOT be a read-only mirror of patient screens —
fast-scan layout, allergies + safety flags (PHQ-9 item 9 etc.) prioritized,
clear badges for incomplete/"I don't have this value" items.

## Acceptance checklist — status against the full plan (not just this pass)

- [x] No PHI-bearing screen is reachable without device verification — now
      PIN (trusted device) OR full email/SMS/login verification (new
      device), never PIN alone on an untrusted device (Pass 14, Phase 1b)
- [ ] Security/compliance sign-off on the PIN re-authentication model
      against HIPAA, and confirmed EHR access-control alignment — both
      explicitly unresolved, see Phase 1b's compliance flag
- [~] All 7 field-type components exist as reusable components — built;
      3 of 7 exercised by a real module so far (Chip, ChipOther,
      CodedSearchSelect)
- [~] Conditional engine: field-level (Medications, Reason for Visit) and
      module-level (Reason for Visit's downstream-module stubs) examples
      done, both verified live; practice-level still pending (needs a
      second practice/specialty config)
- [x] Coded search-select works against mock data with debounce and
      ranked results
- [x] Confirm-don't-reask — Demographics, verified for both the matched
      and no-match paths
- [x] OCR insurance flow — capture -> confidence-gated auto-fill -> manual
      fallback with "I don't have this value", all verified live
- [x] Review & Submit — per-section summary, "On file" badges, Edit links
      (known limitation: Edit restarts that section blank — see Phase 3
      notes), final submit with the full aggregated payload, all verified
      live
- [x] Screener skip-policy distinguishes prorate vs. mandatory — mandatory
      exercised by M-CHAT-R/F, prorate by ASQ-3 (both the valid-prorated
      and over-the-limit-invalid paths), all verified live
- [x] M-CHAT follow-up module — built and verified live: a "medium" (3-7)
      result triggers `MchatRfFollowupModule`, scoped to exactly the
      at-risk items, whose own result determines refer-vs-clear
- [x] Prior-answer-gated screener eligibility (PHQ-2 -> PHQ-9) and a
      self-harm immediate-flag item (PHQ-9 item 9) — both verified live;
      required a new `gte` condition comparator and re-running eligibility
      after each screener instead of a fixed queue
- [ ] Provider summary view — not started (Phase 5)
- [x] Returning-patient welcome fast path (outside the original plan) —
      device-local snapshot, all three paths (cold-start, confirmed
      fast-path, "something's changed") verified live
- [x] Data source layer is abstracted (adapter pattern; mock is the only
      concrete implementation, UI never imports mock data directly)
- [x] Genuinely tap-first on mobile, and now visually matches
      `/tap-intake` exactly (shared components, not matching colors)

## Local dev notes

- **(Pass 14)** Personal-device verification, not a shared PIN anymore:
  first visit on a fresh browser profile always hits
  `FullVerificationScreen` — pick "Email me a code" or "Text me a code"
  and enter `000000` (or set `INTAKE_DEMO_VERIFICATION_CODE`), or "Log in
  to your account instead" with any non-empty email+password. Either
  grants device trust; the following "Create a PIN" step is skippable
  (tap "Skip for now") but skipping means the NEXT visit on this browser
  profile also starts at full verification — set any 4-digit PIN to see
  the fast `PinPad` path on a repeat visit instead. 5 wrong PIN attempts
  in a row forces back to full verification (no timed cooldown) — see
  Phase 1b for why the "too many attempts" message shows up on the full-
  verification screen itself rather than a standalone lockout screen.
  Clear cookies (or use a private window) to reset back to a "new device."
- Set `INTAKE_DEVICE_TOKEN_SECRET` in real deployments — falls back to an
  insecure dev default otherwise.
- Entry point: `/intake` → `/intake/verify` (see above) → `/intake/app`
  (Demographics → SOGI → Guardian → Insurance → Guarantor → Reason for
  Visit → Medications → Allergies → Review & Submit). Search "Ana" /
  "Marquez" in Demographics to exercise the matched confirm-don't-reask
  path (also seeds Guardian's "on file" guardian, Elena Marquez, and puts
  "On file" badges on both in Review); any other name shows the
  no-match/empty-fields path on both. In SOGI, choose "No, skip this" to
  test the opt-out path, or "Yes" to see all 4 equal-weight questions. In
  Guarantor, the device-profile "We think this is you — Elena Marquez, is
  that right?" gate appears first (Pass 14) — "Yes, that's me" pre-fills
  and skips straight to the editable review fields; "That's not me" falls
  through to the existing "Same as guardian/subscriber/someone else"
  picker. In Insurance, pick any two images and tap "Scan card" for the
  high-confidence auto-fill path (name the front image with "test-low" in
  it for the low-confidence fallback), or "I don't have my insurance
  card" to skip straight to manual entry. Back in Guarantor, after tapping
  "That's not me" on the device gate (or on a run where you've edited this
  file to make `mockDeviceProfileSource` return `null`), try "Same as
  guardian" vs. "Same as insurance subscriber" to see the different
  prefill behavior (the latter leaves phone/email blank — and note an
  on-file guardian confirmed via "Looks right" without editing has no
  email captured either, since `PatientRecord.guardian` doesn't carry
  one, so "Same as guardian" prefills email blank too). In Reason for
  Visit, pick "Injury" for the field-level follow-up, or "Behavioral/
  developmental concern" for the module-level "we'll also ask about..."
  banner. In Allergies, search "penicillin" or "peanut" and edit an added
  entry to confirm the reaction options are still the full list, not just
  "Not sure". At Review, Edit any section to see it reopen blank (known
  limitation, see Phase 3), then Submit to see the full aggregated
  console payload. For the screeners, use a DOB roughly 16-30 months
  before today in Demographics' no-match path (any name that isn't "Ana
  Marquez") to get routed into ASQ-3 *and* M-CHAT-R/F in sequence right
  after Reason for Visit (a DOB outside 16-30 months but still under
  ~5.5yo hits ASQ-3 only; anything older, like Ana Marquez, skips both).
  In ASQ-3, skip 2 or fewer items to see a valid prorated score, or 3+ to
  see the "will be marked incomplete" note and an invalid result. In
  M-CHAT-R/F, score 0-2 "at risk" answers to see it skip the Follow-Up;
  score 3-7 to see the Follow-Up module trigger, scoped to just those
  items. Use a DOB roughly 12-18 years before today to hit PHQ-2/PHQ-9
  instead (no overlap with the toddler screeners' age bands) — answer
  both PHQ-2 items "Not at all" to see PHQ-9 get skipped, or push the
  PHQ-2 score to 3+ to see it trigger; in PHQ-9, answer item 9 (the last
  one, explicitly labeled in its placeholder prompt) with anything above
  "Not at all" to see the immediate banner appear before you've even
  reached Continue.
- The returning-patient Welcome Back screen only appears once a full
  intake has actually been submitted once on this browser (it writes to
  `localStorage`, key `intake_last_snapshot_v1`) — the first run on a
  clean browser profile always starts cold at Demographics. To re-trigger
  the cold-start path without a full new browser profile, clear that key
  (`localStorage.removeItem('intake_last_snapshot_v1')`) or use a private
  window.
- This build has **not** been pushed/deployed — it touches PHI handling
  and security, so it's held for explicit review/confirmation before going
  live, separate from the usual deploy-on-request pattern used for
  `/tap-intake` UI changes.
