"use client";

import { useEffect, useRef, useState } from "react";
import { CodedEntry, CodedSearchSource } from "../../lib/data-source/types";

// Field type 4 — type-ahead against a coded data source (medications,
// allergens, ...), debounced, ranked (recent/common first, per the source
// implementation), full detail shown inline per row (never just the bare
// name) so a guardian can tell "Abilify 20mg tablet" from "Abilify 10mg
// tablet" without opening anything. Talks only to the `CodedSearchSource`
// interface — swapping the mock adapter for a real terminology service
// later means zero changes here.
export function CodedSearchSelectField({
  label,
  placeholder,
  source,
  recentIds,
  onSelect,
  autoFocus,
}: {
  label: string;
  placeholder?: string;
  source: CodedSearchSource;
  recentIds?: string[];
  onSelect: (entry: CodedEntry) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CodedEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const myRequest = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const found = await source.search(query, { recentIds, limit: 20 });
      if (requestIdRef.current === myRequest) {
        setResults(found);
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, source]);

  function pick(entry: CodedEntry) {
    onSelect(entry);
    setQuery("");
    setOpen(false);
    setResults([]);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    // Set the loading flag here, in the event handler that actually
    // triggers a new search — not inside the effect body, which should
    // only synchronize with the (already-changed) `query` state.
    setLoading(true);
  }

  return (
    <div className="relative">
      <div className="mb-2 text-sm font-semibold text-ink">{label}</div>
      <input
        autoFocus={autoFocus}
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="min-h-[44px] w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand"
      />

      {open && (query.length > 0 || results.length > 0) ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          {loading ? (
            <div className="px-3 py-3 text-sm text-muted">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted">No matches — try a different spelling</div>
          ) : (
            results.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => pick(entry)}
                className="flex min-h-[52px] w-full cursor-pointer flex-col items-start justify-center border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-background"
              >
                <span className="text-sm font-semibold text-ink">{entry.name}</span>
                <span className="text-xs text-muted">{entry.detail}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
