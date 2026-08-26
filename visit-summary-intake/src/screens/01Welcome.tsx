import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function Welcome() {
  const { store } = useStore();
  const nav = useNavigate();
  const firstName = store.patient.name.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col px-5 py-8">
      <div className="text-2xl font-bold text-neutral-900">Hi {store.patient.guardianName.split(" ")[0]},</div>
      <div className="mt-1 text-base text-neutral-500">Let's get {firstName} ready for tomorrow's visit.</div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">Appointment</div>
        <div className="mt-1 text-lg font-bold text-neutral-900">{store.appointment.time}</div>
        <div className="mt-0.5 text-sm text-neutral-600">{store.appointment.doctor} · {store.appointment.visitType}</div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5">
        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
        <div className="text-sm text-neutral-700">We already have {firstName}&rsquo;s health history, insurance, and details on file — we&rsquo;ll just confirm what&rsquo;s changed.</div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => nav("/reason")}
          className="min-h-[48px] w-full rounded-full bg-neutral-900 text-sm font-bold text-white active:scale-[0.99]"
        >
          Start intake
        </button>
        <div className="mt-3 text-center text-xs text-neutral-400">About 5 minutes · we save as you go</div>
      </div>
    </div>
  );
}
