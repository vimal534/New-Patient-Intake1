"use client";

import { useMemo, useRef, useState } from "react";
import type { MedicationEntry } from "@/app/lib/checkin-types";
import {
  MEDICATION_FREQUENCIES,
  MEDICATION_SUGGESTIONS as MEDICATION_SUGGESTIONS_POOL,
  MEDICATION_UNITS,
} from "@/app/lib/health-suggestions";
import { Chip } from "@/app/components/Chip";

// ---------- shared bits ----------

function useOutsideCollapse(onCollapse: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  function handleBlurCapture(e: React.FocusEvent) {
    if (!ref.current?.contains(e.relatedTarget as Node)) {
      window.setTimeout(() => {
        if (!ref.current?.contains(document.activeElement)) onCollapse();
      }, 0);
    }
  }
  return { ref, handleBlurCapture };
}

function SuggestionList({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="max-h-48 overflow-y-auto divide-y divide-line">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(item)}
          className="block w-full px-3.5 py-2.5 text-left text-sm text-ink hover:bg-background"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ---------- Conditions / Allergies — simple pick-or-type ----------

export function SimpleTagPicker({
  label,
  tags,
  suggestions,
  onChange,
  variant = "brand",
}: {
  label: string;
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
  variant?: "brand" | "caution";
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const { ref, handleBlurCapture } = useOutsideCollapse(() => {
    setExpanded(false);
    setQuery("");
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = suggestions.filter((s) => !tags.includes(s));
    if (!q) return pool.slice(0, 6);
    return pool.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [query, suggestions, tags]);

  function add(value: string) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setQuery("");
    setExpanded(false);
  }

  function remove(value: string) {
    onChange(tags.filter((t) => t !== value));
  }

  const chipTone =
    variant === "caution"
      ? "border-orange text-orange"
      : "border-brand text-brand";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${chipTone}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              className="opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm font-medium text-muted"
          >
            + Add {label}
          </button>
        )}
      </div>

      {expanded && (
        <div ref={ref} onBlurCapture={handleBlurCapture} className="mt-2">
          <div className="rounded-2xl border-2 border-brand bg-white">
            <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) add(query);
                  if (e.key === "Escape") {
                    setExpanded(false);
                    setQuery("");
                  }
                }}
                placeholder={`Start typing — we'll suggest matches`}
                className="flex-1 text-sm text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setQuery("");
                }}
                aria-label="Close"
                className="text-muted-2"
              >
                ×
              </button>
            </div>
            <SuggestionList items={filtered} onPick={add} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Medications — typeahead, then strength + frequency ----------

export function MedicationPicker({
  entries,
  onChange,
}: {
  entries: MedicationEntry[];
  onChange: (entries: MedicationEntry[]) => void;
}) {
  const [mode, setMode] = useState<"collapsed" | "search" | "detail">("collapsed");
  const [query, setQuery] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [strength, setStrength] = useState("");
  const [unit, setUnit] = useState(MEDICATION_UNITS[0]);
  const [frequency, setFrequency] = useState("");
  const [customFrequency, setCustomFrequency] = useState("");

  const existingNames = entries.map((e) => e.name);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = MEDICATION_SUGGESTIONS_POOL.filter(
      (s) => !existingNames.includes(s)
    );
    if (!q) return pool.slice(0, 6);
    return pool.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [query, existingNames]);

  function startDetail(name: string) {
    setPendingName(name);
    setStrength("");
    setUnit(MEDICATION_UNITS[0]);
    setFrequency("");
    setCustomFrequency("");
    setMode("detail");
  }

  function cancel() {
    setMode("collapsed");
    setQuery("");
  }

  function confirmAdd() {
    const finalFrequency =
      frequency === "Other…" ? customFrequency.trim() || "Other" : frequency;
    onChange([
      ...entries,
      { name: pendingName, strength: strength.trim(), unit, frequency: finalFrequency },
    ]);
    setMode("collapsed");
    setQuery("");
  }

  function remove(name: string) {
    onChange(entries.filter((e) => e.name !== name));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {entries.map((e) => (
          <span
            key={e.name}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand px-3 py-1.5 text-sm font-medium text-brand"
          >
            {e.name}
            {e.strength && ` · ${e.strength}${e.unit}`}
            {e.frequency && ` · ${e.frequency}`}
            <button
              type="button"
              onClick={() => remove(e.name)}
              aria-label={`Remove ${e.name}`}
              className="opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        {mode === "collapsed" && (
          <button
            type="button"
            onClick={() => setMode("search")}
            className="rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm font-medium text-muted"
          >
            + Add a medication
          </button>
        )}
      </div>

      <div className={mode === "collapsed" ? "" : "mt-2"}>
        {mode === "search" && (
          <div className="rounded-2xl border-2 border-brand bg-white">
            <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) startDetail(query.trim());
                  if (e.key === "Escape") cancel();
                }}
                placeholder="Search by name"
                className="flex-1 text-sm text-ink outline-none"
              />
              <button type="button" onClick={cancel} aria-label="Close" className="text-muted-2">
                ×
              </button>
            </div>
            <SuggestionList items={filtered} onPick={startDetail} />
          </div>
        )}

        {mode === "detail" && (
          <div className="rounded-2xl border-2 border-brand bg-white p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
                  Adding
                </p>
                <p className="text-base font-bold text-ink">{pendingName}</p>
              </div>
              <button type="button" onClick={cancel} aria-label="Cancel" className="text-muted-2">
                ×
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
                  Strength
                </label>
                <input
                  autoFocus
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="e.g. 1000"
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-line-strong px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="rounded-2xl border border-line-strong bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
                >
                  {MEDICATION_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="mb-2 mt-4 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
              Frequency
            </label>
            <div className="flex flex-wrap gap-2">
              {MEDICATION_FREQUENCIES.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  selected={frequency === f}
                  onClick={() => setFrequency(f)}
                />
              ))}
            </div>
            {frequency === "Other…" && (
              <input
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                placeholder="Describe how often"
                className="mt-2 w-full rounded-2xl border border-line-strong px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
              />
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={cancel}
                className="flex-1 rounded-full border border-line-strong py-2.5 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!strength.trim()}
                onClick={confirmAdd}
                className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

