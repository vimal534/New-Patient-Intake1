"use client";

import { ReactNode } from "react";
import { CheckIcon, PencilIcon, TrashIcon } from "./Icons";

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

export function Eyebrow({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <div
      className={`mb-2.5 text-xs font-semibold tracking-[0.07em] uppercase ${
        muted ? "text-[var(--iv2-text-muted)]" : "text-[var(--iv2-brand)]"
      }`}
    >
      {children}
    </div>
  );
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
  placeholder,
  ariaLabel,
  inputMode,
  tone = "default",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  tone?: "default" | "warning";
}) {
  return (
    <div>
      {label ? <div className="mb-1.5 text-sm text-[var(--iv2-text-muted)]">{label}</div> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || label}
        inputMode={inputMode}
        className={`h-13 w-full rounded-xl border bg-[#FBFBFC] px-3.5 text-[17px] font-semibold text-[var(--iv2-text-primary)] outline-none focus:outline-2 focus:outline-[var(--iv2-brand)] focus:-outline-offset-2 ${
          tone === "warning" ? "border-[var(--iv2-warning-border-strong)] bg-white" : "border-[var(--iv2-border)]"
        }`}
        style={{ height: 52 }}
      />
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

export function RadioRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[60px] cursor-pointer items-center gap-3.5 rounded-2xl border px-[18px] text-left ${
        selected ? "" : "border-[var(--iv2-border)] bg-white hover:border-[var(--iv2-brand)] hover:bg-[var(--iv2-brand-surface)]"
      }`}
      style={selected ? { borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" } : undefined}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold text-white"
        style={{
          borderColor: selected ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
          backgroundColor: selected ? "var(--iv2-brand)" : "#fff",
        }}
      >
        {selected ? "✓" : ""}
      </span>
      <span className="text-[17px] font-medium text-[var(--iv2-text-primary)]">{label}</span>
    </button>
  );
}

export function ConditionTile({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[var(--iv2-text-muted)] hover:bg-[var(--iv2-surface-muted)] ${
        tone === "danger" ? "hover:text-[var(--iv2-danger)]" : "hover:text-[var(--iv2-brand)]"
      }`}
    >
      {icon === "edit" ? <PencilIcon size={17} /> : <TrashIcon size={17} />}
    </button>
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 cursor-pointer rounded-full border px-4 text-[15px] font-semibold ${
        selected ? "" : "border-[var(--iv2-border)] bg-white text-[var(--iv2-text-primary)] hover:border-[var(--iv2-brand)] hover:text-[var(--iv2-brand)]"
      }`}
      style={selected ? { borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)", color: "var(--iv2-brand)" } : undefined}
    >
      {label}
    </button>
  );
}

export { CheckIcon };
