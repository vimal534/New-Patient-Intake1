"use client";

import { SkipPolicy, ValidatedInstrumentQuestion } from "../../lib/schema/types";

// Field type 7 — a fixed clinical instrument (PHQ-9, ASQ-3, etc.). Grouped-
// scale layout: every question on one screen, in its exact validated
// wording — instruments like this are never restyled or reworded, only
// laid out.
//
// `skipPolicy` (per the screener spec) drives two different UI behaviors,
// not just a boolean:
//   - "mandatory": every item required. No skip affordance at all; an
//     inline indicator names exactly what's still missing so submission
//     can be blocked with a clear reason, not a silent disabled button.
//   - "prorate": up to `maxSkips` items may be left blank. Skipped items
//     are visibly marked (not just absent) and, once the count exceeds
//     `maxSkips`, a plain-language note explains the section will be
//     incomplete rather than scored — actually computing the prorated
//     score is the screener engine's job (Phase 4), not this component's.
export function ValidatedInstrumentField({
  title,
  questions,
  answers,
  onAnswer,
  onMarkSkipped,
  skippedKeys,
  skipPolicy,
}: {
  title: string;
  questions: ValidatedInstrumentQuestion[];
  answers: Record<string, string>;
  onAnswer: (questionKey: string, value: string) => void;
  onMarkSkipped: (questionKey: string) => void;
  skippedKeys: string[];
  skipPolicy: SkipPolicy;
}) {
  const isMandatory = skipPolicy.mode === "mandatory";
  const missing = questions.filter((q) => q.required && answers[q.key] === undefined && !skippedKeys.includes(q.key));
  const overSkipLimit = skipPolicy.mode === "prorate" && skippedKeys.length > skipPolicy.maxSkips;

  return (
    <div>
      <div className="mb-4 text-sm font-bold text-ink">{title}</div>
      <div className="space-y-5">
        {questions.map((q) => {
          const skipped = skippedKeys.includes(q.key);
          return (
            <div key={q.key}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-ink">
                  {q.prompt}
                  {!q.required ? <span className="ml-1 text-xs font-normal text-muted">(optional)</span> : null}
                </div>
                {!isMandatory && !skipped ? (
                  <button
                    type="button"
                    onClick={() => onMarkSkipped(q.key)}
                    className="shrink-0 cursor-pointer text-xs font-medium text-muted underline-offset-2 hover:underline"
                  >
                    Skip
                  </button>
                ) : null}
              </div>
              {skipped ? (
                <div className="text-xs italic text-muted">Skipped</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onAnswer(q.key, opt.value)}
                        className={[
                          "min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97]",
                          selected ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-ink hover:border-brand",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isMandatory && missing.length > 0 ? (
        <div className="mt-5 rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 text-xs font-medium text-orange">
          {missing.length} question{missing.length === 1 ? "" : "s"} still need{missing.length === 1 ? "s" : ""} an
          answer before this can be submitted.
        </div>
      ) : null}

      {overSkipLimit ? (
        <div className="mt-5 rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 text-xs font-medium text-orange">
          Too many skipped items — this section will be marked incomplete rather than scored.
        </div>
      ) : null}
    </div>
  );
}
