import { useState } from "react";
import { StepHeader } from "./components/StepHeader";
import { SummaryCard } from "./components/SummaryCard";
import { PainScreen } from "./screens/PainScreen";
import { HealthScreen } from "./screens/HealthScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import type { Step } from "./types";

const STEP_ORDER: Step[] = ["visit", "health", "details", "coverage", "finish"];

export default function App() {
  const [step, setStep] = useState<Step>("visit");
  const [visitSummary, setVisitSummary] = useState<string | null>(null);
  const [healthSummary, setHealthSummary] = useState<string | null>(null);

  function goNext() {
    const i = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.min(STEP_ORDER.length - 1, i + 1)]);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl">
      <StepHeader current={step} />

      {step === "visit" && (
        <PainScreen
          onComplete={(summary) => {
            setVisitSummary(summary);
            goNext();
          }}
        />
      )}

      {step === "health" && (
        <HealthScreen
          onComplete={(summary) => {
            setHealthSummary(summary);
            goNext();
          }}
        />
      )}

      {step === "details" && (
        <PlaceholderScreen
          title="Details"
          description="Demographics and guardian info would appear here — shown only when something is actually missing."
          onComplete={goNext}
        />
      )}

      {step === "coverage" && (
        <PlaceholderScreen
          title="Coverage"
          description="Insurance verification would appear here, following the same on-file-first confirm pattern as Health."
          onComplete={goNext}
        />
      )}

      {step === "finish" && (
        <div className="flex flex-1 flex-col gap-3 px-5 py-6">
          {visitSummary && <SummaryCard title="✓ VISIT COMPLETE" detail={visitSummary} />}
          {healthSummary && <SummaryCard title="✓ HEALTH COMPLETE" detail={healthSummary} />}
          <div className="mt-2 text-sm text-slate-500">Payment and consent would appear here before final submission.</div>
        </div>
      )}
    </div>
  );
}
