"use client";

import { useState } from "react";
import { useVisit, SECTION_ORDER, SECTION_LABELS } from "../state";

// The persistent "Visit so far" surface, per the Build-As-You-Go principle —
// pinned to the top of the section list (sticky while scrolling) rather
// than a bottom bar, and expands inline in place rather than as a popup
// sheet. Renders entirely off sectionStatus, never off guessing field
// emptiness.
export function ProgressSummary() {
  const { state } = useVisit();
  const [open, setOpen] = useState(false);
  const order = state.patientType ? SECTION_ORDER[state.patientType] : [];
  const readyCount = order.filter((k) => state.sectionStatus[k] === "ready").length;
  const pct = order.length ? Math.round((readyCount / order.length) * 100) : 0;

  return (
    <div className="sticky top-0 z-10 mb-3 -mx-4 bg-[var(--color-background)] px-4 pb-3 pt-1">
      <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 px-4 py-3 text-left"
        >
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
          <span
            className={`shrink-0 text-[var(--color-muted)] transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ⌄
          </span>
        </button>

        {open ? (
          <div className="border-t border-[var(--color-line)] px-2 py-2">
            {order.map((key) => {
              const status = state.sectionStatus[key];
              return (
                <div
                  key={key}
                  className={[
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                    status === "in_progress" ? "bg-[var(--color-brand)]/10" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    {status === "not_started" ? (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-dashed border-[var(--color-line-strong)]" />
                    ) : null}
                    <span
                      className={[
                        "text-sm",
                        status === "ready"
                          ? "font-medium text-[var(--color-ink)]"
                          : status === "in_progress"
                            ? "font-semibold text-[var(--color-brand)]"
                            : "font-medium text-[var(--color-placeholder)]",
                      ].join(" ")}
                    >
                      {SECTION_LABELS[key]}
                    </span>
                  </div>
                  {status === "ready" ? (
                    <span className="shrink-0 text-xs font-semibold text-[var(--color-teal)]">Ready</span>
                  ) : null}
                  {status === "in_progress" ? (
                    <span className="shrink-0 text-xs font-semibold text-[var(--color-brand)]">In progress</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
