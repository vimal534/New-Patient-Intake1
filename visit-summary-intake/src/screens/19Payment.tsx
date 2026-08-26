import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { StepHeader } from "../components/StepHeader";
import { BottomBar } from "../components/BottomBar";

export default function Payment() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const [method, setMethod] = useState<"onFile" | "new">(store.payment.method ?? "onFile");

  function pay() {
    patch((prev) => ({ payment: { ...prev.payment, method } }));
    nav("/payment/processing");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="FINISH" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
          <div className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">Amount due</div>
          <div className="mt-1 text-3xl font-bold text-neutral-900">${store.payment.amountDue.toFixed(2)}</div>
          <div className="mt-1 text-xs text-neutral-400">Coverage-adjusted estimate for this visit</div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setMethod("onFile")}
            className={`flex min-h-[44px] items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${method === "onFile" ? "border-neutral-900" : "border-neutral-200"}`}
          >
            Visa ending 4242 (on file)
            {method === "onFile" && <span aria-hidden="true">✓</span>}
          </button>
          <button
            type="button"
            onClick={() => setMethod("new")}
            className={`flex min-h-[44px] items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${method === "new" ? "border-neutral-900" : "border-neutral-200"}`}
          >
            Use a different card
            {method === "new" && <span aria-hidden="true">✓</span>}
          </button>
        </div>

        <div className="text-xs text-neutral-500">You won&rsquo;t be charged until you confirm.</div>
      </div>
      <BottomBar onCta={pay} ctaLabel={`Pay $${store.payment.amountDue.toFixed(2)}`} />
    </div>
  );
}
