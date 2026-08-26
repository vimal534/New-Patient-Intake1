import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ConfirmCard } from "../components/ConfirmCard";
import { StepHeader } from "../components/StepHeader";

export default function Health() {
  const { store, patch } = useStore();
  const nav = useNavigate();

  function nothingChanged() {
    patch((prev) => ({ health: { ...prev.health, changed: "no" } }));
    nav("/health/checkin"); // step 11 is skipped straight-through only when there's nothing new *and* nothing to check in on; here on-file conditions still get their check-in
  }
  function somethingChanged() {
    patch((prev) => ({ health: { ...prev.health, changed: "yes" } }));
    nav("/health/changed");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="HEALTH" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <ConfirmCard
          title="On file"
          rows={[
            ...store.onFile.allergies.map((a) => ({ label: "Allergy", value: a.label })),
            ...store.onFile.conditions.map((c) => ({ label: "Condition", value: c.label })),
          ]}
        />
        <div>
          <div className="mb-2 text-base font-bold text-neutral-900">Has anything changed since last visit?</div>
          <div className="flex gap-2">
            <button type="button" onClick={nothingChanged} className="min-h-[44px] flex-1 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-800">
              Nothing changed
            </button>
            <button type="button" onClick={somethingChanged} className="min-h-[44px] flex-1 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-800">
              Something changed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
