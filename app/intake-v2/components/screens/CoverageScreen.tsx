"use client";

import { Ctx } from "../../ctx";
import { POLICYHOLDER_SCENARIOS, REVIEW_TITLE } from "../../constants";
import { ScanCardIcon, ShieldPlainIcon } from "../Icons";
import { Card, Divider, Eyebrow, InfoNote, LabelValueRow, ScreenCopy, ScreenTitle } from "../ui";

// Screen 6 — Coverage (step 1 of 2). Known-coverage review for a
// returning patient who hasn't flagged a change, vs. the scan-capture
// panel for a new patient or a returning patient who chose to change it.
export function CoverageScreen({ ctx }: { ctx: Ctx }) {
  const { state, isRet, update } = ctx;
  const known = isRet && !state.coverageChanging;
  const capture = !isRet || state.coverageChanging;

  // The scan always reads cleanly now — Payment sits right after
  // Insurance in every flow, so a scripted "first attempt always comes
  // back blurry" demo would mean every patient hits a dead-end retry
  // screen before ever reaching it. `scanBlurry`/`scanRetried` stay in
  // state (OcrScreen's "Re-scan card" still resets them) purely so a
  // future, real "we couldn't read this" failure has somewhere to
  // land — this flow just never triggers it itself anymore.
  const startScan = () => {
    update({ scanning: true, scanBlurry: false });
    // New-patient minors ask "Is [guardian] the policyholder?" right
    // after the card is read (OcrScreen.tsx) — eligibility can't be
    // checked before we know who to check it for, so don't start it
    // here for those scenarios; OcrScreen starts it once that
    // question is answered instead.
    if (!POLICYHOLDER_SCENARIOS.includes(state.demoScenarioId) && state.eligibility === "idle") ctx.startEligibility();
    window.setTimeout(() => {
      update({ scanning: false, groupFixed: true });
      ctx.go("ocr");
    }, 1600);
  };

  return (
    <div className="px-6 py-6">
      <Eyebrow>{state.reviewingFromSuccess ? REVIEW_TITLE.coverage : "Coverage"}</Eyebrow>
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
            <div className="flex flex-col gap-4">
              <LabelValueRow label="Member ID" value={state.memberId || "••••8213"} />
              <LabelValueRow label="Last verified" value="Aug 18, 2026" />
            </div>
          </Card>
          <div className="mt-7 text-xl font-bold text-[var(--iv2-text-primary)]">Still using this insurance?</div>
        </div>
      ) : null}

      {capture ? (
        <div>
          {state.scanBlurry ? (
            <div className="flex w-full flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] p-11 px-6 text-center" style={{ borderColor: "var(--iv2-warning-border)", backgroundColor: "var(--iv2-warning-surface)" }}>
              <span className="mb-3 flex h-17 w-17 items-center justify-center rounded-full bg-white" style={{ height: 68, width: 68 }}>
                <ScanCardIcon />
              </span>
              <span className="text-lg font-semibold text-[var(--iv2-warning)]">We couldn&apos;t read the Group Number</span>
              <span className="text-[15px] text-[var(--iv2-warning)]">Please rescan the card before continuing.</span>
              <button
                type="button"
                onClick={startScan}
                className="mt-3 flex h-12 w-full max-w-[220px] cursor-pointer items-center justify-center rounded-xl border-none bg-[var(--iv2-warning)] text-[15px] font-bold text-white"
              >
                Retake photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startScan}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed p-11 px-6"
              style={{ borderColor: "var(--iv2-scan-border)", backgroundColor: "var(--iv2-scan-bg)" }}
            >
              <span className="mb-3 flex h-17 w-17 items-center justify-center rounded-full bg-white" style={{ height: 68, width: 68 }}>
                <ScanCardIcon />
              </span>
              <span className="text-lg font-semibold text-[var(--iv2-brand)]">{state.scanning ? "Capturing…" : "Tap to scan a card"}</span>
              <span className="text-[15px]" style={{ color: "var(--iv2-scan-sub)" }}>
                Insurance card, business card, or anything similar
              </span>
            </button>
          )}

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
