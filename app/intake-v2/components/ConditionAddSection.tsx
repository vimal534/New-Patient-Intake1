"use client";

import { useState } from "react";
import { Ctx } from "../ctx";
import { COMMON_CONDS, MORE_CONDS } from "../constants";
import { CatalogCheckRow, NoneCheckRow, SearchClearInput, SelectedListSection } from "./ui";

const CATALOG_VISIBLE = 5;
const SEARCH_MIN_CHARS = 2;
const ALL_CONDS = [...COMMON_CONDS, ...MORE_CONDS];

// Shared conditions add flow — used by both the new-patient HealthScreen
// (its own screen, with the exclusive "None" checkbox) and the
// returning-patient HealthCategoryEditors (embedded in
// CategoryFocusPage, no checkbox). Checkbox-driven throughout (no "+"
// icon): checking a catalog/search row selects it immediately (a
// condition has no follow-up details to fill in), landing at the top of
// "Your conditions". Search filters live on every keystroke, no
// debounce, with a Clear (×) button once there's a query and bold
// highlighting on whichever substring matched.
export function ConditionAddSection({ ctx, showNoneOption = false }: { ctx: Ctx; showNoneOption?: boolean }) {
  const { state, update } = ctx;
  const have = state.onFileConds;
  const none = state.noneConds;

  const [query, setQuery] = useState("");
  const [showMore, setShowMore] = useState(false);

  const q = query.trim().toLowerCase();
  const searching = q.length >= SEARCH_MIN_CHARS;

  const available = ALL_CONDS.filter((c) => !have.includes(c));
  const commonVisibleCount = showMore ? available.length : Math.min(CATALOG_VISIBLE, available.length);
  const commonVisible = available.slice(0, commonVisibleCount);
  const commonHiddenCount = available.length - commonVisible.length;

  const searchMatches = searching ? available.filter((c) => c.toLowerCase().includes(q)) : [];

  // Selecting any item disables "None" (point 10); selecting "None"
  // clears the list and disables the rest of the section (points 8-9).
  const addCond = (name: string) => {
    update((s) => ({ onFileConds: [name, ...s.onFileConds], noneConds: false }));
    setQuery("");
  };
  const removeCond = (name: string) => update((s) => ({ onFileConds: s.onFileConds.filter((c) => c !== name) }));
  const toggleNone = () => update((s) => ({ noneConds: !s.noneConds, onFileConds: s.noneConds ? s.onFileConds : [] }));

  return (
    <div>
      {have.length > 0 ? (
        <SelectedListSection
          label="Your conditions"
          noun="conditions"
          items={have.map((name) => ({
            key: name,
            node: <CatalogCheckRow label={name} checked onClick={() => removeCond(name)} />,
          }))}
        />
      ) : null}

      <div className={none ? "pointer-events-none opacity-40" : ""}>
        <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">{have.length ? "Add another" : "Search or select condition"}</div>
        <SearchClearInput placeholder="Search conditions, like migraine" value={query} onChange={setQuery} disabled={none} />

        {searching ? (
          <div className="mt-2.5 max-h-[280px] overflow-y-auto">
            <div className="flex flex-col gap-2.5 pr-0.5">
              {searchMatches.length ? (
                searchMatches.map((name) => <CatalogCheckRow key={name} label={name} query={query} checked={false} onClick={() => addCond(name)} />)
              ) : (
                <div className="py-2 text-[15px] text-[var(--iv2-text-muted)]">No matches for &ldquo;{query.trim()}&rdquo;.</div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Commonly used</div>
            <div className="flex flex-col gap-2.5">
              {commonVisible.map((name) => (
                <CatalogCheckRow key={name} label={name} checked={false} onClick={() => addCond(name)} />
              ))}
            </div>
            {commonHiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="mt-2.5 flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
              >
                Show more ({commonHiddenCount})
              </button>
            ) : null}
          </>
        )}
      </div>

      {showNoneOption ? (
        <div className="mt-6">
          <NoneCheckRow label="I don't have any of these" checked={none} disabled={have.length > 0} onClick={toggleNone} />
        </div>
      ) : null}

      {!showNoneOption && !have.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No conditions reported.</div> : null}
    </div>
  );
}
