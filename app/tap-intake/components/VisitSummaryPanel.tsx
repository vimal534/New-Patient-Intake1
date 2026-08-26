"use client";

import { useVisit, SECTION_ORDER, SECTION_LABELS } from "../state";
import { summarizeConcern } from "../mockData";
import { PrimaryButton, CheckBadge } from "./ui";

// Shared by both flows, in both "panel" (persistent, always present per the
// Build-As-You-Go principle) and "full" (final Visit Summary screen) modes.
// Renders entirely off sectionStatus — never off guessing field emptiness.
export function VisitSummaryPanel({ mode = "panel" }: { mode?: "panel" | "full" }) {
  const { state } = useVisit();
  const order = state.patientType ? SECTION_ORDER[state.patientType] : [];
  const childName = state.child.name || "your child";
  const allReady = order.length > 0 && order.every((k) => state.sectionStatus[k] === "ready");

  const concernLine =
    state.sectionStatus.concern !== "not_started"
      ? summarizeConcern(childName, state.concern.reason, state.concern.structuredSymptoms)
      : null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className={mode === "full" ? "text-xl font-bold text-[var(--color-ink)]" : "text-sm font-bold uppercase tracking-wide text-[var(--color-muted)]"}>
          {mode === "full" ? `${childName}'s Visit Summary` : "Visit so far"}
        </h2>
      </div>

      {mode === "full" && concernLine ? (
        <p className="mb-4 text-sm text-[var(--color-muted)]">{concernLine}</p>
      ) : null}

      <ul className="space-y-2">
        {order.map((key) => {
          const status = state.sectionStatus[key];
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              {status === "ready" ? (
                <CheckBadge />
              ) : (
                <span
                  className={
                    "h-5 w-5 rounded-full border " +
                    (status === "in_progress" ? "border-[var(--color-brand)]" : "border-[var(--color-line)]")
                  }
                />
              )}
              <span
                className={
                  status === "ready"
                    ? "text-[var(--color-ink)]"
                    : status === "in_progress"
                      ? "font-medium text-[var(--color-brand)]"
                      : "text-[var(--color-placeholder)]"
                }
              >
                {SECTION_LABELS[key]}
                {status === "ready" ? " Ready" : ""}
              </span>
            </li>
          );
        })}
      </ul>

      {mode === "full" ? (
        <div className="mt-6 border-t border-[var(--color-line)] pt-4">
          <div className="mb-3 text-sm font-semibold text-[var(--color-teal)]">
            {allReady ? "Ready for Dr. Reyes" : "Almost there — finish the sections above."}
          </div>
          <PrimaryButton onClick={() => {}} disabled={!allReady}>
            Send to Dr. Reyes
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}
