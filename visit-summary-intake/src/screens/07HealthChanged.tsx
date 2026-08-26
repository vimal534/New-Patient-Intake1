import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { QuickSelect } from "../components/QuickSelect";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";

export default function HealthChanged() {
  const { patch } = useStore();
  const nav = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);

  function submit() {
    patch((prev) => ({ health: { ...prev.health, changedCategories: categories } }));
    nav("/health/add");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="HEALTH" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="text-base font-bold text-neutral-900">What&rsquo;s changed?</div>
        <QuickSelect
          multi
          options={["Allergy", "Medication", "Condition", "Surgery", "Hospitalization", "Something else"]}
          value={categories}
          onChange={setCategories}
        />
      </div>
      <BottomBar onCta={submit} ctaDisabled={categories.length === 0} />
    </div>
  );
}
