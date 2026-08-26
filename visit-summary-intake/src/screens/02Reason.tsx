import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { QuickSelect } from "../components/QuickSelect";
import { FlexibleInput } from "../components/FlexibleInput";
import { ConfirmCard } from "../components/ConfirmCard";
import { BottomBar } from "../components/BottomBar";
import { StepHeader } from "../components/StepHeader";

export default function Reason() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const firstName = store.patient.name.split(" ")[0];

  // Demonstrates both paths: a reason captured at booking (confirm/update)
  // vs. asking fresh when nothing was pre-captured.
  const [updating, setUpdating] = useState(!store.visitConcern.reasonPreCaptured);
  const [reason, setReason] = useState<string[]>(store.visitConcern.reason ? [store.visitConcern.reason] : []);
  const [freeText, setFreeText] = useState("");

  function goNext(finalReason: string) {
    patch((prev) => ({ visitConcern: { ...prev.visitConcern, reason: finalReason, reasonPreCaptured: false } }));
    nav("/symptom");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="VISIT" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        {!updating ? (
          <div>
            <div className="mb-2 text-[11px] font-bold tracking-wide text-neutral-500 uppercase">You told us</div>
            <ConfirmCard title="Reason for visit" rows={[{ label: "Reason", value: store.visitConcern.reason ?? "" }]} />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => goNext(store.visitConcern.reason ?? "")}
                className="min-h-[44px] flex-1 rounded-full bg-neutral-900 text-sm font-bold text-white"
              >
                Yes, that&rsquo;s right
              </button>
              <button
                type="button"
                onClick={() => setUpdating(true)}
                className="min-h-[44px] flex-1 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-700"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-lg font-bold text-neutral-900">What brings {firstName} in today?</div>
            <QuickSelect options={["Pain", "New symptom", "Follow-up", "Medication", "Something else"]} value={reason} onChange={setReason} />
            <FlexibleInput
              value={freeText}
              onChange={setFreeText}
              onSubmit={() => setReason([freeText])}
              sampleVoiceText="She's had a fever since yesterday"
            />
          </>
        )}
      </div>
      {updating && <BottomBar onCta={() => goNext(reason[0])} ctaDisabled={!reason[0]} />}
    </div>
  );
}
