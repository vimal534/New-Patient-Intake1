// Interaction pattern #4 — the collapsed "✓ [SECTION] COMPLETE" artifact
// card. This is the visual payoff of the endowment/accumulation
// principle: each finished section becomes a small completed thing, not
// a form recap, and the Final Visit Summary (screen 23) is just a stack
// of these plus one Edit link per section.
export function ProgressiveSummary({
  title,
  lines,
  onEdit,
}: {
  title: string;
  lines: string[];
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
        ✓
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-emerald-900">{title}</div>
        <div className="mt-0.5 flex flex-col gap-0.5">
          {lines.map((l, i) => (
            <div key={i} className="text-xs leading-relaxed text-emerald-800">
              {l}
            </div>
          ))}
        </div>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} className="flex-shrink-0 text-xs font-bold text-emerald-700 underline-offset-2 hover:underline">
          Edit
        </button>
      )}
    </div>
  );
}
