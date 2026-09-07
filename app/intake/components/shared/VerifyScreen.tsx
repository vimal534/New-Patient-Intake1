"use client";

import { PinPad } from "./PinPad";
import { FullVerificationScreen } from "./FullVerificationScreen";

// Picks which of the two verification paths this device gets — the ONLY
// decision this component makes; each path fully owns its own headings/
// copy/steps (see PinPad.tsx and FullVerificationScreen.tsx). `canUsePin`
// comes from a Server Component read of the device-trust + device-PIN
// cookies (verify/actions.ts's getDeviceVerificationState) so the choice
// is made server-side, before any client JS runs — a new/unrecognized
// device never even flashes a PIN screen it would immediately fail.
export function VerifyScreen({
  canUsePin,
  justLockedOut,
  next,
}: {
  canUsePin: boolean;
  // True for exactly the one render right after a 5th wrong PIN attempt
  // cleared device trust — see LOCKOUT_NOTICE_COOKIE's comment in
  // verify/actions.ts. Irrelevant when canUsePin is true (a device that
  // still has a valid PIN wasn't the one that just got locked out).
  justLockedOut: boolean;
  next: string;
}) {
  return canUsePin ? <PinPad next={next} /> : <FullVerificationScreen next={next} justLockedOut={justLockedOut} />;
}
