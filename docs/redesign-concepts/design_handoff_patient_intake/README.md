# Handoff: Patient Intake & Check-In (mobile)

## Overview
A mobile patient intake / check-in experience for a healthcare practice. A patient receives a link, verifies their identity by one-time code, lands on an appointment hub, and completes check-in: personal info, emergency contact, visit reason, insurance capture + eligibility, health history (conditions, medications, allergies), a required screening, payment, consent + signature, final review, and a confirmation screen.

The product is **white-label**: a neutral foundation with a single brand accent token so each practice can swap its color without redesigning components.

The governing UX rule for the whole flow:

- **Returning patient:** confirm what's on file → change only if needed → continue.
- **New patient:** reuse whatever is known → collect what's missing → confirm → continue.

These are deliberately *not* the same flow. The returning path must be substantially faster and must never ask the patient to re-enter data the practice already has.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes that show the intended look, copy, and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's existing environment** (React, React Native, Vue, SwiftUI, native Android, etc.) using that codebase's established patterns, component library, routing, and state management. If no environment exists yet, choose the most appropriate framework for the product and implement the designs there.

`Intake Prototype.dc.html` uses a small in-house template runtime (`support.js`, `<sc-if>` / `<sc-for>` / `{{ }}` holes) and an iPhone bezel wrapper (`ios-frame.jsx`) purely for previewing. **Neither the runtime nor the device frame should be ported.** Read them as: template markup = the view, the `Component` logic class = state + handlers, `ios-frame.jsx` = "this is a 390–402px-wide phone screen."

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, copy, and interaction states are final. Recreate the UI pixel-perfectly using the codebase's existing primitives where they match; where they don't, follow the token values in this document. Every screen was designed mobile-first at ~390px width.

## Design Tokens

### Color
| Token | Value | Use |
| --- | --- | --- |
| `--brand-primary` | `#1677E8` | Progress, selected states, primary CTA, links, section eyebrows, active icons |
| `--brand-primary-hover` | `#1257C4` | Link hover / pressed |
| `--brand-primary-tint` | `#EAF2FE` | Icon containers, info notes, badges |
| `--brand-primary-surface` | `#F5F9FF` | Selected option / selected card fill |
| `--brand-primary-gradient` | `linear-gradient(135deg,#1A56B0,#1677E8)` | Saved-card visual on the payment screen |
| `--text-primary` | `#101828` | Titles, values, primary labels |
| `--text-secondary` | `#667085` | Body, supporting copy, helper rows |
| `--text-muted` | `#98A2B3` | Metadata, eyebrows on dark-neutral, placeholders |
| `--border` | `#E4E7EC` | Card borders, inputs, dividers between grouped rows |
| `--border-subtle` | `#F2F4F7` | In-card dividers |
| `--border-strong` | `#D0D5DD` | Dashed add/scan affordances, unselected radio ring |
| `--surface` | `#FFFFFF` | Cards, sheets, page background |
| `--surface-muted` | `#F7F8FA` | Hub background, quiet notes, icon tiles |
| `--success` | `#067647` | Verified, confirmed, coverage active |
| `--success-surface` | `#ECFDF3` | Success badges/strips |
| `--success-border` | `#ABEFC6` | Success strip border |
| `--warning` | `#B54708` | Needs review, expired card, copay-due action |
| `--warning-surface` | `#FFFAEB` | Needs-review blocks |
| `--warning-border` | `#FEDF89` / `#FEC84B` | Needs-review block border / input border |
| `--danger` | `#B42318` | Errors, expired label |
| `--disabled-bg` | `#EAECF0` | Disabled CTA background |
| `--disabled-fg` | `#98A2B3` | Disabled CTA label |
| Insurance scan panel | bg `#EFF7FE`, dashed border `#A9D3F5`, subcopy `#5A9BD8` | Card-capture affordance |
| Add-card preview | `linear-gradient(135deg,#0E5F63,#127C74)` | Card preview in the Add-new-card sheet |

The accent **must** be a token. Do not spread the brand color across large backgrounds — it is reserved for the uses listed above.

### Typography
Family: **Inter** (weights 400/500/600/700/800), fallback `-apple-system, system-ui, sans-serif`. The signature uses **Caveat** 500 (38px) and is the only exception.

