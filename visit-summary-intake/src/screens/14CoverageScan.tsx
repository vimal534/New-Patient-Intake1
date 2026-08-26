import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { BottomBar } from "../components/BottomBar";

export default function CoverageScan() {
  const nav = useNavigate();
  const [manual, setManual] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="COVERAGE" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="text-base font-bold text-neutral-900">Let&rsquo;s update your insurance</div>
        {!manual ? (
          <>
            <button
              type="button"
              onClick={() => nav("/coverage/capture")}
              className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-sm font-semibold text-neutral-700"
            >
              <span className="text-2xl" aria-hidden="true">📷</span>
              Scan your card
            </button>
            <button
              type="button"
              onClick={() => nav("/coverage/capture")}
              className="min-h-[44px] rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-700"
            >
              Upload a photo instead
            </button>
            <button type="button" onClick={() => setManual(true)} className="text-center text-xs font-semibold text-neutral-500 underline-offset-2 hover:underline">
              Enter details manually instead
            </button>
          </>
        ) : (
          <div className="text-sm text-neutral-500">Manual entry would appear here — for this prototype, scanning is the primary path.</div>
        )}
      </div>
      {manual && <BottomBar onCta={() => nav("/coverage/result")} />}
    </div>
  );
}
