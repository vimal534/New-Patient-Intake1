"use client";

import { Ctx } from "../../ctx";
import { FlowKey } from "../../types";
import { ScreenCopy, ScreenTitle, TextAction } from "../ui";

const SECTIONS: { label: string; jump: FlowKey }[] = [
  { label: "Personal information", jump: "personal" },
  { label: "Emergency contact", jump: "emergency" },
  { label: "Today's visit", jump: "visit" },
  { label: "Coverage", jump: "coverage" },
  { label: "Health history", jump: "health" },
  { label: "Medications", jump: "medications" },
  { label: "Allergies", jump: "allergies" },
  { label: "Required screening", jump: "screener" },
  { label: "Payment", jump: "payment" },
  { label: "Consent", jump: "consent" },
];

// Screen 14 — Final review. Flat, divider-only list (no card frame) —
// requested restyle: a plain checkmark + label + Edit row per section,
// a quiet status line under the list instead of per-row status text, and
// a full-pill primary CTA. The "Coverage" row is the one section that
// can genuinely need review — a new patient whose OCR'd Group number was
// never confirmed (README's groupFixed flag).
export function ReviewScreen({ ctx }: { ctx: Ctx }) {
  const { state, isRet } = ctx;

  const rows = SECTIONS.map((s) => {
    const warn = s.jump === "coverage" && !isRet && !state.groupFixed;
    return { ...s, warn };
  });

  const warnRows = rows.filter((r) => r.warn);
  const statusLine =
    warnRows.length === 0
      ? "Everything below is ready to go."
      : warnRows.length === 1
        ? `Just ${warnRows[0].label.toLowerCase()} left.`
        : `${warnRows.length} items still need your attention.`;

  return (
    <div className="px-6 py-6">
      <ScreenTitle>Almost ready</ScreenTitle>
      <ScreenCopy className="mb-6">Change anything here without redoing a section.</ScreenCopy>

      <div>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 border-b border-[var(--iv2-border-subtle)] py-3.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
              style={{
                backgroundColor: r.warn ? "var(--iv2-warning-surface)" : "var(--iv2-success-surface)",
                color: r.warn ? "var(--iv2-warning)" : "var(--iv2-success)",
              }}
            >
              {r.warn ? "!" : "✓"}
            </div>
            <div className="flex-1 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{r.label}</div>
            <TextAction onClick={() => ctx.go(r.jump)} className="text-base">
              Edit
            </TextAction>
          </div>
        ))}
      </div>

      <div className="pt-5 text-[15px] text-[var(--iv2-text-muted)]">{statusLine}</div>
    </div>
  );
}
