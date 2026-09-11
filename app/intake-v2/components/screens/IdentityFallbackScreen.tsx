"use client";

import { useEffect, useRef, useState } from "react";
import { Ctx } from "../../ctx";
import { CheckIcon, ShieldCheckIcon } from "../Icons";
import { getScrollParent, prefersReducedMotion, scrollToTop } from "../motion";
import { DobField } from "../SmartField";
import { InputField } from "../ui";

// "That's not me," reached from VerifyIntroScreen — the identified
// PATIENT is wrong (as opposed to "I can't access this number," where
// the right patient just can't use that phone; that's a different
// recovery path this screen must not be conflated with). Deliberately
// does not let the visitor edit the phone number on file — instead it's
// a fully separate identity check: full name + date of birth, the same
// two facts front-desk staff would ask for in person. Rendered by
// page.tsx in place of the normal flow (state.identityFallbackOpen)
// rather than as its own flow step, so dismissing it or finishing it
// never has to unwind a skipped step in `idx`.
//
// There's no real backend to re-verify against here, so "Submit" just
// hands this off to staff to confirm at check-in — the honest thing a
// phone-only flow can do once the phone itself is in question — rather
// than pretending to grant access on unverified say-so.
export function IdentityFallbackScreen({ ctx }: { ctx: Ctx }) {
  const { update } = ctx;
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const ready = name.trim().length > 0 && dob.length === 10;
  const close = () => update({ identityFallbackOpen: false });

  // page.tsx only scrolls its shared scroll container back to top on an
  // actual flow-step change (keyed on `key`) — this screen renders in
  // place of that flow instead of as its own step, so submitting from a
  // scrolled-down position (the form fields, near the bottom) would
  // otherwise leave the confirmation scrolled out of view above the
  // fold — it renders fine, just off-screen, which reads as "nothing
  // happened" or a jump back to some blank/landing state. Reset both
  // the app's own scroll container (mobile — PhoneFrame is exactly
  // viewport-height there, so this is the only scroll that can exist)
  // and the browser window itself (desktop preview — PhoneFrame renders
  // at a fixed height inside a taller, separately-scrollable page).
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!submitted) return;
    const parent = getScrollParent(rootRef.current);
    if (parent) scrollToTop(parent);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [submitted]);

  if (submitted) {
    return (
      <div ref={rootRef} className="flex min-h-full flex-col items-center px-6 pt-10 pb-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
          <CheckIcon size={28} color="var(--iv2-success)" strokeWidth={3} />
        </div>
        <div className="mb-2 text-[22px] leading-[1.25] font-bold text-[var(--iv2-text-primary)]">Thanks — that&apos;s on file</div>
        <div className="mx-auto max-w-[300px] text-base leading-[1.5] text-[var(--iv2-text-secondary)]">
          Our front desk will confirm your identity when you arrive, using what you shared here.
        </div>
        <button
          type="button"
          onClick={close}
          className="mt-8 h-14 w-full cursor-pointer rounded-2xl border-none bg-[var(--iv2-brand)] text-base font-bold text-white hover:bg-[var(--iv2-brand-hover)] active:scale-[0.98]"
        >
          Back to sign-in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-10 pb-6 text-center">
      <div className="mx-auto mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
        <ShieldCheckIcon size={36} />
      </div>

      <div className="mb-3 text-[26px] leading-[1.2] font-bold text-[var(--iv2-text-primary)]">Let&apos;s verify a different way</div>
      <div className="mx-auto mb-7 max-w-[300px] text-base leading-[1.5] text-[var(--iv2-text-secondary)]">
        That phone number isn&apos;t you, so we won&apos;t use it to confirm your identity. Share a couple of details instead and our front desk will verify you in person.
      </div>

      <div className="flex flex-col gap-3.5 text-left">
        <InputField label="Patient's full name" value={name} placeholder="Full name" onChange={setName} />
        <DobField label="Patient's date of birth" value={dob} onChange={setDob} />
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => ready && setSubmitted(true)}
          disabled={!ready}
          className={`h-14 w-full rounded-2xl border-none text-base font-bold active:scale-[0.98] ${
            ready
              ? "cursor-pointer bg-[var(--iv2-brand)] text-white hover:bg-[var(--iv2-brand-hover)]"
              : "cursor-not-allowed bg-[var(--iv2-disabled-bg)] text-[var(--iv2-disabled-fg)]"
          }`}
        >
          Submit for verification
        </button>

        <button type="button" onClick={close} className="mt-2 h-11 w-full cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-text-muted)] hover:text-[var(--iv2-brand)]">
          Back to sign-in
        </button>
      </div>
    </div>
  );
}
