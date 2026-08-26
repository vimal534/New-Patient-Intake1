import { useNavigate } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { ProgressiveSummary } from "../components/ProgressiveSummary";
import { BottomBar } from "../components/BottomBar";
import { useStore } from "../context/StoreContext";

export default function CoverageResult() {
  const { store } = useStore();
  const nav = useNavigate();
  const insurance = store.coverage.extracted ?? store.onFile.insurance;

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="COVERAGE" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <ProgressiveSummary title="✓ COVERAGE VERIFIED" lines={[`${insurance.payer} · ${insurance.plan}`, `Member ID ${insurance.memberId}`]} onEdit={() => nav("/coverage")} />
      </div>
      <BottomBar onCta={() => nav("/payment")} />
    </div>
  );
}
