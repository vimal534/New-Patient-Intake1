import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { StepHeader } from "../components/StepHeader";
import { BottomBar } from "../components/BottomBar";

const DOCS = ["HIPAA Privacy Notice", "Financial Policy", "Patient Consent"];

export default function Consents() {
  const { patch } = useStore();
  const nav = useNavigate();
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  function submit() {
    patch((prev) => ({ consents: { ...prev.consents, agreedAll: true } }));
    nav("/summary");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="FINISH" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {DOCS.map((doc) => (
          <div key={doc} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
            <span className="text-sm font-semibold text-neutral-900">{doc}</span>
            <button type="button" onClick={() => setOpenDoc(doc)} className="text-xs font-bold text-neutral-600 underline-offset-2 hover:underline">
              Review ›
            </button>
          </div>
        ))}

        <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-5 w-5 accent-neutral-900" />
          <span className="text-sm text-neutral-800">I&rsquo;ve reviewed and agree to all three documents</span>
        </label>
      </div>
      <BottomBar onCta={submit} ctaDisabled={!agree} ctaLabel="Agree & continue" />

      {openDoc && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-4" onClick={() => setOpenDoc(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-bold text-neutral-900">{openDoc}</div>
            <div className="mt-2 text-sm leading-relaxed text-neutral-500">Full document text would appear here in the real app.</div>
            <button type="button" onClick={() => setOpenDoc(null)} className="mt-4 min-h-[44px] w-full rounded-full bg-neutral-900 text-sm font-bold text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
