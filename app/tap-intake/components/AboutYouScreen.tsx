"use client";

import { useEffect, useState } from "react";
import { useVisit } from "../state";
import { ON_FILE_RECORD, MOCK_BOOKING_INFO } from "../mockData";
import { PhoneFrame } from "./PhoneFrame";
import { Chip, PrimaryButton, QuestionBlock, SectionShell, StepHeader, TextField, TextLink } from "./ui";

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

type CardState = "confirm" | "edit";

// A one-time gate shown right after Intro (new patients) / ReturningHome
// (returning patients), before the main section flow begins.
//
// UX direction (superseding the earlier 3-step "Looks right" per card
// version): the patient is already verified — phone + PIN/OTP in the real
// product (see /intake's Phase 1b security model) — and by this point
// basic info is already pulled from the patient record (returning:
// ON_FILE_RECORD) or the appointment booking (new: MOCK_BOOKING_INFO).
// Re-asking the guardian to individually confirm each already-known field
// is exactly the "asked twice" friction this app's own Intro screen
// promises against. So: anything already known renders as a quiet
// summary + "Edit" link (confirm-don't-reask, the same pattern Guardian/
// Coverage/Health-History already use for returning patients elsewhere
// in this app — see ConfirmCard in ui.tsx) instead of a field the
// guardian has to look at and explicitly bless. Only genuinely MISSING
// info (new patients: legal last name, sex, address, emergency contact —
// none of that is captured at booking) is a real input, and there's one
// Continue at the bottom instead of a "Looks right" gate per card.
//
// For a returning patient every card starts already-known, so this
// screen is a one-glance "here's what's on file, tap Continue" — not a
// form. This also fully replaces the old inline "Child Details" accordion
// section new patients used to fill in mid-flow — see SECTION_KEYS.
export function AboutYouScreen({
  onConfirm,
  onBack,
}: {
  onConfirm: () => void;
  onBack: () => void;
}) {
  const { state, dispatch } = useVisit();
  const { child } = state;
  const isReturning = state.patientType === "returning";

  // Contact/emergency-contact fields are local-only, exactly like the
  // screen they replace — not part of VisitState, since nothing downstream
  // reads them yet (this is a prototype; a real build would fold these
  // into GuardianState). Phone is the one Contact field a new patient's
  // booking already has (the guardian's own number); address genuinely
  // isn't captured at scheduling, so it stays blank same as emergency
  // contact — see MOCK_BOOKING_INFO's own comment on what's realistic.
  const [phone, setPhone] = useState(isReturning ? ON_FILE_RECORD.contact.phone : MOCK_BOOKING_INFO.guardianPhone);
  const [address, setAddress] = useState(isReturning ? ON_FILE_RECORD.contact.address : "");
  const [emName, setEmName] = useState(isReturning ? ON_FILE_RECORD.emergencyContact.name : "");
  const [emRelationship, setEmRelationship] = useState(isReturning ? ON_FILE_RECORD.emergencyContact.relationship : "");
  const [emPhone, setEmPhone] = useState(isReturning ? ON_FILE_RECORD.emergencyContact.phone : "");

  // Identity is reducer state (state.child), not local — seeded here via a
  // real dispatch on mount rather than a display fallback, same reasoning
  // as PaymentSection's cardholder-name seeding: a value only shown but
  // never committed would silently save blank if the guardian never
  // touched an already-correct field. Guarded so it never overwrites a
  // name/DOB already set (e.g. re-opening this screen after "Edit").
  useEffect(() => {
    if (isReturning) return;
    if (!child.legalFirstName) {
      dispatch({ type: "SET_CHILD_FIELD", field: "legalFirstName", value: MOCK_BOOKING_INFO.childFirstName });
      dispatch({ type: "SET_CHILD_FIELD", field: "preferredName", value: MOCK_BOOKING_INFO.childFirstName });
    }
    if (!child.dob) {
      dispatch({ type: "SET_CHILD_FIELD", field: "dob", value: MOCK_BOOKING_INFO.childDob });
      const age = ageFromDob(MOCK_BOOKING_INFO.childDob);
      if (age !== null) dispatch({ type: "SET_CHILD_AGE", age });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Each card starts in "confirm" (quiet summary + Edit) only when EVERY
  // field it covers is already known; otherwise it starts in "edit" (real
  // inputs, pre-filled wherever something IS known) since there's
  // genuinely something the guardian has to type — no separate tap to
  // "unlock" that, they just see the blank field directly. Computed once
  // at mount (a patient's known-ness doesn't change mid-screen), not
  // re-derived every render, so tapping "Edit" on an already-known card
  // doesn't get silently reverted by its own initial-state logic.
  const [identityState, setIdentityState] = useState<CardState>(
    isReturning || (child.legalFirstName && child.legalLastName && child.dob && child.sex) ? "confirm" : "edit"
  );
  const [contactState, setContactState] = useState<CardState>(isReturning ? "confirm" : "edit");
  const [emergencyState, setEmergencyState] = useState<CardState>(isReturning ? "confirm" : "edit");

  const identityValid = child.legalFirstName.trim().length > 0 && child.dob.trim().length > 0 && !!child.sex;
  const contactValid = phone.trim().length > 0 && address.trim().length > 0;
  const emergencyValid = emName.trim().length > 0 && emRelationship.trim().length > 0 && emPhone.trim().length > 0;
  const canContinue = identityValid && contactValid && emergencyValid;

  return (
    <PhoneFrame>
      {/* Outside the scrollable div below, directly under the status bar —
          same non-scrolling top-slot treatment as the main flow's
          ProgressSummary/step-header slot (see StepHeaderSlot.tsx). No
          shared context needed here since this screen has nothing else
          competing for that slot. */}
      <StepHeader eyebrow="About you" stepLabel="Step 1 of 1" progressPercent={100} onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <h1 className="mt-4 text-[22px] font-bold leading-tight text-ink">You&apos;re verified.</h1>
        <p className="mt-1.5 text-sm text-muted">
          {isReturning
            ? "Here's what we have on file — nothing to retype unless something's changed."
            : "Here's what we already have from your booking — just fill in what's left."}
        </p>

        <div className="mt-4 space-y-3">
          <SectionShell title="Identity" status="active">
            {identityState === "confirm" ? (
              <ConfirmSummary
                summary={`${child.preferredName || child.legalFirstName} · ${child.dob} · ${child.sex}`}
                onEdit={() => setIdentityState("edit")}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Legal first name"
                    value={child.legalFirstName}
                    onChange={(v) => dispatch({ type: "SET_CHILD_FIELD", field: "legalFirstName", value: v })}
                  />
                  <TextField
                    label="Legal last name"
                    value={child.legalLastName}
                    onChange={(v) => dispatch({ type: "SET_CHILD_FIELD", field: "legalLastName", value: v })}
                  />
                </div>
                <TextField
                  label="Preferred name"
                  value={child.preferredName}
                  onChange={(v) => dispatch({ type: "SET_CHILD_FIELD", field: "preferredName", value: v })}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  value={child.dob}
                  onChange={(v) => {
                    dispatch({ type: "SET_CHILD_FIELD", field: "dob", value: v });
                    const age = ageFromDob(v);
                    if (age !== null) dispatch({ type: "SET_CHILD_AGE", age });
                  }}
                />
                <QuestionBlock eyebrow="Sex" prompt="Sex assigned at birth (for growth charts & dosing)">
                  <div className="flex flex-wrap gap-2">
                    {["Female", "Male", "Prefer not to say"].map((opt) => (
                      <Chip
                        key={opt}
                        label={opt}
                        selected={child.sex === opt}
                        onClick={() => dispatch({ type: "SET_CHILD_FIELD", field: "sex", value: opt })}
                      />
                    ))}
                  </div>
                </QuestionBlock>
              </>
            )}
          </SectionShell>

          <SectionShell title="Contact" status="active">
            {contactState === "confirm" ? (
              <ConfirmSummary summary={`${phone} · ${address}`} onEdit={() => setContactState("edit")} />
            ) : (
              <>
                <TextField label="Phone" value={phone} onChange={setPhone} inputMode="tel" />
                <TextField label="Address" value={address} onChange={setAddress} />
              </>
            )}
          </SectionShell>

          <SectionShell title="Emergency contact" status="active">
            {emergencyState === "confirm" ? (
              <ConfirmSummary summary={`${emName} · ${emRelationship} · ${emPhone}`} onEdit={() => setEmergencyState("edit")} />
            ) : (
              <>
                <TextField label="Name" value={emName} onChange={setEmName} />
                <TextField label="Relationship" value={emRelationship} onChange={setEmRelationship} />
                <TextField label="Phone" value={emPhone} onChange={setEmPhone} inputMode="tel" />
              </>
            )}
          </SectionShell>
        </div>

        <div className="mt-5">
          <PrimaryButton tone="teal" disabled={!canContinue} onClick={onConfirm}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

// A quiet "here's what we already have" line — no confirm tap required
// (unlike ConfirmCard elsewhere, which asks for an explicit "Nothing
// changed"/"Something changed" per section): this screen's overall
// Continue button is the only affirmative action needed. Edit is the only
// thing to tap, and only if something's actually wrong.
function ConfirmSummary({ summary, onEdit }: { summary: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-medium text-ink">{summary}</div>
      <TextLink onClick={onEdit}>Edit</TextLink>
    </div>
  );
}
