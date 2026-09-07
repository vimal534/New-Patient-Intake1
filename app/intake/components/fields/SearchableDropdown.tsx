"use client";

import { useMemo, useState } from "react";
import { FieldOption } from "../../lib/schema/types";

// Field type 3 — for option sets too long for chips to stay tap-first
// (8+ options): a trigger row that opens a full bottom sheet with a search
// bar, rather than a native <select> (which reads as a cramped desktop
// control on a phone).
export function SearchableDropdownField({
  label,
  helperText,
  options,
  value,
  onChange,
  multi,
  searchPlaceholder = "Search",
}: {
  label: string;
  helperText?: string;
  options: FieldOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multi: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);

  function pick(optValue: string) {
    if (multi) {
      onChange(value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue]);
    } else {
      onChange([optValue]);
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-ink">{label}</div>
      {helperText ? <div className="mb-2 text-xs text-muted">{helperText}</div> : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-lg border border-line-strong bg-white px-3 text-left text-sm text-ink"
      >
        <span className={selectedLabels.length ? "text-ink" : "text-placeholder"}>
          {selectedLabels.length ? selectedLabels.join(", ") : "Select"}
        </span>
        <span aria-hidden className="text-muted">
          ⌄
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-pointer bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-ink">{label}</div>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-sm font-medium text-brand">
                {multi ? "Done" : "Close"}
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="mb-3 min-h-[44px] w-full shrink-0 rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand"
            />
            <div className="flex-1 overflow-y-auto">
              {filtered.map((opt) => {
                const selected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => pick(opt.value)}
                    className="flex min-h-[52px] w-full cursor-pointer items-center justify-between border-b border-line px-2 text-left text-sm text-ink"
                  >
                    {opt.label}
                    {selected ? <span className="text-brand">✓</span> : null}
                  </button>
                );
              })}
              {filtered.length === 0 ? <div className="py-6 text-center text-sm text-muted">No matches</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
