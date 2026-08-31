"use client";

import { useState } from "react";
import { mockScanMedicationLabel, searchMedications } from "../mockData";
import { Chip } from "./ui";

type MedEntry = { id: string; name: string; dose: string; frequency: string; uncertain: boolean };

function formatMed(m: MedEntry): string {
  return `${m.name} · ${m.dose} · ${m.frequency}`;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `med-${idCounter}`;
}

// The "Medications" category's own chip-list input — replaces the old
// fixed-option chip picker with search-to-add (against mockData.ts's own
// small MEDICATION_DIRECTORY — this used to import /intake's own
// mockMedications.ts directly, which broke every Vercel build since
// app/intake/ is never committed to git; see mockData.ts's comment on
// searchMedications for the full story) plus a mock "scan the label"
// shortcut that bulk-adds from a photographed bottle. No real camera/OCR
// call — this repo's mock-data convention explicitly rules that out (see
// mockData.ts's own header comment).
// Clicking the camera button simulates a short scan delay then adds a
// fixed demo pair, one flagged as uncertain, so the "something needs a
// second look" UX is exercisable without a real photo.
export function MedicationChipInput({
  initialFormatted = [],
  onChange,
}: {
  // Seeds the list from previously-saved "name · dose · frequency"
  // strings — needed because this component remounts fresh each time the
  // Health History accordion re-opens the Medications panel (only one
  // category panel exists in the DOM at a time); without this, switching
  // to another category and back would silently drop everything entered
  // so far. Parsed back into structured entries via the same "·"
  // delimiter formatMed() writes with — good enough for round-tripping
  // this component's own output, not a general parser.
  initialFormatted?: string[];
  onChange: (formatted: string[]) => void;
}) {
  const [entries, setEntries] = useState<MedEntry[]>(() =>
    initialFormatted.map((formatted, i) => {
      const [name, dose, frequency] = formatted.split(" · ");
      return { id: `seed-${i}`, name: name ?? formatted, dose: dose ?? "", frequency: frequency ?? "", uncertain: false };
    })
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof searchMedications>>([]);
  const [pending, setPending] = useState<{ name: string; doses: string[]; frequencies: string[] } | null>(null);
  const [pendingDose, setPendingDose] = useState<string | null>(null);
  const [pendingFrequency, setPendingFrequency] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{ count: number; uncertainCount: number } | null>(null);

  function commit(next: MedEntry[]) {
    setEntries(next);
    onChange(next.map(formatMed));
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    setResults(v.trim() ? searchMedications(v, { limit: 6 }) : []);
  }

  function pickResult(name: string, doses: string[] = [], frequencies: string[] = []) {
    setPending({ name, doses, frequencies });
    setPendingDose(null);
    setPendingFrequency(null);
    setQuery("");
    setResults([]);
  }

  function savePending() {
    if (!pending || !pendingDose || !pendingFrequency) return;
    commit([...entries, { id: nextId(), name: pending.name, dose: pendingDose, frequency: pendingFrequency, uncertain: false }]);
    setPending(null);
  }

  function removeEntry(id: string) {
    commit(entries.filter((e) => e.id !== id));
  }

  async function handleScan() {
    setScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const scanned = mockScanMedicationLabel();
    commit([
      ...entries,
      ...scanned.map((s) => ({ id: nextId(), name: s.name, dose: s.dose, frequency: s.frequency, uncertain: s.doseUncertain })),
    ]);
    setLastScanResult({ count: scanned.length, uncertainCount: scanned.filter((s) => s.doseUncertain).length });
    setScanning(false);
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Medications</div>

      {entries.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {entries.map((e) => (
            <span
              key={e.id}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium",
                e.uncertain
                  ? "border-[var(--color-orange)] bg-[var(--color-orange)]/10 text-[var(--color-orange)]"
                  : "border-[var(--color-line-strong)] bg-[var(--color-background)] text-[var(--color-ink)]",
              ].join(" ")}
            >
              {e.name} · {e.dose} · {e.frequency}
              <button type="button" onClick={() => removeEntry(e.id)} aria-label={`Remove ${e.name}`} className="cursor-pointer">
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {!pending ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(ev) => handleQueryChange(ev.target.value)}
              placeholder="Search for a medication"
              className="min-h-[44px] w-full rounded-full border border-[var(--color-line-strong)] bg-white px-4 text-sm outline-none focus:border-[var(--color-brand)]"
            />
            {results.length > 0 ? (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--color-line)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => pickResult(r.name, r.doses, r.frequencies)}
                    className="flex w-full flex-col items-start border-b border-[var(--color-line)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--color-background)]"
                  >
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{r.name}</span>
                    <span className="text-xs text-[var(--color-muted)]">{r.detail}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            aria-label="Scan a medication label"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-white text-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? "…" : "📷"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-background)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--color-ink)]">{pending.name}</div>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="cursor-pointer text-sm font-medium text-[var(--color-brand)]"
            >
              Change
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Dose</div>
              <div className="flex flex-wrap gap-2">
                {[...pending.doses, "Not sure"].map((d) => (
                  <Chip key={d} label={d} selected={pendingDose === d} onClick={() => setPendingDose(d)} />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">How often</div>
              <div className="flex flex-wrap gap-2">
                {[...pending.frequencies, "As needed"].map((f) => (
                  <Chip key={f} label={f} selected={pendingFrequency === f} onClick={() => setPendingFrequency(f)} />
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!pendingDose || !pendingFrequency}
              onClick={savePending}
              className="min-h-[44px] w-full cursor-pointer rounded-full bg-[var(--color-brand)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-dark)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {lastScanResult ? (
        <div className="mt-2 text-xs text-[var(--color-muted)]">
          Read {lastScanResult.count} medication{lastScanResult.count === 1 ? "" : "s"} from the label
          {lastScanResult.uncertainCount > 0
            ? ` — ${lastScanResult.uncertainCount === 1 ? "one dose was" : `${lastScanResult.uncertainCount} doses were`} unclear, check the flagged chip${lastScanResult.uncertainCount === 1 ? "" : "s"}.`
            : "."}
        </div>
      ) : null}
    </div>
  );
}

// The shared chip-list input for the other four Medical History categories
// (allergies, conditions, surgeries, hospitalizations) — same "chip list +
// search-to-add" shape as medications, without dose/frequency or the
// camera-scan step, since none of those categories have that structure.
// Typing something not in `suggestions` still adds it — the list is a
// starting point, not a hard constraint.
export function SimpleChipInput({
  suggestions,
  values,
  onChange,
  placeholder,
}: {
  suggestions: string[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()) && !values.includes(s))
    : [];

  function add(value: string) {
    const v = value.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setQuery("");
  }

  return (
    <div>
      {values.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="cursor-pointer"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <input
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              add(query);
            }
          }}
          placeholder={placeholder}
          className="min-h-[44px] w-full rounded-full border border-[var(--color-line-strong)] bg-white px-4 text-sm outline-none focus:border-[var(--color-brand)]"
        />
        {filtered.length > 0 ? (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--color-line)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="block w-full border-b border-[var(--color-line)] px-3 py-2 text-left text-sm font-medium text-[var(--color-ink)] last:border-b-0 hover:bg-[var(--color-background)]"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
