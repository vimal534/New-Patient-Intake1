"use client";

import { Ctx } from "../../ctx";
import { AddressField, DobField, EmailField } from "../SmartField";
import { Card, Divider, ScreenCopy, ScreenTitle, ValueRow } from "../ui";

// Screen 3 — Personal information.
export function PersonalScreen({ ctx }: { ctx: Ctx }) {
  const { state, isRet, update } = ctx;
  const editing = !isRet || state.editingPersonal;

  const fields: { key: "email" | "dob" | "address"; label: string; placeholder: string; retValue: string }[] = [
    { key: "email", label: "Email", placeholder: "jane.doe@email.com", retValue: "jane.doe@email.com" },
    { key: "dob", label: "Date of birth", placeholder: "MM/DD/YYYY", retValue: "Aug 14, 1991" },
    { key: "address", label: "Address", placeholder: "123 Main Street, Oakwood NY", retValue: "123 Main Street\nOakwood, NY 10001" },
  ];

  return (
    <div className="px-6 py-6">
      <ScreenTitle>Review your information</ScreenTitle>
      <ScreenCopy className="mb-6">
        {isRet ? "Confirm what's on file. Update only what changed." : "Add the information we need for your visit."}
      </ScreenCopy>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">Jane Doe</div>
            <div className="mt-1 text-[13px] text-[var(--iv2-text-muted)]">
              {isRet ? "Last confirmed Aug 18, 2026" : "From your appointment booking"}
            </div>
          </div>
          {isRet ? (
            <div className="flex items-center gap-1.5 rounded-full bg-[var(--iv2-success-surface)] px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[var(--iv2-success)]">
              ✓ Up to date
            </div>
          ) : null}
        </div>

        <Divider className="my-4" />

        <div className="flex flex-col gap-3.5">
          <div>
            <div className="text-[13px] text-[var(--iv2-text-muted)]">Mobile</div>
            <div className="flex items-center gap-2">
              <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">(555) 123-4567</div>
              <div className="text-xs font-bold text-[var(--iv2-success)]">✓ Verified</div>
            </div>
          </div>

          {fields.map((f) => {
            if (!editing) return <ValueRow key={f.key} label={f.label} value={f.retValue} />;
            const value = isRet ? f.retValue : state.personal[f.key];
            const onChange = (v: string) => update((s) => ({ personal: { ...s.personal, [f.key]: v } }));
            if (f.key === "dob") return <DobField key={f.key} value={value} onChange={onChange} />;
            if (f.key === "email") return <EmailField key={f.key} value={value} onChange={onChange} />;
            return <AddressField key={f.key} label={f.label} placeholder={f.placeholder} value={value} onChange={onChange} />;
          })}
        </div>
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
          <ValueRow label="Gender" value="Female" />
          <ValueRow label="Preferred language" value="English" />
          <ValueRow label="Marital status" value="Married" />
        </div>
      ) : null}
    </div>
  );
}
