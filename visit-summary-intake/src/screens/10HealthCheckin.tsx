import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { getConditionCheckins } from "../lib/rulesEngine";
import { QuickSelect } from "../components/QuickSelect";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";

// Conditional blocks driven by rulesEngine.getConditionCheckins — one
// small block per on-file condition, QuickSelect only, no free text.
export default function HealthCheckin() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const blocks = getConditionCheckins(store.onFile.conditions);
  const [answers, setAnswers] = useState<Record<string, string>>(store.health.checkinAnswers);

  function submit() {
    patch((prev) => ({ health: { ...prev.health, checkinAnswers: answers } }));
    nav("/health/summary");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="HEALTH" />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        {blocks.map(({ condition, questions }) => (
          <div key={condition.id}>
            <div className="mb-3 text-[11px] font-bold tracking-wide text-neutral-500 uppercase">{condition.label}</div>
            <div className="flex flex-col gap-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <div className="mb-2 text-sm font-semibold text-neutral-800">{q.question}</div>
                  {q.type === "chips" && (
                    <QuickSelect
                      options={q.options}
                      value={answers[q.id] ? [answers[q.id]] : []}
                      onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v[0] ?? "" }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <BottomBar onCta={submit} />
    </div>
  );
}
