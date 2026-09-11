"use client";

import { RefObject, useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import {
  formatAddress,
  formatAddressLine2,
  formatAgeFromDob,
  formatCity,
  formatDigits,
  formatDob,
  formatEmail,
  formatPhone,
  formatZip,
  isValidEmailFormat,
  validateDob,
} from "../format";
import { ELEVATE_REST_SHADOW, ELEVATE_SCALE, ELEVATE_SHADOW, dur, focusNextIfEmpty } from "./motion";

// Color tokens mirrored 1:1 from app/globals.css's --iv2-* custom
// properties. Duplicated here as literal hex rather than read via
// var(...) because GSAP tweens toward a real, computable color value
// — it can't animate an unresolved CSS custom-property reference.
const C = {
  border: "#E4E7EC",
  borderFocus: "#1677E8",
  borderError: "#B42318",
  borderSuccess: "#067647",
  bgDefault: "#FBFBFC",
  bgFocus: "#FFFFFF",
  bgSuccess: "#ECFDF3",
};

// 150-200ms per spec for the focus border/background/elevation
// transition.
const FOCUS_DURATION = 0.18;
// Slightly longer, still subtle — the "you got it right" confirmation
// flash before the border settles back to its resting state.
const CONFIRM_DURATION = 0.22;
const CONFIRM_HOLD = 0.32;
const CONFIRM_SETTLE = 0.3;

type SmartFieldProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  // Free-text fields have no natural "done typing" signal of their
  // own — callers that need one (e.g. auto-advancing a continuous
  // multi-section flow) can still hook this, same as plain InputField.
  onBlur?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  boldLabel?: boolean;
  required?: boolean;
  // Formatting applied at the onChange boundary, before the parent's
  // state is ever set — so `value` always arrives already valid-shape.
  format?: (raw: string) => string;
  // Returns an error message, or null when there's nothing wrong (that
  // includes "not finished typing yet" — validators are expected to
  // stay quiet until the input is long enough to judge).
  validate?: (v: string) => string | null;
  // "length": re-validate — and, if valid, play the confirm + advance
  // transition — the instant the formatted value reaches
  // `completeLength` characters. Used by DOB and Phone, which both
  // have a fixed target length once fully typed.
  // "blur": validate (and possibly advance) only once the patient
  // leaves the field. Used by Email (inline error only after blur or
  // finished typing, per spec) and the free-text address fields.
  validateOn: "length" | "blur";
  completeLength?: number;
  // The field (an <input>, or any other element implementing the
  // same `data-answered` convention — e.g. SelectField's trigger)
  // this field should hand focus to once it's valid and complete
  // ("smoothly move visual focus to the next field"). Omit for the
  // last field in a chain. Only fires if that next field is still
  // unanswered, so re-editing an earlier field never steals focus
  // away from work already done further down the form.
  nextRef?: RefObject<HTMLElement | null>;
  // Lets a caller capture this field's own input element to use as
  // another field's `nextRef`.
  fieldRef?: RefObject<HTMLInputElement | null>;
};

