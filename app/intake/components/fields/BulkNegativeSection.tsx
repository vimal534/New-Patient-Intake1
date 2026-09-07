"use client";

import { FieldOption } from "../../lib/schema/types";

// Field type 6 — a section-level "I don't have any of these" toggle that
// dims/collapses the individual items in one tap, instead of forcing a
// guardian to tap "No" on every single item to decline a whole category
// (the classic review-of-systems fatigue problem).
export function BulkNegativeSection({
  title,
  helperText,
  negativeToggleLabel,
  items,
  negativeChecked,
  onNegativeChange,
  selected,
  onSelectedChange,
}: {
  title: string;
  helperText?: string;
  negativeToggleLabel: string;
  items: FieldOption[];
  negativeChecked: boolean;
  onNegativeChange: (checked: boolean) => void;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
}) {
  function toggleItem(value: string) {
    if (negativeChecked) return;
    onSelectedChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div>
      <div className="mb-1 text-sm font-semibold text-ink">{title}</div>
      {helperText ? <div className="mb-2 text-xs text-muted">{helperText}</div> : null}

      <button
        type="button"
        onClick={() => {
          const next = !negativeChecked;
          onNegativeChange(next);
          if (next) onSelectedChange([]);
        }}
        className={[
          "mb-3 flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
          negativeChecked ? "border-teal bg-teal/10 text-teal" : "border-line-strong bg-white text-ink",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold",
            negativeChecked ? "border-teal bg-teal text-white" : "border-line-strong",
          ].join(" ")}
        >
          {negativeChecked ? "✓" : ""}
        </span>
        {negativeToggleLabel}
      </button>

      <div className={`flex flex-wrap gap-2 transition-opacity ${negativeChecked ? "pointer-events-none opacity-40" : ""}`}>
        {items.map((item) => {
          const isSelected = selected.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              disabled={negativeChecked}
              onClick={() => toggleItem(item.value)}
              className={[
                "min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97]",
                isSelected ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-ink hover:border-brand",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