| Role | Size / weight / line-height |
| --- | --- |
| Page title | 28px / 700 / ~1.28 (hub greeting name 32px / 700) |
| Amount (copay hero) | 30px / 700 / 1.05 |
| Section heading in-page | 20px / 700 |
| Question | 21–22px / 700 / ~1.35 |
| Card title / value | 17–18px / 600 |
| Body | 16px / 400 / 1.5 |
| Helper / metadata | 14–15px / 400 |
| Eyebrow | 12px / 600 / uppercase / `0.07em` letter-spacing, `--brand-primary` (muted `#98A2B3` variant on the hub) |
| Sheet title | 19–22px / 700 |
| Local step metadata ("Step 2 of 2", "Question 3 of 3") | 13px / 400 / `--text-muted` |

Hierarchy per screen: **question / main task → primary information → supporting information → metadata**. Only one element dominates a content section. No 32–40px headings inside the flow, no competing bold headings.

### Spacing, radius, elevation
- Screen padding: 24px horizontal; 28–32px top for content screens.
- Card padding: 24px (compact info cards 16–20px).
- Radius: 20px major cards, 16px inner blocks / notes / card visuals, 14px controls & CTAs, 12px inputs, 100px pills, 24px top corners on bottom sheets.
- Shadow: `0 1px 2px rgba(16,24,40,0.04)` on cards. Nothing heavier; option rows get no shadow.
- Tap targets: minimum 44px; option rows 56–64px; CTA 56px; secondary CTA 52px.
- Payment screen vertical rhythm (explicitly specified by the client): progress → "Due today" 28–32px; "Due today" → appointment card 12px; appointment card → Payment method 24px; Payment method → card visual 12px; card visual → change-method row 12px; options → consent 20–24px; consent → Pay 16px; stacked bottom actions 10–12px.

## Global chrome

### Check-in header (all flow screens)
Row 1: back chevron (13×22 stroked icon, 2.4 stroke, in a 32px tap target) + "Check-in" (17px/600, `nowrap`) on the left, a 34px circular ✕ (`#F7F8FA` fill) on the right.
Row 2: 4px progress track (`#F2F4F7`) with a `--brand-primary` fill, width animated `240ms ease`; percentage 15px/600 in brand color, right-aligned with 14px gap.
Row 3: "About 2 min left · Progress saved" — 15px `--text-secondary`. (Returning: "About 2 min left"; new: "About 4–5 min left".)

**One global progress system.** No second progress bar anywhere. Local position is metadata only, rendered as muted 13px text above the title ("Step 2 of 2", "Question 3 of 3"). The header is hidden on: verification, appointment hub, success.

Progress percentages by step: welcome 20, personal 30, emergency 38, visit 46, coverage 54, ocr 58, health 66, medications 72, allergies 78, screener 84, payment 90, consent 95, review 99.

### Sticky footer
White, `border-top: 1px solid --border-subtle`, padding `14px 24px 30px`.
- Primary: full width, 56px, radius 14px, `--brand-primary`, white 16px/700 label. Disabled → `--disabled-bg` + `--disabled-fg` + `not-allowed` (set via `background-color`, not the `background` shorthand).
- Secondary: 52px, white, 1.5px `--border`, `--text-primary` label.
- Tertiary: 44px, borderless, `--text-muted` 15px/600.

### Demo control (prototype only — do not ship)
A dark pill labelled "DEMO", fixed bottom-right above the footer, opening a sheet with two options: **New patient** ("First visit — build health history") and **Returning patient** ("Review what's already on file"). Choosing one resets all state and switches the scenario. **This control and its sheet must not appear in the production patient UI**; the real app derives the scenario from the patient record.

## Screens / Views

Flow order (returning): `otp → welcome(hub) → personal → emergency → visit → coverage → health → medications → allergies → screener → payment → consent → review → success`.
New patients get `ocr` inserted after `coverage`. A returning patient who reports changed insurance also gets `ocr` spliced in at that point.

