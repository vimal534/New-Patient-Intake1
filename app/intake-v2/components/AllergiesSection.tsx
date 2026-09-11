"use client";

import { useState } from "react";
import { Ctx } from "../ctx";
import { ALLERGY_CATALOG, ALLERGY_DETAILS, ALLERGY_REACTIONS } from "../constants";
import { CatalogItem } from "../types";
import { BottomSheet, Checkbox22, NoneCheckRow, Reveal, SearchClearInput, SelectField, SelectedListSection, SeverityBadge, highlightMatch } from "./ui";

const CATALOG_VISIBLE = 4;
const SEARCH_MIN_CHARS = 2;

type Draft = { reaction: string; severity: string };
const EMPTY_DRAFT: Draft = { reaction: "", severity: "" };

// Allergies — same Health History common interaction pattern as
// MedicationsSection.tsx: checkbox rows (no "+"), live per-keystroke
// search with a Clear (×) button and bold match highlighting, a
// progressive Reaction/Severity panel under a checked row before it's
// actually added, and an exclusive "None" row that disables (and is
// disabled by) everything else in the section.
export function AllergiesSection({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const items = state.allergies;
  const none = state.allergiesNone;

  const [query, setQuery] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [draftName, setDraftName] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length >= SEARCH_MIN_CHARS;

  const have = items.map((i) => i.name);
  const available = ALLERGY_CATALOG.filter((n) => !have.includes(n));
  const commonVisible = showMore ? available : available.slice(0, CATALOG_VISIBLE);
  const commonHiddenCount = available.length - commonVisible.length;

  const searchMatches = searching ? available.filter((n) => n.toLowerCase().includes(trimmedQuery.toLowerCase())) : [];
  const customName = trimmedQuery;
  const customVisible = searching && !ALLERGY_CATALOG.some((n) => n.toLowerCase() === customName.toLowerCase()) && !have.includes(customName);

  const openPanel = (name: string) => {
    setEditingIndex(null);
    setExpandedKey(name);
    setDraftName(name);
    setDraft(EMPTY_DRAFT);
    setAttempted(false);
  };
  const closePanel = () => {
    setExpandedKey(null);
    setDraftName("");
    setDraft(EMPTY_DRAFT);
    setAttempted(false);
  };

  const startEdit = (i: number) => {
    const it = items[i];
    setExpandedKey(null);
    setEditingIndex(i);
    setDraftName(it.name);
    setDraft({ reaction: it.dose || "", severity: it.frequency || "" });
    setAttempted(false);
  };
  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft(EMPTY_DRAFT);
    setAttempted(false);
  };

  const draftValid = draft.reaction.trim().length > 0 && draft.severity.trim().length > 0;

  const confirmAdd = () => {
    if (!draftValid) {
      setAttempted(true);
      return;
    }
    const name = draftName.trim();
    if (!name) return;
    const detail = `Reaction: ${draft.reaction} · Severity: ${draft.severity}`;
    const item: CatalogItem = { name, detail, dose: draft.reaction, frequency: draft.severity };
    update((s) => (s.allergies.some((i) => i.name === name) ? {} : { allergies: [item, ...s.allergies], allergiesNone: false }));
    setQuery("");
    closePanel();
  };

  const confirmEdit = () => {
    if (!draftValid) {
      setAttempted(true);
      return;
    }
    if (editingIndex === null) return;
    const detail = `Reaction: ${draft.reaction} · Severity: ${draft.severity}`;
    update((s) => ({
      allergies: s.allergies.map((it, i) => (i === editingIndex ? { ...it, detail, dose: draft.reaction, frequency: draft.severity } : it)),
    }));
    cancelEdit();
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    update((s) => ({ allergies: s.allergies.filter((_, i) => i !== deleteIndex) }));
    setDeleteIndex(null);
  };

  const toggleNone = () => update((s) => ({ allergiesNone: !s.allergiesNone, allergies: s.allergiesNone ? s.allergies : [] }));

  const renderPanel = (mode: "add" | "edit") => (
    <Reveal className="border-t border-[var(--iv2-border)] bg-white p-4">
      <div>
        <SelectField
          label="What is your typical reaction to this allergy?"
          value={draft.reaction}
          onChange={(v) => setDraft((d) => ({ ...d, reaction: v }))}
          options={ALLERGY_REACTIONS}
          placeholder="Select reaction"
          tone={attempted && !draft.reaction ? "danger" : "default"}
        />
        {attempted && !draft.reaction ? <div className="mt-1 text-xs font-semibold text-[var(--iv2-danger)]">Reaction is required</div> : null}
      </div>
      <div className="mt-3.5">
        <SelectField
          label="How severe is the reaction?"
          value={draft.severity}
          onChange={(v) => setDraft((d) => ({ ...d, severity: v }))}
          options={ALLERGY_DETAILS}
          placeholder="Select severity"
          tone={attempted && !draft.severity ? "danger" : "default"}
        />
        {attempted && !draft.severity ? <div className="mt-1 text-xs font-semibold text-[var(--iv2-danger)]">Severity is required</div> : null}
      </div>
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
          label="Your allergies"
          noun="allergies"
          items={items.map((it, i) => ({
            key: `${it.name}-${i}`,
            forceVisible: editingIndex === i,
            node:
              editingIndex === i ? (
                <div className="overflow-hidden rounded-2xl border border-[var(--iv2-brand)]">
                  <div className="flex items-center justify-between gap-3 bg-white px-4 py-3.5">
                    <span className="truncate text-[15px] font-bold text-[var(--iv2-text-primary)]">{it.name}</span>
                  </div>
                  {renderPanel("edit")}
                </div>
              ) : (
                <div
                  className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4"
                  style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}
                >
                  <button type="button" onClick={() => setDeleteIndex(i)} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 border-none bg-transparent p-0 text-left">
                    <Checkbox22 checked />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{it.name}</div>
                        {it.frequency ? <SeverityBadge severity={it.frequency} /> : null}
                      </div>
                      {it.dose ? <div className="mt-0.5 truncate text-sm text-[var(--iv2-text-secondary)]">Reaction: {it.dose}</div> : null}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="shrink-0 cursor-pointer border-none bg-transparent text-sm font-bold text-[var(--iv2-brand)]"
                  >
                    Edit
                  </button>
                </div>
              ),
          }))}
        />
      ) : null}

      <div className={none ? "pointer-events-none opacity-40" : ""}>
        <div className="mb-2.5 text-sm font-bold text-[var(--iv2-text-primary)]">{items.length ? "Add another" : "Search or select allergy"}</div>

        <SearchClearInput value={query} onChange={setQuery} placeholder="Search by allergen name" disabled={none} />

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
        <NoneCheckRow label="I don't have any of these" checked={none} disabled={items.length > 0} onClick={toggleNone} />
      </div>

      <BottomSheet open={deleteIndex !== null} onClose={() => setDeleteIndex(null)} zIndex={75} maxHeight="none">
        <div className="mb-5 text-xl leading-[1.35] font-bold text-[var(--iv2-text-primary)]">
          Remove {deleteIndex !== null ? items[deleteIndex]?.name : ""} from your allergies?
        </div>
        <button
          type="button"
          onClick={() => setDeleteIndex(null)}
          className="h-[54px] w-full cursor-pointer rounded-2xl border-[1.5px] border-[var(--iv2-border)] bg-white text-base font-bold text-[var(--iv2-text-primary)]"
        >
          Keep it
        </button>
        <button
          type="button"
          onClick={confirmDelete}
          className="mt-2 h-[54px] w-full cursor-pointer rounded-2xl border-none bg-[var(--iv2-danger)] text-base font-bold text-white"
        >
          Remove
        </button>
      </BottomSheet>
    </div>
  );
}
