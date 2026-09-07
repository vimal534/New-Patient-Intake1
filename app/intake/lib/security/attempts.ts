// Failed-PIN-attempt tracking for the personal-device trust model (Pass 14).
// Stored in a short-lived cookie for this v1 pass — a device that clears
// cookies resets its own attempt count, a real limitation flagged again
// below.
// TODO(real deployment): move this to server-side storage keyed by device
// fingerprint / IP so it can't be reset client-side, per a production
// rate-limit requirement.
//
// Deliberately simpler than a prior version of this file (which did an
// escalating timed lockout — 30s, 60s, ... capped at 15min — then let the
// SAME PIN keep being retried indefinitely). The spec this pass implements
// is explicit: "5 attempts, then forced full re-verification" — not a
// cooldown-then-retry-the-PIN-forever model. A PIN that's been guessed
// wrong 5 times in a row is a signal this probably isn't the device's
// rightful owner; the correct response is to fall back to the STRONG
// verification path (email/SMS/login), not to just make them wait and try
// the same weak credential again. See verify/actions.ts's `verifyPin` for
// where this actually clears device trust on the 5th failure.

export type AttemptState = { count: number };

export const ATTEMPTS_COOKIE_NAME = "intake_pin_attempts";
export const MAX_PIN_ATTEMPTS = 5;

export function parseAttempts(raw: string | undefined | null): AttemptState {
  if (!raw) return { count: 0 };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.count === "number") return { count: parsed.count };
  } catch {
    // fall through to reset
  }
  return { count: 0 };
}

export function serializeAttempts(state: AttemptState): string {
  return JSON.stringify(state);
}

export function recordFailure(state: AttemptState): AttemptState {
  return { count: state.count + 1 };
}

export function attemptsRemaining(state: AttemptState): number {
  return Math.max(0, MAX_PIN_ATTEMPTS - state.count);
}

export function isExhausted(state: AttemptState): boolean {
  return state.count >= MAX_PIN_ATTEMPTS;
}
