import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { getSymptomFollowUps } from "../lib/rulesEngine";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";
import { QuickSelect } from "../components/QuickSelect";

// Driven entirely by the rules engine (lib/rulesEngine.ts), keyed on
// cause+duration from screen 03. No AI framing here — the questions just
// appear, already scoped to this patient's situation.
export default function SymptomFollowUp() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const questions = getSymptomFollowUps(store.visitConcern.cause ?? "", store.visitConcern.duration ?? "");
  const [answers, setAnswers] = useState<Record<string, string | number>>(store.visitConcern.followUpAnswers);

  function submit() {
    patch((prev) => ({ visitConcern: { ...prev.visitConcern, followUpAnswers: answers } }));
    nav("/symptom/summary");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="VISIT" />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        <div className="text-base font-bold text-neutral-900">A few more questions</div>
        {questions.map((q) => (
          <div key={q.id}>
            <div className="mb-2 text-sm font-semibold text-neutral-800">{q.question}</div>
            {q.type === "chips" ? (
              <QuickSelect
                options={q.options}
                value={typeof answers[q.id] === "string" ? [answers[q.id] as string] : []}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v[0] ?? "" }))}
              />
            ) : (
              <div>
                <input
                  type="range"
                  min={q.min}
                  max={q.max}
                  value={typeof answers[q.id] === "number" ? (answers[q.id] as number) : Math.round((q.min + q.max) / 2)}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: Number(e.target.value) }))}
                  className="w-full accent-neutral-900"
                />
                <div className="mt-1 text-xs font-medium text-neutral-500">
                  {answers[q.id] ?? Math.round((q.min + q.max) / 2)} / {q.max}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomBar onCta={submit} />
    </div>
  );
}
