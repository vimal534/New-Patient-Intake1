import { useState } from "react";
import { ChipGroup } from "../components/ChipGroup";
import { AICard } from "../components/AICard";
import { AdaptiveQuestionBlock } from "../components/AdaptiveQuestionBlock";
import { BottomBar } from "../components/BottomBar";
import { getPainFollowUps } from "../data/painRules";

// Fixed for the prototype — in the real flow this comes from wherever the
// patient indicated where it hurts (a body map, or the reason-for-visit
// text) earlier in the Visit step.
const LOCATION = "Pelvis";

export function PainScreen({ onComplete }: { onComplete: (summary: string) => void }) {
  const [worse, setWorse] = useState<string[]>([]);
  const [cause, setCause] = useState<string[]>([]);
  const [duration, setDuration] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string | number>>({});

  // The adaptive block only appears once location + cause + duration are
  // all known — see data/painRules.ts for what gets asked and why.
  const ready = Boolean(cause[0] && duration[0]);
  const followUps = ready ? getPainFollowUps(LOCATION, cause[0]) : [];

  function submitNote() {
    if (!freeText.trim()) return;
    setNotes((n) => [...n, freeText.trim()]);
    setFreeText("");
  }

  function finish() {
    onComplete(`${LOCATION} pain · ${cause[0]} · ${duration[0]}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Where it hurts</div>
          <div className="mt-1 text-base font-bold text-slate-900">{LOCATION}</div>
        </div>

        <div>
          <div className="mb-2 text-base font-bold text-slate-900">What makes your pain worse?</div>
          <ChipGroup
            multi
            options={["Physical activity", "Prolonged sitting", "Prolonged standing", "Lifting or bending", "Twisting", "Stress", "Rest or inactivity", "None"]}
            value={worse}
            onChange={setWorse}
          />
        </div>

        <div>
          <div className="mb-2 text-base font-bold text-slate-900">How did your pain start?</div>
          <ChipGroup options={["After an injury", "Exercise or lifting", "Gradually over time", "Woke up with pain", "Not sure"]} value={cause} onChange={setCause} />
        </div>

        <div>
          <div className="mb-2 text-base font-bold text-slate-900">How long have you had it?</div>
          <ChipGroup options={["<24 hours", "1–7 days", "1–4 weeks", "1–6 months"]} value={duration} onChange={setDuration} />
        </div>

        {notes.length > 0 && (
          <div className="flex flex-col gap-2">
            {notes.map((n, i) => (
              <AICard key={i} field={{ id: String(i), kind: "symptom", label: "Noted", value: n }} />
            ))}
          </div>
        )}

        {ready && (
          <AdaptiveQuestionBlock
            title="A few more questions about your injury"
            questions={followUps}
            answers={followUpAnswers}
            onAnswer={(id, val) => setFollowUpAnswers((a) => ({ ...a, [id]: val }))}
          />
        )}
      </div>

      <BottomBar
        value={freeText}
        onChange={setFreeText}
        onSubmit={submitNote}
        placeholder="Tell us more about your pain..."
        onContinue={finish}
        continueDisabled={!ready}
      />
    </div>
  );
}
