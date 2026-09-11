"use client";

import { ReactNode, RefObject, useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { CheckIcon, ChevronDownIcon, PencilIcon, SearchIcon, TrashIcon, XIcon } from "./Icons";
import {
  ELEVATE_REST_SHADOW,
  ELEVATE_SCALE,
  ELEVATE_SHADOW,
  MOTION_DURATION,
  MOTION_EASE,
  REVEAL_DURATION,
  dur,
  focusNextIfEmpty,
  getScrollParent,
  prefersReducedMotion,
} from "./motion";

// Shared visual primitives for /intake-v2, built directly against the
// token table in
// docs/redesign-concepts/design_handoff_patient_intake/README.md rather
// than reusing /tap-intake's `ui.tsx` — this route is a distinct
// white-label visual system (own brand-blue accent, own radii/shadow
// scale), not a re-skin. See that README's "About the Design Files".

export function Card({ children, className = "", padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div
      className={`rounded-[20px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-[var(--iv2-border-subtle)] ${className}`} />;
}

// Wraps a field/panel that only exists because an earlier answer
// unlocked it (a medication's dose panel, a Yes-triggered detail
// textarea, the second-guardian card, ...) — plays a soft fade + small
// upward rise (~220ms) the moment it mounts, so a newly-revealed field
// visibly arrives rather than just popping into the layout. Reduced
// motion collapses this to an instant appearance. Exit isn't animated
// (the spec only asks for the reveal, not a matching hide), and there's
// nothing to clean up — the tween finishes on its own and the element
// just sits at its resting state after.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (prefersReducedMotion()) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(ref.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: REVEAL_DURATION, ease: "power2.out" });
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// `muted` used to switch this between brand-blue and gray — every
// screen's eyebrow is gray now (quieter, and one less color to keep
// track of matching across screens), so the prop is kept only so no
// call site needs touching, not because it still changes anything.
export function Eyebrow({ children }: { children: ReactNode; muted?: boolean }) {
  return <div className="mb-2.5 text-xs font-semibold tracking-[0.07em] text-[var(--iv2-text-muted)] uppercase">{children}</div>;
}

export function ScreenTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-2 text-2xl leading-[1.2] font-bold text-[var(--iv2-text-primary)] ${className}`}>{children}</div>;
}

export function ScreenCopy({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-base leading-[1.55] text-[var(--iv2-text-secondary)] ${className}`}>{children}</div>;
}

export function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div
      className="rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </div>
  );
}

