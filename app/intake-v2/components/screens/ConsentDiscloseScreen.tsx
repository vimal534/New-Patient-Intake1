"use client";

import { Ctx } from "../../ctx";
import { EMERGENCY_RELATIONSHIP_OPTIONS } from "../../constants";
import { ShieldUserIcon } from "../Icons";
import { PhoneField } from "../SmartField";
import { AuthorizedPerson } from "../../types";
import { Button, CloseCircleButton, IconActionButton, InputField, OptionRow, RadioRow, Reveal, ScreenCopy, ScreenTitle } from "../ui";

const EMPTY_DRAFT: AuthorizedPerson = { name: "", relationship: "", phone: "" };

// First + last initial ("Grandma Rose" → "GR") for the authorized-
// person avatar — falls back to just the first letter for a
// single-word name. Same convention as PatientConfirmScreen's.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Consent to Disclose — card-based, spec Part 1. Starts empty (never
// pre-filled with placeholder people) — "+ Add an authorized person"
// reveals one bordered card per person, same inline-panel pattern as
// Surgeries/Family history. Redesigned pass: a icon-led intro (instead
// of a bare title/copy pair) so the ask reads at a glance, tightened
// copy throughout, and initials-avatar rows for saved people so the
// list scans the same way Steps 1-2's own patient/guardian cards do,
// rather than three lines of plain text per row.
export function ConsentDiscloseScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const people = state.authorizedPersons;
  const firstName = state.scheduling.patientName.split(" ")[0] || "the patient";

  const openAdd = () => update({ authPersonAdding: true, authPersonEditingIndex: null, authPersonDraft: { ...EMPTY_DRAFT } });
  const startEdit = (i: number) => update({ authPersonEditingIndex: i, authPersonAdding: false, authPersonDraft: { ...people[i] } });
  const cancel = () => update({ authPersonAdding: false, authPersonEditingIndex: null, authPersonDraft: { ...EMPTY_DRAFT } });
  const remove = (i: number) => update((s) => ({ authorizedPersons: s.authorizedPersons.filter((_, j) => j !== i) }));

  const draft = state.authPersonDraft;
  const ready = draft.name.trim() && draft.relationship.trim() && draft.phone.trim();

  const confirmAdd = () => {
    if (!ready) return;
    update((s) => ({ authorizedPersons: [...s.authorizedPersons, s.authPersonDraft], authPersonAdding: false, authPersonDraft: { ...EMPTY_DRAFT } }));
  };
  const confirmEdit = () => {
    if (!ready || state.authPersonEditingIndex === null) return;
    update((s) => ({
      authorizedPersons: s.authorizedPersons.map((p, i) => (i === s.authPersonEditingIndex ? s.authPersonDraft : p)),
      authPersonEditingIndex: null,
      authPersonDraft: { ...EMPTY_DRAFT },
    }));
  };

  const setDraft = (patch: Partial<AuthorizedPerson>) => update((s) => ({ authPersonDraft: { ...s.authPersonDraft, ...patch } }));

  return (
    <div className="px-6 pt-5 pb-6">

      <div className="mb-6 flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--iv2-brand-tint)]">
          <ShieldUserIcon size={24} />
        </span>
        <div className="pt-0.5">
          <ScreenTitle className="mb-1 leading-[1.28]">Share {firstName}&apos;s info with others?</ScreenTitle>
          <ScreenCopy>Beyond the guardian on this visit.</ScreenCopy>
        </div>
      </div>

      <div className="mb-7 flex flex-col gap-2.5">
        {["Yes", "No"].map((opt) => (
          <RadioRow
            key={opt}
            label={opt}
            selected={state.consentDiscloseYes === (opt === "Yes")}
            onClick={() => update({ consentDiscloseYes: opt === "Yes" })}
          />
        ))}
      </div>

      {state.consentDiscloseYes ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--iv2-text-primary)]">Authorized people</div>
            {people.length ? <div className="text-sm font-semibold text-[var(--iv2-success)]">{people.length} added</div> : null}
          </div>

          {people.length ? (
            <div className="mb-3.5 flex flex-col gap-2.5">
              {people.map((p, i) =>
                state.authPersonEditingIndex === i ? (
                  <AuthPersonPanel key={`${p.name}-edit`} draft={draft} setDraft={setDraft} mode="edit" onCancel={cancel} onConfirm={confirmEdit} ready={!!ready} />
                ) : (
                  <div
                    key={`${p.name}-${i}`}
                    className="rounded-2xl border-[1.5px] p-4"
                    style={{ borderColor: "var(--iv2-brand)", backgroundColor: "var(--iv2-brand-surface)" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-surface)] text-[15px] font-bold text-[var(--iv2-brand)]">
                          {initialsOf(p.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{p.name}</div>
                          <div className="mt-0.5 truncate text-sm text-[var(--iv2-text-secondary)]">{p.relationship} · {p.phone}</div>
                        </div>
                      </div>
                      <div className="flex w-[76px] shrink-0 justify-end gap-1">
                        <IconActionButton icon="edit" label={`Edit ${p.name}`} onClick={() => startEdit(i)} />
                        <IconActionButton icon="remove" label={`Remove ${p.name}`} tone="danger" onClick={() => remove(i)} />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : null}

          {state.authPersonAdding ? (
            <AuthPersonPanel draft={draft} setDraft={setDraft} mode="add" onCancel={cancel} onConfirm={confirmAdd} ready={!!ready} />
          ) : (
            <button
              type="button"
              onClick={openAdd}
              className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[var(--iv2-border-strong)] bg-[var(--iv2-surface)] px-4 py-3.5 text-left transition-colors hover:border-[var(--iv2-brand)] hover:bg-[var(--iv2-brand-surface)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)] text-base leading-none font-bold text-[var(--iv2-brand)]">
                +
              </span>
              <span className="text-[15px] font-semibold text-[var(--iv2-brand)]">Add an authorized person</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AuthPersonPanel({
  draft,
  setDraft,
  mode,
  onCancel,
  onConfirm,
  ready,
}: {
  draft: AuthorizedPerson;
  setDraft: (patch: Partial<AuthorizedPerson>) => void;
  mode: "add" | "edit";
  onCancel: () => void;
  onConfirm: () => void;
  ready: boolean;
}) {
  return (
    <Reveal className="rounded-2xl border-[1.5px] border-[var(--iv2-brand)] bg-[var(--iv2-surface)] p-4">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-base font-bold text-[var(--iv2-text-primary)]">{mode === "edit" ? "Edit authorized person" : "Add authorized person"}</div>
        <CloseCircleButton onClick={onCancel} />
      </div>
      <div className="flex flex-col gap-3.5">
        <InputField label="Name" value={draft.name} onChange={(v) => setDraft({ name: v })} />
        <OptionRow label="Relationship" value={draft.relationship} options={EMERGENCY_RELATIONSHIP_OPTIONS} onChange={(v) => setDraft({ relationship: v })} />
        <PhoneField label="Phone number" value={draft.phone} onChange={(v) => setDraft({ phone: v })} />
      </div>
      <div className="mt-4 flex gap-2.5">
        <Button variant="secondary" size="sm" onClick={onCancel} className="h-12 flex-1">
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={!ready} className="h-12 flex-1">
          {mode === "edit" ? "Save changes" : "Add person"}
        </Button>
      </div>
    </Reveal>
  );
}
