"use client";

import { Ctx } from "../../ctx";
import { AuthorizedPerson } from "../../types";
import { CloseCircleButton, Eyebrow, IconActionButton, InputField, RadioRow, Reveal, ScreenCopy, ScreenTitle, SelectField } from "../ui";

const ACCESS_OPTIONS = ["All health information", "Scheduling only", "Billing only", "Other"];

const EMPTY_DRAFT: AuthorizedPerson = { name: "", relationship: "", phone: "", access: "", otherSpecify: "" };

// Consent to Disclose — card-based, spec Part 1. Starts empty (never
// pre-filled with placeholder people) — "+ Add an authorized person"
// reveals one bordered card per person, same inline-panel pattern as
// Surgeries/Family history.
export function ConsentDiscloseScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const people = state.authorizedPersons;

  const openAdd = () => update({ authPersonAdding: true, authPersonEditingIndex: null, authPersonDraft: { ...EMPTY_DRAFT } });
  const startEdit = (i: number) => update({ authPersonEditingIndex: i, authPersonAdding: false, authPersonDraft: { ...people[i] } });
  const cancel = () => update({ authPersonAdding: false, authPersonEditingIndex: null, authPersonDraft: { ...EMPTY_DRAFT } });
  const remove = (i: number) => update((s) => ({ authorizedPersons: s.authorizedPersons.filter((_, j) => j !== i) }));

  const draft = state.authPersonDraft;
  const ready = draft.name.trim() && draft.relationship.trim() && draft.phone.trim() && draft.access && (draft.access !== "Other" || draft.otherSpecify.trim());

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
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Consent to disclose</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Do you consent to disclose your health information?</ScreenTitle>
      <ScreenCopy className="mb-6">To anyone besides the parent/guardian listed on this visit.</ScreenCopy>

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
          <div className="mb-3 text-sm font-bold text-[var(--iv2-text-primary)]">Authorized people</div>

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
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold text-[var(--iv2-text-primary)]">{p.name}</div>
                        <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">{p.relationship} · {p.phone}</div>
                        <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">
                          {p.access === "Other" ? p.otherSpecify : p.access}
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
              className="flex min-h-14 w-full cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-[var(--iv2-border-strong)] bg-white px-4 py-3.5 text-left"
            >
              <span className="text-lg leading-none font-bold text-[var(--iv2-brand)]">+</span>
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
    <Reveal className="rounded-2xl border-[1.5px] border-[var(--iv2-brand)] bg-white p-4">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-base font-bold text-[var(--iv2-text-primary)]">{mode === "edit" ? "Edit authorized person" : "Add authorized person"}</div>
        <CloseCircleButton onClick={onCancel} />
      </div>
      <div className="flex flex-col gap-3.5">
        <InputField label="Name" value={draft.name} onChange={(v) => setDraft({ name: v })} />
        <InputField label="Relationship" value={draft.relationship} placeholder="e.g. Grandmother" onChange={(v) => setDraft({ relationship: v })} />
        <InputField label="Phone number" value={draft.phone} placeholder="(555) 123-4567" inputMode="tel" onChange={(v) => setDraft({ phone: v })} />
        <SelectField
          label="Information they can access"
          value={draft.access}
          onChange={(v) => setDraft({ access: v })}
          options={ACCESS_OPTIONS}
          placeholder="Select"
        />
        {draft.access === "Other" ? (
          <Reveal>
            <InputField label="If other, specify" value={draft.otherSpecify} onChange={(v) => setDraft({ otherSpecify: v })} />
          </Reveal>
        ) : null}
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
          {mode === "edit" ? "Save changes" : "Add person"}
        </button>
      </div>
    </Reveal>
  );
}
