"use server";

import { cookies } from "next/headers";
import {
  createDeviceTrustToken,
  createDevicePinToken,
  createSessionVerifiedToken,
  isValidDeviceTrustToken,
  isMatchingPin,
  DEVICE_TRUST_COOKIE,
  DEVICE_PIN_COOKIE,
  SESSION_VERIFIED_COOKIE,
  DEVICE_TRUST_MAX_AGE_SECONDS,
} from "../lib/security/deviceToken";
import {
  ATTEMPTS_COOKIE_NAME,
  parseAttempts,
  serializeAttempts,
  recordFailure,
  attemptsRemaining,
  isExhausted,
} from "../lib/security/attempts";

// Personal-device trust model (Pass 14 — see docs/architecture.md and the
// header comment on lib/security/deviceToken.ts for the full three-token
// design this file drives). Every write here goes through httpOnly cookies
// via the Server Action `cookies()` API — nothing PHI-related is ever
// trusted to a value the client could forge.
//
// TODO(real deployment): the demo verification code and the guardian
// contact info below are stand-ins for a real email/SMS provider + the
// actual matched patient record. This file's cookie/token mechanics are
// real; the "send a code" step is mocked, same convention as every other
// *Source in lib/data-source/mockAdapter.ts.
const DEMO_VERIFICATION_CODE = process.env.INTAKE_DEMO_VERIFICATION_CODE || "000000";
const DEMO_GUARDIAN_EMAIL = "elena.marquez@example.com";
const DEMO_GUARDIAN_PHONE = "(512) 555-0148";

// A short-lived, one-read marker — NOT a security token, just a way to
// carry "why am I suddenly looking at full verification?" across the
// automatic re-render Next.js performs whenever a Server Action mutates
// cookies (see the framework doc excerpt: "Setting or deleting a cookie
// automatically re-renders the current page"). That auto-re-render fires
// INSIDE verifyPin's own response the moment it clears device trust on
// the 5th failure — client state set afterward in the browser (e.g. a
// "too many attempts" screen swapped in via local React state) never gets
// a chance to render, since the server has already swapped PinPad for
// FullVerificationScreen by the time that state update would apply. This
// cookie is how FullVerificationScreen knows to show a lockout-specific
// heading instead of the generic "new device" one. getDeviceVerificationState
// reads AND clears it in the same call, so it only ever explains the ONE
// render it was set for.
const LOCKOUT_NOTICE_COOKIE = "intake_lockout_notice";

