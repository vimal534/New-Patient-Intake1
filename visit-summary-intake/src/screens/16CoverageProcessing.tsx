import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { extractInsuranceCard } from "../lib/insuranceOcr";
import { StepHeader } from "../components/StepHeader";

const CHECKLIST = ["Card captured", "Plan found", "Checking member details"];

// Animated ✦ processing state with a sequential checklist. Deliberately
// avoids any technical language ("OCR", "confidence score", "API") —
// that's an implementation detail, not something a patient needs to see.
export default function CoverageProcessing() {
  const { patch } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1100),
    ];
    extractInsuranceCard().then(({ fields, uncertainField }) => {
      patch((prev) => ({ coverage: { ...prev.coverage, extracted: fields, uncertainField, scanned: true } }));
      nav("/coverage/verify");
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="COVERAGE" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        <div className="text-3xl" aria-hidden="true">✦</div>
        <div className="flex flex-col gap-3">
          {CHECKLIST.map((label, i) => (
            <div key={label} className="flex items-center gap-2.5 text-sm font-medium">
              <span className={i <= step ? "text-emerald-600" : "text-neutral-300"}>{i <= step ? "✓" : "○"}</span>
              <span className={i <= step ? "text-neutral-900" : "text-neutral-400"}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
