"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestVerificationCode,
  confirmVerificationCode,
  confirmLogin,
  setDevicePin,
} from "../../verify/actions";
import { CodeInput, OptionTile, PrimaryButton, TextField, TextLink } from "@/app/tap-intake/components/ui";

type Step = "choose" | "otp" | "login" | "setPin";
type Method = "email" | "sms";

// Strong initial verification for a new/unrecognized device — the ONLY
// path that can grant device trust (see deviceToken.ts's header comment).
// A device that fails this, or that's never completed it, never sees a
// PIN prompt at all; VerifyScreen only renders this component when
// getDeviceVerificationState() says the fast path isn't available.
//
// Four internal steps, each owning its own heading (no shared chrome with
// PinPad — see PinPad.tsx's header comment on why): choose a method ->
// enter the code (or log in) -> optionally set up a PIN for next time.
export function FullVerificationScreen({ next, justLockedOut = false }: { next: string; justLockedOut?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method | null>(null);
  const [destinationLabel, setDestinationLabel] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function chooseMethod(m: Method) {
    setMethod(m);
    setCode("");
    setCodeError(null);
    startTransition(async () => {
      const result = await requestVerificationCode(m);
      setDestinationLabel(result.destinationLabel);
      setStep("otp");
    });
  }

  function submitCode(value: string) {
    startTransition(async () => {
      const result = await confirmVerificationCode(value);
      if (result.ok) {
        setStep("setPin");
        return;
      }
      setCode("");
      setCodeError("That code didn't match — try again.");
    });
  }

  function handleCodeChange(v: string) {
    setCode(v);
    setCodeError(null);
    if (v.length === 6) submitCode(v);
  }

  function submitLogin() {
    startTransition(async () => {
      const result = await confirmLogin(email, password);
      if (result.ok) {
        setStep("setPin");
        return;
      }
      setLoginError("Enter both your email and password.");
    });
  }

  function finishWithoutPin() {
    router.replace(next);
    router.refresh();
  }

  function submitPin() {
    if (pin.length < 4) {
      setPinError("PIN must be at least 4 digits.");
      return;
    }
    if (pin !== pinConfirm) {
      setPinError("PINs didn't match — try again.");
      setPinConfirm("");
      return;
    }
    startTransition(async () => {
      const result = await setDevicePin(pin);
      if (!result.ok) {
        // Trust cookie missing/expired mid-flow — extremely unlikely in
        // this single-page sequence, but fall back to plain "no PIN this
        // time" rather than dead-ending on an error the guardian can't
        // act on.
        finishWithoutPin();
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  if (step === "choose") {
    return (
      <div>
        {justLockedOut ? (
          <div className="mb-4 rounded-lg border border-[var(--color-orange)]/40 bg-[var(--color-orange)]/10 p-3">
            <p className="text-sm font-semibold text-[var(--color-orange)]">Too many attempts</p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              For your security, this device needs to verify your identity the full way again before a PIN will
              work here.
            </p>
          </div>
        ) : null}
        <h1 className="mb-1 text-lg font-bold text-[var(--color-ink)]">Verify it&apos;s you</h1>
        <p className="mb-6 max-w-[300px] text-sm text-[var(--color-muted)]">
          {justLockedOut
            ? "Confirm it's really you the same way as the first time on this device."
            : "This device hasn't been verified before. We need to confirm it's really you before showing any health information."}
        </p>
        <div className="flex flex-col gap-2">
          <OptionTile label="Email me a code" selected={false} onClick={() => chooseMethod("email")} />
          <OptionTile label="Text me a code" selected={false} onClick={() => chooseMethod("sms")} />
        </div>
        <div className="mt-4 text-center">
          <TextLink onClick={() => setStep("login")}>Log in to your account instead</TextLink>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col items-center">
        <h1 className="mb-1 text-lg font-bold text-[var(--color-ink)]">Enter the code</h1>
        <p className="mb-8 max-w-[280px] text-center text-sm text-[var(--color-muted)]">
          We sent a 6-digit code to <span className="font-semibold text-[var(--color-ink)]">{destinationLabel}</span>.
          {/* Demo-only affordance — a real build never surfaces the code
              itself; see verify/actions.ts's DEMO_VERIFICATION_CODE. */}
          {" "}(Demo: enter 000000)
        </p>
        <CodeInput length={6} value={code} onChange={handleCodeChange} mask={false} error={codeError ?? undefined} autoFocus />
        <div className="mt-6 flex gap-4 text-sm">
          <TextLink onClick={() => method && chooseMethod(method)}>Resend code</TextLink>
          <TextLink onClick={() => setStep("choose")}>Use a different method</TextLink>
        </div>
      </div>
    );
  }

  if (step === "login") {
    return (
      <div>
        <h1 className="mb-1 text-lg font-bold text-[var(--color-ink)]">Log in to your account</h1>
        <p className="mb-6 max-w-[300px] text-sm text-[var(--color-muted)]">
          Confirms your identity the same as an email/text code would.
        </p>
        <div className="space-y-3">
          <TextField label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <TextField label="Password" value={password} onChange={setPassword} type="password" autoComplete="current-password" />
        </div>
        {loginError ? <p className="mt-2 text-xs text-red-500">{loginError}</p> : null}
        <div className="mt-5">
          <PrimaryButton disabled={pending} onClick={submitLogin}>
            {pending ? "Logging in…" : "Log in"}
          </PrimaryButton>
        </div>
        <div className="mt-3 text-center">
          <TextLink onClick={() => setStep("choose")}>Back</TextLink>
        </div>
      </div>
    );
  }

  // step === "setPin"
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-1 text-lg font-bold text-[var(--color-ink)]">Create a PIN</h1>
      <p className="mb-8 max-w-[280px] text-center text-sm text-[var(--color-muted)]">
        You&apos;re verified. Set a 4-digit PIN so next time on this device is faster — you can always skip this.
      </p>
      <div className="mb-6">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">New PIN</p>
        <CodeInput length={4} value={pin} onChange={(v) => { setPin(v); setPinError(null); }} mask autoFocus />
      </div>
      <div>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Confirm PIN</p>
        <CodeInput length={4} value={pinConfirm} onChange={(v) => { setPinConfirm(v); setPinError(null); }} mask />
      </div>
      {pinError ? <p className="mt-3 text-xs text-red-500">{pinError}</p> : null}
      <div className="mt-6 w-full">
        <PrimaryButton disabled={pending} onClick={submitPin}>
          {pending ? "Saving…" : "Create PIN"}
        </PrimaryButton>
      </div>
      <div className="mt-3 text-center">
        <TextLink onClick={finishWithoutPin}>Skip for now</TextLink>
      </div>
    </div>
  );
}
