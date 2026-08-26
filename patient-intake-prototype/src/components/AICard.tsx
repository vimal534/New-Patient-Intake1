import type { ParsedField } from "../types";

// An editable card for one AI-parsed field — the only place AI output is
// ever shown. Never rendered as a chat bubble or transcript line.
export function AICard({ field, onRemove }: { field: ParsedField; onRemove?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
      <div>
        <div className="text-[11px] font-bold tracking-wide text-teal-700 uppercase">{field.label}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-800">{field.value}</div>
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-xs font-medium text-slate-400 hover:text-slate-600">
          Remove
        </button>
      )}
    </div>
  );
}
