import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { StepHeader } from "../components/StepHeader";
import { BottomBar } from "../components/BottomBar";

export default function PaymentSuccess() {
  const { store } = useStore();
  const nav = useNavigate();

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="FINISH" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-white">✓</div>
        <div className="text-xl font-bold text-neutral-900">Payment confirmed</div>
        <div className="text-2xl font-bold text-neutral-900">${store.payment.amountDue.toFixed(2)}</div>
        <div className="text-sm text-neutral-500">Visa ending 4242</div>
        <div className="mt-2 text-xs text-neutral-400">Receipt sent to e•••••@example.com</div>
      </div>
      <BottomBar onCta={() => nav("/consents")} />
    </div>
  );
}
