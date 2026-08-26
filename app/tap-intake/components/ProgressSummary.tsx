"use client";

import { useVisit, SECTION_ORDER } from "../state";

// The persistent "Visit so far" surface, per the Build-As-You-Go principle —
// lives directly under the status bar, outside the scrollable section
// area, so it's always on screen. A static readout only — the section list
// right below it already shows every section's status (locked/active/
// ready), so a second expandable copy of the same information here was
// redundant. Renders entirely off sectionStatus, never off guessing field
// emptiness.
export function ProgressSummary() {
  const { state } = useVisit();
  const order = state.patientType ? SECTION_ORDER[state.patientType] : [];
  const readyCount = order.filter((k) => state.sectionStatus[k] === "ready").length;
  const pct = order.length ? Math.round((readyCount / order.length) * 100) : 0;

  return (
    <div className="shrink-0 border-b border-[var(--color-line)] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold text-[var(--color-ink)]">Visit so far</span>
        <span className="shrink-0 text-sm font-bold text-[var(--color-brand)]">{pct}%</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
          <div
            className="h-full rounded-full bg-[var(--color-brand)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-[var(--color-muted)]">
          {readyCount}/{order.length}
        </span>
      </div>
    </div>
  );
}
