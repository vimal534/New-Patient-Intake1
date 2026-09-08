"use client";

import { Ctx } from "../ctx";
import { COMMON_CONDS, FAMILY_RELATIONSHIPS, MORE_CONDS, SURGERY_CATALOG } from "../constants";
import { SurgeryItem, SurgeryOccurrence } from "../types";
import { ConditionAddSection } from "./ConditionAddSection";
import { MedAllergyAddSection } from "./MedAllergyAddSection";
import { Checkbox22, CloseCircleButton, IconActionButton, InputField, SelectField } from "./ui";

const FAMILY_COND_CATALOG = [...COMMON_CONDS, ...MORE_CONDS];
const CATALOG_VISIBLE = 5;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
// Static range (not derived from `new Date()`) so server and client
// render the exact same list — a surgery date has no reason to reach
// into the future, and going back 110 years covers any patient alive
// today.
const SURGERY_YEARS = Array.from({ length: 111 }, (_, i) => String(2030 - i));
const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
const BLANK_OCCURRENCE: SurgeryOccurrence = { month: "", day: "", year: "" };

// A surgery date is entered with whatever precision the patient
// actually remembers — full date, month + year, year alone, or nothing
// at all ("that's okay, you can still save"). These two helpers turn a
// partial SurgeryOccurrence into copy: `formatOccurrence` for the saved
// summary card, `occurrenceHint` for the live feedback line under the
// Month/Day/Year row while it's being entered.
function formatOccurrence(o: SurgeryOccurrence): { text: string; approximate: boolean; unknown: boolean } {
  if (!o.year) return { text: "Date not known", approximate: false, unknown: true };
  if (o.month && o.day) return { text: `${o.month} ${o.day}, ${o.year}`, approximate: false, unknown: false };
  if (o.month) return { text: `${o.month} ${o.year}`, approximate: true, unknown: false };
  return { text: o.year, approximate: true, unknown: false };
}

function occurrenceHint(o: SurgeryOccurrence): string {
  if (o.month && o.day && o.year) return `${o.month} ${o.day}, ${o.year}`;
  if (o.month && o.year) return `${o.month} ${o.year}. Add a day if you remember it.`;
  if (o.year) return `Around ${o.year}. Add a month if you remember one.`;
  return "No date chosen. That's okay, you can still save.";
}

// Oldest first, for the saved summary card. Occurrences with no year at
// all sort to the end (nothing to order them by) rather than to the
// front — a "Date not known" entry isn't necessarily the earliest one.
function sortOccurrences(occurrences: SurgeryOccurrence[]): SurgeryOccurrence[] {
  const key = (o: SurgeryOccurrence) => (o.year ? Number(o.year) * 372 + (MONTHS.indexOf(o.month) + 1) * 31 + Number(o.day || 0) : Infinity);
  return [...occurrences].sort((a, b) => key(a) - key(b));
}

// One line for HealthScreen.tsx's summary CategoryCard.
export function formatSurgeryLine(item: SurgeryItem): string {
  const count = item.occurrences.length;
  if (count <= 1) return count === 1 ? `${item.name} · ${formatOccurrence(item.occurrences[0]).text}` : item.name;
  return `${item.name} · ${count} times`;
}

// The actual add/remove/edit UI for each of the five Health History
// categories — rendered inline by HealthScreen.tsx's CategoryFocusPage
// once a patient taps a category card. These used to live inside a
// bottom sheet (HealthCategorySheet.tsx); now that each category is its
// own focused page rather than a sheet over the summary, the bodies
// moved here, and the page's sticky Footer (via footerFor's
// hhEditing/hhMode branch in page.tsx) owns the single "Save changes"
// action instead of a sheet-local Done button.
//
// All five share the exact same catalog-search-inline-panel pattern
// (see MedAllergyAddSection.tsx and ConditionAddSection.tsx): a search
// box sits above its own close-by results, common items list below with
// a "+" row each, tapping "+" expands that row into an inline Add panel
// (Date-of-surgery for Surgeries, a relationship checklist for Family),
// and confirming lands the new entry at the top of its own list — no
// dropdown `<select>`, no bottom sheet.

export function ConditionsEditor({ ctx }: { ctx: Ctx }) {
  return <ConditionAddSection ctx={ctx} />;
}

export function MedicationsEditor({ ctx }: { ctx: Ctx }) {
  return <MedAllergyAddSection ctx={ctx} kind="medications" />;
}

export function AllergiesEditor({ ctx }: { ctx: Ctx }) {
  return <MedAllergyAddSection ctx={ctx} kind="allergies" />;
}

