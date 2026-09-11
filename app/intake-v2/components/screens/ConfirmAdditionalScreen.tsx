"use client";

import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { Guardian } from "../../types";
import { formatPhone } from "../../format";
import { Card, Divider, Eyebrow, InputField, ScreenCopy, ScreenTitle, ValueRow } from "../ui";

// Confirm Additional Information — spec Parts 4-5, item 4. Both
// parents' contact and occupation, plus who completed registration —
// all shown as what's on file, one screen-level "Update" toggle.
export function ConfirmAdditionalScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const editing = state.confirmAdditionalEditing;
  const hasSecondGuardian = state.guardian2.name.trim().length > 0;

  const setGuardian = (which: "guardian1" | "guardian2", patch: Partial<Guardian>) =>
    update((s) => ({ [which]: { ...s[which], ...patch } }));

  return (
    <div className="px-6 py-6">
      <Eyebrow>{state.reviewingFromSuccess ? REVIEW_TITLE.confirmAdditional : "Confirm additional information"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Parent details on file</ScreenTitle>
      <ScreenCopy className="mb-6">We have this on file. Update only what&apos;s changed.</ScreenCopy>

      <Card>
        <div className="mb-1 text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">{state.guardian1.relationship || "Parent"}</div>
        {editing ? (
          <div className="flex flex-col gap-3.5">
            <InputField label="Name" value={state.guardian1.name} onChange={(v) => setGuardian("guardian1", { name: v })} />
            <InputField label="Mobile" value={state.guardian1.mobile} inputMode="tel" onChange={(v) => setGuardian("guardian1", { mobile: formatPhone(v) })} />
            <InputField label="Occupation" value={state.guardian1.occupation} placeholder="Optional" onChange={(v) => setGuardian("guardian1", { occupation: v })} />
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            <ValueRow label="Name" value={state.guardian1.name} />
            <ValueRow label="Mobile" value={state.guardian1.mobile} />
            <ValueRow label="Occupation" value={state.guardian1.occupation || "Not on file"} />
          </div>
        )}

        {hasSecondGuardian ? (
          <>
            <Divider className="my-4.5" />
            <div className="mb-1 text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">{state.guardian2.relationship || "Parent"}</div>
            {editing ? (
              <div className="flex flex-col gap-3.5">
                <InputField label="Name" value={state.guardian2.name} onChange={(v) => setGuardian("guardian2", { name: v })} />
                <InputField label="Mobile" value={state.guardian2.mobile} inputMode="tel" onChange={(v) => setGuardian("guardian2", { mobile: formatPhone(v) })} />
                <InputField label="Occupation" value={state.guardian2.occupation} placeholder="Optional" onChange={(v) => setGuardian("guardian2", { occupation: v })} />
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                <ValueRow label="Name" value={state.guardian2.name} />
                <ValueRow label="Mobile" value={state.guardian2.mobile} />
                <ValueRow label="Occupation" value={state.guardian2.occupation || "Not on file"} />
              </div>
            )}
          </>
        ) : null}

        <Divider className="my-4.5" />

        <div className="mb-1 text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Who completed registration</div>
        {editing ? (
          <div className="mt-2">
            <InputField value={state.completedBy} placeholder="Name (method)" onChange={(v) => update({ completedBy: v })} />
          </div>
        ) : (
          <div className="mt-2">
            <ValueRow label="On file" value={state.completedBy || "Not on file"} />
          </div>
        )}
      </Card>
    </div>
  );
}
