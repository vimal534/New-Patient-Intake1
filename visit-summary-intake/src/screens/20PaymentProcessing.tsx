import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { processPayment } from "../lib/paymentProcessor";
import { StepHeader } from "../components/StepHeader";

export default function PaymentProcessing() {
  const { store, patch } = useStore();
  const nav = useNavigate();

  useEffect(() => {
    patch((prev) => ({ payment: { ...prev.payment, processing: true } }));
    processPayment(store.payment.amountDue).then(() => {
      patch((prev) => ({ payment: { ...prev.payment, processing: false, paid: true } }));
      nav("/payment/success");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="FINISH" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
        <div className="text-lg font-bold text-neutral-900">Processing ${store.payment.amountDue.toFixed(2)}</div>
        <div className="text-sm text-neutral-500">Visa ending 4242</div>
        <div className="mt-2 text-xs text-neutral-400">Please don&rsquo;t close this screen.</div>
      </div>
    </div>
  );
}
