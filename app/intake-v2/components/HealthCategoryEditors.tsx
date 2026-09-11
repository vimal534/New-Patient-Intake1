"use client";

import { useState } from "react";
import { Ctx } from "../ctx";
import { FAMILY_RELATIONSHIPS, SURGERY_CATALOG, COMMON_CONDS, MORE_CONDS } from "../constants";
import { SurgeryItem, SurgeryOccurrence } from "../types";
import { AllergiesSection } from "./AllergiesSection";
import { ConditionAddSection } from "./ConditionAddSection";
import { MedicationsSection } from "./MedicationsSection";
import { Checkbox22, NoneCheckRow, Reveal, SearchClearInput, SelectField, SelectedListSection, highlightMatch } from "./ui";

const FAMILY_COND_CATALOG = [...COMMON_CONDS, ...MORE_CONDS];
const CATALOG_VISIBLE = 4;
const SEARCH_MIN_CHARS = 2;

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
// once a patient taps a category card (returning-patient path), and
// directly by each category's own screen for new patients. All five
// share one common interaction pattern (see ui.tsx's CatalogCheckRow/
// NoneCheckRow/SearchClearInput/highlightMatch): checkbox rows, no "+"
// icon, live per-keystroke search with a Clear button, bold match
// highlighting, progressive detail reveal for items that need
// follow-up info, and an exclusive "None" row.

export function ConditionsEditor({ ctx }: { ctx: Ctx }) {
  return <ConditionAddSection ctx={ctx} showNoneOption />;
}

export function MedicationsEditor({ ctx }: { ctx: Ctx }) {
  return <MedicationsSection ctx={ctx} />;
}

export function AllergiesEditor({ ctx }: { ctx: Ctx }) {
  return <AllergiesSection ctx={ctx} />;
}

