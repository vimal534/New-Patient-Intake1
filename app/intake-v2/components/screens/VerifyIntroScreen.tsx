"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Ctx } from "../../ctx";
import { ArrowRightIcon, BoltIcon, LockIcon, PhoneIcon, ShieldCheckIcon, SignalWaveIcon } from "../Icons";
import { prefersReducedMotion } from "../motion";

// Screen 0 (new) — Verify intro. Sits before the OTP auto-fill screen —
// "Text me a code" advances into that existing flow; this screen only
// sets the phone number's expectation and sells why re-verifying is
// quick. No shared header (matches otp/welcome/success) and no shared
// sticky Footer either — the trust line at the very bottom needs to sit
// *below* the action buttons, which the shared Footer can't do, so this
// screen renders its own bottom section and footerFor suppresses the
// shared one for this key.
//
// The phone on file is read-only here — no "Edit" next to it. An
// unverified visitor shouldn't be able to redirect the OTP to a number
// of their own choosing before identity is confirmed.
export function VerifyIntroScreen({ ctx }: { ctx: Ctx }) {
  const { state, update, next, isRet } = ctx;

  // New-patient variant drops the "Welcome back" line entirely — no
  // prior visit exists to welcome them back to (spec: Identity
  // Verification — NEW PATIENT variant).
  const firstName = state.scheduling.patientName.split(" ")[0];

  // A slow, quiet breathing pulse on the two "broadcast" wave icons
  // either side of the shield — purely decorative, so it's skipped
  // entirely under prefers-reduced-motion rather than just sped up.
  const wavesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !wavesRef.current) return;
    const tween = gsap.to(wavesRef.current.children, {
      opacity: 0.35,
      scale: 0.92,
      duration: 1.1,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 0.15,
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col px-6 pt-10 pb-6 text-center">
      <div ref={wavesRef} className="relative mx-auto mb-4 flex h-[110px] w-[110px] items-center justify-center">
        <span className="absolute top-1/2 -left-4 -translate-y-1/2">
          <SignalWaveIcon size={28} />
        </span>
        <span className="absolute top-1/2 -right-4 -translate-y-1/2" style={{ transform: "translateY(-50%) scaleX(-1)" }}>
          <SignalWaveIcon size={28} />
        </span>
        <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
          <ShieldCheckIcon size={44} />
        </div>
      </div>

      {isRet ? <div className="mt-3 mb-1.5 text-lg font-semibold text-[var(--iv2-brand)]">Welcome back, {firstName}</div> : null}
      <div className={`mb-3 text-[28px] leading-[1.2] font-bold text-[var(--iv2-text-primary)] ${isRet ? "" : "mt-3"}`}>Let&apos;s verify it&apos;s you</div>
      <div className="mx-auto mb-7 max-w-[300px] text-base leading-[1.5] text-[var(--iv2-text-secondary)]">
        We&apos;ll send a one-time code to the phone number we have on file.
      </div>

      <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-[var(--iv2-brand-surface)] p-4 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
          <PhoneIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Phone on file</div>
          <div className="mt-0.5 text-lg font-bold text-[var(--iv2-text-primary)]">{state.phoneOnFile}</div>
          <div className="mt-0.5 text-[13px] text-[var(--iv2-text-secondary)]">This is the number we have for {firstName}.</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 text-left">
        <div className="flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
            <BoltIcon size={18} />
          </span>
          <div>
            <div className="text-base font-bold text-[var(--iv2-text-primary)]">No password needed</div>
            <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">One tap on the text we send confirms it&apos;s you.</div>
          </div>
        </div>
        <div className="flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
            <LockIcon size={16} color="#1677E8" />
          </span>
          <div>
            <div className="text-base font-bold text-[var(--iv2-text-primary)]">Keeps your information safe</div>
            <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Protects your health information, always.</div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={next}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-none bg-[var(--iv2-brand)] text-base font-bold text-white hover:bg-[var(--iv2-brand-hover)] active:scale-[0.98]"
        >
          Text me a code
          <ArrowRightIcon />
        </button>

        <button
          type="button"
          onClick={() => update({ identityFallbackOpen: true })}
          className="mt-2 h-11 w-full cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-text-muted)] hover:text-[var(--iv2-brand)]"
        >
          That&apos;s not me
        </button>
      </div>
    </div>
  );
}
