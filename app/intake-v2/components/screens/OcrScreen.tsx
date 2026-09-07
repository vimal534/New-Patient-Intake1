"use client";

import { Ctx } from "../../ctx";
import { InfoIcon } from "../Icons";
import { CheckIcon, Eyebrow, InfoNote, InputField, ScreenCopy, ScreenTitle, StatusStrip } from "../ui";

// Screen 7 — Coverage read (OCR review), step 2 of 2. Only the
// low-confidence Group field is interactive — everything else the OCR
// was confident about renders as a plain row (README: "do not ask the
// patient to re-verify fields the OCR was confident about").
export function OcrScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const manual = state.manualEntry;

  return (
    <div className="px-6 py-6">
      <Eyebrow>Coverage</Eyebrow>
      <div className="mb-1.5 text-[13px] text-[var(--iv2-text-muted)]">Step 2 of 2</div>
      <ScreenTitle>{manual ? "Enter your insurance details" : "Insurance"}</ScreenTitle>
      <ScreenCopy className="mb-6">
        {manual
          ? "Add the details from the front of your card."
          : "We read your card and are checking the coverage with your payer while you finish the rest of the form."}
      </ScreenCopy>

      {manual ? (
        <div className="flex flex-col gap-3.5 rounded-[20px] border border-[var(--iv2-border)] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <InputField label="Insurance carrier" value={state.carrier} placeholder="Blue Shield" onChange={(v) => update({ carrier: v })} />
          <InputField label="Member ID" value={state.memberId} placeholder="VZ48213" onChange={(v) => update({ memberId: v })} />
          <InputField label="Group number" value={state.groupValue} placeholder="00921" onChange={(v) => update({ groupValue: v })} />
        </div>
      ) : (
        <div>
          <div className="rounded-[20px] border border-[var(--iv2-border)] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="mb-4.5 flex items-center gap-2">
              <CheckIcon size={16} strokeWidth={2.8} />
              <div className="text-xs font-bold tracking-[0.07em] text-[var(--iv2-success)] uppercase">Card read</div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-4">
                <div className="shrink-0 text-[13px] font-semibold tracking-[0.05em] text-[var(--iv2-text-muted)] uppercase">Carrier</div>
                <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">Blue Shield PPO</div>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <div className="shrink-0 text-[13px] font-semibold tracking-[0.05em] text-[var(--iv2-text-muted)] uppercase">Member</div>
                <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">Jane Doe</div>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <div className="shrink-0 text-[13px] font-semibold tracking-[0.05em] text-[var(--iv2-text-muted)] uppercase">Member ID</div>
                <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">VZ48213</div>
              </div>

              {state.groupFixed ? (
                <div className="flex items-baseline justify-between gap-4">
                  <div className="shrink-0 text-[13px] font-semibold tracking-[0.05em] text-[var(--iv2-text-muted)] uppercase">Group</div>
                  <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.groupValue || "00921"}</div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--iv2-warning-border)] bg-[var(--iv2-warning-surface)] p-3.5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[13px] font-semibold tracking-[0.05em] text-[var(--iv2-warning)] uppercase">Group — please check</div>
                    <div className="text-[13px] text-[var(--iv2-warning)]">Blurry on the card</div>
                  </div>
                  <InputField
                    value={state.groupValue}
                    placeholder="00921"
                    ariaLabel="Group number"
                    tone="warning"
                    onChange={(v) => update({ groupValue: v })}
                  />
                  <button
                    type="button"
                    onClick={() => update((s) => ({ groupFixed: true, groupValue: s.groupValue || "00921" }))}
                    className="cursor-pointer border-none bg-transparent pt-2.5 text-[15px] font-semibold text-[var(--iv2-warning)]"
                  >
                    This is correct
                  </button>
                </div>
              )}
            </div>

            <div className="my-4.5 h-px bg-[var(--iv2-border-subtle)]" />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  update({ groupFixed: false });
                  ctx.go("coverage");
                }}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[var(--iv2-brand)]"
              >
                Re-scan card
              </button>
              <button
                type="button"
                onClick={() => update({ backScanned: !state.backScanned })}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] font-semibold text-[var(--iv2-text-secondary)]"
              >
                {state.backScanned ? "✓ Back captured" : "Scan back"}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <StatusStrip
              tone={state.eligibility === "done" ? "success" : "pending"}
              label={state.eligibility === "done" ? "Blue Shield active · $40 office visit" : "Checking with Blue Shield…"}
              meta={state.eligibility === "done" ? "Verified" : "A few seconds"}
            />
          </div>

          <div className="mt-3">
            <InfoNote>
              <InfoIcon color="#667085" />
              <div className="text-[15px] leading-[1.5] text-[var(--iv2-text-secondary)]">
                Coverage is confirmed before your visit, so there&apos;s no surprise self-pay at the desk and no claim
                denied for an inactive plan.
              </div>
            </InfoNote>
          </div>
        </div>
      )}
    </div>
  );
}
