import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ConfirmCard } from "../components/ConfirmCard";
import { StepHeader } from "../components/StepHeader";

export default function Details() {
  const { store, patch } = useStore();
  const nav = useNavigate();

  function confirm() {
    patch((prev) => ({ details: { ...prev.details, confirmed: true } }));
    nav("/coverage");
  }
  function update() {
    patch((prev) => ({ details: { ...prev.details, updated: true, confirmed: true } }));
    nav("/coverage");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="DETAILS" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <ConfirmCard
          title="Patient & guardian"
          rows={[
            { label: "Patient", value: `${store.patient.name} · ${store.patient.dob}` },
            { label: "Guardian", value: `${store.patient.guardianName} (${store.patient.guardianRelationship})` },
            { label: "Phone", value: store.patient.phoneMasked },
          ]}
        />
        <div>
          <div className="mb-2 text-base font-bold text-neutral-900">Does this still look right?</div>
          <div className="flex gap-2">
            <button type="button" onClick={confirm} className="min-h-[44px] flex-1 rounded-full bg-neutral-900 text-sm font-bold text-white">
              Yes, looks right
            </button>
            <button type="button" onClick={update} className="min-h-[44px] flex-1 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-800">
              Update details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
