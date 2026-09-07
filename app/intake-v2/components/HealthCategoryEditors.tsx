"use client";

import { Ctx } from "../ctx";
import { COMMON_CONDS, MED_DETAILS, MORE_CONDS } from "../constants";
import { Card, ConditionTile, DetailPill, IconActionButton, InputField, TextAction } from "./ui";

// The actual add/remove/edit UI for each of the five Health History
// categories — rendered inline by HealthScreen.tsx's CategoryFocusPage
// once a patient taps "Update <category>" past the confirm gate. These
// used to live inside a bottom sheet (HealthCategorySheet.tsx); now that
// each category is its own focused page rather than a sheet over the
// summary, the bodies moved here unchanged and the page's sticky Footer
// (via footerFor's hhEditing/hhMode branch in page.tsx) owns the single
// "Save changes" action instead of a sheet-local Done button.

function ListRow({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--iv2-border-subtle)] py-3">
      <div className="min-w-0 text-base font-semibold text-ellipsis text-[var(--iv2-text-primary)]">{title}</div>
      <IconActionButton icon="remove" label={`Remove ${title}`} tone="danger" onClick={onRemove} />
    </div>
  );
}

export function ConditionsEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  if (!state.hhCondAdding) {
    return (
      <div>
        {state.onFileConds.map((name) => (
          <ListRow key={name} title={name} onRemove={() => update({ pendingRemove: name })} />
        ))}
        {!state.onFileConds.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No conditions reported.</div> : null}
        <TextAction onClick={() => update({ hhCondAdding: true, selectedConds: [], condSearch: "", showMore: false })} className="block pt-4 text-base">
          + Add a condition
        </TextAction>
      </div>
    );
  }

  const options = [...COMMON_CONDS, ...(state.showMore ? MORE_CONDS : [])].filter((c) => !state.onFileConds.includes(c));
  const toggle = (name: string) =>
    update((s) => ({ selectedConds: s.selectedConds.includes(name) ? s.selectedConds.filter((c) => c !== name) : [...s.selectedConds, name] }));

  const save = () =>
    update((s) => ({
      onFileConds: [...s.onFileConds, ...s.selectedConds.filter((c) => !s.onFileConds.includes(c))],
      selectedConds: [],
      hhCondAdding: false,
      condSearch: "",
      showMore: false,
    }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((name) => (
          <ConditionTile key={name} label={name} selected={state.selectedConds.includes(name)} onClick={() => toggle(name)} />
        ))}
      </div>
      <TextAction onClick={() => update({ showMore: !state.showMore })} className="block pt-3.5 text-[15px]">
        {state.showMore ? "Show fewer conditions" : `Show ${MORE_CONDS.length} more conditions`}
      </TextAction>
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={() => update({ hhCondAdding: false, selectedConds: [] })}
          className="h-12 flex-1 cursor-pointer rounded-xl border-[1.5px] border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!state.selectedConds.length}
          className="h-12 flex-1 rounded-xl border-none text-[15px] font-bold"
          style={{
            backgroundColor: state.selectedConds.length ? "var(--iv2-brand)" : "var(--iv2-disabled-bg)",
            color: state.selectedConds.length ? "#fff" : "var(--iv2-disabled-fg)",
            cursor: state.selectedConds.length ? "pointer" : "not-allowed",
          }}
        >
          Add selected
        </button>
      </div>
    </div>
  );
}

