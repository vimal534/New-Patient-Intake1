"use client";

import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { formatPhone } from "../../format";
import { Card, Divider, Eyebrow, InputField, ScreenCopy, ScreenTitle, ValueRow } from "../ui";

// Confirm Your Information — spec Parts 4-5, item 3. Patient contact,
// guardian contact and insurance — all shown as what's on file (never
// a blank field), one screen-level "Update" toggle flips the whole
// thing into editable fields (same convention as the existing
// PersonalScreen/EmergencyScreen).
export function ConfirmInfoScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const editing = state.confirmInfoEditing;
  const g = state.guardian1;

  return (
    <div className="px-6 py-6">
      <Eyebrow>{state.reviewingFromSuccess ? REVIEW_TITLE.confirmInfo : "Confirm your information"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Is this still accurate?</ScreenTitle>
      <ScreenCopy className="mb-6">We have this on file from your last visit. Update only what&apos;s changed.</ScreenCopy>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.scheduling.patientName}</div>
            <div className="mt-1 text-[13px] text-[var(--iv2-text-muted)]">On file from your last visit</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--iv2-success-surface)] px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[var(--iv2-success)]">
            ✓ Up to date
          </div>
        </div>

        <Divider className="my-4.5" />

        <div className="mb-1 text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Patient contact</div>
        {editing ? (
          <div className="flex flex-col gap-3.5">
            <InputField label="Email" value={state.personal.email} placeholder="name@email.com" inputMode="email" onChange={(v) => update((s) => ({ personal: { ...s.personal, email: v } }))} />
            <InputField label="Date of birth" value={state.personal.dob} placeholder="MM/DD/YYYY" inputMode="numeric" onChange={(v) => update((s) => ({ personal: { ...s.personal, dob: v } }))} />
            <InputField label="Address" value={state.personal.address} placeholder="123 Main Street, Oakwood NY" onChange={(v) => update((s) => ({ personal: { ...s.personal, address: v } }))} />
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            <ValueRow label="Mobile" value={state.phoneOnFile} />
            <ValueRow label="Email" value={state.personal.email || `${state.scheduling.patientName.split(" ")[0].toLowerCase()}@email.com`} />
            <ValueRow label="Date of birth" value={state.personal.dob || "Not on file"} />
            <ValueRow label="Address" value={state.personal.address || state.guardian1.address || "123 Main Street, Oakwood, NY 10001"} />
          </div>
        )}

        <Divider className="my-4.5" />

        <div className="mb-1 text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Guardian contact</div>
        {editing ? (
          <div className="flex flex-col gap-3.5">
            <InputField label="Name" value={g.name} onChange={(v) => update((s) => ({ guardian1: { ...s.guardian1, name: v } }))} />
            <InputField label="Relationship" value={g.relationship} onChange={(v) => update((s) => ({ guardian1: { ...s.guardian1, relationship: v } }))} />
            <InputField label="Mobile" value={g.mobile} inputMode="tel" onChange={(v) => update((s) => ({ guardian1: { ...s.guardian1, mobile: formatPhone(v) } }))} />
            <InputField label="Address" value={g.address} onChange={(v) => update((s) => ({ guardian1: { ...s.guardian1, address: v } }))} />
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            <ValueRow label={g.relationship || "Guardian"} value={g.name} />
            <ValueRow label="Mobile" value={g.mobile} />
            <ValueRow label="Address" value={g.address} />
          </div>
        )}

        <Divider className="my-4.5" />

        <div className="mb-1 text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Insurance</div>
        {editing ? (
          <div className="flex flex-col gap-3.5">
            <InputField label="Insurance carrier" value={state.carrier} placeholder="Blue Shield PPO" onChange={(v) => update({ carrier: v })} />
            <InputField label="Member ID" value={state.memberId} placeholder="VZ48213" onChange={(v) => update({ memberId: v })} />
            <InputField label="Group number" value={state.groupValue} placeholder="00921" onChange={(v) => update({ groupValue: v })} />
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            <ValueRow label="Carrier" value={state.carrier || "Blue Shield PPO"} />
            <ValueRow label="Member ID" value={state.memberId || "••••8213"} />
          </div>
        )}
      </Card>

      <button
        type="button"
        onClick={() => update({ additionalOpen: !state.additionalOpen })}
        className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-2xl border-none bg-white p-4 shadow-[0_1px_2px_rgba(16,24,43,0.06)]"
      >
        <span className="text-base font-semibold text-[var(--iv2-text-primary)]">Additional information</span>
        <span className="text-sm text-[var(--iv2-text-muted)]">{state.additionalOpen ? "−" : "+"}</span>
      </button>

      {state.additionalOpen ? (
        <div className="mt-2 flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,43,0.06)]">
          <ValueRow label="Preferred language" value="English" />
        </div>
      ) : null}
    </div>
  );
}
