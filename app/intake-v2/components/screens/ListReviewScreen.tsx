"use client";

import { Ctx } from "../../ctx";
import { Eyebrow, ScreenCopy, ScreenTitle, TextAction } from "../ui";

// Screens 9/10 — Medications and Allergies. Same structural pattern, one
// component per README ("Same structural pattern, one per screen").
export function ListReviewScreen({ ctx, kind }: { ctx: Ctx; kind: "medications" | "allergies" }) {
  const { state, isRet, update } = ctx;
  const items = kind === "medications" ? state.meds : state.allergies;
  const editing = kind === "medications" ? state.medsEditing : state.allergiesEditing;
  const nounSingular = kind === "medications" ? "a medication" : "an allergy";
  const emptyText = kind === "medications" ? "No medications on file yet." : "No known allergies on file.";
  const nameColor = kind === "medications" ? "var(--iv2-text-primary)" : "var(--iv2-warning)";

  const title = editing
    ? isRet
      ? kind === "medications"
        ? "Update your medications"
        : "Update your allergies"
      : kind === "medications"
        ? "Any medications you take regularly?"
        : "Do you have any allergies?"
    : kind === "medications"
      ? "Your medications"
      : "Your allergies";

  const copy = editing
    ? kind === "medications"
      ? "Include prescriptions, inhalers and anything over-the-counter."
      : "Include medication, food and environmental allergies."
    : "Here's what we currently have on file.";

  const removeItem = (index: number) =>
    update((s) => {
      const list = kind === "medications" ? s.meds : s.allergies;
      const next = list.filter((_, i) => i !== index);
      return kind === "medications" ? { meds: next } : { allergies: next };
    });

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{kind === "medications" ? "Medications" : "Allergies"}</Eyebrow>
      <ScreenTitle className="mb-3.5 leading-[1.28]">{title}</ScreenTitle>
      <ScreenCopy className="mb-7">{copy}</ScreenCopy>

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {items.map((it, i) => (
            <div key={it.name} className="flex items-center justify-between gap-3 border-b border-[var(--iv2-border-subtle)] px-5 py-4.5">
              <div>
                <div className="text-[17px] font-semibold" style={{ color: nameColor }}>
                  {it.name}
                </div>
                <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">{it.detail}</div>
              </div>
              {editing ? (
                <TextAction onClick={() => removeItem(i)} className="text-[15px]">
                  Remove
                </TextAction>
              ) : null}
            </div>
          ))}
          <div className="px-5 py-4 text-sm text-[var(--iv2-text-muted)]">Last confirmed {state.lastConfirmed}</div>
        </div>
      ) : (
        <div className="text-[17px] text-[var(--iv2-text-primary)]">{emptyText}</div>
      )}

      {editing ? (
        <TextAction
          onClick={() => update({ addSheet: kind, addQuery: "", addPicks: [], addDetail: null })}
          className="pt-4.5 text-base"
        >
          + Add {nounSingular}
        </TextAction>
      ) : null}

      {!editing ? <div className="mt-8 text-xl font-bold text-[var(--iv2-text-primary)]">Has anything changed?</div> : null}
    </div>
  );
}