export function MedicationsEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  const startEdit = (i: number) => {
    const m = state.meds[i];
    update({ medEditingIndex: i, medDraftName: m.name, medDraftDose: m.dose || "", medDraftFrequency: m.frequency || "" });
  };
  const remove = (i: number) => update((s) => ({ meds: s.meds.filter((_, j) => j !== i) }));
  const saveEdit = () =>
    update((s) => ({
      meds: s.meds.map((m, j) =>
        j === s.medEditingIndex
          ? { name: s.medDraftName || m.name, dose: s.medDraftDose, frequency: s.medDraftFrequency, detail: `${s.medDraftDose} · ${s.medDraftFrequency}` }
          : m
      ),
      medEditingIndex: null,
    }));

  if (state.medEditingIndex !== null) {
    return (
      <div className="flex flex-col gap-3.5">
        <InputField label="Drug name" value={state.medDraftName} onChange={(v) => update({ medDraftName: v })} />
        <InputField label="Dose" value={state.medDraftDose} placeholder="500 mg" onChange={(v) => update({ medDraftDose: v })} />
        <div>
          <div className="mb-1.5 text-sm text-[var(--iv2-text-muted)]">Frequency</div>
          <div className="flex flex-wrap gap-2">
            {MED_DETAILS.map((label) => (
              <DetailPill key={label} label={label} selected={state.medDraftFrequency === label} onClick={() => update({ medDraftFrequency: label })} />
            ))}
          </div>
        </div>
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => update({ medEditingIndex: null })}
            className="h-12 flex-1 cursor-pointer rounded-xl border-[1.5px] border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveEdit}
            className="h-12 flex-1 cursor-pointer rounded-xl border-none bg-[var(--iv2-brand)] text-[15px] font-bold text-white"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {state.meds.map((m, i) => (
          <Card key={`${m.name}-${i}`} padded={false} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-[var(--iv2-text-primary)]">{m.name}</div>
                <div className="mt-0.5 truncate text-sm text-[var(--iv2-text-secondary)]">{m.dose ? `${m.dose} · ${m.frequency}` : m.detail}</div>
              </div>
              {/* Fixed-width action cluster (2 × 36px + gap) so every
                  medication row's icons line up in the same column
                  regardless of how long the name/dose text runs. */}
              <div className="flex w-[76px] shrink-0 justify-end gap-1">
                <IconActionButton icon="edit" label={`Edit ${m.name}`} onClick={() => startEdit(i)} />
                <IconActionButton icon="remove" label={`Remove ${m.name}`} tone="danger" onClick={() => remove(i)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      {!state.meds.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No medications on file.</div> : null}
      <TextAction onClick={() => update({ addSheet: "medications", addQuery: "", addPicks: [], addDetail: null })} className="block pt-4 text-base">
        + Add a medication
      </TextAction>
    </div>
  );
}

export function SurgeriesEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const remove = (i: number) => update((s) => ({ surgeries: s.surgeries.filter((_, j) => j !== i) }));
  const add = () => {
    if (!state.surgeryDraftName.trim()) return;
    update((s) => ({
      surgeries: [...s.surgeries, { name: s.surgeryDraftName.trim(), year: s.surgeryDraftYear.trim() || "Year unknown" }],
      surgeryDraftName: "",
      surgeryDraftYear: "",
    }));
  };

  return (
    <div>
      {state.surgeries.map((s, i) => (
        <ListRow key={`${s.name}-${i}`} title={`${s.name} · ${s.year}`} onRemove={() => remove(i)} />
      ))}
      {!state.surgeries.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No surgeries reported.</div> : null}
      <div className="mt-4 flex gap-2.5">
        <div className="flex-[1.4]">
          <InputField ariaLabel="Surgery name" placeholder="Appendectomy" value={state.surgeryDraftName} onChange={(v) => update({ surgeryDraftName: v })} />
        </div>
        <div className="flex-1">
          <InputField ariaLabel="Year" placeholder="2018" value={state.surgeryDraftYear} onChange={(v) => update({ surgeryDraftYear: v })} />
        </div>
      </div>
      <button
        type="button"
        onClick={add}
        disabled={!state.surgeryDraftName.trim()}
        className="mt-2.5 h-11 rounded-xl border-none px-4 text-[15px] font-bold"
        style={{
          backgroundColor: state.surgeryDraftName.trim() ? "var(--iv2-brand-tint)" : "var(--iv2-disabled-bg)",
          color: state.surgeryDraftName.trim() ? "var(--iv2-brand)" : "var(--iv2-disabled-fg)",
          cursor: state.surgeryDraftName.trim() ? "pointer" : "not-allowed",
        }}
      >
        + Add surgery
      </button>
    </div>
  );
}

export function AllergiesEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const remove = (i: number) => update((s) => ({ allergies: s.allergies.filter((_, j) => j !== i) }));

  return (
    <div>
      {state.allergies.map((a, i) => (
        <ListRow key={`${a.name}-${i}`} title={a.detail ? `${a.name} · ${a.detail}` : a.name} onRemove={() => remove(i)} />
      ))}
      {!state.allergies.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">No known allergies.</div> : null}
      <TextAction onClick={() => update({ addSheet: "allergies", addQuery: "", addPicks: [], addDetail: null })} className="block pt-4 text-base">
        + Add an allergy
      </TextAction>
    </div>
  );
}

export function FamilyEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const remove = (i: number) => update((s) => ({ familyHistory: s.familyHistory.filter((_, j) => j !== i) }));
  const add = () => {
    const v = state.familyDraft.trim();
    if (!v) return;
    update((s) => ({ familyHistory: [...s.familyHistory, v], familyDraft: "" }));
  };

  return (
    <div>
      {state.familyHistory.map((f, i) => (
        <ListRow key={`${f}-${i}`} title={f} onRemove={() => remove(i)} />
      ))}
      {!state.familyHistory.length ? <div className="py-2 text-base text-[var(--iv2-text-muted)]">None reported.</div> : null}
      <div className="mt-4 flex gap-2.5">
        <div className="flex-1">
          <InputField ariaLabel="Family history" placeholder="Diabetes (mother)" value={state.familyDraft} onChange={(v) => update({ familyDraft: v })} />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!state.familyDraft.trim()}
          className="h-13 shrink-0 rounded-xl border-none px-4 text-[15px] font-bold"
          style={{
            height: 52,
            backgroundColor: state.familyDraft.trim() ? "var(--iv2-brand-tint)" : "var(--iv2-disabled-bg)",
            color: state.familyDraft.trim() ? "var(--iv2-brand)" : "var(--iv2-disabled-fg)",
            cursor: state.familyDraft.trim() ? "pointer" : "not-allowed",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
