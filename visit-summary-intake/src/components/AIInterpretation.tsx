import { useState } from "react";
import type { ParsedField } from "../types";

// Interaction pattern #3 — the only place AI is ever visible. A single
// ✦-marked card showing what was parsed from free text/voice, as editable
// fields with an explicit confirm action. Never rendered as chat.
export function AIInterpretation({
  headline,
  fields,
  onConfirm,
  onEdit,
}: {
  headline: string;
  fields: ParsedField[];
  onConfirm: (fields: ParsedField[]) => void;
  onEdit?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fields);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
        <span aria-hidden="true">✦</span>
        {headline}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {draft.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5">
            <div className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">{f.label}</div>
            {editing ? (
              <input
                value={f.value}
                onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                className="mt-0.5 w-full border-b border-neutral-300 bg-transparent text-sm font-semibold text-neutral-900 outline-none"
              />
            ) : (
              <div className="mt-0.5 text-sm font-semibold text-neutral-900">{f.value}</div>
            )}
            {f.detail && <div className="mt-0.5 text-xs text-neutral-500">{f.detail}</div>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(draft)}
          className="min-h-[44px] flex-1 rounded-full bg-neutral-900 text-sm font-bold text-white"
        >
          ✓ Yes, add this
        </button>
        <button
          type="button"
          onClick={() => {
            if (editing) onEdit?.();
            setEditing((e) => !e);
          }}
          className="min-h-[44px] rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
    </div>
  );
}