### 1. Verification
No header. Centered column, 64px top padding.
64px circular `--brand-primary-tint` with a 26px shield-check icon → title **"Confirming it's you"** (28px/700) → "We texted a code to (•••) •••–0148 and filled it in for you." (16px, `--text-secondary`, max-width 300px) → six 64px cells (radius 16px, 1.5px border: `--border` empty / `--brand-primary` filled, digit 26px/600).
The code **auto-fills** one digit every 260ms (`017722`). A 26px-tall status line below reads "Reading your code…" (`--text-muted`) while filling, then "✓ Verified" (15px/600 `--success`).
Below: an `--brand-primary-tint` note (radius 16px) with an info icon — "Every check-in link opens this way. Nothing on the record loads until the phone it belongs to answers."
Footer: **Continue**, disabled until all six digits are present.

### 2. Appointment hub
Owns its own header — **no check-in progress chrome**. Background `--surface-muted`.
White header band: "GOOD MORNING" (13px/600, uppercase, `0.08em`, `--text-muted`) → patient first name (32px/700) → 52px circular practice mark (white, 1px border) on the right.
**YOUR VISIT** eyebrow, then the visit card:
- Appointment title 24px/700, status chips (13px/600 pills): returning → "Confirmed" (brand tint) + "Most info on file" (success surface); new → "Confirmed" + "Complete intake" (warning surface).
- Provider and date rows with 16px stroked icons.
- **Readiness ring**: 92px circle, `conic-gradient(--brand-primary <pct>turn, #EDF0F3 0)`, 66px white center, value 24px/700 + "%" 13px/600, caption "READINESS" 11px/600 uppercase. Returning 80%, new 35%.
- Divider rows for **LOCATION** and **START TIME** (38px `--surface-muted` icon tiles; start time has an outlined "Add" button for calendar).
- CTA inside the card: 56px, brand, white 17px/600 + arrow — "Resume check-in" (returning) / "Start check-in" (new).

**WHAT TO DO** list: "Copay due / Collected during check-in" with a `--warning` "Pay $40" button; "ID and insurance" with "Review" (returning, sub "On file from your last visit") or "Add" (new, sub "Photo ID and insurance card").
**Before you arrive** card: numbered instruction rows (24px brand-tint numerals) and a full-width acknowledgement button — "Got it — I understand" (brand tint) → "✓ Got it" (success surface) once tapped.
Footer line: "Need to reschedule or cancel?" (15px `--text-muted`). Every action on this screen enters the check-in flow.

### 3. Personal information
Title "Review your information". Subtitle: returning → "Confirm what's on file. Update only what changed."; new → "Add the information we need for your visit."
One card: name 18px/600 + metadata ("Last confirmed Aug 18, 2026" / "From your appointment booking"), a success "✓ Up to date" pill for returning, divider, then Mobile (with a `--success` "✓ Verified" tag), Email, Date of birth, Address.
Returning renders values as text; tapping the secondary CTA "Edit information" swaps them to inputs (52px, radius 12px, `--border`, `#FBFBFC` fill) and the CTA becomes "Done editing". New patients get inputs from the start.
A collapsible "Additional information" row reveals Gender / Preferred language / Marital status.
Footer: "Everything looks correct" (returning) / "Save and continue" (new).

### 4. Emergency contact
Returning with a contact on file: "Is this still your emergency contact?" + one card (name, relationship, phone); footer "Yes, looks correct" / secondary "Update".
Otherwise: "Who should we contact?" with three inputs (Full name, Relationship, Mobile) and "Save contact".

### 5. Today's visit
Eyebrow **TODAY'S VISIT**. Two states:
1. Unconfirmed — title "Is this what you're coming in for?", copy "Confirm the reason on file so your care team can prepare.", the reason card (44px circular brand-tint calendar icon, "Reason for visit" 15px `--text-secondary`, value 18px/600). Footer: "Yes, that's right" / "Update reason".
2. Confirmed — title "A few details", copy "Just a couple quick questions to help us prepare for your visit.", the same reason card, then eyebrow **A FEW DETAILS**, question "Have you had any new symptoms in the last two weeks?" (21px/700), and four 60px single-select rows with a 24px radio (unselected ring `--border-strong`; selected = brand ring + brand fill + white ✓, row bg `--brand-primary-surface`, border brand): "No new symptoms", "Mild cough or congestion", "Fever", "Something else". Footer: Continue.

