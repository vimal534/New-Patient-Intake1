// Signed tokens for the personal-device trust model (Pass 14 — see
// docs/architecture.md's "Phase 1b — personal-device trust model" section
// for the full rationale). Three distinct tokens, three distinct cookies —
// deliberately NOT one combined "verified" flag, because each answers a
// different question and each is set by a different event:
//
//   1. Device-trust token  — "has this device ever proven who it belongs
//      to via a STRONG method (email code / SMS code / account login)?"
//      Long-lived (180 days). Set ONLY by full verification succeeding —
//      never by a PIN check. This is what makes the lightweight PIN path
//      available at all on a given device.
//   2. Device-PIN token    — "has a personal PIN been set up on this
//      device?" Long-lived (180 days), same as trust. Stores an HMAC of
//      the PIN, never the PIN itself. Optional — set only if the guardian
//      chooses to create one right after full verification; skipping
//      leaves this absent, which means next visit falls back to full
//      verification again (no lightweight path was ever established).
//   3. Session-verified token — "has THIS visit actually been unlocked
//      (PIN or full verification), so PHI can be shown right now?" A true
//      session cookie (no maxAge — expires when the browser session ends).
//      This is the ONLY token proxy.ts checks for PHI gating. Holding a
//      valid device-trust token is NOT sufficient by itself — it only
//      unlocks the PIN *path*; the session token is the actual gate,
//      matching the spec's sequencing requirement ("Step 1: PIN or full
//      verification. Step 2: only after that succeeds, show PHI").
//
// Uses Web Crypto (`crypto.subtle`) rather than Node's `crypto` module
// specifically so the same helper works unmodified in both the Edge
// runtime (proxy.ts) and the Node runtime (the verify Server Actions) —
// no runtime-specific branching needed.
//
// TODO(real deployment): move DEVICE_TOKEN_SECRET out of an env-var
// fallback and into a real secret store. This file's crypto is real
// (genuine HMAC-SHA256, no shortcuts) — the fallback secret and cookie-
// only storage are the v1 stand-ins, not the signing mechanism itself.
//
// ⚠️ COMPLIANCE FLAG — flagged again in docs/architecture.md and in the
// chat response this shipped in: security/compliance has not signed off
// on this PIN-based re-authentication model against HIPAA requirements,
// and EHR alignment (does verified-device + PIN status map cleanly to
// the EHR integration's own access-control model?) has not been
// confirmed. Both are required before this goes live — this file
// implements the FLOW correctly; it does not constitute that sign-off.

const DEVICE_TRUST_COOKIE = "intake_device_trusted";
const DEVICE_PIN_COOKIE = "intake_device_pin";
const SESSION_VERIFIED_COOKIE = "intake_session_verified";
const DEVICE_TRUST_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days — "until explicitly revoked or expired"

function getSecret(): string {
  return process.env.INTAKE_DEVICE_TOKEN_SECRET || "dev-only-insecure-secret-change-me";
}

// Manual ArrayBuffer -> base64url (no `Buffer` — this file must run
// unmodified on the Edge runtime, which doesn't have Node's Buffer global).
function toBase64Url(buf: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buf)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

async function signPayload(payload: string): Promise<string> {
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

async function verifyPayload(token: string, expectedPrefix: string): Promise<string | null> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!payload.startsWith(expectedPrefix)) return null;
  const expected = await hmac(payload);
  return expected === sig ? payload : null;
}

// --- 1. Device trust (strong verification only) ---------------------------

export async function createDeviceTrustToken(): Promise<{ value: string; maxAge: number }> {
  const value = await signPayload(`trusted:${Date.now()}`);
  return { value, maxAge: DEVICE_TRUST_MAX_AGE_SECONDS };
}

export async function isValidDeviceTrustToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const payload = await verifyPayload(token, "trusted:");
  if (!payload) return false;
  const issuedAt = Number(payload.slice("trusted:".length));
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt <= DEVICE_TRUST_MAX_AGE_SECONDS * 1000; // defense in depth vs. cookie maxAge alone
}

// --- 2. Device PIN (hash only — the raw PIN is never stored) --------------

async function pinHash(pin: string): Promise<string> {
  return hmac(`pin:${pin}`);
}

export async function createDevicePinToken(pin: string): Promise<{ value: string; maxAge: number }> {
  const hash = await pinHash(pin);
  const value = await signPayload(`pinset:${hash}`);
  return { value, maxAge: DEVICE_TRUST_MAX_AGE_SECONDS };
}

export async function isMatchingPin(token: string | undefined | null, candidatePin: string): Promise<boolean> {
  if (!token) return false;
  const payload = await verifyPayload(token, "pinset:");
  if (!payload) return false;
  const storedHash = payload.slice("pinset:".length);
  const candidateHash = await pinHash(candidatePin);
  return storedHash === candidateHash;
}

// --- 3. Session verified (the actual PHI gate proxy.ts checks) ------------

export async function createSessionVerifiedToken(): Promise<{ value: string }> {
  const value = await signPayload(`session:${Date.now()}`);
  return { value };
}

export async function isValidSessionVerifiedToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const payload = await verifyPayload(token, "session:");
  return payload !== null;
}

export {
  DEVICE_TRUST_COOKIE,
  DEVICE_PIN_COOKIE,
  SESSION_VERIFIED_COOKIE,
  DEVICE_TRUST_MAX_AGE_SECONDS,
};
