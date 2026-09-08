"use client";

import { Ctx } from "../ctx";
import { COMMON_CONDS, MORE_CONDS } from "../constants";
import { Checkbox22, IconActionButton, InputField } from "./ui";

const CATALOG_VISIBLE = 5;
const ALL_CONDS = [...COMMON_CONDS, ...MORE_CONDS];

// Shared conditions add flow — used by both the new-patient HealthScreen
// (its own screen, with the "None of these apply" checkbox) and the
// returning-patient HealthCategoryEditors (embedded in
// CategoryFocusPage, no checkbox). Same pattern as
// MedAllergyAddSection: tapping "+" adds immediately (no per-item
// details to fill in for a condition), landing at the top of "Your
// conditions"; search only kicks in past 2 characters, right below the
// search box, capped to a scrollable ~4–5 rows.
export function ConditionAddSection({ ctx, showNoneOption = false }: { ctx: Ctx; showNoneOption?: boolean }) {
  const { state, update } = ctx;
  const have = state.onFileConds;

  const q = state.condSearch.trim().toLowerCase();
  const searching = q.length >= 2;

  const available = ALL_CONDS.filter((c) => !have.includes(c));
  const commonVisibleCount = state.showMore ? available.length : Math.min(CATALOG_VISIBLE, available.length);
  const commonVisible = available.slice(0, commonVisibleCount);
  const commonHiddenCount = available.length - commonVisible.length;

  const searchMatches = searching ? available.filter((c) => c.toLowerCase().includes(q)) : [];

  const addCond = (name: string) => update((s) => ({ onFileConds: [name, ...s.onFileConds], noneConds: false, condSearch: "" }));
  const removeCond = (name: string) => update((s) => ({ onFileConds: s.onFileConds.filter((c) => c !== name) }));
  const toggleNone = () => update((s) => ({ noneConds: !s.noneConds, onFileConds: s.noneConds ? s.onFileConds : [] }));

  const renderRow = (name: string) => (
    <button
      key={name}
      type="button"
      onClick={() => addCond(name)}
      className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--iv2-border)] bg-white px-4 py-3.5 text-left hover:border-[var(--iv2-brand)]"
    >
      <span className="truncate text-[15px] font-semibold text-[var(--iv2-text-primary)]">{name}</span>
      <span className="shrink-0 text-xl leading-none font-bold text-[var(--iv2-success)]">+</span>
    </button>
  );

  return (
    <div>
      {have.length > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--iv2-text-primary)]">Your conditions</div>
            <div className="text-sm font-semibold text-[var(--iv2-success)]">{have.length} added</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {have.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4"
                style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}
              >
                <div className="min-w-0 truncate text-base font-bold text-[var(--iv2-text-primary)]">{name}</div>
                <IconActionButton icon="remove" label={`Remove ${name}`} tone="danger" onClick={() => removeCond(name)} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!state.noneConds ? (
        <>
          <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">
            {have.length ? "Add another condition" : "Search or select a condition"}
          </div>
          <InputField
            ariaLabel="Search"
            placeholder="Search conditions, like migraine"
            value={state.condSearch}
            onChange={(v) => update({ condSearch: v })}
          />

          {searching ? (
            <div className="mt-2.5 max-h-[280px] overflow-y-auto">
              <div className="flex flex-col gap-2.5 pr-0.5">
                {searchMatches.length ? (
                  searchMatches.map(renderRow)
                ) : (
                  <div className="py-2 text-[15px] text-[var(--iv2-text-muted)]">No matches for &ldquo;{state.condSearch.trim()}&rdquo;.</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Common conditions</div>
              <div className="flex flex-col gap-2.5">{commonVisible.map(renderRow)}</div>
              {commonHiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => update({ showMore: true })}
                  className="mt-2.5 flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
                >
                  Show more conditions ({commonHiddenCount})
                </button>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {showNoneOption ? (
        <button
          type="button"
          onClick={toggleNone}
          className="mt-6 flex min-h-14 w-full cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left"
          style={{ borderColor: state.noneConds ? "var(--iv2-brand)" : "var(--iv2-border-subtle)", backgroundColor: state.noneConds ? "var(--iv2-brand-surface)" : "#fff" }}
        >
          <Checkbox22 checked={state.noneConds} />
          <span className="text-base font-semibold text-[var(--iv2-text-primary)]">None of these apply</span>
        </button>
      ) : null}

      {!showNoneOption && !have.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No conditions reported.</div> : null}
    </div>
  );
}