export function InputField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  ariaLabel,
  inputMode,
  tone = "default",
  boldLabel = true,
  rightAdornment,
  errorText,
  valueColor,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  // Free-text fields have no natural "done typing" signal to advance
  // on (unlike a tap on a radio/pill) — callers that need to know
  // "the patient is done with this field for now" (e.g. auto-advancing
  // a continuous multi-section flow) hook this instead of onChange.
  onBlur?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  tone?: "default" | "warning" | "danger";
  boldLabel?: boolean;
  // Sits inside the field's right edge (a detected card brand mark, an
  // AlertCircleIcon on an invalid value) — AddCardSheet's own need,
  // generic enough other bespoke-validation fields can reuse it.
  rightAdornment?: ReactNode;
  // Rendered below the field in danger-red when `tone` is "danger" —
  // optional so existing callers that render their own error line
  // right after this component (the many `attempted && !x` blocks
  // elsewhere) are untouched.
  errorText?: string;
  // Overrides the typed value's text color (a CSS color, e.g. brand
  // blue once AddCardSheet's card number reads as a recognized brand)
  // — unset leaves the usual dark text-primary.
  valueColor?: string;
}) {
  // Elevation only — border/background/colors are untouched, still
  // the plain CSS :focus outline above; this just layers a soft
  // shadow + a hair of scale on top via GSAP, same feel as every
  // other interactive field/card in the app.
  const fieldRef = useRef<HTMLInputElement>(null);
  const onFieldFocus = () => {
    if (fieldRef.current) gsap.to(fieldRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onFieldBlur = () => {
    if (fieldRef.current) gsap.to(fieldRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
    onBlur?.();
  };
  return (
    <div>
      {label ? (
        <div className={`mb-1.5 text-sm ${boldLabel ? "font-semibold text-[var(--iv2-text-primary)]" : "text-[var(--iv2-text-muted)]"}`}>{label}</div>
      ) : null}
      <div className="relative">
        <input
          ref={fieldRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFieldFocus}
          onBlur={onFieldBlur}
          placeholder={placeholder}
          aria-label={ariaLabel || label}
          inputMode={inputMode}
          className={`h-13 w-full rounded-xl border bg-[#FBFBFC] px-3.5 text-[17px] font-semibold outline-none transition-colors focus:outline-2 focus:outline-[var(--iv2-brand)] focus:-outline-offset-2 ${
            valueColor ? "" : "text-[var(--iv2-text-primary)]"
          } ${rightAdornment ? "pr-11" : ""} ${
            tone === "warning"
              ? "border-[var(--iv2-warning-border-strong)] bg-white"
              : tone === "danger"
                ? "border-[var(--iv2-danger)] bg-white focus:outline-[var(--iv2-danger)]"
                : "border-[var(--iv2-border)] hover:border-[var(--iv2-text-muted)]"
          }`}
          style={{ height: 52, boxShadow: ELEVATE_REST_SHADOW, color: valueColor }}
        />
        {rightAdornment ? <div className="absolute inset-y-0 right-3.5 flex items-center">{rightAdornment}</div> : null}
      </div>
      {tone === "danger" && errorText ? <div className="mt-1 text-xs font-semibold text-[var(--iv2-danger)]">{errorText}</div> : null}
    </div>
  );
}

// Custom dropdown styled to match InputField/SmartField — replaces a
// plain browser-native <select> (which can't be restyled past its own
// OS chrome) with one that matches the rest of the design system:
// rounded corners, the same border/background focus treatment as
// SmartField, a 180ms GSAP open/close, and a real option list where
// the selected row gets a checkmark + light brand-tinted background
// instead of the OS's own highlight color. `placeholder` (e.g.
// "Optional") is shown only as muted helper text on the closed
// trigger when nothing is selected — it is never a selectable row.
// Same external shape (value/onChange/options) as before, so every
// existing caller's form logic is untouched.
const SELECT_C = {
  border: "#E4E7EC",
  borderDanger: "#B42318",
  borderFocus: "#1677E8",
  bgDefault: "#FBFBFC",
  bgFocus: "#FFFFFF",
};
const SELECT_FOCUS_DURATION = 0.18; // 180ms, matching SmartField's focus tween
const SELECT_PANEL_DURATION = 0.18;
// Closing because a value was just picked is its own, slower beat than
// opening or dismissing with nothing chosen (Escape/outside click) —
// 300-500ms per spec, so there's a visible moment of "that landed"
// before the panel's gone and the next field starts moving, rather
// than the pick and the scroll away reading as one instant jump.
const SELECT_COMPLETE_DURATION = 0.4;
const SELECT_SHADOW_REST = "0 1px 2px rgba(16,24,40,0)";
const SELECT_SHADOW_ELEVATED = "0 8px 20px rgba(16,24,40,0.10)";

// Roughly how tall the panel will be (options.length rows, capped at
// the same max-h-64/256px the panel itself uses) — used only to guess
// whether it'll fit below the trigger before it's actually mounted.
const SELECT_ROW_HEIGHT = 46;
const SELECT_PANEL_MAX_HEIGHT = 256;

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  boldLabel = true,
  tone = "default",
  fieldRef,
  nextRef,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
  boldLabel?: boolean;
  tone?: "default" | "danger";
  // Same chaining shape as SmartField: `fieldRef` lets a caller capture
  // this field's own trigger to use as an earlier field's `nextRef`;
  // `nextRef` is whatever should get focus once an option here is
  // picked (skipped if that next field is already answered).
  fieldRef?: RefObject<HTMLButtonElement | null>;
  nextRef?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const localTriggerRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = fieldRef ?? localTriggerRef;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const restBorder = tone === "danger" ? SELECT_C.borderDanger : SELECT_C.border;

  // Resting visual state, set instantly (no animation) on mount so a
  // re-rendered field never replays the focus tween on first paint.
  useEffect(() => {
    if (triggerRef.current) {
      gsap.set(triggerRef.current, { borderColor: restBorder, backgroundColor: SELECT_C.bgDefault, boxShadow: SELECT_SHADOW_REST, scale: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setOpenAnimated = (next: boolean, closeDuration = SELECT_PANEL_DURATION, onClosed?: () => void) => {
    if (triggerRef.current) {
      gsap.to(triggerRef.current, {
        borderColor: next ? SELECT_C.borderFocus : restBorder,
        backgroundColor: next ? SELECT_C.bgFocus : SELECT_C.bgDefault,
        boxShadow: next ? SELECT_SHADOW_ELEVATED : SELECT_SHADOW_REST,
        scale: next ? ELEVATE_SCALE : 1,
        duration: dur(next ? SELECT_FOCUS_DURATION : closeDuration),
        ease: "power2.out",
      });
    }
    if (next) {
      // Decide up-front whether the panel will actually fit below the
      // trigger inside the scroll container's visible viewport — if
      // not (a field near the bottom of the screen, e.g. right above
      // a sticky footer button), open it upward instead so it's never
      // clipped or hidden behind the footer.
      const triggerEl = triggerRef.current;
      const container = triggerEl ? getScrollParent(triggerEl) : null;
      if (triggerEl && container) {
        const triggerRect = triggerEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const estimatedHeight = Math.min(options.length * SELECT_ROW_HEIGHT + 12, SELECT_PANEL_MAX_HEIGHT);
        const spaceBelow = containerRect.bottom - triggerRect.bottom;
        const spaceAbove = triggerRect.top - containerRect.top;
        setOpenUpward(spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow);
      } else {
        setOpenUpward(false);
      }
      setOpen(true);
    } else if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0,
        y: openUpward ? 6 : -6,
        duration: dur(closeDuration),
        ease: "power1.in",
        onComplete: () => {
          setOpen(false);
          onClosed?.();
        },
      });
    } else {
      setOpen(false);
      onClosed?.();
    }
  };

  // Panel enter animation — plays once the panel mounts (open just
  // became true), a quiet fade + 6px rise toward the trigger (from
  // above when the panel opens downward, from below when it's
  // flipped upward), nothing bouncy or scaled.
  useEffect(() => {
    if (open && panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0, y: openUpward ? 6 : -6 }, { opacity: 1, y: 0, duration: dur(SELECT_PANEL_DURATION), ease: "power1.out" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Outside click / Escape closes the panel, same as any native select.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenAnimated(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAnimated(false);
    };
    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hasValue = value !== "" && options.includes(value);

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <div className={`mb-1.5 text-sm ${boldLabel ? "font-semibold text-[var(--iv2-text-primary)]" : "text-[var(--iv2-text-muted)]"}`}>{label}</div>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenAnimated(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel || label}
        data-answered={hasValue ? "true" : "false"}
        className="flex h-13 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 text-left outline-none"
        style={{ height: 52 }}
      >
        <span className="truncate text-[17px] font-semibold" style={{ color: hasValue ? "var(--iv2-text-primary)" : "var(--iv2-text-muted)" }}>
          {hasValue ? value : placeholder}
        </span>
        <span className="shrink-0 transition-transform duration-150" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel || label}
          className={`absolute inset-x-0 z-30 overflow-y-auto rounded-2xl border border-[var(--iv2-border)] bg-white p-1.5 shadow-[0_12px_28px_rgba(16,24,40,0.14)] ${
            openUpward ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
          style={{ maxHeight: SELECT_PANEL_MAX_HEIGHT }}
        >
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt);
                  // The completed field settles and the panel fades
                  // over SELECT_COMPLETE_DURATION (300-500ms) rather
                  // than the snappier open/dismiss beat — a deliberate
                  // "that was applied" moment — and only once that's
                  // actually finished does focus (and, if it's not
                  // already comfortably on screen, a scroll) hand off
                  // to whatever's next, so nothing jumps mid-close.
                  setOpenAnimated(false, SELECT_COMPLETE_DURATION, () => focusNextIfEmpty(nextRef?.current ?? null, 0));
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-none px-3.5 py-3 text-left text-[15px] font-semibold transition-colors ${
                  selected ? "bg-[var(--iv2-brand-surface)] text-[var(--iv2-brand)]" : "bg-transparent text-[var(--iv2-text-primary)] hover:bg-[var(--iv2-surface-muted)]"
                }`}
              >
                <span className="truncate">{opt}</span>
                {selected ? <CheckIcon size={16} color="var(--iv2-brand)" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function ValueRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-[15px] text-[var(--iv2-text-muted)]">{label}</div>
      <div className="mt-0.5 text-lg font-semibold whitespace-pre-line text-[var(--iv2-text-primary)]">{value}</div>
    </div>
  );
}

// Right-aligned label/value row — the "CARD READ" scanned-details style
// (OcrScreen.tsx's card-read view), also used by Coverage's own-file
// card so a returning patient's on-file coverage reads the same way a
// freshly scanned one does: uppercase muted label on the left, the
// value right-aligned in the same row, instead of stacked.
export function LabelValueRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="shrink-0 text-[13px] font-semibold tracking-[0.05em] text-[var(--iv2-text-muted)] uppercase">{label}</div>
      <div className="text-right text-[17px] font-semibold text-[var(--iv2-text-primary)]">{value}</div>
    </div>
  );
}

export function Checkbox22({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold text-white"
      style={{
        borderColor: checked ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
        backgroundColor: checked ? "var(--iv2-brand)" : "#fff",
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export function Checkbox24({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-sm font-extrabold text-white"
      style={{
        borderColor: checked ? "var(--iv2-brand)" : "var(--iv2-border)",
        backgroundColor: checked ? "var(--iv2-brand)" : "#fff",
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

// Selected state is a bold, fully-filled pill (solid brand fill, white
// text) — not a thin border + small checkmark. Once a screen has no
// Continue button and relies on auto-advance, this fill IS the only
// feedback a tap registered, so it has to read unmistakably, at a
// glance, as "this one is picked."
export function RadioRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const onCardFocus = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onCardBlur = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onFocus={onCardFocus}
      onBlur={onCardBlur}
      className={`flex w-full min-h-[60px] cursor-pointer items-center gap-3.5 rounded-2xl border px-[18px] text-left transition-colors duration-150 ${
        selected ? "border-transparent" : "border-[var(--iv2-border)] bg-white hover:border-[var(--iv2-brand)] hover:bg-[var(--iv2-brand-surface)]"
      }`}
      style={selected ? { backgroundColor: "var(--iv2-brand)" } : undefined}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold"
        style={{
          borderColor: selected ? "#fff" : "var(--iv2-border-strong)",
          backgroundColor: selected ? "#fff" : "#fff",
          color: "var(--iv2-brand)",
        }}
      >
        {selected ? "✓" : ""}
      </span>
      <span className="text-[17px] font-semibold" style={{ color: selected ? "#fff" : "var(--iv2-text-primary)" }}>
        {label}
      </span>
    </button>
  );
}

const YES_NO = ["Yes", "No"];
const YES_NO_UNKNOWN = ["Yes", "No", "Unknown"];

// Compact, content-sized pill — not a full-width row. Unselected: thin
// border, white fill. Selected: solid brand fill, white bold text, no
// border. Matches the marketing site's "What brings you by" picker.
export function OptionPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const onCardFocus = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onCardBlur = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onFocus={onCardFocus}
      onBlur={onCardBlur}
      className={`inline-flex h-12 cursor-pointer items-center justify-center rounded-full border px-5 text-[15px] transition-colors duration-150 ${
        selected
          ? "border-transparent bg-[var(--iv2-brand)] font-bold text-white"
          : "border-[var(--iv2-border)] bg-white font-semibold text-[var(--iv2-text-primary)] hover:border-[var(--iv2-brand)] hover:bg-[var(--iv2-brand-surface)]"
      }`}
    >
      {label}
    </button>
  );
}

// Bold question + a row of compact pills below it, wrapping as needed
// — the shared shape for every short single-select question across
// the app (Birth & Prenatal History, Social History, etc.).
export function OptionRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="mb-3 text-[15px] font-semibold text-[var(--iv2-text-primary)]">{label}</div>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => (
          <OptionPill key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
        ))}
      </div>
    </div>
  );
}

export function YesNoRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <OptionRow label={label} value={value} options={YES_NO} onChange={onChange} />;
}

export function YesNoUnknownRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <OptionRow label={label} value={value} options={YES_NO_UNKNOWN} onChange={onChange} />;
}

export function ConditionTile({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const onCardFocus = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onCardBlur = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onFocus={onCardFocus}
      onBlur={onCardBlur}
      className={`flex min-h-16 cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left ${
        selected ? "" : "border-[var(--iv2-border-subtle)] bg-white hover:border-[var(--iv2-brand)] hover:bg-[var(--iv2-brand-surface)]"
      }`}
      style={selected ? { borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" } : undefined}
    >
      <Checkbox22 checked={selected} />
      <span className="text-[15px] leading-[1.3] font-semibold text-[var(--iv2-text-primary)]">{label}</span>
    </button>
  );
}

export function TextAction({ children, onClick, className = "" }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`cursor-pointer border-none bg-transparent p-0 text-left font-semibold text-[var(--iv2-brand)] hover:text-[var(--iv2-brand-hover)] hover:underline ${className}`}>
      {children}
    </button>
  );
}

// Fixed-size icon-only row action (Edit/Remove on a Health History
// category's edit list) — same 36px square for every row regardless of
// label length, so a row's action cluster lines up identically whether
// it carries one action (Remove) or two (Edit + Remove), unlike the
// variable-width text-link pair this replaced.
export function IconActionButton({
  icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: "edit" | "remove";
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  // Remove/delete is red at rest, not just on hover — this is a
  // touch-first app, and a color that only shows up on :hover never
  // reaches a patient tapping with a finger. Edit stays the neutral
  // muted-to-brand treatment.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none ${
        tone === "danger"
          ? "bg-[var(--iv2-danger-surface)] text-[var(--iv2-danger)] hover:bg-[var(--iv2-danger)] hover:text-white"
          : "bg-transparent text-[var(--iv2-text-muted)] hover:bg-[var(--iv2-surface-muted)] hover:text-[var(--iv2-brand)]"
      }`}
    >
      {icon === "edit" ? <PencilIcon size={17} /> : <TrashIcon size={17} />}
    </button>
  );
}

// Color-coded severity indicator — mild/moderate/severe read at a
// glance from the badge's color (green/amber/red), never by coloring
// the item's own name text (which was ambiguous: a colored allergy
// name didn't actually track its severity, just a fixed accent).
const SEVERITY_STYLES: Record<string, { bg: string; fg: string }> = {
  "Mild reaction": { bg: "var(--iv2-success-surface)", fg: "var(--iv2-success)" },
  "Moderate reaction": { bg: "var(--iv2-warning-surface)", fg: "var(--iv2-warning)" },
  "Severe reaction": { bg: "var(--iv2-danger-surface)", fg: "var(--iv2-danger)" },
};
export function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_STYLES[severity] ?? { bg: "var(--iv2-surface-muted)", fg: "var(--iv2-text-muted)" };
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {severity.replace(" reaction", "")}
    </span>
  );
}

export function InfoNote({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "muted" | "quiet" }) {
  const bg = tone === "brand" ? "var(--iv2-brand-tint)" : tone === "quiet" ? "#F4F9FE" : "var(--iv2-surface-muted)";
  return (
    <div className="flex gap-3 rounded-2xl p-4 text-left" style={{ backgroundColor: bg }}>
      {children}
    </div>
  );
}

export function StatusStrip({ label, meta, tone }: { label: string; meta?: string; tone: "success" | "pending" }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-4"
      style={{
        backgroundColor: tone === "success" ? "var(--iv2-success-surface)" : "#fff",
        borderColor: tone === "success" ? "var(--iv2-success-border)" : "var(--iv2-border)",
      }}
    >
      {tone === "success" ? (
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)] text-[13px] font-extrabold text-white">
          ✓
        </span>
      ) : (
        <span className="h-[26px] w-[26px] shrink-0 animate-spin rounded-full border-[2.5px] border-[var(--iv2-border)] border-t-[var(--iv2-brand)]" />
      )}
      <div className="min-w-0 flex-1 text-base font-semibold text-[var(--iv2-text-primary)]">{label}</div>
      {meta ? (
        <div className={`shrink-0 text-[15px] font-semibold ${tone === "success" ? "text-[var(--iv2-success)]" : "text-[var(--iv2-text-muted)]"}`}>
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function BottomSheet({
  open,
  onClose,
  children,
  zIndex = 76,
  maxHeight = "86%",
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  zIndex?: number;
  maxHeight?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 flex flex-col justify-end bg-[rgba(16,24,40,0.4)]"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-t-[24px] bg-white px-5 pt-3 pb-[30px]"
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-[5px] w-11 shrink-0 rounded-full bg-[var(--iv2-border)]" />
        {children}
      </div>
    </div>
  );
}

export function CloseCircleButton({ onClick, label = "✕" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--iv2-surface-muted)] text-[15px] font-semibold text-[var(--iv2-text-primary)]"
    >
      {label}
    </button>
  );
}

export function DetailPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const onCardFocus = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onCardBlur = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onFocus={onCardFocus}
      onBlur={onCardBlur}
      className={`min-h-11 cursor-pointer rounded-full border px-4 text-[15px] font-semibold ${
        selected ? "" : "border-[var(--iv2-border)] bg-white text-[var(--iv2-text-primary)] hover:border-[var(--iv2-brand)] hover:text-[var(--iv2-brand)]"
      }`}
      style={selected ? { borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)", color: "var(--iv2-brand)" } : undefined}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------
// Health History — shared interaction atoms (Conditions, Surgeries,
// Family History, Allergies, Medications). One common pattern across
// all five: checkbox rows (no "+" icon), a live-filtering search box
// with a Clear (×) affordance, bold match-highlighting, an exclusive
// "None" row, and a "Selected" card list. See each section's own file
// for how these compose — this file only holds the pieces that look
// and behave identically everywhere they're used.
// ---------------------------------------------------------------------

// Bold the first case-insensitive match of `query` inside `text` — used
// by every section's search results and catalog list once a query is
// active, so a match reads at a glance regardless of which list it's in.
export function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-extrabold">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

// Search box that shows a magnifying-glass icon while empty and a
// Clear (×) button once the patient starts typing — tapping it clears
// the field and restores the default (unfiltered) list. Filtering
// itself happens live, on every keystroke, in the caller.
export function SearchClearInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const fieldRef = useRef<HTMLInputElement>(null);
  const onFieldFocus = () => {
    if (fieldRef.current) gsap.to(fieldRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onFieldBlur = () => {
    if (fieldRef.current) gsap.to(fieldRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <div className="relative">
      <input
        ref={fieldRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        className="h-13 w-full rounded-xl border border-[var(--iv2-border)] bg-[#FBFBFC] py-3.5 pr-11 pl-3.5 text-[17px] font-semibold text-[var(--iv2-text-primary)] outline-none transition-colors focus:outline-2 focus:outline-[var(--iv2-brand)] focus:-outline-offset-2 disabled:opacity-50"
        style={{ height: 52, boxShadow: ELEVATE_REST_SHADOW }}
      />
      <span className="absolute top-1/2 right-3.5 -translate-y-1/2">
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0"
          >
            <XIcon size={16} />
          </button>
        ) : (
          <SearchIcon />
        )}
      </span>
    </div>
  );
}

// One catalog/search-result row — a checkbox (never a "+") that either
// selects immediately (no detail needed) or opens an inline detail
// panel right below it (progressive reveal). `checked` reflects
// whichever of those is currently true for this row.
export function CatalogCheckRow({
  label,
  query,
  checked,
  disabled,
  onClick,
  dashed = false,
}: {
  label: string;
  query?: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  dashed?: boolean;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const onCardFocus = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onCardBlur = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onFocus={onCardFocus}
      onBlur={onCardBlur}
      disabled={disabled}
      className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-[var(--iv2-brand)]" : dashed ? "border-dashed border-[var(--iv2-border-strong)]" : "border-[var(--iv2-border)] hover:border-[var(--iv2-brand)]"
      }`}
    >
      <Checkbox22 checked={checked} />
      <span className="truncate text-[15px] font-semibold" style={{ color: checked ? "var(--iv2-brand)" : "var(--iv2-text-primary)" }}>
        {query ? highlightMatch(label, query) : label}
      </span>
    </button>
  );
}

