"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyPin } from "../../verify/actions";
import { MAX_PIN_ATTEMPTS } from "../../lib/security/attempts";
import { CodeInput } from "@/app/tap-intake/components/ui";

// The lightweight re-auth path for a device that's already completed
// strong verification AND set up a personal PIN (see
// verify/actions.ts's getDeviceVerificationState — this component only
// ever renders when that's already true). Fully self-contained, including
// its own heading, so VerifyScreen.tsx just picks PinPad vs.
// FullVerificationScreen with no shared chrome to keep in sync.
//
// No "too many attempts, tap to verify again" screen lives here on
// purpose — earlier this DID try to show one via local React state, but
// Next.js auto-re-renders the current route the instant a Server Action
// mutates cookies (see the framework doc excerpt quoted on
// LOCKOUT_NOTICE_COOKIE in verify/actions.ts). verifyPin's 5th-failure
// branch clears device trust as part of ITS OWN response, which swaps
// this component out for FullVerificationScreen before any state set
// afterward in the browser could ever paint — confirmed empirically (the
// screen change is instant, no intermediate frame). The lockout message
// itself is shown by FullVerificationScreen instead, via the
// `justLockedOut` flag that survives that automatic swap.
export function PinPad({ next }: { next: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [pending, startTransition] = useTransition();

  // Purely cosmetic — clears the shake class after its animation finishes,
  // not tied to any lockout timer (there isn't one anymore; see
  // attempts.ts's header comment on why the old escalating-timeout model
  // was replaced).
  useEffect(() => {
    if (!shake) return;
    const id = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(id);
  }, [shake]);

  function submit(pin: string) {
    startTransition(async () => {
      const result = await verifyPin(pin);
      if (result.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      setDigits("");
      setShake(true);
      // "reverify_required" needs no client handling at all — see the
      // header comment above; the route has already swapped to
      // FullVerificationScreen by the time this line runs.
      if (result.reason === "wrong") {
        setError(`Wrong PIN — ${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} left`);
      }
    });
  }

  function handleChange(v: string) {
    if (pending) return;
    setDigits(v);
    setError(null);
    if (v.length === 4) submit(v);
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-1 text-lg font-bold text-[var(--color-ink)]">Enter your PIN</h1>
      <p className="mb-8 max-w-[280px] text-center text-sm text-[var(--color-muted)]">
        This device is recognized — enter your PIN to continue.
      </p>
      <div className={shake ? "animate-[intake-shake_400ms_ease-in-out]" : ""}>
        <CodeInput length={4} value={digits} onChange={handleChange} mask autoFocus />
      </div>
      <div className="mt-4 min-h-[20px] text-sm font-medium text-red-500">{error}</div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">Up to {MAX_PIN_ATTEMPTS} attempts before a full re-verify.</p>
    </div>
  );
}