### 6. Coverage
Eyebrow **COVERAGE**, muted "Step 1 of 2".
- **Returning, unchanged:** title "Your coverage", copy "We have this coverage on file.", card with carrier + plan + shield icon, divider, Member ID and Last verified; then "Still using this insurance?" (20px/700). Footer: "Yes, continue" / "Change insurance". An inline edit state exposes Member ID and Group inputs.
- **Capture state (new patient, or returning who changed):** title "Insurance", copy "Photograph the card and we read it, then check the coverage with your payer while the rest of the form is still being filled in." Then the scan panel: full-width, radius 18px, `#EFF7FE` fill, 1.5px dashed `#A9D3F5`, 44px vertical padding, containing a 68px white circle with a card icon, "Tap to scan a card" (18px/600 brand) and "Insurance card, business card — anything" (15px `#5A9BD8`). Below it a `#F4F9FE` note: "Your front desk makes this check by phone or portal, one patient at a time. We run it the moment the card is captured and write the answer to your chart." Footer: **Continue disabled until a card is captured**, secondary "Enter details manually", tertiary "I'll do this later". Centered caption "Nothing is stored on your phone."
- Tapping scan shows "Capturing…" plus a "Reading your card…" strip for ~1.6s, starts the eligibility check, then advances to the read screen.

### 7. Coverage read (OCR review)
Eyebrow **COVERAGE**, muted "Step 2 of 2", title "Insurance", copy "We read your card and are checking the coverage with your payer while you finish the rest of the form."
Card: green ✓ + **CARD READ** (12px/700 uppercase `--success`), then right-aligned label/value rows — CARRIER "Blue Shield PPO", MEMBER "Jane Doe", MEMBER ID "VZ48213".
**Only the low-confidence field is interactive**: Group renders as a `--warning-surface` block, "GROUP — PLEASE CHECK" with "Blurry on the card" on the right, a 50px input, and a "This is correct" action that resolves it to a plain row. Do not ask the patient to re-verify fields the OCR was confident about.
Card base: paired quiet links "Re-scan card" (brand) and the optional back-of-card scan (`--text-secondary`, becomes "✓ Back captured").
**Eligibility strip** below the card: spinner + "Checking with Blue Shield…" / "A few seconds" → success strip (`--success-surface`, `--success-border`) with a green ✓, "Blue Shield active · $40 office visit", and "Verified". This is where the copay shown later on the payment screen comes from.
Neutral note: "Coverage is confirmed before your visit, so there's no surprise self-pay at the desk and no claim denied for an inactive plan."
Manual-entry variant of this screen: title "Enter your insurance details" with Insurance carrier / Member ID / Group number inputs and a "Save and continue" CTA.
Footer: "Looks good, continue".

While eligibility is in flight, the **next** screen shows a non-blocking card — spinner + "Checking your coverage… / You can keep going with your check-in. We'll let you know when it's ready." — replaced by a "✓ Coverage verified" success strip when it resolves (~3.2s in the prototype).

### 8. Health history — conditions
Two genuinely different flows.

**New patient (discover → select → confirm):** title "Health history", copy "Which conditions have you been diagnosed with? Select any that apply, now or in the past."
A responsive **2-column grid** of 64px selectable cards, each with a 22px checkbox (radius 7px) and a 15px/600 label; selected = brand border + `--brand-primary-surface` + filled brand checkbox. Common set: High blood pressure, Diabetes, Asthma, Thyroid condition, Depression or anxiety, PCOS, Endometriosis, Uterine fibroids.
Quiet text action "Show 12 more conditions" (toggles to "Show fewer conditions") reveals: Migraine, Arthritis, High cholesterol, Sleep apnea, Acid reflux, Anemia, Kidney disease, Heart disease, Epilepsy, Chronic pain, COPD, Eczema.
Then eyebrow "Add a condition" and a search input (placeholder "Type a condition, like migraine"); at 2+ characters, up to 4 matching rows appear with an "Add" affordance.
At the bottom, an **exclusive** "None of these apply" option: selecting it clears all condition selections; selecting any condition clears it. Never both.
Footer: **Continue disabled** until at least one condition or "None of these apply" is selected.

