"use client";

import { Ctx } from "../../ctx";
import { ALLERGY_CATALOG, ALLERGY_DETAILS, MED_CATALOG, MED_DETAILS } from "../../constants";
import { BottomSheet, CloseCircleButton, DetailPill, InputField } from "../ui";

// Add-sheet used by both Medications and Allergies (README: "used by
// both — never silently append a value"). Search → multi-select →
// (once anything is picked) a single detail question → submit.
export function AddItemSheet({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const kind = state.addSheet;
  if (!kind) return null;

  const catalog = kind === "allergies" ? ALLERGY_CATALOG : MED_CATALOG;
  const have = (kind === "allergies" ? state.allergies : state.meds).map((x) => x.name);
  const q = state.addQuery.trim().toLowerCase();

  const options = catalog
    .filter((n) => !have.includes(n))
    .filter((n) => !q || n.toLowerCase().includes(q))
    .concat(state.addPicks.filter((p) => !catalog.includes(p)));

  const customVisible =
    state.addQuery.trim().length > 1 &&
    !catalog.some((n) => n.toLowerCase() === state.addQuery.trim().toLowerCase()) &&
    !state.addPicks.includes(state.addQuery.trim());

  const togglePick = (name: string) =>
    update((s) => ({
      addPicks: s.addPicks.includes(name) ? s.addPicks.filter((p) => p !== name) : [...s.addPicks, name],
    }));

  const close = () => update({ addSheet: null, addQuery: "", addPicks: [], addDetail: null });

  const submit = () => {
    if (!state.addPicks.length) return;
    const detail = state.addDetail || (kind === "medications" ? "Dose not specified" : "Reaction not specified");
    const items = state.addPicks.map((name) => ({ name, detail }));
    if (kind === "medications") {
      update((s) => ({ meds: [...s.meds, ...items.filter((i) => !s.meds.some((m) => m.name === i.name))] }));
    } else {
      update((s) => ({ allergies: [...s.allergies, ...items.filter((i) => !s.allergies.some((a) => a.name === i.name))] }));
    }
    close();
  };

  const detailOptions = kind === "allergies" ? ALLERGY_DETAILS : MED_DETAILS;
  const submitLabel =
    state.addPicks.length > 1
      ? `Add ${state.addPicks.length} items`
      : state.addPicks.length === 1
        ? `Add ${state.addPicks[0]}`
        : "Select to add";

  return (
    <BottomSheet open zIndex={76}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xl font-bold text-[var(--iv2-text-primary)]">{kind === "allergies" ? "Add an allergy" : "Add a medication"}</div>
        <CloseCircleButton onClick={close} />
      </div>
      <InputField
        value={state.addQuery}
        placeholder={kind === "allergies" ? "Search allergies, like latex" : "Search medications, like metformin"}
        ariaLabel="Search"
        onChange={(v) => update({ addQuery: v })}
      />

      <div className="mt-2 flex-1 overflow-auto">
        {options.map((name) => {
          const sel = state.addPicks.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => togglePick(name)}
              className="flex min-h-14 w-full cursor-pointer items-center gap-3.5 border-none border-b border-[var(--iv2-border-subtle)] px-1 py-3 text-left"
              style={{ backgroundColor: sel ? "var(--iv2-brand-surface)" : "transparent" }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[13px] font-bold text-white"
                style={{
                  borderColor: sel ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
                  backgroundColor: sel ? "var(--iv2-brand)" : "#fff",
                }}
              >
                {sel ? "✓" : ""}
              </span>
              <span className="text-[17px] text-[var(--iv2-text-primary)]">{name}</span>
            </button>
          );
        })}
        {customVisible ? (
          <button
            type="button"
            onClick={() => togglePick(state.addQuery.trim())}
            className="flex min-h-14 w-full cursor-pointer items-center gap-3.5 border-none bg-transparent px-1 py-3 text-left"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-[var(--iv2-border-strong)] text-[15px] text-[var(--iv2-brand)]">
              +
            </span>
            <span className="text-[17px] font-semibold text-[var(--iv2-brand)]">Add &ldquo;{state.addQuery}&rdquo;</span>
          </button>
        ) : null}
      </div>

      {state.addPicks.length > 0 ? (
        <div className="shrink-0 pt-4">
          <div className="mb-2.5 text-[13px] font-semibold text-[var(--iv2-text-secondary)]">
            {kind === "allergies" ? "How severe is the reaction?" : "How often do you take it?"}
          </div>
          <div className="flex flex-wrap gap-2">
            {detailOptions.map((label) => (
              <DetailPill key={label} label={label} selected={state.addDetail === label} onClick={() => update({ addDetail: label })} />
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!state.addPicks.length}
        className="mt-5 h-14 w-full shrink-0 rounded-2xl border-none text-base font-semibold"
        style={{
          backgroundColor: state.addPicks.length ? "var(--iv2-brand)" : "var(--iv2-disabled-bg)",
          color: state.addPicks.length ? "#fff" : "var(--iv2-disabled-fg)",
          cursor: state.addPicks.length ? "pointer" : "not-allowed",
        }}
      >
        {submitLabel}
      </button>
    </BottomSheet>
  );
}
