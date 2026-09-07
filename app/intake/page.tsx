"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/app/tap-intake/components/PhoneFrame";
import { PrimaryButton } from "@/app/tap-intake/components/ui";

// The one screen an unverified device can see — no patient health
// information here, just what this is and how to proceed. Everything past
// this point (the verification screen aside) is guarded by proxy.ts.
// Reuses tap-intake's actual PhoneFrame/StatusBar/PrimaryButton — this is
// the same visual system as /tap-intake, not a new design.
//
// Copy updated (Pass 14) away from the old "ask a staff member for
// today's device PIN" front-desk-kiosk framing — this is now a personal-
// device trust model (the guardian's own phone, verified once via email/
// SMS/login, then a personal PIN for later visits), not a shared clinic
// tablet unlocked by staff. See docs/architecture.md's "Phase 1b" section.
export default function IntakeWelcomePage() {
  const router = useRouter();
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[var(--color-teal)]">✚</span>
          <span className="text-lg font-bold text-[var(--color-brand)]">
            Health<span className="text-[var(--color-teal)]">pro</span>
          </span>
          <span className="text-lg font-normal text-[var(--color-ink)]">Clinic</span>
        </div>

        <h1 className="mt-8 text-center text-[28px] font-bold leading-tight text-[var(--color-ink)]">
          Patient intake
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-center text-sm text-[var(--color-muted)]">
          Before we show any health information, we need to verify it&apos;s you — a quick one-time check the first
          time on this device, then just a PIN after that.
        </p>

        <div className="flex-1" />

        <PrimaryButton onClick={() => router.push("/intake/app")}>Continue</PrimaryButton>
        <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
          You&apos;ll be asked to verify on the next screen.
        </p>
      </div>
    </PhoneFrame>
  );
}