export function SurgeriesEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const items = state.surgeries;
  const none = state.surgeriesNone;
  const have = items.map((i) => i.name);

  const [query, setQuery] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftOccurrences, setDraftOccurrences] = useState<SurgeryOccurrence[]>([{ ...BLANK_OCCURRENCE }]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length >= SEARCH_MIN_CHARS;

  const available = SURGERY_CATALOG.filter((n) => !have.includes(n));
  const commonVisible = showMore ? available : available.slice(0, CATALOG_VISIBLE);
  const commonHiddenCount = available.length - commonVisible.length;
  const searchMatches = searching ? available.filter((n) => n.toLowerCase().includes(trimmedQuery.toLowerCase())) : [];

  const customName = trimmedQuery;
  const customVisible = searching && !SURGERY_CATALOG.some((n) => n.toLowerCase() === customName.toLowerCase()) && !have.includes(customName);

  const openPanel = (name: string) => {
    setEditingIndex(null);
    setExpandedKey(name);
    setDraftName(name);
    setDraftOccurrences([{ ...BLANK_OCCURRENCE }]);
  };
  const closePanel = () => {
    setExpandedKey(null);
    setDraftName("");
    setDraftOccurrences([{ ...BLANK_OCCURRENCE }]);
  };
  const startEdit = (i: number) => {
    const it = items[i];
    setExpandedKey(null);
    setEditingIndex(i);
    setDraftName(it.name);
    setDraftOccurrences(it.occurrences.length ? it.occurrences.map((o) => ({ ...o })) : [{ ...BLANK_OCCURRENCE }]);
  };
  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftName("");
    setDraftOccurrences([{ ...BLANK_OCCURRENCE }]);
  };

  const confirmAdd = () => {
    const name = draftName.trim();
    if (!name) return;
    update((s) => (s.surgeries.some((i) => i.name === name) ? {} : { surgeries: [{ name, occurrences: draftOccurrences }, ...s.surgeries], surgeriesNone: false }));
    setQuery("");
    closePanel();
  };
  const confirmEdit = () => {
    const name = draftName.trim();
    if (!name || editingIndex === null) return;
    update((s) => ({ surgeries: s.surgeries.map((it, i) => (i === editingIndex ? { name, occurrences: draftOccurrences } : it)) }));
    cancelEdit();
  };
  const confirmDelete = () => {
    if (deleteIndex === null) return;
    update((s) => ({ surgeries: s.surgeries.filter((_, i) => i !== deleteIndex) }));
    setDeleteIndex(null);
  };
  const toggleNone = () => update((s) => ({ surgeriesNone: !s.surgeriesNone, surgeries: s.surgeriesNone ? s.surgeries : [] }));

  const updateOcc = (i: number, patch: Partial<SurgeryOccurrence>) => setDraftOccurrences((occs) => occs.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const addOcc = () => setDraftOccurrences((occs) => [...occs, { ...BLANK_OCCURRENCE }]);
  const removeOcc = (i: number) => setDraftOccurrences((occs) => occs.filter((_, j) => j !== i));

  const occurrenceLabel = (i: number) => {
    if (draftOccurrences.length <= 1) return "Date of surgery";
    const ordinal = ORDINALS[i] || `${i + 1}th`;
    const noun = draftName.trim() ? draftName.trim().toLowerCase() : "surgery";
    return `${ordinal} ${noun}`;
  };

  const renderPanel = (mode: "add" | "edit") => (
    <Reveal className="border-t border-[var(--iv2-border)] bg-white p-4">
      <div className="mb-1 text-[15px] font-bold text-[var(--iv2-text-primary)]">When did it happen?</div>
      <div className="mb-3 text-[13px] text-[var(--iv2-text-secondary)]">Choose what you remember. The year alone is fine.</div>
      <div className="flex flex-col gap-3">
        {draftOccurrences.map((occ, i) => (
          <div key={i} className="rounded-xl border border-[var(--iv2-border)] bg-white p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)] text-[11px] font-bold text-[var(--iv2-brand)]">
                  {i + 1}
                </span>
                <span className="truncate text-[14px] font-semibold text-[var(--iv2-text-primary)]">{occurrenceLabel(i)}</span>
              </div>
              {draftOccurrences.length > 1 ? (
                <button type="button" onClick={() => removeOcc(i)} className="cursor-pointer border-none bg-transparent text-sm font-bold text-[var(--iv2-danger)]">
                  Remove
                </button>
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
        + {draftOccurrences.length > 1 ? "Add another date" : "I had this surgery more than once"}
      </button>
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={mode === "add" ? closePanel : cancelEdit}
          className="h-12 flex-1 cursor-pointer rounded-xl border-[1.5px] border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={mode === "add" ? confirmAdd : confirmEdit}
          className="h-12 flex-1 cursor-pointer rounded-xl border-none bg-[var(--iv2-brand)] text-[15px] font-bold text-white"
        >
          {mode === "edit" ? "Save changes" : "Confirm"}
        </button>
      </div>
    </Reveal>
  );

  const renderRow = (name: string) => {
    const expanded = expandedKey === name;
    return (
      <div key={name} className={`overflow-hidden rounded-2xl border transition-colors ${expanded ? "border-[var(--iv2-brand)]" : "border-[var(--iv2-border)]"}`}>
        <button
          type="button"
          onClick={() => (expanded ? closePanel() : openPanel(name))}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 bg-white px-4 py-3.5 text-left hover:border-[var(--iv2-brand)]"
        >
          <Checkbox22 checked={expanded} />
          <span className="truncate text-[15px] font-semibold" style={{ color: expanded ? "var(--iv2-brand)" : "var(--iv2-text-primary)" }}>
            {highlightMatch(name, trimmedQuery)}
          </span>
        </button>
        {expanded ? renderPanel("add") : null}
      </div>
    );
  };

  const renderCustomRow = () => {
    const expanded = expandedKey === customName;
    return (
      <div className={`overflow-hidden rounded-2xl border transition-colors ${expanded ? "border-[var(--iv2-brand)]" : "border-dashed border-[var(--iv2-border-strong)]"}`}>
        <button
          type="button"
          onClick={() => (expanded ? closePanel() : openPanel(customName))}
          className="flex min-h-14 w-full cursor-pointer items-center gap-2 bg-white px-4 py-3.5 text-left"
        >
          <Checkbox22 checked={expanded} />
          <span className="truncate text-[15px] font-semibold text-[var(--iv2-brand)]">Add &ldquo;{customName}&rdquo;</span>
        </button>
        {expanded ? renderPanel("add") : null}
      </div>
    );
  };

  return (
    <div>
      {items.length > 0 ? (
        <SelectedListSection
          label="Your surgeries"
          noun="surgeries"
          items={items.map((it, i) => {
            if (editingIndex === i) {
              return {
                key: `${it.name}-edit`,
                forceVisible: true,
                node: (
                  <div className="overflow-hidden rounded-2xl border border-[var(--iv2-brand)]">
                    <div className="flex items-center justify-between gap-3 bg-white px-4 py-3.5">
                      <span className="truncate text-[15px] font-bold text-[var(--iv2-text-primary)]">{it.name}</span>
                    </div>
                    {renderPanel("edit")}
                  </div>
                ),
              };
            }
            const sorted = sortOccurrences(it.occurrences);
            return {
              key: `${it.name}-${i}`,
              node: (
                <div className="rounded-2xl border-[1.5px] p-4" style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteIndex(i)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left"
                    >
                      <Checkbox22 checked />
                      <span className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{it.name}</span>
                      {sorted.length > 1 ? (
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[12px] font-bold text-[var(--iv2-brand)]">{sorted.length} times</span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="shrink-0 cursor-pointer border-none bg-transparent text-sm font-bold text-[var(--iv2-brand)]"
                    >
                      Edit
                    </button>
                  </div>
                  {sorted.length ? (
                    <div className="mt-2.5 ml-9 flex flex-col gap-1.5">
                      {sorted.map((occ, j) => {
                        const f = formatOccurrence(occ);
                        return (
                          <div key={j} className="flex items-center gap-2">
                            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[var(--iv2-brand)]">
                              {j + 1}
                            </span>
                            <span className={`text-sm ${f.unknown ? "text-[var(--iv2-text-muted)]" : "text-[var(--iv2-text-primary)]"}`}>{f.text}</span>
                            {f.approximate ? <span className="text-[12px] text-[var(--iv2-text-muted)]">approximate</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ),
            };
          })}
        />
      ) : null}

      <div className={none ? "pointer-events-none opacity-40" : ""}>
        <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">{items.length ? "Add another" : "Search or select surgery"}</div>
        <SearchClearInput value={query} onChange={setQuery} placeholder="Search by surgery name" disabled={none} />

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
            <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Commonly used</div>
            <div className="flex flex-col gap-2.5">{commonVisible.map(renderRow)}</div>
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

      <div className="mt-3.5">
        <NoneCheckRow label="I haven't had any of these" checked={none} disabled={items.length > 0} onClick={toggleNone} />
      </div>

      <BottomSheetLike open={deleteIndex !== null} onClose={() => setDeleteIndex(null)} onConfirm={confirmDelete} name={deleteIndex !== null ? items[deleteIndex]?.name : ""} noun="surgeries" />
    </div>
  );
}

// Family history entries are stored as one combined "Condition (Rel1,
// Rel2)" string — split back apart for editing.
function parseFamilyEntry(entry: string): { condition: string; relations: string[] } {
  const match = entry.match(/^(.+) \((.+)\)$/);
  return match ? { condition: match[1], relations: match[2].split(", ") } : { condition: entry, relations: [] };
}

export function FamilyEditor({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const items = state.familyHistory;
  const none = state.familyNone;

  const [query, setQuery] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftCondition, setDraftCondition] = useState("");
  const [draftRelations, setDraftRelations] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length >= SEARCH_MIN_CHARS;

  // Unlike medications/surgeries, the same condition can legitimately
  // recur for a different relative — the catalog never excludes
  // already-added conditions.
  const commonVisible = showMore ? FAMILY_COND_CATALOG : FAMILY_COND_CATALOG.slice(0, CATALOG_VISIBLE);
  const commonHiddenCount = FAMILY_COND_CATALOG.length - commonVisible.length;
  const searchMatches = searching ? FAMILY_COND_CATALOG.filter((n) => n.toLowerCase().includes(trimmedQuery.toLowerCase())) : [];
  const customName = trimmedQuery;
  const customVisible = searching && !FAMILY_COND_CATALOG.some((n) => n.toLowerCase() === customName.toLowerCase());

  const openPanel = (condition: string) => {
    setEditingIndex(null);
    setExpandedKey(condition);
    setDraftCondition(condition);
    setDraftRelations([]);
    setAttempted(false);
  };
  const closePanel = () => {
    setExpandedKey(null);
    setDraftCondition("");
    setDraftRelations([]);
    setAttempted(false);
  };
  const startEdit = (i: number) => {
    const { condition, relations } = parseFamilyEntry(items[i]);
    setExpandedKey(null);
    setEditingIndex(i);
    setDraftCondition(condition);
    setDraftRelations(relations);
    setAttempted(false);
  };
  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftCondition("");
    setDraftRelations([]);
    setAttempted(false);
  };

  const toggleRelation = (name: string) =>
    setDraftRelations((rs) => (rs.includes(name) ? rs.filter((r) => r !== name) : [...rs, name]));

  const draftValid = draftCondition.trim().length > 0 && draftRelations.length > 0;

  const confirmAdd = () => {
    if (!draftValid) {
      setAttempted(true);
      return;
    }
    const entry = `${draftCondition.trim()} (${draftRelations.join(", ")})`;
    update((s) => ({ familyHistory: [entry, ...s.familyHistory], familyNone: false }));
    setQuery("");
    closePanel();
  };
  const confirmEdit = () => {
    if (!draftValid || editingIndex === null) {
      setAttempted(true);
      return;
    }
    const entry = `${draftCondition.trim()} (${draftRelations.join(", ")})`;
    update((s) => ({ familyHistory: s.familyHistory.map((f, i) => (i === editingIndex ? entry : f)) }));
    cancelEdit();
  };
  const confirmDelete = () => {
    if (deleteIndex === null) return;
    update((s) => ({ familyHistory: s.familyHistory.filter((_, i) => i !== deleteIndex) }));
    setDeleteIndex(null);
  };
  const toggleNone = () => update((s) => ({ familyNone: !s.familyNone, familyHistory: s.familyNone ? s.familyHistory : [] }));

  const renderPanel = (mode: "add" | "edit") => (
    <Reveal className="border-t border-[var(--iv2-border)] bg-white p-4">
      <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">
        Who in your family has this condition? <span className="text-[var(--iv2-danger)]">*</span>
      </div>
      <div className={`max-h-[220px] overflow-y-auto rounded-xl border bg-white ${attempted && !draftRelations.length ? "border-[var(--iv2-danger)]" : "border-[var(--iv2-border)]"}`}>
        {FAMILY_RELATIONSHIPS.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => toggleRelation(name)}
            className={`flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2.5 text-left ${
              i > 0 ? "border-t border-[var(--iv2-border-subtle)]" : ""
            }`}
          >
            <Checkbox22 checked={draftRelations.includes(name)} />
            <span className="text-[15px] text-[var(--iv2-text-primary)]">{name}</span>
          </button>
        ))}
      </div>
      {attempted && !draftRelations.length ? <div className="mt-1 text-xs font-semibold text-[var(--iv2-danger)]">Select at least one relative</div> : null}
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={mode === "add" ? closePanel : cancelEdit}
          className="h-12 flex-1 cursor-pointer rounded-xl border-[1.5px] border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={mode === "add" ? confirmAdd : confirmEdit}
          className="h-12 flex-1 cursor-pointer rounded-xl border-none bg-[var(--iv2-brand)] text-[15px] font-bold text-white"
        >
          {mode === "edit" ? "Save changes" : "Confirm"}
        </button>
      </div>
    </Reveal>
  );

  const renderRow = (name: string) => {
    const expanded = expandedKey === name;
    return (
      <div key={name} className={`overflow-hidden rounded-2xl border transition-colors ${expanded ? "border-[var(--iv2-brand)]" : "border-[var(--iv2-border)]"}`}>
        <button
          type="button"
          onClick={() => (expanded ? closePanel() : openPanel(name))}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 bg-white px-4 py-3.5 text-left hover:border-[var(--iv2-brand)]"
        >
          <Checkbox22 checked={expanded} />
          <span className="truncate text-[15px] font-semibold" style={{ color: expanded ? "var(--iv2-brand)" : "var(--iv2-text-primary)" }}>
            {highlightMatch(name, trimmedQuery)}
          </span>
        </button>
        {expanded ? renderPanel("add") : null}
      </div>
    );
  };

  const renderCustomRow = () => {
    const expanded = expandedKey === customName;
    return (
      <div className={`overflow-hidden rounded-2xl border transition-colors ${expanded ? "border-[var(--iv2-brand)]" : "border-dashed border-[var(--iv2-border-strong)]"}`}>
        <button
          type="button"
          onClick={() => (expanded ? closePanel() : openPanel(customName))}
          className="flex min-h-14 w-full cursor-pointer items-center gap-2 bg-white px-4 py-3.5 text-left"
        >
          <Checkbox22 checked={expanded} />
          <span className="truncate text-[15px] font-semibold text-[var(--iv2-brand)]">Add &ldquo;{customName}&rdquo;</span>
        </button>
        {expanded ? renderPanel("add") : null}
      </div>
    );
  };

  return (
    <div>
      {items.length > 0 ? (
        <SelectedListSection
          label="Your family's medical conditions"
          noun="conditions"
          items={items.map((f, i) => ({
            key: `${f}-${i}`,
            forceVisible: editingIndex === i,
            node:
              editingIndex === i ? (
                <div className="overflow-hidden rounded-2xl border border-[var(--iv2-brand)]">
                  <div className="flex items-center justify-between gap-3 bg-white px-4 py-3.5">
                    <span className="truncate text-[15px] font-bold text-[var(--iv2-text-primary)]">{parseFamilyEntry(f).condition}</span>
                  </div>
                  {renderPanel("edit")}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4" style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}>
                  <button type="button" onClick={() => setDeleteIndex(i)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left">
                    <Checkbox22 checked />
                    <span className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{f}</span>
                  </button>
                  <button type="button" onClick={() => startEdit(i)} className="shrink-0 cursor-pointer border-none bg-transparent text-sm font-bold text-[var(--iv2-brand)]">
                    Edit
                  </button>
                </div>
              ),
          }))}
        />
      ) : null}

      <div className={none ? "pointer-events-none opacity-40" : ""}>
        <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">{items.length ? "Add another" : "Search or select condition"}</div>
        <SearchClearInput value={query} onChange={setQuery} placeholder="Search by condition name" disabled={none} />

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
            <div className="mt-4 mb-2.5 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Commonly used</div>
            <div className="flex flex-col gap-2.5">{commonVisible.map(renderRow)}</div>
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

      <div className="mt-3.5">
        <NoneCheckRow label="None of these apply" checked={none} disabled={items.length > 0} onClick={toggleNone} />
      </div>

      <BottomSheetLike open={deleteIndex !== null} onClose={() => setDeleteIndex(null)} onConfirm={confirmDelete} name={deleteIndex !== null ? items[deleteIndex] : ""} noun="family history" />
    </div>
  );
}

// Small inline delete-confirmation sheet shared by Surgeries and
// Family — same shape as MedicationsSection/AllergiesSection's local
// BottomSheet, factored out here since both entries carry meaningful
// entered detail (dates, relationships) worth confirming before losing.
function BottomSheetLike({
  open,
  onClose,
  onConfirm,
  name,
  noun,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name?: string;
  noun: string;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[75] flex flex-col justify-end bg-[rgba(16,24,40,0.4)]" onClick={onClose}>
      <div className="flex flex-col rounded-t-[24px] bg-white px-5 pt-3 pb-[30px]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-[5px] w-11 shrink-0 rounded-full bg-[var(--iv2-border)]" />
        <div className="mb-5 text-xl leading-[1.35] font-bold text-[var(--iv2-text-primary)]">
          Remove {name} from your {noun}?
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-[54px] w-full cursor-pointer rounded-2xl border-[1.5px] border-[var(--iv2-border)] bg-white text-base font-bold text-[var(--iv2-text-primary)]"
        >
          Keep it
        </button>
        <button type="button" onClick={onConfirm} className="mt-2 h-[54px] w-full cursor-pointer rounded-2xl border-none bg-[var(--iv2-danger)] text-base font-bold text-white">
          Remove
        </button>
      </div>
    </div>
  );
}
