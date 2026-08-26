import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { AIInterpretation } from "../components/AIInterpretation";
import { StepHeader } from "../components/StepHeader";
import { BottomBar } from "../components/BottomBar";
import type { ParsedField } from "../types";

// If free text/voice was used on the previous screen, this is where the
// mock parser's output gets a confirm/edit pass before it's saved to the
// store — the only AI-branded moment in the Health section.
export default function HealthConfirm() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const items = store.health.addedItems;

  function confirmFields(itemId: string, fields: ParsedField[]) {
    patch((prev) => ({
      health: { ...prev.health, addedItems: prev.health.addedItems.map((it) => (it.id === itemId ? { ...it, fields } : it)) },
    }));
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="HEALTH" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {items.length === 0 && <div className="text-sm text-neutral-500">Nothing to confirm.</div>}
        {items.map((item) => (
          <AIInterpretation key={item.id} headline={`I found an update`} fields={item.fields} onConfirm={(f) => confirmFields(item.id, f)} />
        ))}
      </div>
      <BottomBar onCta={() => nav("/health/checkin")} />
    </div>
  );
}