**Returning patient (review → change only what differs → confirm):** title "Your health history", copy "Review what's on file and update anything that has changed."
**One** summary card: eyebrow "CONDITIONS ON FILE" with an "Edit" action, the conditions listed as 18px/600 lines, and "Last confirmed Aug 18, 2026" (14px `--text-muted`) prominent enough to explain why they're reviewing. Below: "Has anything changed?" (20px/700) and a text action "+ Add a condition".
Footer: **"Everything is still correct"** — the fast path; it confirms the list, updates the confirmation date, and advances.

- **Add** (returning): title "Add a condition", copy "Select any new conditions that apply.", the same grid filtered to exclude what's already on file, "Show more conditions", search. Bottom CTA is **"No new conditions"** (never "None of the above") until something is selected, then "Add selected conditions".
- **Edit** (returning): title "Edit conditions", card of existing conditions each with a "Remove" action. Removal is **never silent** — a bottom sheet asks "Remove <condition> from your current health history?" with "Keep it" (outline) and "Remove" (brand). Footer "Save changes" returns to the review screen.
- **Nothing on file:** no empty card. "No conditions are currently on file." + "Last confirmed …" + "Has anything changed since your last visit?" with "+ Add a condition" (outline) and footer "No, still none".

### 9. Medications / 10. Allergies
Same structural pattern, one per screen.
Returning: title "Your medications" / "Your allergies", copy "Here's what we currently have on file.", one grouped card listing each item (name 17px/600 + detail 15px `--text-secondary`; allergy names use `--warning`) and a "Last confirmed …" footer row, then "Has anything changed?". Footer: "No changes" / secondary "Update medications" | "Update allergies".
Editing / new: title "Any medications you take regularly?" ("Include prescriptions, inhalers and anything over-the-counter.") / "Do you have any allergies?" ("Include medication, food and environmental allergies."), each row gaining a "Remove" action, plus "+ Add a medication" / "+ Add an allergy". Footer: "Save and continue", or "I take no medications" / "I have no known allergies" when the list is empty.
Empty state text: "No medications on file yet." / "No known allergies on file."

**Add sheet** (used by both — never silently append a value): bottom sheet titled "Add a medication" / "Add an allergy" with a ✕, a search input ("Search medications, like metformin" / "Search allergies, like latex"), a scrollable list of 56px multi-select rows (already-added items filtered out), and — when the query doesn't match a catalog entry — an "Add "<query>"" row with a dashed + for free text.
Once anything is selected, a chip row asks the single detail that matters: "How often do you take it?" (Once daily / Twice daily / As needed / Not sure) or "How severe is the reaction?" (Mild reaction / Moderate reaction / Severe reaction / Not sure); 44px pills, selected = brand border + surface + brand label.
Sheet CTA: "Select to add" (disabled) → "Add Metformin" → "Add 3 items". Unanswered detail falls back to "Dose not specified" / "Reaction not specified".
Catalogs — medications: Albuterol, Atorvastatin, Levothyroxine, Lisinopril, Metformin, Omeprazole, Sertraline, Amlodipine, Ibuprofen, Vitamin D. Allergies: Penicillin, Sulfa drugs, Aspirin, Latex, Peanuts, Shellfish, Eggs, Pollen, Bee stings, Iodine contrast.
Seeded returning data: Albuterol (Inhaler · as needed), Metformin (1000 mg · twice daily); Penicillin (Severe reaction).

### 11. Required screening
Eyebrow "REQUIRED SCREENING" → explanatory line "Your care team has a few questions before your visit." → muted "Question N of 3" → the question at 26px/600, the strongest text on screen. **No segmented sub-progress bar.**
Options are 54px single-select rows in the same selected treatment as the visit question; picking an answer advances automatically (last answer moves to Payment). No footer CTA.
Questions: PHQ-2 style "Over the last two weeks, how often have you felt down, depressed or hopeless?" and "How often have you had little interest or pleasure in doing things?" (Not at all / Several days / More than half the days / Nearly every day), then "Do you feel safe at home?" (Yes / No / Prefer not to answer).

