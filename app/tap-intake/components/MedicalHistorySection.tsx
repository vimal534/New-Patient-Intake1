"use client";

import { useEffect, useRef, useState } from "react";
import { useVisit } from "../state";
import { MEDICAL_CATEGORY_LABELS, MEDICAL_CATEGORY_OPTIONS } from "../questionBank";
import { MedicalCategoryKey, MEDICAL_CATEGORY_KEYS } from "../types";
import { ON_FILE_RECORD, formatUpdatedDate } from "../mockData";
import { Chip, PrimaryButton, TextLink } from "./ui";
import { MedicationChipInput, SimpleChipInput } from "./MedicalHistoryChips";

// One combined "Health History" section — was two (Medical History +
// Family History) until a reference design showed them merged into a
// single screen. Family history is still just a 6th MEDICAL_CATEGORY_KEY
// (see types.ts), stored as plain "Label — Relative" strings through the
// same detail[cat]/SET_MEDICAL_DETAIL mechanism every other category uses.
//
// UX direction (same reasoning as AboutYouScreen's redesign — see its own
// comment): the patient is already verified and returning patients'
// medical history is already pulled from the record, so re-asking them to
// individually confirm/re-enter it is exactly the friction to avoid. This
// used to be a two-step flow — a "Still accurate?" gate (its own
// StepHeader, Nothing/Something-changed buttons) before a free-text +
// category-chip editor. Now it's ONE view: on-file items show directly as
// a plain read list with an "Edit" link (not asked to be individually
// blessed), whatever's been added beyond that shows as its own "Anything
// new?" chip list (each removable inline), and a single Continue —
// no gate, no per-item confirmation, no special step header (this section
// now uses the regular ProgressSummary top slot like any other section).
// "Edit" and "+ Add a condition" both open the same category picker
// (Allergies/Medications/.../Family history chips -> SimpleChipInput or
// MedicationChipInput) that already existed — corrections and new
// additions go through the identical, still fully-capable flow (search,
// dose/frequency for medications, camera-scan mock), just tucked behind
// one toggle instead of being the first thing on screen.
export function MedicalHistorySection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const isReturning = state.patientType === "returning";
  const { detail } = state.medicalHistory;

  const seededRef = useRef(false);
  useEffect(() => {
    if (!isReturning || seededRef.current) return;
    seededRef.current = true;
    const onFile = ON_FILE_RECORD.medicalHistory;
    dispatch({ type: "SET_MEDICAL_DETAIL", category: "allergies", values: onFile.allergies });
    dispatch({ type: "SET_MEDICAL_DETAIL", category: "medications", values: onFile.medications });
    dispatch({ type: "SET_MEDICAL_DETAIL", category: "conditions", values: onFile.conditions });
    dispatch({ type: "SET_MEDICAL_DETAIL", category: "surgeries", values: onFile.surgeries });
    dispatch({ type: "SET_MEDICAL_DETAIL", category: "hospitalizations", values: onFile.hospitalizations });
    dispatch({
      type: "SET_MEDICAL_DETAIL",
      category: "familyHistory",
      values: ON_FILE_RECORD.familyHistory.map((f) => `${f.label} — ${f.relative ?? "relative"}`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReturning]);

  // The static on-file baseline, per category — what's already known
  // going in, never what the guardian just added this visit. Comparing
  // against this (not some separate "confirmed" flag) is what lets a
  // single detail[cat] array serve both the read-only "on file" list and
  // the editable "anything new" list without a parallel data structure.
  const baseline: Record<MedicalCategoryKey, string[]> = isReturning
    ? {
        allergies: ON_FILE_RECORD.medicalHistory.allergies,
        medications: ON_FILE_RECORD.medicalHistory.medications,
        conditions: ON_FILE_RECORD.medicalHistory.conditions,
        surgeries: ON_FILE_RECORD.medicalHistory.surgeries,
        hospitalizations: ON_FILE_RECORD.medicalHistory.hospitalizations,
        familyHistory: ON_FILE_RECORD.familyHistory.map((f) => `${f.label} — ${f.relative ?? "relative"}`),
      }
    : { allergies: [], medications: [], conditions: [], surgeries: [], hospitalizations: [], familyHistory: [] };

  const onFileItems = MEDICAL_CATEGORY_KEYS.flatMap((cat) => baseline[cat]);
  const newItems: { cat: MedicalCategoryKey; value: string }[] = MEDICAL_CATEGORY_KEYS.flatMap((cat) =>
    detail[cat].filter((v) => !baseline[cat].includes(v)).map((value) => ({ cat, value }))
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MedicalCategoryKey | null>(null);
  const [noneToReport, setNoneToReport] = useState(false);

  const hasAnyEntries = MEDICAL_CATEGORY_KEYS.some((k) => detail[k].length > 0);
  const canContinue = noneToReport || hasAnyEntries;

  function toggleCategory(cat: MedicalCategoryKey) {
    setNoneToReport(false);
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }

  function setCategoryValues(cat: MedicalCategoryKey, values: string[]) {
    setNoneToReport(false);
    dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values });
  }

  function removeItem(cat: MedicalCategoryKey, value: string) {
    dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values: detail[cat].filter((v) => v !== value) });
  }

  function handleNoneToReport() {
    setNoneToReport(true);
    setActiveCategory(null);
    setEditorOpen(false);
    MEDICAL_CATEGORY_KEYS.forEach((cat) => dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values: [] }));
  }

  return (
    <>
      <div className="text-sm font-semibold text-ink">
        {isReturning ? "Here's what we have on file" : "Tell us about your child's health history"}
      </div>

      {onFileItems.length > 0 ? (
        <div className="rounded-lg bg-background p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-sm text-ink">
              {onFileItems.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
            <TextLink onClick={() => setEditorOpen((v) => !v)}>Edit</TextLink>
          </div>
          {/* "Show the age" — a concrete date gives a reason to actually
              read the list above instead of trusting a silent prefill.
              Deliberately not used to hide anything here (unlike
              AboutYouScreen's per-card suppression) — see
              medicalHistoryUpdatedAt's own comment in mockData.ts for why
              clinical facts stay visible regardless of how recently
              they were reviewed. */}
          <div className="mt-2 text-xs text-muted">Updated {formatUpdatedDate(ON_FILE_RECORD.medicalHistoryUpdatedAt)}</div>
        </div>
      ) : null}

      <div className="text-sm font-semibold text-ink">Anything new?</div>

      {newItems.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {newItems.map(({ cat, value }) => (
            <span
              key={`${cat}-${value}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-background px-3 py-2 text-sm font-medium text-ink"
            >
              {value}
              <button
                type="button"
                onClick={() => removeItem(cat, value)}
                aria-label={`Remove ${value}`}
                className="cursor-pointer text-muted"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setEditorOpen((v) => !v)}
        className="min-h-[44px] w-full cursor-pointer rounded-full border border-dashed border-line-strong px-4 text-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand"
      >
        + Add a condition
      </button>

      {editorOpen ? (
        <div className="space-y-3 rounded-xl border border-line p-3">
          <div className="flex flex-wrap gap-2">
            {MEDICAL_CATEGORY_KEYS.map((cat) => (
              <Chip
                key={cat}
                label={MEDICAL_CATEGORY_LABELS[cat] + (detail[cat].length > 0 && activeCategory !== cat ? ` (${detail[cat].length})` : "")}
                selected={activeCategory === cat}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
          {activeCategory ? (
            activeCategory === "medications" ? (
              <MedicationChipInput
                initialFormatted={detail.medications}
                onChange={(values) => setCategoryValues("medications", values)}
              />
            ) : (
              <SimpleChipInput
                suggestions={MEDICAL_CATEGORY_OPTIONS[activeCategory]}
                values={detail[activeCategory]}
                onChange={(values) => setCategoryValues(activeCategory, values)}
                placeholder={`Search ${MEDICAL_CATEGORY_LABELS[activeCategory].toLowerCase()}`}
              />
            )
          ) : (
            <div className="text-xs text-muted">Pick a category above to search or add.</div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleNoneToReport}
        className={[
          "min-h-[44px] w-full cursor-pointer rounded-full border border-dashed px-4 text-sm font-medium transition-colors",
          noneToReport ? "border-brand bg-brand/10 text-brand" : "border-line-strong text-muted",
        ].join(" ")}
      >
        Nothing to report — I&apos;m healthy
      </button>

      <PrimaryButton
        disabled={!canContinue}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "medicalHistory" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
      {isReturning ? <p className="text-center text-xs text-muted">If everything looks right, just continue.</p> : null}
    </>
  );
}
