// Shared input-formatting helpers for /intake-v2's free-text fields —
// applied at the onChange boundary (so `state` always holds the
// already-formatted string) rather than at render time, keeping every
// InputField a plain controlled input. Used by both new-patient and
// returning-patient screens wherever the same kind of field appears
// (DOB, phone, card expiry), not just one form.

import { CardBrand } from "./types";

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

// "4242 4242 4242 4242" — a space inserted after every 4th digit as
// the patient types, capped at the 16 actual digits this app validates
// (see validateCardNumber) so the grouping is purely a readability aid
// on top of that one 16-digit rule, never a second length to satisfy.
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

// Recognizes a card number by its leading digits alone (no real BIN
// table) — enough to show the right brand mark. Anything else
// (Discover, Diners, an unrecognized prefix) just shows no brand mark
// rather than being rejected — this app only actually stores 16-digit
// numbers (see validateCardNumber below), so brand here is cosmetic.
export function detectCardBrand(digits: string): CardBrand | null {
  if (/^4/.test(digits)) return "VISA";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^5[1-5]/.test(digits) || /^222[1-9]|^22[3-9]\d|^2[3-6]\d{2}|^27[01]\d/.test(digits)) return "MC";
  return null;
}

// Card number → an error message, or null. One rule, no brand-specific
// exceptions: exactly 16 digits, entered as a single unbroken string
// (no auto-inserted spaces — AddCardSheet's field caps input at 16
// digits itself). Empty is reported as "required" rather than silently
// valid — callers only show this once the field's been touched/submitted.
export function validateCardNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "Card number is required.";
  return digits.length === 16 ? null : "Card number must be 16 digits.";
}

// "MM / YY" (formatCardExpiry's own spacing) → an error message, or
// null once it's both a real month and not already expired — compared
// against the actual current date since this only ever renders inside
// a client-only bottom sheet the patient opened, well after hydration.
export function validateCardExpiry(formatted: string): string | null {
  const m = formatted.match(/^(\d{2}) \/ (\d{2})$/);
  if (!m) return "Enter a valid date (MM/YY).";
  const month = Number(m[1]);
  if (month < 1 || month > 12) return "Enter a valid date (MM/YY).";
  const year = 2000 + Number(m[2]);
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  if (year < now.getFullYear() || (year === now.getFullYear() && month < curMonth)) return "This card has expired.";
  return null;
}

// CVV → an error message, or null. 4 digits for Amex (its CVV sits on
// the front, one digit longer), 3 for every other recognized brand;
// unrecognized-brand numbers accept either length.
export function validateCvv(raw: string, brand: CardBrand | null): string | null {
  if (!raw) return "CVV is required.";
  if (brand) {
    const expected = brand === "AMEX" ? 4 : 3;
    return raw.length === expected ? null : `CVV must be ${expected} digits.`;
  }
  return raw.length === 3 || raw.length === 4 ? null : "CVV must be 3 or 4 digits.";
}

// Cardholder name → an error message, or null. Just "present and more
// than a single character" — real names are too varied to validate
// more strictly than that.
export function validateCardholderName(raw: string): string | null {
  return raw.trim().length >= 2 ? null : "Enter the cardholder name.";
}

// Full "MM/DD/YYYY" string (from formatDob) → an error message, or
// null when valid/not-yet-complete. Deliberately returns null (no
// error) for anything shorter than 10 characters — a half-typed date
// isn't wrong yet, it's just unfinished, and SmartField only calls
// this once the field has reached its full length. A real calendar
// check (not just digit ranges) catches things like 02/30/2026, and
// the future-date check compares against local midnight so "today" is
// always a valid DOB.
export function validateDob(formatted: string): string | null {
  if (formatted.length < 10) return null;
  const m = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "Enter a valid date.";
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return "Enter a valid date.";
  if (year < 1900) return "Enter a valid birth year.";
  const date = new Date(year, month - 1, day);
  const isRealCalendarDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealCalendarDate) return "That date doesn't exist. Check the month and day.";
  const today = new Date();
  today.setHours(23, 59, 59, 999); // today itself still counts as valid
  if (date.getTime() > today.getTime()) return "Date of birth can't be in the future.";
  return null;
}

// A full, valid "MM/DD/YYYY" (as already confirmed by validateDob) →
// "3 months old" / "5 years old" — the automatic age display next to
// a pediatric patient's split month/day/year birth date fields, so a
// parent gets an immediate sanity check that what they typed is right.
export function formatAgeFromDob(formatted: string): string | null {
  const m = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  const today = new Date();
  let months = (today.getFullYear() - year) * 12 + (today.getMonth() - (month - 1));
  if (today.getDate() < day) months -= 1;
  if (months < 0) return null; // future date — validateDob already flags this as an error
  if (months < 24) return months <= 0 ? "Newborn" : `${months} month${months === 1 ? "" : "s"} old`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} old`;
}

// Email — filters to the standard unquoted-local-part character set as
// the patient types (so a space or stray symbol never lands in the
// field at all) and trims incidental leading/trailing whitespace, e.g.
// from a paste.
export function formatEmail(raw: string): string {
  return raw.replace(/[^A-Za-z0-9@._%+-]/g, "").trim();
}

// name@example.com — a pragmatic (not full-RFC) shape check: one "@",
// a domain with at least one "." and a 2+ letter TLD. Good enough to
// catch typos without rejecting real addresses.
export function isValidEmailFormat(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(email);
}

// Home/mailing address — letters, numbers, spaces, commas, periods,
// hyphens, apostrophes, and "#" (for "Apt #4B" etc.), everything else
// stripped. Deliberately permissive beyond that allowlist — real
// addresses vary too much to validate more strictly than "these
// characters are safe to store and print."
export function formatAddress(raw: string, maxLength = 150): string {
  return raw.replace(/[^A-Za-z0-9\s,.'#-]/g, "").slice(0, maxLength);
}

// Address line 2 (Apt/Suite/Floor) — same character allowlist as the
// primary address line, shorter cap.
export function formatAddressLine2(raw: string): string {
  return formatAddress(raw, 100);
}

// City — letters, spaces, hyphens, periods, and apostrophes only (no
// digits or "#" — those belong on the street line, not the city).
// Covers real city names like "Winston-Salem" or "St. Paul".
export function formatCity(raw: string, maxLength = 60): string {
  return raw.replace(/[^A-Za-z\s'.-]/g, "").slice(0, maxLength);
}

// ZIP code — 5 digits only, auto-truncated. (US ZIP+4 isn't collected
// here; the 5-digit code is all the City/State autofill needs.)
export function formatZip(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}
