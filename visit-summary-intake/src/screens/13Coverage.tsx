import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ConfirmCard } from "../components/ConfirmCard";
import { StepHeader } from "../components/StepHeader";

export default function Coverage() {
  const { store, patch } = useStore();
  const nav = useNavigate();

  function stillCorrect() {
    patch((prev) => ({ coverage: { ...prev.coverage, changed: false, verified: true } }));
    nav("/coverage/result");
  }
  function itsChanged() {
    patch((prev) => ({ coverage: { ...prev.coverage, changed: true } }));
    nav("/coverage/scan");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="COVERAGE" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <ConfirmCard
          title="Insurance on file"
          rows={[
            { label: "Payer", value: store.onFile.insurance.payer },
            { label: "Plan", value: store.onFile.insurance.plan },
            { label: "Member ID", value: store.onFile.insurance.memberId },
          ]}
        />
        <div>
          <div className="mb-2 text-base font-bold text-neutral-900">Is this still correct?</div>
          <div className="flex gap-2">
            <button type="button" onClick={stillCorrect} className="min-h-[44px] flex-1 rounded-full bg-neutral-900 text-sm font-bold text-white">
              Yes, still correct
            </button>
            <button type="button" onClick={itsChanged} className="min-h-[44px] flex-1 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-800">
              No, it&rsquo;s changed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
