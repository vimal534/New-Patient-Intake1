// The collapsed, completed-section state a screen settles into once it's
// done — e.g. "✓ HEALTH COMPLETE — 1 new medication, Asthma reviewed, No
// new allergies". This is the only "AI branding" left visible once a
// section is finished; no repeated assistant chrome elsewhere.
export function SummaryCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
        ✓
      </div>
      <div>
        <div className="text-sm font-bold text-emerald-800">{title}</div>
        <div className="text-xs text-emerald-700">{detail}</div>
      </div>
    </div>
  );
}