function cookieOpts(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}), // omitted maxAge = a true session cookie
  };
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user[0]}${"•".repeat(Math.max(1, user.length - 2))}${user.slice(-1)}@${domain}`;
}

function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{2})/g, "•");
}

// Read-only device state for verify/page.tsx (a Server Component) to decide
// which screen to render: the fast PIN path only exists once a device has
// BOTH proven itself via strong verification (device-trust token) AND set
// up a personal PIN (device-pin token) — trust alone, with no PIN, still
// falls back to full verification, since there's no lightweight credential
// to check the PIN entry screen against.
export async function getDeviceVerificationState(): Promise<{ canUsePin: boolean; justLockedOut: boolean }> {
  const store = await cookies();
  const trusted = await isValidDeviceTrustToken(store.get(DEVICE_TRUST_COOKIE)?.value);
  const hasPin = !!store.get(DEVICE_PIN_COOKIE)?.value;
  // Read-only here deliberately — cookies() can only be MUTATED from a
  // Server Action or Route Handler, and this function is also called
  // directly from verify/page.tsx's plain Server Component render, where
  // a .set() would throw. The notice cookie is instead self-expiring (a
  // short maxAge set where it's created, in verifyPin below) rather than
  // explicitly cleared after this one read.
  const justLockedOut = !!store.get(LOCKOUT_NOTICE_COOKIE)?.value;
  return { canUsePin: trusted && hasPin, justLockedOut };
}

export type PinResult =
  | { ok: true }
  | { ok: false; reason: "wrong"; attemptsRemaining: number }
  | { ok: false; reason: "reverify_required" };

// PIN verification for an already-trusted, already-PIN-configured device.
// Never callable meaningfully on a new device — if device-trust or the PIN
// token is missing, this always reports "wrong" rather than silently
// treating "no PIN configured" as "any PIN passes."
export async function verifyPin(pin: string): Promise<PinResult> {
  const store = await cookies();
  const attemptState = parseAttempts(store.get(ATTEMPTS_COOKIE_NAME)?.value);

  const trusted = await isValidDeviceTrustToken(store.get(DEVICE_TRUST_COOKIE)?.value);
  const pinToken = store.get(DEVICE_PIN_COOKIE)?.value;
  const matches = trusted && (await isMatchingPin(pinToken, pin));

  if (matches) {
    store.set(ATTEMPTS_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    const session = await createSessionVerifiedToken();
    store.set(SESSION_VERIFIED_COOKIE, session.value, cookieOpts());
    return { ok: true };
  }

  const next = recordFailure(attemptState);

  // 5th wrong attempt: per spec, this is NOT a timed cooldown — it forces
  // full re-verification. Clear device trust + the PIN token entirely, so
  // the very next screen this device sees (via getDeviceVerificationState)
  // is the strong-verification path, not another PIN prompt.
  if (isExhausted(next)) {
    store.set(ATTEMPTS_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    store.set(DEVICE_TRUST_COOKIE, "", { maxAge: 0, path: "/" });
    store.set(DEVICE_PIN_COOKIE, "", { maxAge: 0, path: "/" });
    // Self-expiring (30s, not httpOnly-sensitive — it carries no secret,
    // just "show the lockout message"), so it naturally stops applying
    // even if this exact render is somehow missed — no separate clear
    // step needed (see getDeviceVerificationState's comment on why it
    // can't mutate cookies itself).
    store.set(LOCKOUT_NOTICE_COOKIE, "1", { path: "/", maxAge: 30 });
    return { ok: false, reason: "reverify_required" };
  }

  store.set(ATTEMPTS_COOKIE_NAME, serializeAttempts(next), cookieOpts(60 * 60));
  return { ok: false, reason: "wrong", attemptsRemaining: attemptsRemaining(next) };
}

export type SendCodeResult = { destinationLabel: string };

// Mock "send a code" — no real email/SMS provider wired up. Returns a
// masked destination label only (never the actual code) so the UI can show
// "We sent a code to e••••a@example.com" without ever putting a real
// secret in a client-visible return value.
export async function requestVerificationCode(method: "email" | "sms"): Promise<SendCodeResult> {
  await new Promise((resolve) => setTimeout(resolve, 250)); // simulated send latency
  return { destinationLabel: method === "email" ? maskEmail(DEMO_GUARDIAN_EMAIL) : maskPhone(DEMO_GUARDIAN_PHONE) };
}

export type FullVerifyResult = { ok: true } | { ok: false; reason: "wrong_code" };

// Confirms the OTP and, on success, grants device trust + unlocks this
// session. Does NOT set up a PIN — that's a separate explicit step
// (setDevicePin below), since PIN setup is optional per spec ("may be
// used"), not implied by passing strong verification.
export async function confirmVerificationCode(code: string): Promise<FullVerifyResult> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (code.trim() !== DEMO_VERIFICATION_CODE) {
    return { ok: false, reason: "wrong_code" };
  }
  const store = await cookies();
  const trust = await createDeviceTrustToken();
  store.set(DEVICE_TRUST_COOKIE, trust.value, cookieOpts(trust.maxAge));
  const session = await createSessionVerifiedToken();
  store.set(SESSION_VERIFIED_COOKIE, session.value, cookieOpts());
  return { ok: true };
}

// The "full account login" alternative to an OTP code — same strength
// tier per the spec ("email or SMS confirmation, OR full account login"),
// same resulting grant. Mock: any non-empty email+password pair succeeds,
// matching this repo's established "the UI flow is real, the auth
// provider is the mocked seam" convention (see mockInsuranceOcrSource,
// mockPatientLookupSource, etc. in lib/data-source/mockAdapter.ts).
export async function confirmLogin(email: string, password: string): Promise<FullVerifyResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!email.trim() || !password.trim()) {
    return { ok: false, reason: "wrong_code" };
  }
  const store = await cookies();
  const trust = await createDeviceTrustToken();
  store.set(DEVICE_TRUST_COOKIE, trust.value, cookieOpts(trust.maxAge));
  const session = await createSessionVerifiedToken();
  store.set(SESSION_VERIFIED_COOKIE, session.value, cookieOpts());
  return { ok: true };
}

// Sets up the personal PIN right after full verification. Only takes
// effect if device trust already exists this session — a PIN can never be
// the FIRST thing that grants trust (see isExhausted's cookie-clearing
// above, and the header comment on deviceToken.ts).
export async function setDevicePin(pin: string): Promise<{ ok: true } | { ok: false; reason: "not_trusted" }> {
  const store = await cookies();
  const trusted = await isValidDeviceTrustToken(store.get(DEVICE_TRUST_COOKIE)?.value);
  if (!trusted) return { ok: false, reason: "not_trusted" };
  const pinToken = await createDevicePinToken(pin);
  store.set(DEVICE_PIN_COOKIE, pinToken.value, cookieOpts(DEVICE_TRUST_MAX_AGE_SECONDS));
  return { ok: true };
}