### 12. Payment
Order is **amount → visit → payment method → authorization → pay**.
"Due today" (20px/700) → appointment card (44px brand-tint calendar tile, "Annual Physical" 17px/700, time and clinic 15px `--text-secondary`, **$40.00** 20px/700 right-aligned) → "Payment method" (18px/700) with "Secure payment" + lock on the right.
**Only the selected method** is shown, as a real card visual: radius 16px, `--brand-primary-gradient`, min-height 132px, italic 22px/800 brand wordmark, "•••• •••• •••• 4545" 19px/600 with `0.14em` tracking, expiry 15px, and a 26px white circular ✓ badge. No selected method → dashed placeholder "No payment method selected yet."
Then a single "Change payment method ›" row (no duplicate add-card action on this screen), a `--surface-muted` note with a green shield — "Your payment information is encrypted and secure." — and a **Receipt** section: one row with a mail tile, "Email receipt", the address, and an "Edit" action.
Footer: **Pay $40.00** (disabled until a method is selected) + "Pay at the visit".

**Payment methods sheet:** grab handle, "Payment methods" 22px/700 + ✕. Apple Pay row (dark 46×34 mark, "Apple Pay / Fast, secure and easy."), then "Saved cards" (18px/700) listing each card — 46×34 brand mark (`#1A56B0` Visa, `#EB5C1E` MC, `#1677E8` Amex), "Visa •••• 4545" 17px/600 `nowrap`, "Expires 03/28"; the selected row gets a brand border, `--brand-primary-surface`, and a 26px brand ✓. Expired cards render muted with "Expired 09/25" in `--danger` and open the add-card sheet instead of selecting. Finally a text action "+ Add new card". Selecting a method closes the sheet.

**Add new card sheet:** grab handle, back chevron + centered "Add new card". A live card preview (`linear-gradient(135deg,#0E5F63,#127C74)`, italic VISA, masked number that fills in as the patient types, "MM/YY" and "CARDHOLDER NAME" placeholders that mirror the inputs). Fields: Card number (placeholder `1234 5678 9012 3456`), Expiration date + CVV side by side, Cardholder name. A checked-by-default checkbox "Save this card for future visits / You can manage your cards anytime." CTA "Add card", enabled once 4+ digits are entered; saving selects the new card and closes both sheets.

**Payment authorization sheet** (from "View authorization"): title "Payment authorization", body "By submitting payment, you authorize Main St. Clinic to charge the selected payment method for the amount shown.", then Amount `$40.00`, Payment method, Visit + time. Single "Close" action. **No consent checkbox** — the CTA plus the adjacent line carries consent unless legal requires an explicit acknowledgement.

### 13. Consent & signature
Eyebrow "FORMS", title "Review & sign". Card with the plain-language summary ("You agree to treatment at Main St. Clinic, allow the practice to bill your insurance, and confirm you received the notice of privacy practices.") and a "Read full consent ›" action that opens a sheet with the long text — the long form is never inlined on the screen.
A 24px checkbox row: "I have read and agree to the terms above."
Signature: 110px tap area, radius 14px, border brand when signed; empty state "Tap to sign" (`--text-muted`), signed state renders "Jane Doe" in Caveat 38px.
Footer: "Sign and continue" (first tap sets both the checkbox and signature in the prototype; production should require real input).

### 14. Final review
Eyebrow "REVIEW", title "Almost done". Copy counts real flags: "Everything below is confirmed and saved." / "One item still needs your attention." / "N items still need your attention."
One grouped card, one row per section — 22px status circle (✓ success / ! warning), label 16px/600, status line "Confirmed" (`--text-muted`) or "Needs review" (`--warning`), and an action "Edit" / "Review" that jumps to that step. Sections: Personal information, Emergency contact, Today's visit, Coverage, Health history, Medications, Allergies, Required screening, Payment, Consent.
Footer: "Complete check-in".

### 15. Success
No header. 56px success circle with ✓, "You're ready for your visit" (30px/700), "Your care team has what they need.", appointment card (time, provider, clinic, divider, then ✓ lines: Check-in complete, Coverage submitted, Forms signed, Payment complete / Payment due at visit).
Then the passport offer card: "Save your information for next time / Start future check-ins at this practice with most of your information already completed." with an outlined **"Make it my passport"** and a quiet "Maybe later"; accepting swaps in a success strip "✓ Saved for next time".
Bottom: "Manage appointment" (neutral fill), which restarts the prototype.

