import { useStore } from "../context/StoreContext";

// No AI messaging here on purpose — this is the one screen that should
// feel entirely human and clean, not a product feature moment.
export default function Done() {
  const { store } = useStore();
  const firstName = store.patient.name.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-3xl font-bold text-white">✓</div>
      <div className="text-xl font-bold text-neutral-900">Everything is ready.</div>
      <div className="text-sm text-neutral-500">
        {firstName}&rsquo;s appointment is {store.appointment.time.toLowerCase()} with {store.appointment.doctor}.
      </div>
      <div className="text-sm font-semibold text-neutral-900">See you tomorrow!</div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 min-h-[48px] rounded-full bg-neutral-900 px-8 text-sm font-bold text-white"
      >
        Done
      </button>
    </div>
  );
}
