"use client";

import { ReactNode } from "react";

// Shared read-only summary row — first used by Review & Submit, now also
// by the returning-patient Welcome Back screen. `onEdit` is optional:
// Review wires it to jump back to that section; Welcome Back has no
// per-card edit (it offers one global "something's changed" action
// instead), so it just omits the prop.
export function SummaryCard({
  title,
  onFile,
  onEdit,
  children,
}: {
  title: string;
  onFile?: boolean;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-ink)]">{title}</span>
          {onFile ? (
            <span className="rounded-full bg-[var(--color-teal)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-teal)]">
              On file
            </span>
          ) : null}
        </div>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="cursor-pointer text-sm font-medium text-[var(--color-brand)]">
            Edit
          </button>
        ) : null}
      </div>
      <div className="text-xs text-[var(--color-muted)]">{children}</div>
    </div>
  );
}