export function SmartTextField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  ariaLabel,
  inputMode,
  boldLabel = true,
  required,
  format,
  validate,
  validateOn,
  completeLength,
  nextRef,
  fieldRef,
}: SmartFieldProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const localRef = useRef<HTMLInputElement | null>(null);
  const inputRef = fieldRef ?? localRef;
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  // Start every field in its resting state, no animation — otherwise
  // a screen re-mounting this field (e.g. re-entering a section) would
  // visibly replay the focus tween on first paint.
  useEffect(() => {
    if (wrapRef.current) gsap.set(wrapRef.current, { borderColor: C.border, backgroundColor: C.bgDefault, boxShadow: ELEVATE_REST_SHADOW, scale: 1 });
  }, []);

  const settle = (tone: "default" | "error") => {
    if (!wrapRef.current) return;
    gsap.to(wrapRef.current, {
      borderColor: tone === "error" ? C.borderError : C.border,
      backgroundColor: C.bgDefault,
      boxShadow: ELEVATE_REST_SHADOW,
      scale: 1,
      duration: dur(FOCUS_DURATION),
      ease: "power1.out",
    });
  };

  // The confirm flash and the elevation reset are one continuous
  // gesture: a brief "got it" color pulse, then — in the same tween —
  // settle both the color AND the elevation back down together as
  // focus moves on to the next field.
  const playConfirm = () => {
    if (!wrapRef.current) return;
    gsap
      .timeline()
      .to(wrapRef.current, { borderColor: C.borderSuccess, backgroundColor: C.bgSuccess, duration: dur(CONFIRM_DURATION), ease: "power1.out" })
      .to(wrapRef.current, {
        borderColor: C.border,
        backgroundColor: C.bgDefault,
        boxShadow: ELEVATE_REST_SHADOW,
        scale: 1,
        duration: dur(CONFIRM_SETTLE),
        ease: "power1.inOut",
        delay: dur(CONFIRM_HOLD),
      });
  };

  const advanceToNext = () => focusNextIfEmpty(nextRef?.current ?? null);

  const handleChange = (raw: string) => {
    const formatted = format ? format(raw) : raw;
    onChange(formatted);
    if (error) setError(null); // typing again clears a stale error right away

    if (validateOn === "length" && completeLength && formatted.length === completeLength) {
      const err = validate ? validate(formatted) : null;
      if (err) {
        setError(err);
        settle("error");
      } else {
        playConfirm();
        advanceToNext();
      }
    }
  };

  const handleFocus = () => {
    if (!wrapRef.current) return;
    gsap.to(wrapRef.current, {
      borderColor: C.borderFocus,
      backgroundColor: C.bgFocus,
      boxShadow: ELEVATE_SHADOW,
      scale: ELEVATE_SCALE,
      duration: dur(FOCUS_DURATION),
      ease: "power1.out",
    });
  };

  const handleBlur = () => {
    if (validateOn === "blur") {
      const err = value ? (validate ? validate(value) : null) : null;
      setError(err);
      if (!err && value) {
        playConfirm();
        advanceToNext();
      } else {
        settle(err ? "error" : "default");
      }
    } else {
      settle(error ? "error" : "default");
    }
    onBlur?.();
  };

  return (
    <div>
      {label ? (
        <div className={`mb-1.5 text-sm ${boldLabel ? "font-semibold text-[var(--iv2-text-primary)]" : "text-[var(--iv2-text-muted)]"}`}>
          {label} {required ? <span className="text-[var(--iv2-danger)]">*</span> : null}
        </div>
      ) : null}
      <div ref={wrapRef} className="rounded-xl border" style={{ height: 52, borderColor: C.border, backgroundColor: C.bgDefault, boxShadow: ELEVATE_REST_SHADOW }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          inputMode={inputMode}
          className="h-full w-full border-none bg-transparent px-3.5 text-[17px] font-semibold text-[var(--iv2-text-primary)] outline-none"
        />
      </div>
      {error ? (
        <div id={errorId} className="mt-1.5 text-[13px] font-semibold text-[var(--iv2-danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

type PresetProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  ariaLabel?: string;
  boldLabel?: boolean;
  required?: boolean;
  nextRef?: RefObject<HTMLElement | null>;
  fieldRef?: RefObject<HTMLInputElement | null>;
};

// MM/DD/YYYY — digits only, auto-inserted slashes, capped at 8 digits
// (via formatDob), validated as a real calendar date that isn't in
// the future once all 10 characters are in.
export function DobField({ label = "Date of birth", placeholder = "MM/DD/YYYY", ...rest }: PresetProps & { placeholder?: string }) {
  return (
    <SmartTextField
      {...rest}
      label={label}
      placeholder={placeholder}
      inputMode="numeric"
      format={formatDob}
      validate={validateDob}
      validateOn="length"
      completeLength={10}
    />
  );
}

// (###) ###-#### — non-digits are stripped as they're typed (so
// letters/spaces/punctuation entered manually never land in the
// field), capped at 10 digits.
export function PhoneField({ label = "Mobile", placeholder = "(555) 123-4567", ...rest }: PresetProps & { placeholder?: string }) {
  return (
    <SmartTextField
      {...rest}
      label={label}
      placeholder={placeholder}
      inputMode="tel"
      format={formatPhone}
      validateOn="length"
      completeLength={14} // "(###) ###-####"
    />
  );
}

// Standard email characters only, auto-trimmed; format is validated
// inline only after the patient leaves the field (or effectively
// finishes typing and moves on) — never on every keystroke.
export function EmailField({ label = "Email", placeholder = "name@email.com", ...rest }: PresetProps & { placeholder?: string }) {
  return (
    <SmartTextField
      {...rest}
      label={label}
      placeholder={placeholder}
      inputMode="email"
      format={formatEmail}
      validate={(v) => (isValidEmailFormat(v) ? null : "Enter a valid email address.")}
      validateOn="blur"
    />
  );
}

// Letters, numbers, spaces, and , . ' # - — deliberately permissive
// (no strict pattern requirement) since real addresses vary too much
// to validate more tightly than a safe character allowlist. Holds
// just the street line — City/State/ZIP are their own fields
// (CityField/ZipField below, State via ui.tsx's SelectField).
export function AddressField({ label = "Street address", placeholder = "123 Main Street", ...rest }: PresetProps & { placeholder?: string }) {
  return (
    <SmartTextField
      {...rest}
      label={label}
      placeholder={placeholder}
      format={(raw) => formatAddress(raw, 150)}
      validateOn="blur"
    />
  );
}

// Optional Apt/Suite/Floor line — same character rules as
// AddressField, shorter cap, never required.
export function AddressLine2Field({ label = "Apt, suite, floor", placeholder = "Apt 4B", ...rest }: PresetProps & { placeholder?: string }) {
  return (
    <SmartTextField
      {...rest}
      label={label}
      placeholder={placeholder}
      format={formatAddressLine2}
      validateOn="blur"
    />
  );
}

// City — letters/spaces/hyphens/periods/apostrophes only; usually
// arrives pre-filled by ZipField's autofill but stays fully editable.
export function CityField({ label = "City", placeholder = "City", ...rest }: PresetProps & { placeholder?: string }) {
  return <SmartTextField {...rest} label={label} placeholder={placeholder} format={(raw) => formatCity(raw, 60)} validateOn="blur" />;
}

// 5-digit ZIP — digits only, capped at 5. Its `onChange` is expected
// to also drive the City/State autofill (see PatientInfoScreen.tsx);
// SmartField itself only handles the formatting/advance-on-complete
// side, same as PhoneField.
export function ZipField({ label = "ZIP code", placeholder = "ZIP code", ...rest }: PresetProps & { placeholder?: string }) {
  return (
    <SmartTextField
      {...rest}
      label={label}
      placeholder={placeholder}
      inputMode="numeric"
      format={formatZip}
      validateOn="length"
      completeLength={5}
    />
  );
}

// Pediatric birth date — three separate Month/Day/Year boxes instead
// of one MM/DD/YYYY text field (per design review: "a three-field
// input to avoid errors"), auto-advancing Month → Day → Year as each
// fills, and showing the computed age underneath once the date is
// complete and valid — an immediate sanity check for the parent
// entering it. Combines back to the same "MM/DD/YYYY" string every
// other DOB field in the app uses, so it's a drop-in replacement
// wherever the patient (not a guardian/policyholder) is a minor.
const SPLIT_DOB_C = {
  border: "#E4E7EC",
  borderError: "#B42318",
  bgDefault: "#FBFBFC",
};

export function SplitDobField({
  label = "Date of birth",
  value,
  onChange,
  required,
  fieldRef,
  nextRef,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  // Ref to the Month box, so an earlier field's `nextRef` can focus
  // straight into this one.
  fieldRef?: RefObject<HTMLInputElement | null>;
  // Where focus goes once Month/Day/Year are all filled and valid.
  nextRef?: RefObject<HTMLElement | null>;
}) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  const monthLocalRef = useRef<HTMLInputElement | null>(null);
  const monthRef = fieldRef ?? monthLocalRef;
  const dayRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);
  const errorId = useId();

  const [error, setError] = useState<string | null>(null);

  const combine = (nextMm: string, nextDd: string, nextYyyy: string) => formatDob(`${nextMm}${nextDd}${nextYyyy}`);

  const checkComplete = (formatted: string) => {
    if (formatted.length < 10) {
      if (error) setError(null);
      return;
    }
    const err = validateDob(formatted);
    setError(err);
    if (!err) focusNextIfEmpty(nextRef?.current ?? null);
  };

  const onMonthChange = (raw: string) => {
    const next = formatDigits(raw, 2);
    const formatted = combine(next, dd, yyyy);
    onChange(formatted);
    checkComplete(formatted);
    if (next.length === 2) window.setTimeout(() => dayRef.current?.focus(), 0);
  };
  const onDayChange = (raw: string) => {
    const next = formatDigits(raw, 2);
    const formatted = combine(mm, next, yyyy);
    onChange(formatted);
    checkComplete(formatted);
    if (next.length === 2) window.setTimeout(() => yearRef.current?.focus(), 0);
  };
  const onYearChange = (raw: string) => {
    const next = formatDigits(raw, 4);
    const formatted = combine(mm, dd, next);
    onChange(formatted);
    checkComplete(formatted);
  };

  const handleBlur = () => checkComplete(combine(mm, dd, yyyy));

  const age = error ? null : formatAgeFromDob(combine(mm, dd, yyyy));
  const borderColor = error ? SPLIT_DOB_C.borderError : SPLIT_DOB_C.border;

  const boxClass =
    "h-13 w-full rounded-xl border bg-[#FBFBFC] px-3 text-center text-[17px] font-semibold text-[var(--iv2-text-primary)] outline-none transition-colors duration-150 focus:border-[var(--iv2-brand)] focus:bg-white hover:border-[var(--iv2-text-muted)]";

  return (
    <div>
      {label ? (
        <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">
          {label} {required ? <span className="text-[var(--iv2-danger)]">*</span> : null}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            ref={monthRef}
            value={mm}
            onChange={(e) => onMonthChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="MM"
            inputMode="numeric"
            aria-label="Birth month"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={boxClass}
            style={{ height: 52, borderColor }}
          />
        </div>
        <span className="shrink-0 text-lg font-semibold text-[var(--iv2-text-muted)]">/</span>
        <div className="flex-1">
          <input
            ref={dayRef}
            value={dd}
            onChange={(e) => onDayChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="DD"
            inputMode="numeric"
            aria-label="Birth day"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={boxClass}
            style={{ height: 52, borderColor }}
          />
        </div>
        <span className="shrink-0 text-lg font-semibold text-[var(--iv2-text-muted)]">/</span>
        <div className="flex-[1.4]">
          <input
            ref={yearRef}
            value={yyyy}
            onChange={(e) => onYearChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="YYYY"
            inputMode="numeric"
            aria-label="Birth year"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={boxClass}
            style={{ height: 52, borderColor }}
          />
        </div>
      </div>
      {error ? (
        <div id={errorId} className="mt-1.5 text-[13px] font-semibold text-[var(--iv2-danger)]">
          {error}
        </div>
      ) : age ? (
        <div className="mt-1.5 text-[13px] font-semibold text-[var(--iv2-success)]">{age}</div>
      ) : null}
    </div>
  );
}
