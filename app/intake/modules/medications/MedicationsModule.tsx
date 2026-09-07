"use client";

import { useState } from "react";
import { CodedSearchSelectField } from "../../components/fields/CodedSearchSelect";
import { ChipField } from "../../components/fields/Chip";
import { CodedEntry, MedicationStatementDraft } from "../../lib/data-source/types";
import { medicationSource, mockMedicationWriteSource } from "../../lib/data-source/mockAdapter";
import { evaluateCondition } from "../../lib/schema/conditions";
import { AnswerState } from "../../lib/schema/types";
import { Checkbox, PrimaryButton, SectionShell, TextField } from "@/app/tap-intake/components/ui";

const NOT_SURE = "Not sure";

type MedicationEntry = {
  localId: string;
  medicationId: string;
  medicationName: string;
  medicationDetail: string;
  dose: string | null; // null = "Not sure"
  frequency: string | null;
  note: string;
  // The full matched entry, kept so editEntry can restore the real
  // dose/frequency option lists — reconstructing a bare {id,name,detail}
  // would silently drop `doses`/`frequencies` and leave only "Not sure"
  // selectable on edit.
  codedEntry: CodedEntry;
};

// The "reveal a note field when either dose or frequency is Not sure" rule
// below is the real, working example of the conditional-field engine —
// evaluated through the same `evaluateCondition`/`ConditionGroup` shared
// types every module's field-level conditions use, not a bespoke
// if-statement local to this component.
const NOTE_CONDITION = {
  any: [
    { sourceField: "dose", equals: NOT_SURE },
    { sourceField: "frequency", equals: NOT_SURE },
  ],
};

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `med-${localIdCounter}`;
}

// Reuses tap-intake's own SectionShell/PrimaryButton/Checkbox/TextField —
// this is the same card/chip/button visual system as the rest of the app,
// not a parallel design. Only the field-type components (ChipField,
// CodedSearchSelectField) are this module's own — they're the reusable,
// schema-driven library from Phase 2, shared across every future module.
export function MedicationsModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  onComplete: (meds: MedicationStatementDraft[]) => void;
}) {
  const [noMeds, setNoMeds] = useState(false);
  const [entries, setEntries] = useState<MedicationEntry[]>([]);
  const [pending, setPending] = useState<CodedEntry | null>(null);
  const [pendingDose, setPendingDose] = useState<string | null>(null);
  const [pendingFrequency, setPendingFrequency] = useState<string | null>(null);
  const [pendingNote, setPendingNote] = useState("");
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pendingAnswers: AnswerState = { dose: pendingDose ?? undefined, frequency: pendingFrequency ?? undefined };
  const showNoteField = evaluateCondition(NOTE_CONDITION, pendingAnswers);

  function startAdd(entry: CodedEntry) {
    setPending(entry);
    setPendingDose(null);
    setPendingFrequency(null);
    setPendingNote("");
    setEditingLocalId(null);
  }

  function cancelAdd() {
    setPending(null);
    setPendingDose(null);
    setPendingFrequency(null);
    setPendingNote("");
    setEditingLocalId(null);
  }

  function commitAdd() {
    if (!pending || !pendingDose || !pendingFrequency) return;
    const entry: MedicationEntry = {
      localId: editingLocalId ?? nextLocalId(),
      medicationId: pending.id,
      medicationName: pending.name,
      medicationDetail: pending.detail,
      dose: pendingDose === NOT_SURE ? null : pendingDose,
      frequency: pendingFrequency === NOT_SURE ? null : pendingFrequency,
      note: pendingNote.trim(),
      codedEntry: pending,
    };
    setEntries((prev) => {
      if (editingLocalId) return prev.map((e) => (e.localId === editingLocalId ? entry : e));
      return [...prev, entry];
    });
    cancelAdd();
  }

  function editEntry(entry: MedicationEntry) {
    setPending(entry.codedEntry);
    setPendingDose(entry.dose ?? NOT_SURE);
    setPendingFrequency(entry.frequency ?? NOT_SURE);
    setPendingNote(entry.note);
    setEditingLocalId(entry.localId);
  }

  function deleteEntry(localId: string) {
    setEntries((prev) => prev.filter((e) => e.localId !== localId));
  }

  async function handleContinue() {
    setSaving(true);
    const meds: MedicationStatementDraft[] = entries.map((e) => ({
      medicationId: e.medicationId,
      medicationName: e.medicationName,
      dose: e.dose,
      frequency: e.frequency,
      note: e.note || undefined,
    }));
    await mockMedicationWriteSource.saveMedications(patientId, meds);
    setSaving(false);
    onComplete(meds);
  }

  const canContinue = noMeds || entries.length > 0;

  return (
    <SectionShell status="active" title="Medications">
      <div className="text-sm text-[var(--color-muted)]">
        Add anything Ana takes regularly, including over-the-counter and vitamins.
      </div>

      <Checkbox
        label="Not currently taking any medications"
        checked={noMeds}
        onChange={(checked) => {
          setNoMeds(checked);
          if (checked) {
            setEntries([]);
            cancelAdd();
          }
        }}
      />

      {!noMeds ? (
        <>
          {entries.length > 0 ? (
            <div className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
              {entries.map((entry) => (
                <div key={entry.localId} className="flex items-start justify-between gap-3 p-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-ink)]">{entry.medicationName}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {entry.dose ?? "Dose not sure"} · {entry.frequency ?? "Frequency not sure"}
                    </div>
                    {entry.note ? (
                      <div className="mt-1 text-xs italic text-[var(--color-muted)]">&ldquo;{entry.note}&rdquo;</div>
                    ) : null}
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
                label={entries.length > 0 ? "Add another medication" : "Search for a medication"}
                placeholder="e.g. Amoxicillin"
                source={medicationSource}
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
                    label="Dose"
                    options={[...(pending.doses ?? []), NOT_SURE].map((d) => ({ value: d, label: d }))}
                    value={pendingDose ? [pendingDose] : []}
                    onChange={(v) => setPendingDose(v[0] ?? null)}
                    multi={false}
                  />
                  <ChipField
                    label="How often"
                    options={[...(pending.frequencies ?? []), NOT_SURE].map((f) => ({ value: f, label: f }))}
                    value={pendingFrequency ? [pendingFrequency] : []}
                    onChange={(v) => setPendingFrequency(v[0] ?? null)}
                    multi={false}
                  />

                  {showNoteField ? (
                    <TextField
                      label="Anything you can tell us about it? (optional)"
                      value={pendingNote}
                      onChange={setPendingNote}
                      placeholder="e.g. a small white pill, taken in the morning"
                    />
                  ) : null}

                  <PrimaryButton disabled={!pendingDose || !pendingFrequency} onClick={commitAdd}>
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