## Interactions & Behavior
- **Verification:** digits auto-fill at 260ms intervals; status flips to "✓ Verified" at six digits; Continue enabled only then.
- **Navigation:** linear next/back over the flow array; back is disabled at index 0. The final-review "Edit"/"Review" actions jump directly to a step and return via normal forward navigation.
- **Scenario branching:** flow membership is computed, not hardcoded — `ocr` is present for new patients, and spliced in for returning patients who change insurance or choose manual entry.
- **Card scan:** 1.6s "Capturing…" simulation, then advance; kicks off eligibility.
- **Eligibility:** asynchronous, ~3.2s, non-blocking. Never gate the flow on it; surface pending/verified states inline.
- **Exclusive selection:** "None of these apply" and condition selections are mutually exclusive.
- **Destructive actions:** removing an on-file condition always confirms via sheet.
- **Sheets:** overlay `rgba(16,24,40,0.35–0.4)`, panel anchored bottom, 24px top radius, internal scroll with pinned title and CTA. Z-order used: methods 72, consent/privacy 74, remove-confirm 75, add-item 76, add-card 78, demo 80.
- **Transitions:** buttons transition `background`, `border-color`, `color`, `transform` at 180ms ease; the progress fill animates width at 240ms ease. Respect `prefers-reduced-motion` in production.
- **Focus:** inputs use a 2px `--brand-primary` inset outline.
- **Responsive:** designed for 390–402px; the condition grid must collapse to one column on narrow screens; long values (card numbers, "Check-in") must not wrap.

## State Management
Scenario: `'new' | 'returning'` (production: derive from the patient record, not a UI control).

Per-session state in the prototype:
- Navigation: `idx` into the computed flow array.
- Verification: `otp`.
- Personal: `editingPersonal`, `additionalOpen`, field values (email, dob, address).
- Emergency: `emergencyUpdating`, `{ name, relation, phone }`.
- Visit: `visitConfirmed`, `visitAnswer`.
- Coverage: `coverageChanging`, `coverageEditing`, `manualEntry`, `carrier`, `memberId`, `scanning`, `groupValue`, `groupFixed`, `backScanned`, `eligibility: 'idle' | 'pending' | 'done'`.
- Health: `hv: 'review' | 'empty' | 'pick' | 'add' | 'edit'`, `onFileConds[]`, `selectedConds[]`, `noneConds`, `showMore`, `condSearch`, `pendingRemove`, `lastConfirmed`.
- Meds/allergies: `meds[]`, `allergies[]`, `medsEditing`, `allergiesEditing`; add sheet: `addSheet`, `addQuery`, `addPicks[]`, `addDetail`.
- Screening: `screenerIdx`, `screenerAnswers[]`.
- Payment: `cards[]`, `selectedCardId` (`'applepay'` allowed), `methodsOpen`, `cardSheetOpen`, `cardNumber`, `cardExp`, `cardCvc`, `cardName`, `saveCardChecked`, `authSheetOpen`, `paid`.
- Consent: `consentFullOpen`, `agreed`, `signed`.
- Success: `passport: 'offer' | 'saved' | 'dismissed'`.
- Misc: `privacyOpen`, `acked`.

Data the real implementation needs: patient demographics + last-confirmed timestamps, emergency contact, appointment (type, provider, location, start time), coverage record + eligibility response (status + copay), problem/medication/allergy lists, screening instrument + answers, stored payment methods, consent documents and signature capture. Copay and readiness are **derived**, not entered.

## Assets
No image assets. All icons are inline SVG strokes (1.7–2.4 weight, round caps/joins) drawn on a 24×24 viewBox; brand marks (VISA / APPLE / MC / AMEX) are text set in Inter, to be replaced with the codebase's licensed brand marks. Fonts are Inter and Caveat from Google Fonts. The practice logo on the hub is a placeholder stethoscope glyph — swap for the tenant's logo asset.

## Files
- `Intake Prototype.dc.html` — the full clickable prototype (all 15 screens, all sheets, both scenarios). Primary reference.
- `Patient Intake Concepts.dc.html` — the earlier three-concept exploration (Guided / Smart Review / Adaptive). Kept for rationale only; the direction chosen and built out is **Smart Review & Confirm**.
- `ios-frame.jsx` — preview-only iPhone bezel. Do not port.
- `support.js` — preview-only template runtime. Do not port.
