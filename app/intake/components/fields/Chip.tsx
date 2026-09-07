"use client";

import { FieldOption } from "../../lib/schema/types";

// Field type 1 — fixed small option set, single or multi-select. The
// default, primary interaction pattern across the whole intake ("tap
// first"); every other field type exists for when a plain chip set
// genuinely doesn't fit (too many options, needs free text, etc.).
export function ChipField({
  label,
  helperText,
  options,
  value,
  onChange,
  multi,
}: {
  label: string;
  helperText?: string;
  options: FieldOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multi: boolean;
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
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
