"use client";

import { Ctx } from "../../ctx";
import { InfoIcon, ShieldCheckIcon } from "../Icons";
import { CheckIcon, InfoNote } from "../ui";

// Screen 1 — Verification. No header (hidden by the caller). The six
// digits auto-fill on an interval owned by page.tsx (mirrors the
// prototype's componentDidMount timer) — this component is purely
// presentational.
export function OtpScreen({ ctx }: { ctx: Ctx }) {
  const { otp } = ctx.state;
  const cells = Array.from({ length: 6 }, (_, i) => otp[i] || "");
  const verified = otp.length === 6;

  return (
    <div className="flex flex-col items-center px-6 pt-16 pb-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
        <ShieldCheckIcon />
      </div>
      <div className="mb-3 text-2xl leading-[1.25] font-bold text-[var(--iv2-text-primary)]">Confirming it&apos;s you</div>
      <div className="mb-7 max-w-[300px] text-base leading-[1.55] text-[var(--iv2-text-secondary)]">
        We texted a code to (•••) •••–0148 and filled it in for you.
      </div>

      <div className="flex w-full gap-2.5">
        {cells.map((digit, i) => (
          <div
            key={i}
            className="flex h-16 flex-1 items-center justify-center rounded-2xl border-[1.5px] bg-white text-[26px] font-semibold text-[var(--iv2-text-primary)]"
            style={{ borderColor: digit ? "var(--iv2-brand)" : "var(--iv2-border)" }}
          >
            {digit}
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex h-[26px] items-center justify-center">
        {verified ? (
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--iv2-success)]">
            <CheckIcon />
            Verified
          </div>
        ) : (
          <div className="text-[15px] text-[var(--iv2-text-muted)]">Reading your code…</div>
        )}
      </div>

      <div className="mt-5 w-full">
        <InfoNote>
          <InfoIcon size={18} />
          <div className="text-sm leading-[1.5] text-[var(--iv2-text-primary)]">
            Every check-in link opens this way. Nothing on the record loads until the phone it belongs to answers.
          </div>
        </InfoNote>
      </div>
    </div>
  );
}
