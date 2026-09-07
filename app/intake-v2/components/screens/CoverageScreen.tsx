"use client";

import { Ctx } from "../../ctx";
import { ScanCardIcon, ShieldPlainIcon } from "../Icons";
import { Card, Divider, Eyebrow, InfoNote, InputField, LabelValueRow, ScreenCopy, ScreenTitle } from "../ui";

// Screen 6 — Coverage (step 1 of 2). Known-coverage review for a
// returning patient who hasn't flagged a change, vs. the scan-capture
// panel for a new patient or a returning patient who chose to change it.
export function CoverageScreen({ ctx }: { ctx: Ctx }) {
  const { state, isRet, update } = ctx;
  const known = isRet && !state.coverageChanging;
  const capture = !isRet || state.coverageChanging;

  return (
    <div className="px-6 py-6">
      <Eyebrow>Coverage · step 1 of 2</Eyebrow>
      <ScreenTitle>{known ? "Your coverage" : "Insurance"}</ScreenTitle>
      <ScreenCopy className="mb-6">
        {known
          ? "We have this coverage on file."
          : "Photograph the card and we read it, then check the coverage with your payer while the rest of the form is still being filled in."}
      </ScreenCopy>

      {known ? (
        <div>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-bold text-[var(--iv2-text-primary)]">Blue Shield</div>
                <div className="mt-0.5 text-base text-[var(--iv2-text-secondary)]">PPO</div>
              </div>
              <ShieldPlainIcon />
            </div>
            <Divider className="my-4.5" />
            {state.coverageEditing ? (
              <div className="flex flex-col gap-3.5">
                <InputField
                  label="Member ID"
                  value={state.memberId}
                  placeholder="VZ48213"
                  onChange={(v) => update({ memberId: v })}
                />
                <InputField
                  label="Group number"
                  value={state.groupValue}
                  placeholder="00921"
                  onChange={(v) => update({ groupValue: v })}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <LabelValueRow label="Member ID" value={state.memberId || "••••8213"} />
                <LabelValueRow label="Last verified" value="Aug 18, 2026" />
              </div>
            )}
          </Card>
          {!state.coverageEditing ? (
            <div className="mt-7 text-xl font-bold text-[var(--iv2-text-primary)]">Still using this insurance?</div>
          ) : null}
        </div>
      ) : null}

      {capture ? (
        <div>
          <button
            type="button"
            onClick={() => {
              update({ scanning: true });
              if (state.eligibility === "idle") ctx.startEligibility();
              window.setTimeout(() => {
                update({ scanning: false });
                ctx.go("ocr");
              }, 1600);
            }}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed p-11 px-6"
            style={{ borderColor: "var(--iv2-scan-border)", backgroundColor: "var(--iv2-scan-bg)" }}
          >
            <span className="mb-3 flex h-17 w-17 items-center justify-center rounded-full bg-white" style={{ height: 68, width: 68 }}>
              <ScanCardIcon />
            </span>
            <span className="text-lg font-semibold text-[var(--iv2-brand)]">{state.scanning ? "Capturing…" : "Tap to scan a card"}</span>
            <span className="text-[15px]" style={{ color: "var(--iv2-scan-sub)" }}>
              Insurance card, business card — anything
            </span>
          </button>

          <div className="mt-5">
            <InfoNote tone="quiet">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="9.5" stroke="#667085" strokeWidth={1.8} />
                <path d="M12 11v6M12 7.6v.4" stroke="#667085" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
              <div className="text-[15px] leading-[1.5] text-[var(--iv2-text-primary)]">
                Your front desk makes this check by phone or portal, one patient at a time. We run it the moment the
                card is captured and write the answer to your chart.
              </div>
            </InfoNote>
          </div>

          {state.scanning ? (
            <div className="mt-4 rounded-2xl bg-[var(--iv2-brand-tint)] px-4 py-3.5 text-[15px] font-semibold text-[var(--iv2-brand-hover)]">
              Reading your card…
            </div>
          ) : null}

          <div className="mt-5 text-center text-sm text-[var(--iv2-text-muted)]">Nothing is stored on your phone.</div>
        </div>
      ) : null}
    </div>
  );
}
