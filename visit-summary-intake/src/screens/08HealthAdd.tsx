import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { FlexibleInput } from "../components/FlexibleInput";
import { QuickSelect } from "../components/QuickSelect";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";
import type { ParsedField } from "../types";

// One targeted input per selected category — a category never re-shows
// generic "tell us about your health" phrasing, it asks the specific
// question that category implies.
export default function HealthAdd() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const categories = store.health.changedCategories;
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [reaction, setReaction] = useState<string[]>([]);
  const category = categories[index];

  const firstName = store.patient.name.split(" ")[0];

  function saveAndAdvance() {
    const fields: ParsedField[] = [];
    if (category === "Allergy") {
      fields.push({ id: "manual-1", label: "NEW ALLERGY", value: text || "Unspecified", detail: reaction[0] ? "Reaction: " + reaction[0] : undefined });
    } else {
      fields.push({ id: "manual-1", label: "NEW " + (category ?? "").toUpperCase(), value: text || "Unspecified" });
    }
    patch((prev) => ({
      health: {
        ...prev.health,
        addedItems: [...prev.health.addedItems, { id: "item-" + prev.health.addedItems.length, category: (category ?? "Something else") as never, fields }],
      },
    }));
    setText("");
    setReaction([]);
    if (index + 1 < categories.length) {
      setIndex(index + 1);
    } else {
      nav("/health/confirm");
    }
  }

  if (!category) {
    nav("/health/confirm");
    return null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="HEALTH" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="text-base font-bold text-neutral-900">
          {category === "Allergy" ? `What is ${firstName} allergic to?` : `Tell us about the ${category?.toLowerCase()}`}
        </div>
        <FlexibleInput value={text} onChange={setText} onSubmit={() => {}} sampleVoiceText={category === "Allergy" ? "Latex, she got a rash" : "Started a new inhaler last week"} />
        {category === "Allergy" && (
          <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700">Reaction</div>
            <QuickSelect options={["Rash", "Swelling", "Trouble breathing", "Not sure"]} value={reaction} onChange={setReaction} />
          </div>
        )}
      </div>
      <BottomBar onCta={saveAndAdvance} ctaDisabled={!text.trim()} ctaLabel={index + 1 < categories.length ? "Next" : "Continue"} />
    </div>
  );
}
