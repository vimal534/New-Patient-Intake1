"use client";

import { KeyboardEvent, ReactNode, Ref } from "react";

export function Chip({
  label,
  selected,
  onClick,
  tone = "default",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  tone?: "default" | "suggested";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97]",
        selected
          ? tone === "suggested"
            ? "border-dashed border-white bg-[var(--color-brand)] text-white"
            : "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
          : "border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// Rectangular, grid-arranged option row — for list-like picks (insurance
// carrier, etc.) where entries read more naturally as a list than as
// free-flowing pill chips. Selected state is a soft tint, not a solid fill,
// since this isn't a single-glance yes/no answer but one item picked out of
// a longer list.
export function OptionTile({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-[44px] w-full cursor-pointer rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors active:scale-[0.98]",
        selected
          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-dark)]"
          : "border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "brand",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  // "teal" — the confirm-a-card affirmation color (StepHeader, "✓ Looks
  // right" on AboutYouScreen) — vs. "brand", the default blue used for
  // every other primary CTA in the app.
  tone?: "brand" | "teal";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "min-h-[44px] cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[var(--color-placeholder)] active:scale-[0.98]",
        tone === "teal" ? "bg-[var(--color-teal)]" : "bg-[var(--color-brand)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[44px] cursor-pointer rounded-xl border border-[var(--color-line-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-brand)] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  autoComplete,
  onKeyDown,
  onBlur,
  error,
  inputRef,
  disabled,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "tel" | "email" | "decimal";
  maxLength?: number;
  autoComplete?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  disabled?: boolean;
  // A leading glyph inside the field itself — same treatment as the
  // search icon in Coverage's carrier picker. Optional since most
  // TextFields (name, ZIP, expiry...) don't need one.
  icon?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none text-[var(--color-muted)]">
            {icon}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className={[
            "min-h-[44px] w-full rounded-lg border bg-white text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:bg-[var(--color-background)] disabled:text-[var(--color-placeholder)]",
            icon ? "pl-9 pr-3" : "px-3",
            error ? "border-red-400 focus:border-red-400" : "border-[var(--color-line-strong)]",
          ].join(" ")}
        />
      </div>
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

// A fixed-length numeric code entry — one box per digit, driven by a single
// hidden text input underneath (a <label> wrapping a real input, so tapping
// anywhere in the box row focuses it natively, no manual ref-forwarding
// needed). Two users: a device PIN (`mask` true — dots, since it's a
// standing credential someone could be watching a shoulder for) and an
// email/SMS one-time code (`mask` false — visible digits, since an OTP is
// single-use and the person needs to visually confirm they typed what was
// sent). First used by /intake's personal-device verification flow
// (Pass 14) but kept here rather than local to that route since a numeric-
// code entry is a generic enough primitive other flows may want later.
export function CodeInput({
  length,
  value,
  onChange,
  mask = true,
  error,
  autoFocus,
}: {
  length: number;
  value: string;
  onChange: (v: string) => void;
  mask?: boolean;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex justify-center gap-2.5">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={[
              "flex h-14 w-11 items-center justify-center rounded-xl border text-2xl font-bold text-[var(--color-ink)]",
              i < value.length
                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                : "border-[var(--color-line-strong)] bg-white",
              error ? "border-red-400" : "",
            ].join(" ")}
          >
            {i < value.length ? (mask ? "•" : value[i]) : ""}
          </div>
        ))}
      </div>
      <input
        autoFocus={autoFocus}
        inputMode="numeric"
        value={value}
        maxLength={length}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        className="sr-only"
        aria-label={mask ? "PIN" : "Verification code"}
      />
      {error ? <p className="mt-3 text-center text-xs text-red-500">{error}</p> : null}
    </label>
  );
}

