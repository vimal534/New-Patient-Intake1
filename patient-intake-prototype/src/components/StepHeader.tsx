import type { Step } from "../types";

const STEPS: { key: Step; label: string }[] = [
  { key: "visit", label: "Visit" },
  { key: "health", label: "Health" },
  { key: "details", label: "Details" },
  { key: "coverage", label: "Coverage" },
  { key: "finish", label: "Finish" },
];

// Reused across all 5 steps — reads its position from `current` alone, so
// a screen never has to know its own step number.
export function StepHeader({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  const stage = STEPS[idx]?.label.toUpperCase() ?? "";
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 pt-4 pb-3 backdrop-blur">
      <div className="text-xs font-bold tracking-wide text-slate-500">
        {stage} · {idx + 1} OF {STEPS.length}
      </div>
      <div className="mt-2 flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-blue-600" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}