// The exclusive "None of these apply"-style row — same checkbox visual
// language as a catalog row, with an optional hint line underneath.
export function NoneCheckRow({
  label,
  hint,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const onCardFocus = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  const onCardBlur = () => {
    if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: dur(MOTION_DURATION), ease: MOTION_EASE });
  };
  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onFocus={onCardFocus}
      onBlur={onCardBlur}
      disabled={disabled}
      className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-[var(--iv2-brand)] bg-[var(--iv2-brand-surface)]" : "border-[var(--iv2-border)] bg-white hover:border-[var(--iv2-brand)]"
      }`}
    >
      <Checkbox22 checked={checked} />
      <div>
        <div className="text-[15px] font-semibold text-[var(--iv2-text-primary)]">{label}</div>
        {hint ? <div className="mt-0.5 text-sm leading-[1.4] text-[var(--iv2-text-muted)]">{hint}</div> : null}
      </div>
    </button>
  );
}

// A completed/selected entry — checkbox stays checked (unchecking
// removes it directly, no confirmation modal), name + detail summary,
// and an optional Edit action for entries with follow-up details worth
// revisiting (dose/frequency, a surgery date, a family relationship).
export function SelectedCard({
  label,
  detail,
  onUncheck,
  onEdit,
}: {
  label: string;
  detail?: ReactNode;
  onUncheck: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4" style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}>
      <button type="button" onClick={onUncheck} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 border-none bg-transparent p-0 text-left">
        <Checkbox22 checked />
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{label}</div>
          {detail ? <div className="mt-0.5 truncate text-sm text-[var(--iv2-text-secondary)]">{detail}</div> : null}
        </div>
      </button>
      {onEdit ? <IconActionButton icon="edit" label={`Edit ${label}`} onClick={onEdit} /> : null}
    </div>
  );
}

// Wraps a Health History category's "Your X" list (surgeries,
// allergies, medications, conditions, family history) so a long list
// never forces excessive scrolling: past `collapsedCount` entries it
// collapses to a peek plus a "View all N" toggle, expanding in place to
// the full list with a "Hide list" toggle to collapse back. `forceExpanded`
// keeps an in-progress edit visible even if it falls outside the
// collapsed peek — the toggle itself is hidden in that case since
// there'd be nothing meaningful left for it to do.
export function SelectedListSection({
  label,
  noun,
  items,
  collapsedCount = 2,
}: {
  label: string;
  noun: string;
  items: { key: string; node: ReactNode; forceVisible?: boolean }[];
  collapsedCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = items.length;
  const anyForcedBeyondPeek = items.slice(collapsedCount).some((it) => it.forceVisible);
  const isExpanded = expanded || anyForcedBeyondPeek;
  const showToggle = count > collapsedCount;
  const visible = isExpanded ? items : items.slice(0, collapsedCount);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-[var(--iv2-text-primary)]">{label}</div>
        <div className="text-sm font-semibold text-[var(--iv2-success)]">{count} added</div>
      </div>
      <div className="flex flex-col gap-2.5">
        {visible.map((it) => (
          <div key={it.key}>{it.node}</div>
        ))}
      </div>
      {showToggle && !anyForcedBeyondPeek ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2.5 flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none bg-[var(--iv2-brand-tint)] text-[15px] font-bold text-[var(--iv2-brand)]"
        >
          {isExpanded ? "Hide list" : `View all ${count} ${noun}`}
          <span className="transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}>
            <ChevronDownIcon color="var(--iv2-brand)" />
          </span>
        </button>
      ) : null}
    </div>
  );
}

export { CheckIcon };
