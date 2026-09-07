"use client";

import { useState } from "react";
import { CodedSearchSelectField } from "../../components/fields/CodedSearchSelect";
import { ChipField } from "../../components/fields/Chip";
import { AllergyIntoleranceDraft, CodedEntry } from "../../lib/data-source/types";
import { allergenSource, mockAllergyWriteSource } from "../../lib/data-source/mockAdapter";
import { Checkbox, PrimaryButton, SectionShell } from "@/app/tap-intake/components/ui";

const NOT_SURE = "Not sure";
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe", NOT_SURE];

type Severity = "mild" | "moderate" | "severe" | null;

function toSeverity(label: string | null): Severity {
  if (label === "Mild") return "mild";
  if (label === "Moderate") return "moderate";
  if (label === "Severe") return "severe";
  return null; // "Not sure" or unset
}

type AllergyEntry = {
  localId: string;
  allergenId: string;
  allergenName: string;
  allergenDetail: string;
  reaction: string | null; // null = "Not sure"
  severityLabel: string; // kept as the chip label so editing re-selects the right chip; "mild"/"moderate"/"severe"/null resolved at save time
  // The full matched entry, kept so editEntry can restore the real
  // reaction option list — reconstructing a bare {id,name,detail} would
  // silently drop `reactions` and leave only "Not sure" selectable on edit.
  codedEntry: CodedEntry;
};

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `alg-${localIdCounter}`;
}

// Same coded-search-select + editable-list pattern as Medications — the
// difference this module cares about is severity, not dose/frequency.
export function AllergiesModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (allergies: AllergyIntoleranceDraft[]) => void;
}) {
  const [noneKnown, setNoneKnown] = useState(false);
  const [entries, setEntries] = useState<AllergyEntry[]>([]);
  const [pending, setPending] = useState<CodedEntry | null>(null);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);
  const [pendingSeverity, setPendingSeverity] = useState<string | null>(null);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startAdd(entry: CodedEntry) {
    setPending(entry);
    setPendingReaction(null);
    setPendingSeverity(null);
    setEditingLocalId(null);
  }

  function cancelAdd() {
    setPending(null);
    setPendingReaction(null);
    setPendingSeverity(null);
    setEditingLocalId(null);
  }

  function commitAdd() {
    if (!pending || !pendingSeverity) return;
    const entry: AllergyEntry = {
      localId: editingLocalId ?? nextLocalId(),
      allergenId: pending.id,
      allergenName: pending.name,
      allergenDetail: pending.detail,
      reaction: pendingReaction === NOT_SURE ? null : pendingReaction,
      severityLabel: pendingSeverity,
      codedEntry: pending,
    };
    setEntries((prev) => {
      if (editingLocalId) return prev.map((e) => (e.localId === editingLocalId ? entry : e));
      return [...prev, entry];
    });
    cancelAdd();
  }

  function editEntry(entry: AllergyEntry) {
    setPending(entry.codedEntry);
    setPendingReaction(entry.reaction ?? NOT_SURE);
    setPendingSeverity(entry.severityLabel);
    setEditingLocalId(entry.localId);
  }

  function deleteEntry(localId: string) {
    setEntries((prev) => prev.filter((e) => e.localId !== localId));
  }

  async function handleContinue() {
    setSaving(true);
    const allergies: AllergyIntoleranceDraft[] = entries.map((e) => ({
      allergenId: e.allergenId,
      allergenName: e.allergenName,
      reaction: e.reaction,
      severity: toSeverity(e.severityLabel === NOT_SURE ? null : e.severityLabel),
    }));
    await mockAllergyWriteSource.saveAllergies(patientId, allergies);
    setSaving(false);
    onComplete(allergies);
  }

  const canContinue = noneKnown || entries.length > 0;

  return (
    <SectionShell status="active" title="Allergies">
      <div className="text-sm text-[var(--color-muted)]">
        Include drug, food, and environmental allergies — anything that&apos;s caused a reaction.
      </div>

      <Checkbox
        label="No known allergies"
        checked={noneKnown}
        onChange={(checked) => {
          setNoneKnown(checked);
          if (checked) {
            setEntries([]);
            cancelAdd();
          }
        }}
      />

      {!noneKnown ? (
        <>
          {entries.length > 0 ? (
            <div className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
              {entries.map((entry) => (
                <div key={entry.localId} className="flex items-start justify-between gap-3 p-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-ink)]">{entry.allergenName}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {entry.reaction ?? "Reaction not sure"} · Severity: {entry.severityLabel === NOT_SURE ? "Not sure" : entry.severityLabel}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3 text-sm font-medium">
                    <button type="button" onClick={() => editEntry(entry)} className="cursor-pointer text-[var(--color-brand)]">
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteEntry(entry.localId)} className="cursor-pointer text-red-500">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-background)] p-3">
            {!pending ? (
              <CodedSearchSelectField
                label={entries.length > 0 ? "Add another allergy" : "Search for an allergy"}
                placeholder="e.g. Penicillin, Peanuts"
                source={allergenSource}
                onSelect={startAdd}
              />
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-ink)]">{pending.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{pending.detail}</div>
                  </div>
                  <button type="button" onClick={cancelAdd} className="cursor-pointer text-sm font-medium text-[var(--color-brand)]">
                    Change
                  </button>
                </div>

                <div className="space-y-4">
                  <ChipField
                    label="Reaction"
                    options={[...(pending.reactions ?? []), NOT_SURE].map((r) => ({ value: r, label: r }))}
                    value={pendingReaction ? [pendingReaction] : []}
                    onChange={(v) => setPendingReaction(v[0] ?? null)}
                    multi={false}
                  />
                  <ChipField
                    label="How severe?"
                    options={SEVERITY_OPTIONS.map((s) => ({ value: s, label: s }))}
                    value={pendingSeverity ? [pendingSeverity] : []}
                    onChange={(v) => setPendingSeverity(v[0] ?? null)}
                    multi={false}
                  />

                  <PrimaryButton disabled={!pendingSeverity} onClick={commitAdd}>
                    {editingLocalId ? "Save changes" : "Add to list"}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
