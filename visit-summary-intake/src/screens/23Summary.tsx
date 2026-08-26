import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { StepHeader } from "../components/StepHeader";
import { ProgressiveSummary } from "../components/ProgressiveSummary";
import { BottomBar } from "../components/BottomBar";

// The payoff screen — every prior section, each already a "✓ COMPLETE"
// artifact, assembled into one hero view. Edit links route straight back
// to the owning step, since the store already holds everything.
export default function Summary() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const firstName = store.patient.name.split(" ")[0];

  const insurance = store.coverage.extracted ?? store.onFile.insurance;
  const paidLabel = store.payment.method === "new" ? "New card" : "Visa ending 4242";

  function complete() {
    patch(() => ({ completed: true }));
    nav("/done");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="FINISH" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
        <div>
          <div className="text-2xl font-bold text-neutral-900">{firstName}&rsquo;s Visit Summary</div>
          <div className="mt-1 text-sm text-neutral-500">Everything below is what {store.appointment.doctor} will see tomorrow.</div>
        </div>

        <ProgressiveSummary
          title="✓ VISIT CONCERN"
          lines={[store.visitConcern.reason ?? "", [store.visitConcern.cause, store.visitConcern.duration].filter(Boolean).join(" · ")].filter(Boolean)}
          onEdit={() => nav("/reason")}
        />
        <ProgressiveSummary
          title="✓ HEALTH"
          lines={[
            `Allergies: ${store.onFile.allergies.length + store.health.addedItems.filter((i) => i.category === "Allergy").length} on file`,
            `Conditions reviewed: ${store.onFile.conditions.map((c) => c.label).join(", ") || "None"}`,
          ]}
          onEdit={() => nav("/health")}
        />
        <ProgressiveSummary
          title="✓ DETAILS"
          lines={[`${store.patient.name} · ${store.patient.guardianName} (${store.patient.guardianRelationship})`]}
          onEdit={() => nav("/details")}
        />
        <ProgressiveSummary title="✓ COVERAGE" lines={[`${insurance.payer} · ${insurance.plan}`]} onEdit={() => nav("/coverage")} />
        <ProgressiveSummary title="✓ PAYMENT" lines={[`$${store.payment.amountDue.toFixed(2)} · ${paidLabel}`]} onEdit={() => nav("/payment")} />
        <ProgressiveSummary title="✓ CONSENTS" lines={["All 3 documents agreed to"]} onEdit={() => nav("/consents")} />

        <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">Ready for tomorrow</div>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-neutral-700">
            <div>✓ Visit concern recorded</div>
            <div>✓ Health history current</div>
            <div>✓ Coverage verified</div>
            <div>✓ Payment on file</div>
            <div>✓ Consents signed</div>
          </div>
        </div>
      </div>
      <BottomBar onCta={complete} ctaLabel="Confirm & complete intake" />
    </div>
  );
}
