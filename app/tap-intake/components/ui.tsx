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
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[44px] cursor-pointer rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[var(--color-placeholder)] active:scale-[0.98]"
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
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
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
          "min-h-[44px] w-full rounded-lg border bg-white px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:bg-[var(--color-background)] disabled:text-[var(--color-placeholder)]",
          error ? "border-red-400 focus:border-red-400" : "border-[var(--color-line-strong)]",
        ].join(" ")}
      />
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
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
  children,
}: {
  title: string;
  status: "locked" | "active" | "ready";
  onReopen?: () => void;
  summaryLine?: string;
  children?: ReactNode;
}) {
  if (status === "locked") {
    // Flat row + dashed circle bullet, matching the same "not started" row
    // style used in the Visit-so-far progress panel — no boxed border, so
    // the upcoming-sections list reads as one quiet list rather than a
    // stack of empty cards competing for attention with the active one.
    return (
      <div className="flex items-center gap-2 px-1 py-1.5">
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-dashed border-[var(--color-line-strong)]" />
        <span className="text-sm font-medium text-[var(--color-placeholder)]">{title}</span>
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