// Bordered "Your X" row shared by Surgeries and Family — same visual as
// a medication/condition row (brand-tinted card + edit/remove icons).
function EntryRow({ title, onEdit, onRemove }: { title: string; onEdit: () => void; onRemove: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4"
      style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}
    >
      <div className="min-w-0 truncate text-base font-bold text-[var(--iv2-text-primary)]">{title}</div>
      <div className="flex w-[76px] shrink-0 justify-end gap-1">
        <IconActionButton icon="edit" label={`Edit ${title}`} onClick={onEdit} />
        <IconActionButton icon="remove" label={`Remove ${title}`} tone="danger" onClick={onRemove} />
      </div>
    </div>
  );
}

// A catalog/search "+" row — identical shape across Medications,
// Allergies, Conditions, Surgeries and Family.
function CatalogRow({ name, onOpen }: { name: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--iv2-border)] bg-white px-4 py-3.5 text-left hover:border-[var(--iv2-brand)]"
    >
      <span className="truncate text-[15px] font-semibold text-[var(--iv2-text-primary)]">{name}</span>
      <span className="shrink-0 text-xl leading-none font-bold text-[var(--iv2-success)]">+</span>
    </button>
  );
}

export function SurgeriesEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const items = state.surgeries;
  const have = items.map((i) => i.name);
  const q = state.surgeryQuery.trim().toLowerCase();
  const searching = q.length >= 2;

  const available = SURGERY_CATALOG.filter((n) => !have.includes(n));
  const commonVisibleCount = state.surgeryCatalogShowMore ? available.length : Math.min(CATALOG_VISIBLE, available.length);
  const commonVisible = available.slice(0, commonVisibleCount);
  const commonHiddenCount = available.length - commonVisible.length;
  const searchMatches = searching ? available.filter((n) => n.toLowerCase().includes(q)) : [];

  const customName = state.surgeryQuery.trim();
  const customVisible = searching && !SURGERY_CATALOG.some((n) => n.toLowerCase() === customName.toLowerCase()) && !have.includes(customName);

  const resetDraft = () => ({ surgeryDraftName: "", surgeryDraftOccurrences: [{ ...BLANK_OCCURRENCE }] });
  const openPanel = (name: string) => update({ surgeryExpandedName: name, surgeryEditingIndex: null, surgeryDraftName: name, surgeryDraftOccurrences: [{ ...BLANK_OCCURRENCE }] });
  const startEdit = (i: number) => {
    const it = items[i];
    update({
      surgeryEditingIndex: i,
      surgeryExpandedName: null,
      surgeryDraftName: it.name,
      surgeryDraftOccurrences: it.occurrences.length ? it.occurrences.map((o) => ({ ...o })) : [{ ...BLANK_OCCURRENCE }],
    });
  };
  const cancelPanel = () => update({ surgeryExpandedName: null, surgeryEditingIndex: null, ...resetDraft() });
  const remove = (i: number) => update((s) => ({ surgeries: s.surgeries.filter((_, j) => j !== i) }));

  const confirmAdd = () => {
    const name = state.surgeryDraftName.trim();
    if (!name) return;
    // New entries land at the top, same as medications/conditions.
    update((s) => (s.surgeries.some((i) => i.name === name) ? {} : { surgeries: [{ name, occurrences: state.surgeryDraftOccurrences }, ...s.surgeries] }));
    update({ surgeryExpandedName: null, surgeryQuery: "", ...resetDraft() });
  };
  const confirmEdit = () => {
    const name = state.surgeryDraftName.trim();
    if (!name || state.surgeryEditingIndex === null) return;
    update((s) => ({ surgeries: s.surgeries.map((it, i) => (i === s.surgeryEditingIndex ? { name, occurrences: state.surgeryDraftOccurrences } : it)) }));
    update({ surgeryEditingIndex: null, ...resetDraft() });
  };

  const renderRow = (name: string) =>
    state.surgeryExpandedName === name ? (
      <SurgeryPanel key={name} ctx={ctx} mode="add" onCancel={cancelPanel} onConfirm={confirmAdd} />
    ) : (
      <CatalogRow key={name} name={name} onOpen={() => openPanel(name)} />
    );

  return (
    <div>
      {items.length > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--iv2-text-primary)]">Your surgeries</div>
            <div className="text-sm font-semibold text-[var(--iv2-success)]">{items.length} added</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {items.map((it, i) =>
              state.surgeryEditingIndex === i ? (
                <SurgeryPanel key={`${it.name}-edit`} ctx={ctx} mode="edit" onCancel={cancelPanel} onConfirm={confirmEdit} />
              ) : (
                <SurgeryCard key={`${it.name}-${i}`} item={it} onEdit={() => startEdit(i)} onRemove={() => remove(i)} />
              )
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 text-base text-[var(--iv2-text-muted)]">No surgeries reported.</div>
      )}

      <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">{items.length ? "Add another surgery" : "Search or select a surgery"}</div>
      <InputField ariaLabel="Search" placeholder="Search by surgery name..." value={state.surgeryQuery} onChange={(v) => update({ surgeryQuery: v })} />

      {searching ? (
        <div className="mt-2.5 max-h-[280px] overflow-y-auto">
          <div className="flex flex-col gap-2.5 pr-0.5">
            {searchMatches.map(renderRow)}
            {customVisible ? (
              state.surgeryExpandedName === customName ? (
                <SurgeryPanel key="custom" ctx={ctx} mode="add" onCancel={cancelPanel} onConfirm={confirmAdd} />
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
              )
            ) : null}
            {!searchMatches.length && !customVisible ? (
              <div className="py-2 text-[15px] text-[var(--iv2-text-muted)]">No matches for &ldquo;{customName}&rdquo;.</div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Common surgeries</div>
          <div className="flex flex-col gap-2.5">{commonVisible.map(renderRow)}</div>
          {commonHiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => update({ surgeryCatalogShowMore: true })}
              className="mt-2.5 flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
            >
              Show more surgeries ({commonHiddenCount})
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

// Saved-summary card — one per surgery TYPE, an occurrence-count badge
// once there's more than one, and a numbered oldest-first list of dates
// underneath (partial dates tagged "approximate", no date at all shown
// as "Date not known").
function SurgeryCard({ item, onEdit, onRemove }: { item: SurgeryItem; onEdit: () => void; onRemove: () => void }) {
  const sorted = sortOccurrences(item.occurrences);
  return (
    <div className="rounded-2xl border-[1.5px] p-4" style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{item.name}</span>
          {sorted.length > 1 ? (
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[12px] font-bold text-[var(--iv2-brand)]">{sorted.length} times</span>
          ) : null}
        </div>
        <div className="flex w-[76px] shrink-0 justify-end gap-1">
          <IconActionButton icon="edit" label={`Edit ${item.name}`} onClick={onEdit} />
          <IconActionButton icon="remove" label={`Remove ${item.name}`} tone="danger" onClick={onRemove} />
        </div>
      </div>
      {sorted.length ? (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {sorted.map((occ, i) => {
            const f = formatOccurrence(occ);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[var(--iv2-brand)]">
                  {i + 1}
                </span>
                <span className={`text-sm ${f.unknown ? "text-[var(--iv2-text-muted)]" : "text-[var(--iv2-text-primary)]"}`}>{f.text}</span>
                {f.approximate ? <span className="text-[12px] text-[var(--iv2-text-muted)]">approximate</span> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SurgeryPanel({ ctx, mode, onCancel, onConfirm }: { ctx: Ctx; mode: "add" | "edit"; onCancel: () => void; onConfirm: () => void }) {
  const { state, update } = ctx;
  const occurrences = state.surgeryDraftOccurrences;
  const ready = state.surgeryDraftName.trim().length > 0;

  const updateOcc = (i: number, patch: Partial<SurgeryOccurrence>) =>
    update((s) => ({ surgeryDraftOccurrences: s.surgeryDraftOccurrences.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
  const addOcc = () => update((s) => ({ surgeryDraftOccurrences: [...s.surgeryDraftOccurrences, { ...BLANK_OCCURRENCE }] }));
  const removeOcc = (i: number) => update((s) => ({ surgeryDraftOccurrences: s.surgeryDraftOccurrences.filter((_, j) => j !== i) }));

  const occurrenceLabel = (i: number) => {
    if (occurrences.length <= 1) return "Date of surgery";
    const ordinal = ORDINALS[i] || `${i + 1}th`;
    const noun = state.surgeryDraftName.trim() ? state.surgeryDraftName.trim().toLowerCase() : "surgery";
    return `${ordinal} ${noun}`;
  };

  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--iv2-brand)] bg-white p-4">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-base font-bold text-[var(--iv2-text-primary)]">{mode === "edit" ? "Edit surgery" : "Add a surgery"}</div>
        <CloseCircleButton onClick={onCancel} />
      </div>
      <InputField label="Surgery type" value={state.surgeryDraftName} onChange={(v) => update({ surgeryDraftName: v })} />

      <div className="mt-3.5 mb-1 text-[15px] font-bold text-[var(--iv2-text-primary)]">When did it happen?</div>
      <div className="mb-3 text-[13px] text-[var(--iv2-text-secondary)]">Choose what you remember — the year alone is fine.</div>

      <div className="flex flex-col gap-3">
        {occurrences.map((occ, i) => (
          <div key={i} className="rounded-xl border border-[var(--iv2-border)] p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)] text-[11px] font-bold text-[var(--iv2-brand)]">
                  {i + 1}
                </span>
                <span className="truncate text-[14px] font-semibold text-[var(--iv2-text-primary)]">{occurrenceLabel(i)}</span>
              </div>
              {occurrences.length > 1 ? (
                <IconActionButton icon="remove" label={`Remove occurrence ${i + 1}`} tone="danger" onClick={() => removeOcc(i)} />
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <SelectField ariaLabel="Month" value={occ.month} onChange={(v) => updateOcc(i, { month: v })} options={MONTHS} placeholder="Month" />
              <SelectField ariaLabel="Day" value={occ.day} onChange={(v) => updateOcc(i, { day: v })} options={DAYS} placeholder="Day" />
              <SelectField ariaLabel="Year" value={occ.year} onChange={(v) => updateOcc(i, { year: v })} options={SURGERY_YEARS} placeholder="Year" />
            </div>
            <div className="mt-2 text-[13px] font-semibold text-[var(--iv2-success)]">{occurrenceHint(occ)}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOcc}
        className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--iv2-border-strong)] bg-white text-[15px] font-semibold text-[var(--iv2-brand)]"
      >
        + {occurrences.length > 1 ? "Add another date" : "I had this surgery more than once"}
      </button>

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
          {mode === "edit" ? "Save changes" : "Save surgery"}
        </button>
      </div>
    </div>
  );
}

// Family history entries are stored as one combined "Condition (Rel1,
// Rel2)" string (FamilyEditor below) — split back apart for editing.
function parseFamilyEntry(entry: string): { condition: string; relations: string[] } {
  const match = entry.match(/^(.+) \((.+)\)$/);
  return match ? { condition: match[1], relations: match[2].split(", ") } : { condition: entry, relations: [] };
}

export function FamilyEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const items = state.familyHistory;
  const q = state.familyQuery.trim().toLowerCase();
  const searching = q.length >= 2;

  // Unlike medications/surgeries, the same condition can legitimately
  // recur for a different relative — the catalog never excludes
  // already-added conditions.
  const commonVisibleCount = state.familyCatalogShowMore ? FAMILY_COND_CATALOG.length : Math.min(CATALOG_VISIBLE, FAMILY_COND_CATALOG.length);
  const commonVisible = FAMILY_COND_CATALOG.slice(0, commonVisibleCount);
  const commonHiddenCount = FAMILY_COND_CATALOG.length - commonVisible.length;
  const searchMatches = searching ? FAMILY_COND_CATALOG.filter((n) => n.toLowerCase().includes(q)) : [];

  const customName = state.familyQuery.trim();
  const customVisible = searching && !FAMILY_COND_CATALOG.some((n) => n.toLowerCase() === customName.toLowerCase());

  const resetDraft = () => ({ familyDraftCondition: "", familyDraftRelations: [] as string[] });
  const openPanel = (condition: string) => update({ familyExpandedCondition: condition, familyEditingIndex: null, familyDraftCondition: condition, familyDraftRelations: [] });
  const startEdit = (i: number) => {
    const { condition, relations } = parseFamilyEntry(items[i]);
    update({ familyEditingIndex: i, familyExpandedCondition: null, familyDraftCondition: condition, familyDraftRelations: relations });
  };
  const cancelPanel = () => update({ familyExpandedCondition: null, familyEditingIndex: null, ...resetDraft() });
  const remove = (i: number) => update((s) => ({ familyHistory: s.familyHistory.filter((_, j) => j !== i) }));

  const confirmAdd = () => {
    const condition = state.familyDraftCondition.trim();
    if (!condition || !state.familyDraftRelations.length) return;
    const entry = `${condition} (${state.familyDraftRelations.join(", ")})`;
    update((s) => ({ familyHistory: [entry, ...s.familyHistory] }));
    update({ familyExpandedCondition: null, familyQuery: "", ...resetDraft() });
  };
  const confirmEdit = () => {
    const condition = state.familyDraftCondition.trim();
    if (!condition || !state.familyDraftRelations.length || state.familyEditingIndex === null) return;
    const entry = `${condition} (${state.familyDraftRelations.join(", ")})`;
    update((s) => ({ familyHistory: s.familyHistory.map((f, i) => (i === s.familyEditingIndex ? entry : f)) }));
    update({ familyEditingIndex: null, ...resetDraft() });
  };

  const renderRow = (name: string) =>
    state.familyExpandedCondition === name ? (
      <FamilyPanel key={name} ctx={ctx} mode="add" onCancel={cancelPanel} onConfirm={confirmAdd} />
    ) : (
      <CatalogRow key={name} name={name} onOpen={() => openPanel(name)} />
    );

  return (
    <div>
      {items.length > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--iv2-text-primary)]">Your family&apos;s medical conditions</div>
            <div className="text-sm font-semibold text-[var(--iv2-success)]">{items.length} added</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {items.map((f, i) =>
              state.familyEditingIndex === i ? (
                <FamilyPanel key={`${f}-edit`} ctx={ctx} mode="edit" onCancel={cancelPanel} onConfirm={confirmEdit} />
              ) : (
                <EntryRow key={`${f}-${i}`} title={f} onEdit={() => startEdit(i)} onRemove={() => remove(i)} />
              )
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 text-base text-[var(--iv2-text-muted)]">None reported.</div>
      )}

      <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">
        {items.length ? "Add another condition" : "Search or select a condition"}
      </div>
      <InputField ariaLabel="Search" placeholder="Search by condition name..." value={state.familyQuery} onChange={(v) => update({ familyQuery: v })} />

      {searching ? (
        <div className="mt-2.5 max-h-[280px] overflow-y-auto">
          <div className="flex flex-col gap-2.5 pr-0.5">
            {searchMatches.map(renderRow)}
            {customVisible ? (
              state.familyExpandedCondition === customName ? (
                <FamilyPanel key="custom" ctx={ctx} mode="add" onCancel={cancelPanel} onConfirm={confirmAdd} />
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
              )
            ) : null}
            {!searchMatches.length && !customVisible ? (
              <div className="py-2 text-[15px] text-[var(--iv2-text-muted)]">No matches for &ldquo;{customName}&rdquo;.</div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Common conditions</div>
          <div className="flex flex-col gap-2.5">{commonVisible.map(renderRow)}</div>
          {commonHiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => update({ familyCatalogShowMore: true })}
              className="mt-2.5 flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
            >
              Show more conditions ({commonHiddenCount})
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function FamilyPanel({ ctx, mode, onCancel, onConfirm }: { ctx: Ctx; mode: "add" | "edit"; onCancel: () => void; onConfirm: () => void }) {
  const { state, update } = ctx;
  const toggleRelation = (name: string) =>
    update((s) => ({
      familyDraftRelations: s.familyDraftRelations.includes(name)
        ? s.familyDraftRelations.filter((r) => r !== name)
        : [...s.familyDraftRelations, name],
    }));
  const ready = state.familyDraftCondition.trim().length > 0 && state.familyDraftRelations.length > 0;

  return (
    <div className="rounded-2xl border-[1.5px] border-[var(--iv2-brand)] bg-white p-4">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-base font-bold text-[var(--iv2-text-primary)]">{mode === "edit" ? "Edit family history" : "Add family history"}</div>
        <CloseCircleButton onClick={onCancel} />
      </div>
      <div className="flex flex-col gap-3.5">
        <InputField label="Medical condition" value={state.familyDraftCondition} onChange={(v) => update({ familyDraftCondition: v })} />
        <div>
          <div className="mb-1.5 text-sm text-[var(--iv2-text-muted)]">
            Who in your family has this condition? <span className="text-[var(--iv2-danger)]">*</span>
          </div>
          <div className="max-h-[220px] overflow-y-auto rounded-xl border border-[var(--iv2-border)]">
            {FAMILY_RELATIONSHIPS.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => toggleRelation(name)}
                className={`flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2.5 text-left ${
                  i > 0 ? "border-t border-[var(--iv2-border-subtle)]" : ""
                }`}
              >
                <Checkbox22 checked={state.familyDraftRelations.includes(name)} />
                <span className="text-[15px] text-[var(--iv2-text-primary)]">{name}</span>
              </button>
            ))}
          </div>
        </div>
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
          {mode === "edit" ? "Save changes" : "Add"}
        </button>
      </div>
    </div>
  );
}
