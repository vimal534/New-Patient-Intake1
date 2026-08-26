import type { FollowUpQuestion } from "../types";
import { ChipGroup } from "./ChipGroup";

// Renders whatever the rules engine (see data/painRules.ts) decided to
// ask — this component has no idea why these particular questions were
// chosen, only how to render a "chips" or "slider" question generically.
export function AdaptiveQuestionBlock({
  title,
  questions,
  answers,
  onAnswer,
}: {
  title: string;
  questions: FollowUpQuestion[];
  answers: Record<string, string | number | undefined>;
  onAnswer: (id: string, value: string | number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{title}</div>
      <div className="mt-3 flex flex-col gap-4">
        {questions.map((q) => (
          <div key={q.id}>
            <div className="mb-2 text-sm font-semibold text-slate-800">{q.question}</div>
            {q.type === "chips" ? (
              <ChipGroup
                options={q.options}
                value={typeof answers[q.id] === "string" ? [answers[q.id] as string] : []}
                onChange={(v) => onAnswer(q.id, v[0] ?? "")}
              />
            ) : (
              <div>
                <input
                  type="range"
                  min={q.min}
                  max={q.max}
                  value={typeof answers[q.id] === "number" ? (answers[q.id] as number) : Math.round((q.min + q.max) / 2)}
                  onChange={(e) => onAnswer(q.id, Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="mt-1 text-xs font-medium text-slate-500">
                  {answers[q.id] ?? Math.round((q.min + q.max) / 2)} / {q.max}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
