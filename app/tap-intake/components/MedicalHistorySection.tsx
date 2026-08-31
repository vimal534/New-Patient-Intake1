"use client";

import { useEffect, useRef, useState } from "react";
import { useVisit } from "../state";
import { MEDICAL_CATEGORY_LABELS, MEDICAL_CATEGORY_OPTIONS } from "../questionBank";
import { MedicalCategoryKey, MEDICAL_CATEGORY_KEYS } from "../types";
import { ON_FILE_RECORD, structureHealthHistoryText } from "../mockData";
import { Chip, PrimaryButton, QuestionBlock } from "./ui";
import { MedicationChipInput, SimpleChipInput } from "./MedicalHistoryChips";

// One combined "Health History" section — was two (Medical History +
// Family History) until a reference design showed them merged into a
// single free-text-plus-quick-select screen. Family history is now just
// a 6th MEDICAL_CATEGORY_KEY (see types.ts), stored as plain "Label —
// Relative" strings through the same detail[cat]/SET_MEDICAL_DETAIL
// mechanism every other category already used — no new reducer shape.
//
// Same component for both patient types now (the old NewMedicalHistory /
// ReturningMedicalHistory split is gone): returning patients just get
// `detail` pre-seeded from ON_FILE_RECORD on mount plus an "On file"
// recap card, everything else — free text, quick-select, "nothing to
// report" — behaves identically either way.
export function MedicalHistorySection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const isReturning = state.patientType === "returning";
  const { detail } = state.medicalHistory;

  // Which category's panel is open — one at a time (accordion), not the
  // old "every selected category's panel stays open" model. Tapping the
  // already-open category's chip again closes it and re-enables free text.
  const [activeCategory, setActiveCategory] = useState<MedicalCategoryKey | null>(null);
  const [freeText, setFreeText] = useState("");
  const [noneToReport, setNoneToReport] = useState(false);

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

  const hasAnyEntries = MEDICAL_CATEGORY_KEYS.some((k) => detail[k].length > 0);
  const canContinue = noneToReport || hasAnyEntries;
  const typingDisabled = activeCategory !== null;

  function toggleCategory(cat: MedicalCategoryKey) {
    setNoneToReport(false);
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }

  function setCategoryValues(cat: MedicalCategoryKey, values: string[]) {
    setNoneToReport(false);
    dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values });
  }

  function handleFreeTextSubmit() {
    if (!freeText.trim()) return;
    const extracted = structureHealthHistoryText(freeText);
    (Object.keys(extracted) as MedicalCategoryKey[]).forEach((cat) => {
      const values = extracted[cat];
      if (!values || !values.length) return;
      const merged = Array.from(new Set([...detail[cat], ...values]));
      dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values: merged });
    });
    setNoneToReport(false);
    setFreeText("");
  }

  function handleNoneToReport() {
    setNoneToReport(true);
    setActiveCategory(null);
    setFreeText("");
    MEDICAL_CATEGORY_KEYS.forEach((cat) => dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values: [] }));
  }

  const onFileSummary = isReturning
    ? [
        ...ON_FILE_RECORD.medicalHistory.conditions.map((v) => `${v} (condition)`),
        ...ON_FILE_RECORD.medicalHistory.medications.map((v) => `${v} (medication)`),
        ...ON_FILE_RECORD.medicalHistory.surgeries.map((v) => `${v} (surgery)`),
        ...ON_FILE_RECORD.medicalHistory.allergies.map((v) => `${v} (allergy)`),
        ...ON_FILE_RECORD.familyHistory.map((f) => `${f.label} — ${f.relative ?? "relative"} (family history)`),
      ].join(" · ")
    : "";

  return (
    <>
      <QuestionBlock eyebrow="Health history" prompt="Tell us about your health history.">
        <div className="text-xs text-muted">A few words is enough — you&apos;ll review and fix anything after.</div>
      </QuestionBlock>

      <div className="relative">
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          onBlur={handleFreeTextSubmit}
          disabled={typingDisabled}
          rows={3}
          placeholder="e.g. I have diabetes, take metformin, had my appendix out in 2015, and my mom had breast cancer."
          className="min-h-[44px] w-full resize-none rounded-lg border border-line-strong bg-white px-3 py-2 pr-14 text-sm text-ink outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-background disabled:text-placeholder"
        />
        <button
          type="button"
          onClick={handleFreeTextSubmit}
          disabled={typingDisabled || !freeText.trim()}
          aria-label="Add to health history"
          className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          ➤
        </button>
      </div>

      {typingDisabled ? (
        <div className="text-xs text-muted">
          Typing&apos;s off while you&apos;re using quick-select below — tap the category again to switch back.
        </div>
      ) : null}

      {isReturning ? (
        <div className="rounded-lg border border-line p-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-2">On file</div>
          <div className="text-sm text-ink">{onFileSummary || "Nothing on file"}</div>
        </div>
      ) : null}

      <div className="text-xs text-muted">Tap to check or add — one at a time</div>
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
        <div className="rounded-xl border border-line p-3">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-2">
            {MEDICAL_CATEGORY_LABELS[activeCategory]}
          </div>
          {activeCategory === "medications" ? (
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
    </>
  );
}
