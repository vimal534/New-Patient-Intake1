import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ProgressiveSummary } from "../components/ProgressiveSummary";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";

// Collapsed and grouped by meaning (allergies / conditions / medications),
// not by the order questions were asked in.
export default function HealthSummary() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const { onFile, health } = store;

  const newAllergies = health.addedItems.filter((i) => i.category === "Allergy");
  const newMeds = health.addedItems.filter((i) => i.category === "Medication");
  const otherItems = health.addedItems.filter((i) => i.category !== "Allergy" && i.category !== "Medication");

  const allergyLine =
    onFile.allergies.map((a) => `${a.label} — Confirmed`).concat(newAllergies.map((i) => `${i.fields[0]?.value} — New`)).join(", ") || "None reported";
  const conditionLines = onFile.conditions.map((c) => `${c.label}: reviewed, ${Object.keys(health.checkinAnswers).length ? "no new concerns" : "no changes noted"}`);
  const medsLine = newMeds.length ? newMeds.map((i) => i.fields[0]?.value).join(", ") : "No changes";
  const otherLine = otherItems.length ? otherItems.map((i) => i.fields[0]?.value).join(", ") : undefined;

  function submit() {
    patch((prev) => ({ health: { ...prev.health, confirmed: true } }));
    nav("/details");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="HEALTH" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <ProgressiveSummary
          title="✓ HEALTH COMPLETE"
          lines={["ALLERGIES: " + allergyLine, ...conditionLines, "MEDICATIONS: " + medsLine, ...(otherLine ? ["OTHER: " + otherLine] : [])]}
          onEdit={() => nav("/health")}
        />
      </div>
      <BottomBar onCta={submit} />
    </div>
  );
}
