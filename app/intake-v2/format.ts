// Shared input-formatting helpers for /intake-v2's free-text fields —
// applied at the onChange boundary (so `state` always holds the
// already-formatted string) rather than at render time, keeping every
// InputField a plain controlled input. Used by both new-patient and
// returning-patient screens wherever the same kind of field appears
// (DOB, phone, card expiry), not just one form.

// "MM/DD/YYYY" — digits only, slashes inserted automatically as the
// patient types. Deliberately reformats from scratch on every keystroke
// (re-deriving from the digits already typed) rather than trying to
// patch around a single inserted character, so deleting a digit near a
// slash never leaves a stray "/" behind.
export function formatDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// "(555) 123-4567" — strips any non-digit (so letters can never land in
// a phone field) and progressively adds the area-code parens and the
// mid-number dash as more digits arrive.
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// "MM / YY" — same digit-only + auto-slash idea as formatDob, matching
// the card-expiry field's "MM / YY" placeholder spacing exactly.
export function formatCardExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

// Digits only, capped to a length — CVV, and anywhere else a field must
// never accept a letter but doesn't need punctuation inserted.
export function formatDigits(raw: string, maxLength: number): string {
  return raw.replace(/\D/g, "").slice(0, maxLength);
}
