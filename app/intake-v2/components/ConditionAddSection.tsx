"use client";

import { useState } from "react";
import { Ctx } from "../ctx";
import { CONDITION_CATEGORIES } from "../constants";
import { XIcon } from "./Icons";
import { BrowseByCategory } from "./CategoryBrowser";
import { CatalogChip, NoneCheckRow, SearchClearInput } from "./ui";

const SEARCH_MIN_CHARS = 2;
const ALL_CONDS = CONDITION_CATEGORIES.flatMap((c) => c.conditions);
const CATEGORIES = CONDITION_CATEGORIES.map((c) => ({ name: c.name, items: c.conditions }));

// Shared conditions add flow — used by both the new-patient HealthScreen
// (its own screen, with the exclusive "None" checkbox) and the
// returning-patient HealthCategoryEditors (embedded in
// CategoryFocusPage, no checkbox). A "Selected" strip of removable
// chips on top, then Browse by category (tap-to-toggle chips inside
// each). Search still filters across every category on each keystroke,
// with a Clear (×) button once there's a query and bold highlighting on
// the matched substring.
export function ConditionAddSection({ ctx, showNoneOption = false }: { ctx: Ctx; showNoneOption?: boolean }) {
  const { state, update } = ctx;
  const have = state.onFileConds;
  const none = state.noneConds;

  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const searching = q.length >= SEARCH_MIN_CHARS;
  const searchMatches = searching ? ALL_CONDS.filter((c) => !have.includes(c) && c.toLowerCase().includes(q)) : [];

  // Selecting any item disables "None"; selecting "None" clears the
  // list and disables the rest of the section.
  const addCond = (name: string) => {
    update((s) => ({ onFileConds: [name, ...s.onFileConds], noneConds: false }));
    setQuery("");
  };
  const removeCond = (name: string) => update((s) => ({ onFileConds: s.onFileConds.filter((c) => c !== name) }));
  const toggleCond = (name: string) => (have.includes(name) ? removeCond(name) : addCond(name));
  const toggleNone = () => update((s) => ({ noneConds: !s.noneConds, onFileConds: s.noneConds ? s.onFileConds : [] }));

  return (
    <div>
      {have.length > 0 ? (
        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Selected</div>
            <div className="text-sm font-semibold text-[var(--iv2-brand)]">{have.length} added</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {have.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => removeCond(name)}
                aria-label={`Remove ${name}`}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--iv2-brand)] bg-[var(--iv2-brand-tint)] py-2 pr-3 pl-4 text-[15px] font-semibold text-[var(--iv2-brand)]"
              >
                {name}
                <XIcon size={14} color="var(--iv2-brand)" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={none ? "pointer-events-none opacity-40" : ""}>
        <SearchClearInput placeholder="Search conditions, like migraine" value={query} onChange={setQuery} disabled={none} />

        {searching ? (
          <>
            <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Search results</div>
            {searchMatches.length ? (
              <div className="max-h-[280px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2.5 pr-0.5">
                  {searchMatches.map((name) => (
                    <CatalogChip key={name} label={name} query={query} selected={false} onClick={() => addCond(name)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--iv2-border-strong)] px-5 py-8 text-center">
                <div className="text-[15px] font-semibold text-[var(--iv2-text-primary)]">
                  No matches for &ldquo;<span className="font-extrabold">{query.trim()}</span>&rdquo;.
                </div>
                <div className="mt-1 text-sm text-[var(--iv2-text-muted)]">Check the spelling or try the generic name.</div>
              </div>
            )}
          </>
        ) : (
          <BrowseByCategory
            categories={CATEGORIES}
            selectedCount={(name) => (CATEGORIES.find((c) => c.name === name)?.items ?? []).filter((c) => have.includes(c)).length}
            renderItem={(name) => <CatalogChip key={name} label={name} selected={have.includes(name)} onClick={() => toggleCond(name)} />}
          />
        )}
      </div>

      {showNoneOption ? (
        <div className="mt-6">
          <NoneCheckRow
            label="I don't have any of these"
            hint="Select this if none apply."
            checked={none}
            disabled={have.length > 0}
            onClick={toggleNone}
          />
        </div>
      ) : null}

      {!showNoneOption && !have.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No conditions reported.</div> : null}
    </div>
  );
}
