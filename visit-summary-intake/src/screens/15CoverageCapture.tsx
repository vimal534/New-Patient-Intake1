import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Mock camera UI — a card-alignment guide overlay, a capture button, and
// a front-then-back flow with a brief "Hold steady..." state standing in
// for a real camera capture.
export default function CoverageCapture() {
  const nav = useNavigate();
  const [side, setSide] = useState<"front" | "back">("front");
  const [holding, setHolding] = useState(false);

  function capture() {
    setHolding(true);
    setTimeout(() => {
      setHolding(false);
      if (side === "front") setSide("back");
      else nav("/coverage/processing");
    }, 1500);
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-950">
      <div className="border-b border-neutral-800 px-5 pt-4 pb-3">
        <div className="text-xs font-bold tracking-wide text-neutral-400">CAPTURE {side.toUpperCase()} OF CARD</div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        <div className="flex aspect-[1.586/1] w-full max-w-xs items-center justify-center rounded-2xl border-2 border-dashed border-neutral-500">
          <div className="text-sm text-neutral-400">{holding ? "Hold steady..." : `Align the ${side} of your card`}</div>
        </div>
      </div>
      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={capture}
          disabled={holding}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/10"
          aria-label="Capture"
        >
          <div className="h-12 w-12 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
