"use client";

import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { CheckIcon, DocumentIcon } from "../Icons";
import { Card, Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

// Consent on File — spec Parts 4-5, item 6. Shown as already signed;
// "Update" flips into the same checkbox + tap-to-sign flow the fresh
// Policies screen uses (reuses agreed/signed).
export function ConsentOnFileScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const editing = state.consentOnFileEditing;
  const signerName = state.guardian1.name.trim() || state.scheduling.patientName;

  return (
    <div className="px-6 py-6">
      <Eyebrow>{state.reviewingFromSuccess ? REVIEW_TITLE.consentOnFile : "Consent on file"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Consent to treat</ScreenTitle>
      <ScreenCopy className="mb-6">
        {editing ? "Re-sign below to update your consent on file." : "Signed and on file from a previous visit."}
      </ScreenCopy>

      {editing ? (
        <>
          <button
            type="button"
            onClick={() => update({ agreed: !state.agreed })}
            className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border-none bg-[var(--iv2-brand-tint)] p-4 text-left"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-sm font-extrabold text-white"
              style={{
                borderColor: state.agreed ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
                backgroundColor: state.agreed ? "var(--iv2-brand)" : "#fff",
              }}
            >
              {state.agreed ? "✓" : ""}
            </span>
            <div className="text-[15px] leading-[1.45] font-semibold text-[var(--iv2-text-primary)]">
              I have read and agree to the consent to treat on behalf of {signerName}.
            </div>
          </button>

          <div className="mt-6 mb-2 text-[13px] text-[var(--iv2-text-muted)]">Signature</div>
          <button
            type="button"
            onClick={() => update({ signed: !state.signed })}
            className="flex h-[110px] w-full cursor-pointer items-center justify-center rounded-2xl border-[1.5px] bg-white"
            style={{ borderColor: state.signed ? "var(--iv2-brand)" : "var(--iv2-border)" }}
          >
            {state.signed ? (
              <span className="text-[38px] text-[var(--iv2-text-primary)]" style={{ fontFamily: "var(--font-caveat), cursive" }}>
                {signerName}
              </span>
            ) : (
              <span className="text-[15px] font-semibold text-[var(--iv2-text-muted)]">Tap to sign</span>
            )}
          </button>
        </>
      ) : (
        <Card>
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
              <DocumentIcon color="#1677E8" />
            </span>
            <div>
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">Consent to treat</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[15px] font-semibold text-[var(--iv2-success)]">
                <CheckIcon size={14} strokeWidth={2.8} />
                Signed {state.lastConfirmed}
              </div>
            </div>
          </div>
          <div className="mt-4 text-[15px] leading-[1.5] text-[var(--iv2-text-secondary)]">
            Signed electronically by {signerName} on behalf of {state.scheduling.patientName}.
          </div>
        </Card>
      )}
    </div>
  );
}
