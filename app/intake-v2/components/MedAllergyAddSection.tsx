"use client";

import { Ctx } from "../ctx";
import { ALLERGY_CATALOG, ALLERGY_DETAILS, ALLERGY_REACTIONS, MED_CATALOG, MED_DETAILS, MED_UNITS } from "../constants";
import { formatDigits } from "../format";
import { CatalogItem } from "../types";
import { Checkbox22, CloseCircleButton, IconActionButton, InputField, SelectField } from "./ui";

const CATALOG_VISIBLE = 5;

// Shared medications/allergies add flow — used by both the new-patient
// ListReviewScreen (its own screen, with the "I don't take any..."
// checkbox) and the returning-patient HealthCategoryEditors (embedded
// in CategoryFocusPage, no checkbox). Catalog rows expand in place into
// an inline Add panel (Drug name + Dose/Unit + Frequency for
// medications, Drug name + Reaction for allergies) rather than a bottom
// sheet — one item at a time, collecting into "Your medications" above
// the remaining catalog. Search only kicks in past 2 characters, right
// below the search box, capped to a scrollable ~4–5 rows; newly added
// items land at the top of the list.
export function MedAllergyAddSection({
  ctx,
  kind,
  showNoneOption = false,
}: {
  ctx: Ctx;
  kind: "medications" | "allergies";
  showNoneOption?: boolean;
}) {
  const { state, update } = ctx;
  const items = kind === "medications" ? state.meds : state.allergies;
  const catalog = kind === "medications" ? MED_CATALOG : ALLERGY_CATALOG;
  const detailOptions = kind === "medications" ? MED_DETAILS : ALLERGY_DETAILS;
  const none = kind === "medications" ? state.noneMeds : state.noneAllergies;
  const nounSingular = kind === "medications" ? "a medication" : "an allergy";
  const nameColor = kind === "medications" ? "var(--iv2-text-primary)" : "var(--iv2-warning)";
  const noDetailText = kind === "medications" ? "No details added" : "Reaction not specified";

  const have = items.map((i) => i.name);
  const q = state.addQuery.trim().toLowerCase();
  // Results only appear once there's enough to actually narrow things
  // down — below 2 characters every catalog entry would still match.
  const searching = q.length >= 2;

  const available = catalog.filter((n) => !have.includes(n));
  const commonVisibleCount = state.addCatalogShowMore ? available.length : Math.min(CATALOG_VISIBLE, available.length);
  const commonVisible = available.slice(0, commonVisibleCount);
  const commonHiddenCount = available.length - commonVisible.length;

  const searchMatches = searching ? available.filter((n) => n.toLowerCase().includes(q)) : [];

  const customName = state.addQuery.trim();
  const customVisible = searching && !catalog.some((n) => n.toLowerCase() === customName.toLowerCase()) && !have.includes(customName);

  const resetDraft = () => ({ addDraftName: "", addDraftDose: "", addDraftUnit: "mg", addDraftFrequency: "", addDraftReaction: "" });

  const openPanel = (name: string) => update({ addExpandedName: name, addEditingIndex: null, ...resetDraft(), addDraftName: name });

  const startEdit = (i: number) => {
    const it = items[i];
    if (kind === "medications") {
      const [doseNum, doseUnit] = (it.dose || "").split(" ");
      update({
        addEditingIndex: i,
        addExpandedName: null,
        addDraftName: it.name,
        addDraftDose: doseNum || "",
        addDraftUnit: doseUnit || "mg",
        addDraftFrequency: it.frequency || "",
        addDraftReaction: "",
      });
    } else {
      // Allergies repurpose CatalogItem.dose to hold the reaction type
      // (medications' own dose/unit split doesn't apply here) and
      // frequency to hold severity.
      update({
        addEditingIndex: i,
        addExpandedName: null,
        addDraftName: it.name,
        addDraftDose: "",
        addDraftUnit: "mg",
        addDraftFrequency: it.frequency || "",
        addDraftReaction: it.dose || "",
      });
    }
  };

  const cancelPanel = () => update({ addExpandedName: null, addEditingIndex: null, ...resetDraft() });

  const buildDetail = (s: typeof state) =>
    kind === "medications"
      ? s.addDraftDose && s.addDraftFrequency
        ? `${s.addDraftDose} ${s.addDraftUnit} · ${s.addDraftFrequency}`
        : noDetailText
      : s.addDraftReaction && s.addDraftFrequency
        ? `Reaction: ${s.addDraftReaction} | Severity: ${s.addDraftFrequency}`
        : noDetailText;

  const confirmAdd = () => {
    const name = state.addDraftName.trim();
    if (!name) return;
    const detail = buildDetail(state);
    const item: CatalogItem =
      kind === "medications"
        ? { name, detail, dose: state.addDraftDose ? `${state.addDraftDose} ${state.addDraftUnit}` : undefined, frequency: state.addDraftFrequency || undefined }
        : { name, detail, dose: state.addDraftReaction || undefined, frequency: state.addDraftFrequency || undefined };
    // Newly added items land at the top of "Your medications" — the
    // one just picked (search or common list) should be the first
    // thing the patient sees confirmed, not buried below earlier ones.
    update((s) => {
      if (kind === "medications") return s.meds.some((i) => i.name === name) ? {} : { meds: [item, ...s.meds], noneMeds: false };
      return s.allergies.some((i) => i.name === name) ? {} : { allergies: [item, ...s.allergies], noneAllergies: false };
    });
    update({ addExpandedName: null, addQuery: "", ...resetDraft() });
  };

  const confirmEdit = () => {
    const name = state.addDraftName.trim();
    if (!name || state.addEditingIndex === null) return;
    const detail = buildDetail(state);
    update((s) => {
      const list = kind === "medications" ? s.meds : s.allergies;
      const next = list.map((it, i) =>
        i === s.addEditingIndex
          ? {
              name,
              detail,
              dose: kind === "medications" ? (s.addDraftDose ? `${s.addDraftDose} ${s.addDraftUnit}` : undefined) : s.addDraftReaction || it.dose,
              frequency: s.addDraftFrequency || it.frequency,
            }
          : it
      );
      return kind === "medications" ? { meds: next } : { allergies: next };
    });
    update({ addEditingIndex: null, ...resetDraft() });
  };

  const removeItem = (index: number) =>
    update((s) => {
      const list = kind === "medications" ? s.meds : s.allergies;
      const next = list.filter((_, i) => i !== index);
      return kind === "medications" ? { meds: next } : { allergies: next };
    });

  const toggleNone = () => {
    if (kind === "medications") update((s) => ({ noneMeds: !s.noneMeds }));
    else update((s) => ({ noneAllergies: !s.noneAllergies }));
  };

  // Same "+" row (or its expanded Add panel) whether it's rendered from
  // the common list or the search results — one consistent pattern
  // regardless of which list the tap came from.
  const renderRow = (name: string) =>
    state.addExpandedName === name ? (
      <AddPanel key={name} ctx={ctx} kind={kind} detailOptions={detailOptions} mode="add" onCancel={cancelPanel} onConfirm={confirmAdd} />
    ) : (
      <button
        key={name}
        type="button"
        onClick={() => openPanel(name)}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--iv2-border)] bg-white px-4 py-3.5 text-left hover:border-[var(--iv2-brand)]"
      >
        <span className="truncate text-[15px] font-semibold text-[var(--iv2-text-primary)]">{name}</span>
        <span className="shrink-0 text-xl leading-none font-bold text-[var(--iv2-success)]">+</span>
      </button>
    );

  const renderCustomRow = () =>
    state.addExpandedName === customName ? (
      <AddPanel key="custom" ctx={ctx} kind={kind} detailOptions={detailOptions} mode="add" onCancel={cancelPanel} onConfirm={confirmAdd} />
    ) : (
      <button
        key="custom"
        type="button"
        onClick={() => openPanel(customName)}
        className="flex min-h-14 w-full cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-[var(--iv2-border-strong)] bg-white px-4 py-3.5 text-left"
      >
        <span className="text-lg leading-none font-bold text-[var(--iv2-brand)]">+</span>
        <span className="truncate text-[15px] font-semibold text-[var(--iv2-brand)]">Add &ldquo;{customName}&rdquo;</span>
      </button>
    );

  return (
    <div>
      {items.length > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--iv2-text-primary)]">Your {kind === "medications" ? "medications" : "allergies"}</div>
            <div className="text-sm font-semibold text-[var(--iv2-success)]">{items.length} added</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {items.map((it, i) =>
              state.addEditingIndex === i ? (
                <AddPanel key={`${it.name}-edit`} ctx={ctx} kind={kind} detailOptions={detailOptions} mode="edit" onCancel={cancelPanel} onConfirm={confirmEdit} />
              ) : (
                <div
                  key={`${it.name}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4"
                  style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold" style={{ color: nameColor }}>
                      {it.name}
                    </div>
                    <div className="mt-0.5 truncate text-sm" style={{ color: it.detail === noDetailText ? "var(--iv2-text-muted)" : "var(--iv2-text-secondary)" }}>
                      {it.detail}
                    </div>
                  </div>
                  <div className="flex w-[76px] shrink-0 justify-end gap-1">
                    <IconActionButton icon="edit" label={`Edit ${it.name}`} onClick={() => startEdit(i)} />
                    <IconActionButton icon="remove" label={`Remove ${it.name}`} tone="danger" onClick={() => removeItem(i)} />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : null}

      {!none ? (
        <>
          <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">
            {items.length ? `Add another ${kind === "medications" ? "medication" : "allergy"}` : `Search or select ${nounSingular}`}
          </div>

          {/* Search box sits above its own results, not the common
              list, so the two stay visually next to each other. */}
          <InputField
            ariaLabel="Search"
            placeholder={`Search by ${kind === "medications" ? "drug" : "allergen"} name...`}
            value={state.addQuery}
            onChange={(v) => update({ addQuery: v })}
          />

          {searching ? (
            <div className="mt-2.5 max-h-[280px] overflow-y-auto">
              <div className="flex flex-col gap-2.5 pr-0.5">
                {searchMatches.map(renderRow)}
                {customVisible ? renderCustomRow() : null}
                {!searchMatches.length && !customVisible ? (
                  <div className="py-2 text-[15px] text-[var(--iv2-text-muted)]">No matches for &ldquo;{customName}&rdquo;.</div>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">
                Common {kind === "medications" ? "medications" : "allergens"}
              </div>
              <div className="flex flex-col gap-2.5">{commonVisible.map(renderRow)}</div>

              {commonHiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => update({ addCatalogShowMore: true })}
                  className="mt-2.5 flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
                >
                  Show more {kind === "medications" ? "medications" : "allergens"} ({commonHiddenCount})
                </button>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {showNoneOption ? (
        <>
          <button
            type="button"
            onClick={toggleNone}
            className="mt-6 flex min-h-14 w-full cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left"
            style={{ borderColor: none ? "var(--iv2-brand)" : "var(--iv2-border-subtle)", backgroundColor: none ? "var(--iv2-brand-surface)" : "#fff" }}
          >
            <Checkbox22 checked={none} />
            <span className="text-base font-semibold text-[var(--iv2-text-primary)]">
              {kind === "medications" ? "I don't take any of these medications" : "I don't have any of these allergies"}
            </span>
          </button>
          {!none && !items.length ? (
            <div className="mt-2 text-[13px] text-[var(--iv2-text-muted)]">
              Select {nounSingular} or choose &ldquo;I don&apos;t take any of these medications.&rdquo;
            </div>
          ) : null}
        </>
      ) : null}

      {!showNoneOption && !items.length ? (
        <div className="py-2 text-base text-[var(--iv2-text-muted)]">
          {kind === "medications" ? "No medications on file." : "No known allergies."}
        </div>
      ) : null}
    </div>
  );
}

// The inline Add/Edit form — a bordered card that takes the place of
// whichever catalog row (adding) or "Your medications" row (editing)
// it's replacing, rather than a bottom sheet.
function AddPanel({
  ctx,
  kind,
  detailOptions,
  mode,
  onCancel,
  onConfirm,
}: {
  ctx: Ctx;
  kind: "medications" | "allergies";
  detailOptions: string[];
  mode: "add" | "edit";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { state, update } = ctx;
  const ready = state.addDraftName.trim().length > 0;
  const noun = kind === "medications" ? "medication" : "allergy";

  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--iv2-brand)] bg-white p-4">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-base font-bold text-[var(--iv2-text-primary)]">{mode === "edit" ? `Edit ${noun}` : `Add ${noun}`}</div>
        <CloseCircleButton onClick={onCancel} />
      </div>
      <div className="flex flex-col gap-3.5">
        <InputField label={kind === "medications" ? "Drug name" : "Allergy"} value={state.addDraftName} onChange={(v) => update({ addDraftName: v })} />
        {kind === "medications" ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <InputField
                label="Dose"
                value={state.addDraftDose}
                placeholder="20"
                inputMode="numeric"
                onChange={(v) => update({ addDraftDose: formatDigits(v, 4) })}
              />
            </div>
            <div className="w-[110px] shrink-0">
              <SelectField label="Unit" value={state.addDraftUnit} onChange={(v) => update({ addDraftUnit: v })} options={MED_UNITS} />
            </div>
          </div>
        ) : (
          <SelectField
            label="What is your typical reaction to this allergy?"
            value={state.addDraftReaction}
            onChange={(v) => update({ addDraftReaction: v })}
            options={ALLERGY_REACTIONS}
            placeholder="Select reaction"
          />
        )}
        <SelectField
          label={kind === "medications" ? "How often do you take it?" : "How severe is the reaction?"}
          value={state.addDraftFrequency}
          onChange={(v) => update({ addDraftFrequency: v })}
          options={detailOptions}
          placeholder={kind === "medications" ? "Select frequency" : "Select severity"}
        />
      </div>
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 cursor-pointer rounded-xl border-[1.5px] border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!ready}
          className="h-12 flex-1 rounded-xl border-none text-[15px] font-bold"
          style={{
            backgroundColor: ready ? "var(--iv2-brand)" : "var(--iv2-disabled-bg)",
            color: ready ? "#fff" : "var(--iv2-disabled-fg)",
            cursor: ready ? "pointer" : "not-allowed",
          }}
        >
          {mode === "edit" ? "Save changes" : `Add ${noun}`}
        </button>
      </div>
    </div>
  );
}
