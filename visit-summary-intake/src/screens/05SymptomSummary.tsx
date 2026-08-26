import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ProgressiveSummary } from "../components/ProgressiveSummary";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";

// The first "✓ [X] ADDED" artifact card — the first application of the
// endowment/accumulation principle. This should feel like a completed
// thing, not a form recap.
export default function SymptomSummary() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const vc = store.visitConcern;

  const lines = [
    vc.reason ?? "Reason not set",
    [vc.cause, vc.duration].filter(Boolean).join(" · "),
    vc.worse.length ? "Worse with: " + vc.worse.join(", ") : undefined,
  ].filter((l): l is string => Boolean(l));

  function submit() {
    patch((prev) => ({ visitConcern: { ...prev.visitConcern, confirmed: true } }));
    nav("/health");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="VISIT" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <ProgressiveSummary title="✓ VISIT CONCERN ADDED" lines={lines} onEdit={() => nav("/reason")} />
        <div className="text-sm text-neutral-500">This is what Dr. Reyes will see about why you&rsquo;re here today.</div>
      </div>
      <BottomBar onCta={submit} />
    </div>
  );
}
