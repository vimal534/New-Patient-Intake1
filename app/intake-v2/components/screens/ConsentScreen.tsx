"use client";

import { Ctx } from "../../ctx";
import { Card, Checkbox24, Eyebrow, ScreenTitle, TextAction } from "../ui";

// Screen 13 — Consent & signature.
export function ConsentScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <div className="px-6 py-6">
      <Eyebrow>Forms</Eyebrow>
      <ScreenTitle className="mb-5">Review &amp; sign</ScreenTitle>

      <Card>
        <div className="text-base leading-[1.6] text-[var(--iv2-text-primary)]">
          You agree to treatment at Main St. Clinic, allow the practice to bill your insurance, and confirm you
          received the notice of privacy practices.
        </div>
        <TextAction onClick={() => update({ consentFullOpen: true })} className="pt-3.5 text-[15px]">
          Read full consent ›
        </TextAction>
      </Card>

      <button
        type="button"
        onClick={() => update({ agreed: !state.agreed })}
        className="mt-4 flex w-full cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left"
      >
        <Checkbox24 checked={state.agreed} />
        <span className="text-[15px] leading-[1.45] text-[var(--iv2-text-primary)]">
          I have read and agree to the terms above.
        </span>
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
            Jane Doe
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-[var(--iv2-text-muted)]">Tap to sign</span>
        )}
      </button>
    </div>
  );
}
