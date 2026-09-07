"use client";

import { useState } from "react";
import { FieldOption } from "../../lib/schema/types";

const OTHER_VALUE = "__other__";

// Field type 2 — same as Chip, but an "Other" chip reveals an inline text
// input the moment it's tapped. Never a dead end: whatever doesn't fit the
// fixed list still has somewhere to go, without falling back to a bare
// free-text field for everything.
export function ChipOtherField({
  label,
  helperText,
  options,
  value,
  otherText,
  onChange,
  onOtherTextChange,
  multi,
  otherLabel = "Other",
}: {
  label: string;
  helperText?: string;
  options: FieldOption[];
  value: string[]; // may include OTHER_VALUE
  otherText: string;
  onChange: (next: string[]) => void;
  onOtherTextChange: (text: string) => void;
  multi: boolean;
  otherLabel?: string;
}) {
  const [otherFocused, setOtherFocused] = useState(false);
  const showOtherInput = value.includes(OTHER_VALUE);

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
        <button
          type="button"
          onClick={() => toggle(OTHER_VALUE)}
          className={[
            "min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97]",
            showOtherInput ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-ink hover:border-brand",
          ].join(" ")}
        >
          {otherLabel}
        </button>
      </div>

      {showOtherInput ? (
        <input
          autoFocus
          type="text"
          value={otherText}
          onChange={(e) => onOtherTextChange(e.target.value)}
          onFocus={() => setOtherFocused(true)}
          onBlur={() => setOtherFocused(false)}
          placeholder="Tell us what it is"
          className={[
            "mt-2 min-h-[44px] w-full rounded-lg border bg-white px-3 text-sm text-ink outline-none",
            otherFocused ? "border-brand" : "border-line-strong",
          ].join(" ")}
        />
      ) : null}
    </div>
  );
}
