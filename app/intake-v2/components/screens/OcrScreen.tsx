"use client";

import { Ctx } from "../../ctx";
import { InfoIcon, InsuranceBrandIcon } from "../Icons";
import { CheckIcon, Eyebrow, InputField, ScreenCopy, ScreenTitle } from "../ui";

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
          <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center gap-2 bg-[var(--iv2-success-surface)] px-5 py-3.5">
              <CheckIcon size={16} strokeWidth={2.8} />
              <div className="text-xs font-bold tracking-[0.07em] text-[var(--iv2-success)] uppercase">Card read</div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3.5">
                <InsuranceBrandIcon />
                {state.ocrFieldsEditing ? (
                  <div className="min-w-0 flex-1">
                    <InputField
                      ariaLabel="Insurance carrier"
                      value={state.carrier}
                      placeholder="Blue Shield PPO"
                      onChange={(v) => update({ carrier: v })}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-[var(--iv2-text-primary)]">{state.carrier || "Blue Shield PPO"}</div>
                    <div className="text-[15px] text-[var(--iv2-text-secondary)]">Medical Insurance</div>
                  </div>
                )}
              </div>

              <div className="my-4 h-px bg-[var(--iv2-border-subtle)]" />

              <div className="flex flex-col gap-3.5">
                {state.ocrFieldsEditing ? (
                  <InputField label="Member" value={state.memberName} placeholder="Jane Doe" onChange={(v) => update({ memberName: v })} />
                ) : (
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="shrink-0 text-[15px] text-[var(--iv2-text-secondary)]">Member</div>
                    <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.memberName || "Jane Doe"}</div>
                  </div>
                )}
                {state.ocrFieldsEditing ? (
                  <InputField label="Member ID" value={state.memberId} placeholder="VZ48213" onChange={(v) => update({ memberId: v })} />
                ) : (
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="shrink-0 text-[15px] text-[var(--iv2-text-secondary)]">Member ID</div>
                    <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.memberId || "VZ48213"}</div>
                  </div>
                )}

                {state.ocrFieldsEditing ? (
                  <InputField label="Group number" value={state.groupValue} placeholder="00921" onChange={(v) => update({ groupValue: v })} />
                ) : state.groupFixed ? (
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="shrink-0 text-[15px] text-[var(--iv2-text-secondary)]">Group number</div>
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
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[var(--iv2-success-surface)] p-4">
            {state.eligibility === "done" ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)]">
                <CheckIcon size={13} color="#fff" strokeWidth={3} />
              </span>
            ) : (
              <span className="mt-0.5 h-6 w-6 shrink-0 animate-spin rounded-full border-[2.5px] border-[var(--iv2-success-border)] border-t-[var(--iv2-success)]" />
            )}
            <div>
              <div className="text-base font-bold text-[var(--iv2-success)]">
                {state.eligibility === "done" ? "Coverage verified" : "Checking with Blue Shield…"}
              </div>
              <div className="mt-0.5 text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
                {state.eligibility === "done"
                  ? "Blue Shield PPO is active for this visit. $40 office visit copay."
                  : "A few seconds — you can keep going with the rest of your check-in."}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[var(--iv2-surface-muted)] p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand)]">
              <InfoIcon size={13} color="#fff" />
            </span>
            <div>
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">Good to know</div>
              <div className="mt-0.5 text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
                We verify your coverage with Blue Shield. Final eligibility is confirmed at the time of your visit.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
