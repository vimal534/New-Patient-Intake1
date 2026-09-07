"use client";

import { FieldOption } from "../../lib/schema/types";

// Field type 5 — a chip/checkbox list plus one persistent "Anything else?"
// field pinned at the section bottom. Free text is a supplement here, not
// the primary path — never free-text-only for anything clinically
// codeable; the chips still capture the structured, codeable answer.
export function StructuredFreeTextField({
  label,
  helperText,
  options,
  value,
  freeText,
  onChange,
  onFreeTextChange,
  multi,
  freeTextLabel = "Anything else?",
}: {
  label: string;
  helperText?: string;
  options: FieldOption[];
  value: string[];
  freeText: string;
  onChange: (next: string[]) => void;
  onFreeTextChange: (text: string) => void;
  multi: boolean;
  freeTextLabel?: string;
}) {
  function toggle(optValue: string) {
    if (multi) {
      onChange(value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue]);
    } else {
      onChange(value.includes(optValue) ? [] : [optValue]);
    }
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-ink">{label}</div>
      {helperText ? <div className="mb-2 text-xs text-muted">{helperText}</div> : null}
      <div className="mb-3 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={[
                "min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97]",
                selected ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-ink hover:border-brand",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{freeTextLabel}</span>
        <input
          type="text"
          value={freeText}
          onChange={(e) => onFreeTextChange(e.target.value)}
          placeholder="Optional"
          className="min-h-[44px] w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand"
        />
      </label>
    </div>
  );
}