// The wrapper every section renders inside — handles the three visual
// states (locked / active / ready) so individual sections only worry about
// their own questions.
export function SectionShell({
  title,
  status,
  onReopen,
  summaryLine,
  lockedPosition = "only",
  children,
}: {
  title: string;
  status: "locked" | "active" | "ready";
  onReopen?: () => void;
  summaryLine?: string;
  // Only meaningful when status === "locked". Consecutive locked rows are
  // rendered as one merged block (shared outer border, hairline dividers
  // between rows) instead of separate floating lines each carrying the
  // same space-y-3 gap as a full active/ready card — that gap made a
  // 7-item "what's left" list read as a long, effortful scroll for text
  // that's meant to be a quick, quiet glance ahead.
  lockedPosition?: "first" | "middle" | "last" | "only";
  children?: ReactNode;
}) {
  if (status === "locked") {
    const isTop = lockedPosition === "first" || lockedPosition === "only";
    const isBottom = lockedPosition === "last" || lockedPosition === "only";
    return (
      <div
        className={[
          "flex items-center gap-2 border-x border-b border-[var(--color-line)] bg-white px-3 py-2.5",
          isTop ? "rounded-t-xl border-t" : "",
          isBottom ? "rounded-b-xl" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="h-3 w-3 shrink-0 rounded-full border border-dashed border-[var(--color-line-strong)]" />
        <span className="text-sm font-medium text-[var(--color-muted)]">{title}</span>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckBadge />
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
              {summaryLine ? <div className="text-sm text-[var(--color-muted)]">{summaryLine}</div> : null}
            </div>
          </div>
          {onReopen ? (
            <button type="button" onClick={onReopen} className="cursor-pointer text-sm font-medium text-[var(--color-brand)]">
              Edit
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[var(--color-brand)] bg-white px-5 py-5 shadow-sm">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export type StepHeaderInfo = {
  eyebrow: string;
  stepLabel: string;
  progressPercent: number;
  onBack: () => void;
};

// The back-chevron + "EYEBROW · STEP X OF Y" + teal progress bar used by
// any multi-step sub-flow (Coverage's card capture, Payment's steps,
// Health History's "still accurate?" gate, AboutYouScreen). Was three
// near-identical hand-rolled copies before this got extracted; then lived
// briefly as a `sticky`-within-its-own-card element before THAT was
// replaced too — see StepHeaderSlot.tsx's header comment for why sticky
// wasn't enough (it only ever pinned to the top of its own card, not the
// phone's actual top edge, which a reference screenshot showed it should).
//
// This component itself is now a plain, non-sticky block — matching
// ProgressSummary's own `px-4 py-3` exactly, since the two now share the
// same non-scrolling slot directly under the status bar (main flow, via
// StepHeaderSlot.tsx) or the same role on their own dedicated screen
// (AboutYouScreen, which places it outside its own scroll container
// directly, no shared slot needed there since nothing else competes for
// that spot on that screen).
export function StepHeader({ eyebrow, stepLabel, progressPercent, onBack }: StepHeaderInfo) {
  return (
    <div className="shrink-0 border-b border-[var(--color-line)] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="cursor-pointer text-lg text-[var(--color-teal)]">
          ←
        </button>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-teal)]">
          {eyebrow} · {stepLabel}
        </div>
      </div>
      <div className="mt-2 h-[3px] w-full rounded-full bg-[var(--color-line)]">
        <div
          className="h-full rounded-full bg-[var(--color-teal)] transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function CheckBadge() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-teal)] text-[11px] font-bold text-white">
      ✓
    </span>
  );
}

// Same visual pattern for any "here's data we already have, edit if it's
// off" moment — reused guardian/policyholder info and scanned-card results
// alike, so scanned data reads with the same confidence level as any other
// confirmed data in the flow, not as something separately AI-flavored.
export function InfoNote({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted)]">{children}</div>;
}

// A quiet, secondary affordance — visually subordinate to the primary
// fields/CTA on the same screen, per "OCR is opt-in, never the first
// thing the user sees."
export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-sm font-medium text-[var(--color-brand)] underline-offset-2 hover:underline"
    >
      {children}
    </button>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-[var(--color-ink)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-brand)]"
      />
      {label}
    </label>
  );
}

export function QuestionBlock({ eyebrow, prompt, children }: { eyebrow: string; prompt: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted-2)]">{eyebrow}</div>
      <div className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{prompt}</div>
      {children}
    </div>
  );
}

// Shared "on file" confirm card used by every returning-patient section.
export function ConfirmCard({
  title,
  summary,
  onNoChange,
  onChanged,
  changedLabel = "Something changed",
}: {
  title: string;
  summary: ReactNode;
  onNoChange: () => void;
  onChanged: () => void;
  changedLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-background)] p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        {title}
        <span className="rounded-full bg-[var(--color-teal)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-teal)]">
          On file
        </span>
      </div>
      <div className="mb-3 text-sm text-[var(--color-muted)]">{summary}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onNoChange}
          className="min-h-[44px] cursor-pointer rounded-full border border-[var(--color-teal)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-teal)] active:scale-[0.97]"
        >
          ✓ Nothing changed
        </button>
        <button
          type="button"
          onClick={onChanged}
          className="min-h-[44px] cursor-pointer rounded-full border border-[var(--color-line-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] active:scale-[0.97]"
        >
          {changedLabel}
        </button>
      </div>
    </div>
  );
}
