"use client";

import { useState } from "react";
import { ON_FILE_RECORD } from "../mockData";
import { ConfirmCard, PrimaryButton, TextField } from "./ui";
import { PhoneFrame } from "./PhoneFrame";

type CardState = "confirm" | "editing" | "confirmed";

// A one-time gate between the returning-patient home screen and the main
// section flow — confirm contact and emergency-contact are still accurate
// before asking anything else (identity is shown but not re-confirmed the
// same way — see the field's own comment in mockData.ts). Not a tracked
// SECTION_KEYS entry — same "local UI gate, not reducer state" treatment
// Shell() already gives introDone/returningHomeDone, since this only ever
// needs to happen once here, not be revisited mid-flow via the
// upcoming-sections list.
export function ConfirmDetailsScreen({ onConfirm }: { onConfirm: () => void }) {
  const { child, contact, emergencyContact } = ON_FILE_RECORD;

  const [contactState, setContactState] = useState<CardState>("confirm");
  const [emergencyState, setEmergencyState] = useState<CardState>("confirm");

  const [phone, setPhone] = useState(contact.phone);
  const [address, setAddress] = useState(contact.address);
  const [emName, setEmName] = useState(emergencyContact.name);
  const [emRelationship, setEmRelationship] = useState(emergencyContact.relationship);
  const [emPhone, setEmPhone] = useState(emergencyContact.phone);

  const canContinue = contactState !== "editing" && emergencyState !== "editing";

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <h1 className="text-[22px] font-bold leading-tight text-ink">Let&apos;s confirm a few things.</h1>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-white p-3">
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
          {contactState === "confirm" ? (
            <ConfirmCard
              title="Contact"
              summary={`${phone} · ${address}`}
              onNoChange={() => setContactState("confirmed")}
              onChanged={() => setContactState("editing")}
            />
          ) : contactState === "editing" ? (
            <div className="rounded-lg border border-line p-3">
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Contact</div>
              <div className="space-y-3">
                <TextField label="Phone" value={phone} onChange={setPhone} inputMode="tel" />
                <TextField label="Address" value={address} onChange={setAddress} />
              </div>
              <button
                type="button"
                onClick={() => setContactState("confirmed")}
                className="mt-3 cursor-pointer text-sm font-medium text-brand"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-line bg-white p-3">
              <div>
                <div className="text-sm font-semibold text-ink">Contact</div>
                <div className="text-sm text-muted">
                  {phone} · {address}
                </div>
              </div>
              <button type="button" onClick={() => setContactState("editing")} className="cursor-pointer text-sm font-medium text-brand">
                Edit
              </button>
            </div>
          )}

          {emergencyState === "confirm" ? (
            <ConfirmCard
              title="Emergency contact"
              summary={`${emName} · ${emRelationship} · ${emPhone}`}
              onNoChange={() => setEmergencyState("confirmed")}
              onChanged={() => setEmergencyState("editing")}
            />
          ) : emergencyState === "editing" ? (
            <div className="rounded-lg border border-line p-3">
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Emergency contact</div>
              <div className="space-y-3">
                <TextField label="Name" value={emName} onChange={setEmName} />
                <TextField label="Relationship" value={emRelationship} onChange={setEmRelationship} />
                <TextField label="Phone" value={emPhone} onChange={setEmPhone} inputMode="tel" />
              </div>
              <button
                type="button"
                onClick={() => setEmergencyState("confirmed")}
                className="mt-3 cursor-pointer text-sm font-medium text-brand"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-line bg-white p-3">
              <div>
                <div className="text-sm font-semibold text-ink">Emergency contact</div>
                <div className="text-sm text-muted">
                  {emName} · {emRelationship} · {emPhone}
                </div>
              </div>
              <button type="button" onClick={() => setEmergencyState("editing")} className="cursor-pointer text-sm font-medium text-brand">
                Edit
              </button>
            </div>
          )}
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
