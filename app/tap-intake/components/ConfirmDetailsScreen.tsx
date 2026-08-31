"use client";

import { useState } from "react";
import { ON_FILE_RECORD } from "../mockData";
import { PrimaryButton, TextField } from "./ui";
import { PhoneFrame } from "./PhoneFrame";

type CardState = "view" | "editing";

function EditableCard({
  title,
  summary,
  state,
  onEdit,
  onDone,
  children,
}: {
  title: string;
  summary: string;
  state: CardState;
  onEdit: () => void;
  onDone: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-2">{title}</div>
        {state === "view" ? (
          <button type="button" onClick={onEdit} className="cursor-pointer text-sm font-medium text-brand">
            Edit
          </button>
        ) : null}
      </div>
      {state === "view" ? (
        <div className="text-sm font-semibold text-ink">{summary}</div>
      ) : (
        <div>
          <div className="space-y-3">{children}</div>
          <button type="button" onClick={onDone} className="mt-3 cursor-pointer text-sm font-medium text-brand">
            Done editing
          </button>
        </div>
      )}
    </div>
  );
}

// A one-time gate between the returning-patient home screen and the main
// section flow — confirm contact and emergency-contact are still accurate
// before asking anything else (identity is shown but not editable the same
// way — see the field's own comment in mockData.ts: a legal name/DOB
// correction goes through the front desk). Not a tracked SECTION_KEYS
// entry — same "local UI gate, not reducer state" treatment
// Shell() already gives introDone/returningHomeDone.
//
// v2: cards are shown as already-accurate by default (a single "Edit"
// link, no separate confirm tap) rather than the earlier version's
// ConfirmCard "On file" pill + Nothing changed/Something changed pair —
// matches the reference exactly, and reads as one less required tap
// before Continue: the guardian only interacts if something's actually
// wrong, not to affirmatively bless data that was already correct.
export function ConfirmDetailsScreen({ onConfirm, onBack }: { onConfirm: () => void; onBack: () => void }) {
  const { child, contact, emergencyContact } = ON_FILE_RECORD;

  const [contactState, setContactState] = useState<CardState>("view");
  const [emergencyState, setEmergencyState] = useState<CardState>("view");

  const [phone, setPhone] = useState(contact.phone);
  const [address, setAddress] = useState(contact.address);
  const [emName, setEmName] = useState(emergencyContact.name);
  const [emRelationship, setEmRelationship] = useState(emergencyContact.relationship);
  const [emPhone, setEmPhone] = useState(emergencyContact.phone);

  const canContinue = contactState !== "editing" && emergencyState !== "editing";

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back" className="cursor-pointer text-lg text-teal">
            ←
          </button>
          <div className="text-[11px] font-bold uppercase tracking-wide text-teal">Confirm details · Step 1 of 1</div>
        </div>
        <div className="mt-2 h-[3px] w-full rounded-full bg-line">
          <div className="h-full w-full rounded-full bg-teal" />
        </div>

        <h1 className="mt-4 text-[22px] font-bold leading-tight text-ink">Let&apos;s confirm a few things.</h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/15 text-lg font-bold text-teal">
            {child.name[0]}
          </span>
          <div>
            <div className="text-base font-bold text-ink">{child.name}</div>
            <div className="text-sm text-muted">
              {child.dob} · {child.sex}
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted">These two change more often — worth a quick check.</div>

        <div className="mt-2 space-y-3">
          <EditableCard
            title="Contact"
            summary={`${phone} · ${address}`}
            state={contactState}
            onEdit={() => setContactState("editing")}
            onDone={() => setContactState("view")}
          >
            <TextField label="Phone" value={phone} onChange={setPhone} inputMode="tel" />
            <TextField label="Address" value={address} onChange={setAddress} />
          </EditableCard>

          <EditableCard
            title="Emergency contact"
            summary={`${emName} · ${emRelationship} · ${emPhone}`}
            state={emergencyState}
            onEdit={() => setEmergencyState("editing")}
            onDone={() => setEmergencyState("view")}
          >
            <TextField label="Name" value={emName} onChange={setEmName} />
            <TextField label="Relationship" value={emRelationship} onChange={setEmRelationship} />
            <TextField label="Phone" value={emPhone} onChange={setEmPhone} inputMode="tel" />
          </EditableCard>
        </div>

        <div className="mt-8">
          <PrimaryButton disabled={!canContinue} onClick={onConfirm}>
            Continue
          </PrimaryButton>
          <p className="mt-3 text-center text-xs text-muted">If everything looks right, just continue.</p>
        </div>
      </div>
    </PhoneFrame>
  );
}
