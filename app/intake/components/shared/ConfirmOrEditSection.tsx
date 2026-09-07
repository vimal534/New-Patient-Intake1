"use client";

import { ReactNode } from "react";

// Shared confirm-don't-reask shell — first used by Demographics (Identity;
// Contact & address), now also by Guardian/Dependent. Matched data starts
// in "confirm" (shows "On file" + "✓ Looks right" / "Edit"); unmatched
// data starts in "not_applicable" (always-editable fields, no confirm
// step, no dead end for a genuinely new patient/guardian).
export type SectionState = "confirm" | "editing" | "confirmed" | "not_applicable";

export function initialSectionState(matched: boolean): SectionState {
  return matched ? "confirm" : "not_applicable";
}

export function ConfirmOrEditSection({
  title,
  state,
  summary,
  onLooksRight,
  onEdit,
  children,
}: {
  title: string;
  state: SectionState;
  summary: string;
  onLooksRight: () => void;
  onEdit: () => void;
  children: ReactNode;
}) {
  if (state === "confirm") {
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
            onClick={onLooksRight}
            className="min-h-[44px] cursor-pointer rounded-full border border-[var(--color-teal)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-teal)] active:scale-[0.97]"
          >
            ✓ Looks right
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="min-h-[44px] cursor-pointer rounded-full border border-[var(--color-line-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] active:scale-[0.97]"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  if (state === "confirmed") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-white p-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
          <div className="text-xs text-[var(--color-muted)]">{summary}</div>
        </div>
        <button type="button" onClick={onEdit} className="cursor-pointer text-sm font-medium text-[var(--color-brand)]">
          Edit
        </button>
      </div>
    );
  }

  // "editing" or "not_applicable" — always-editable fields.
  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-2)]">{title}</div>
      {children}
      {state === "editing" ? (
        <button type="button" onClick={onLooksRight} className="cursor-pointer text-sm font-medium text-[var(--color-brand)]">
          Done editing
        </button>
      ) : null}
    </div>
  );
}
