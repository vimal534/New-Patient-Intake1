import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { QuickSelect } from "../components/QuickSelect";
import { FlexibleInput } from "../components/FlexibleInput";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";

export default function Symptom() {
  const { store, patch } = useStore();
  const nav = useNavigate();

  const [worse, setWorse] = useState<string[]>(store.visitConcern.worse);
  const [cause, setCause] = useState<string[]>(store.visitConcern.cause ? [store.visitConcern.cause] : []);
  const [duration, setDuration] = useState<string[]>(store.visitConcern.duration ? [store.visitConcern.duration] : []);
  const [freeText, setFreeText] = useState("");

  const ready = Boolean(cause[0] && duration[0]);

  function submit() {
    patch((prev) => ({
      visitConcern: { ...prev.visitConcern, worse, cause: cause[0] ?? null, duration: duration[0] ?? null },
    }));
    nav("/symptom/follow-up");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="VISIT" />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        <div>
          <div className="mb-2 text-base font-bold text-neutral-900">What makes it worse?</div>
          <QuickSelect
            multi
            options={["Physical activity", "Prolonged sitting", "Prolonged standing", "Lifting or bending", "Twisting", "Stress", "Rest or inactivity", "None"]}
            value={worse}
            onChange={setWorse}
          />
        </div>
        <div>
          <div className="mb-2 text-base font-bold text-neutral-900">How did it start?</div>
          <QuickSelect options={["After an injury", "Exercise or lifting", "Gradually over time", "Woke up with it", "Not sure"]} value={cause} onChange={setCause} />
        </div>
        <div>
          <div className="mb-2 text-base font-bold text-neutral-900">How long have you had it?</div>
          <QuickSelect options={["<24 hours", "1–7 days", "1–4 weeks", "1–6 months"]} value={duration} onChange={setDuration} />
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-neutral-700">Anything else worth mentioning?</div>
          <FlexibleInput value={freeText} onChange={setFreeText} onSubmit={() => setFreeText("")} sampleVoiceText="It's worse when she sits for a long time" />
        </div>
      </div>
      <BottomBar onCta={submit} ctaDisabled={!ready} />
    </div>
  );
}
