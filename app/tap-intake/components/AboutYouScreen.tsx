"use client";

import { useState } from "react";
import { useVisit } from "../state";
import { ON_FILE_RECORD } from "../mockData";
import { PhoneFrame } from "./PhoneFrame";
import { Chip, PrimaryButton, QuestionBlock, SectionShell, StepHeader, TextField } from "./ui";

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

const STEPS = ["identity", "contact", "emergency"] as const;
type Step = (typeof STEPS)[number];
const STEP_TITLES: Record<Step, string> = { identity: "Identity", contact: "Contact", emergency: "Emergency contact" };

// A one-time gate shown right after Intro (new patients) / ReturningHome
// (returning patients), before the main section flow begins — same slot
// the old "Confirm Details" screen occupied, redesigned per a reference the
// guardian pointed to directly: identity becomes its own editable card
// (previously just a read-only "Ana · 2020-03-14 · Female" summary line —
// see the old rationale, now superseded, in ON_FILE_RECORD's own comment)
// with Legal First/Last Name split out from Preferred Name, and Contact /
// Emergency Contact reveal progressively underneath as locked rows
// (SectionShell's own "locked" treatment, same merged-block styling the
// main flow already uses for not-yet-reached sections) rather than sitting
// open side by side.
//
// Now shown to BOTH patient types, not just returning ones — a new patient
// has no prior booking data, so their fields start blank ("Let's get some
// basics before we start" instead of "We've pre-filled what we got from
// your booking"), but the card shape, fields, and progressive reveal are
// identical either way. This also fully replaces the old inline "Child
// Details" accordion section new patients used to fill in mid-flow — see
// the comment on SECTION_KEYS.
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

  const [step, setStep] = useState<Step>("identity");

  // Contact/emergency-contact fields are local-only, exactly like the
  // screen they replace — not part of VisitState, since nothing downstream
  // reads them yet (this is a prototype; a real build would fold these
  // into GuardianState). Seeded from ON_FILE_RECORD for returning patients,
  // blank for new ones since there's no booking data to pre-fill from.
  const [phone, setPhone] = useState(isReturning ? ON_FILE_RECORD.contact.phone : "");
  const [address, setAddress] = useState(isReturning ? ON_FILE_RECORD.contact.address : "");
  const [emName, setEmName] = useState(isReturning ? ON_FILE_RECORD.emergencyContact.name : "");
  const [emRelationship, setEmRelationship] = useState(isReturning ? ON_FILE_RECORD.emergencyContact.relationship : "");
  const [emPhone, setEmPhone] = useState(isReturning ? ON_FILE_RECORD.emergencyContact.phone : "");

  const identityValid = child.legalFirstName.trim().length > 0 && child.dob.trim().length > 0 && !!child.sex;
  const contactValid = phone.trim().length > 0 && address.trim().length > 0;
  const emergencyValid = emName.trim().length > 0 && emRelationship.trim().length > 0 && emPhone.trim().length > 0;

  const stepIndex = STEPS.indexOf(step);
  const revealed = STEPS.slice(0, stepIndex + 1);
  const locked = STEPS.slice(stepIndex + 1);

  function summaryFor(s: Step): string {
    if (s === "identity") return `${child.preferredName || child.legalFirstName} · ${child.dob} · ${child.sex}`;
    if (s === "contact") return `${phone} · ${address}`;
    return `${emName} · ${emRelationship} · ${emPhone}`;
  }

  function advance() {
    if (step === "emergency") {
      onConfirm();
      return;
    }
    setStep(STEPS[stepIndex + 1]);
  }

  return (
    <PhoneFrame>
      {/* Outside the scrollable div below, directly under the status bar —
          same non-scrolling top-slot treatment as the main flow's
          ProgressSummary/step-header slot (see StepHeaderSlot.tsx). No
          shared context needed here since this screen has nothing else
          competing for that slot. */}
      <StepHeader eyebrow="About you" stepLabel="Step 1 of 1" progressPercent={100} onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <h1 className="mt-4 text-[22px] font-bold leading-tight text-ink">Let&apos;s confirm a few things.</h1>
        <p className="mt-1.5 text-sm text-muted">
          {isReturning
            ? "We've pre-filled what we got from your booking. Confirm or correct each one."
            : "Let's get some basics before we start."}
        </p>

        <div className="mt-4 space-y-3">
          {revealed.map((s, i) => {
            const status = i === revealed.length - 1 ? "active" : "ready";
            return (
              <SectionShell
                key={s}
                title={STEP_TITLES[s]}
                status={status}
                summaryLine={status === "ready" ? summaryFor(s) : undefined}
                onReopen={() => setStep(s)}
              >
                {status === "active" ? (
                  <StepBody
                    step={s}
                    child={child}
                    dispatch={dispatch}
                    phone={phone}
                    setPhone={setPhone}
                    address={address}
                    setAddress={setAddress}
                    emName={emName}
                    setEmName={setEmName}
                    emRelationship={emRelationship}
                    setEmRelationship={setEmRelationship}
                    emPhone={emPhone}
                    setEmPhone={setEmPhone}
                    canContinue={s === "identity" ? identityValid : s === "contact" ? contactValid : emergencyValid}
                    onContinue={advance}
                  />
                ) : null}
              </SectionShell>
            );
          })}
        </div>

        {locked.length > 0 ? (
          <div className="mt-3">
            {locked.map((s, i) => (
              <SectionShell
                key={s}
                title={STEP_TITLES[s]}
                status="locked"
                lockedPosition={locked.length === 1 ? "only" : i === 0 ? "first" : i === locked.length - 1 ? "last" : "middle"}
              />
            ))}
          </div>
        ) : null}
      </div>
    </PhoneFrame>
  );
}

function StepBody({
  step,
  child,
  dispatch,
  phone,
  setPhone,
  address,
  setAddress,
  emName,
  setEmName,
  emRelationship,
  setEmRelationship,
  emPhone,
  setEmPhone,
  canContinue,
  onContinue,
}: {
  step: Step;
  child: ReturnType<typeof useVisit>["state"]["child"];
  dispatch: ReturnType<typeof useVisit>["dispatch"];
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  emName: string;
  setEmName: (v: string) => void;
  emRelationship: string;
  setEmRelationship: (v: string) => void;
  emPhone: string;
  setEmPhone: (v: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  if (step === "identity") {
    return (
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
        <PrimaryButton tone="teal" disabled={!canContinue} onClick={onContinue}>
          ✓ Looks right
        </PrimaryButton>
      </>
    );
  }

  if (step === "contact") {
    return (
      <>
        <TextField label="Phone" value={phone} onChange={setPhone} inputMode="tel" />
        <TextField label="Address" value={address} onChange={setAddress} />
        <PrimaryButton tone="teal" disabled={!canContinue} onClick={onContinue}>
          ✓ Looks right
        </PrimaryButton>
      </>
    );
  }

  return (
    <>
      <TextField label="Name" value={emName} onChange={setEmName} />
      <TextField label="Relationship" value={emRelationship} onChange={setEmRelationship} />
      <TextField label="Phone" value={emPhone} onChange={setEmPhone} inputMode="tel" />
      <PrimaryButton tone="teal" disabled={!canContinue} onClick={onContinue}>
        ✓ Looks right
      </PrimaryButton>
    </>
  );
}
