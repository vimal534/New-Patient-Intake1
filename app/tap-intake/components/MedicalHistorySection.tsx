"use client";

import { useVisit } from "../state";
import { MEDICAL_CATEGORY_LABELS, MEDICAL_CATEGORY_OPTIONS } from "../questionBank";
import { MedicalCategoryKey } from "../types";
import { ON_FILE_RECORD } from "../mockData";
import { Chip, ConfirmCard, PrimaryButton, QuestionBlock } from "./ui";
import { MedicationChipInput, SimpleChipInput } from "./MedicalHistoryChips";

const CATEGORY_KEYS = Object.keys(MEDICAL_CATEGORY_LABELS) as MedicalCategoryKey[];

export function MedicalHistorySection({ onDone }: { onDone: () => void }) {
  const { state } = useVisit();
  return state.patientType === "returning" ? (
    <ReturningMedicalHistory onDone={onDone} />
  ) : (
    <NewMedicalHistory onDone={onDone} />
  );
}

function NewMedicalHistory({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const { selectedCategories, detail } = state.medicalHistory;
  const name = state.child.name || "your child";

  return (
    <>
      <QuestionBlock eyebrow="Medical history" prompt={`Do any of these apply to ${name}? Select any that apply.`}>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((cat) => (
            <Chip
              key={cat}
              label={MEDICAL_CATEGORY_LABELS[cat]}
              selected={selectedCategories.includes(cat)}
              onClick={() => dispatch({ type: "TOGGLE_MEDICAL_CATEGORY", category: cat })}
            />
          ))}
        </div>
        <div className="mt-1 text-xs text-[var(--color-muted)]">Leave all unselected if none apply.</div>
      </QuestionBlock>

      {selectedCategories.map((cat) =>
        cat === "medications" ? (
          <MedicationChipInput
            key={cat}
            onChange={(values) => dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values })}
          />
        ) : (
          <QuestionBlock key={cat} eyebrow={MEDICAL_CATEGORY_LABELS[cat]} prompt={`Which ${MEDICAL_CATEGORY_LABELS[cat].toLowerCase()}?`}>
            <SimpleChipInput
              suggestions={MEDICAL_CATEGORY_OPTIONS[cat]}
              values={detail[cat]}
              onChange={(values) => dispatch({ type: "SET_MEDICAL_DETAIL", category: cat, values })}
              placeholder={`Search or type a ${MEDICAL_CATEGORY_LABELS[cat].toLowerCase().replace(/s$/, "")}`}
            />
          </QuestionBlock>
        )
      )}

      <PrimaryButton
        disabled={selectedCategories.some((cat) => state.medicalHistory.detail[cat].length === 0)}
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

function ReturningMedicalHistory({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const { reviewed, changedCategories } = state.medicalHistory;
  const name = state.child.name || "Ana";
  const onFile = ON_FILE_RECORD.medicalHistory;

  const summaryBits = [
    onFile.allergies.length ? `${onFile.allergies.join(", ")} allergy` : null,
    onFile.conditions.length ? onFile.conditions.join(", ") : null,
    onFile.surgeries.length ? onFile.surgeries.join(", ") : null,
  ].filter(Boolean);

  if (!reviewed) {
    return (
      <ConfirmCard
        title={`${name}'s health`}
        summary={summaryBits.join(" · ")}
        onNoChange={() => {
          dispatch({ type: "CONFIRM_MEDICAL_NO_CHANGE" });
          onDone();
        }}
        onChanged={() => dispatch({ type: "OPEN_MEDICAL_REVIEW" })}
      />
    );
  }

  return (
    <>
      <div className="text-sm text-[var(--color-muted)]">Only the categories you flag get reopened — everything else stays as on file.</div>
      {CATEGORY_KEYS.map((cat) => {
        const onFileValues = (onFile as unknown as Record<MedicalCategoryKey, string[]>)[cat];
        const isEditing = changedCategories.includes(cat);
        return (
          <div key={cat} className="rounded-lg border border-[var(--color-line)] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{MEDICAL_CATEGORY_LABELS[cat]}</div>
                <div className="text-sm text-[var(--color-muted)]">{onFileValues.length ? onFileValues.join(", ") : "None on file"}</div>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "FLAG_MEDICAL_CHANGED", category: cat })}
                  className="text-sm font-medium text-[var(--color-brand)]"
                >
                  Edit
                </button>
              ) : null}
            </div>
            {isEditing ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {MEDICAL_CATEGORY_OPTIONS[cat].map((opt) => {
                  const values = state.medicalHistory.detail[cat].length ? state.medicalHistory.detail[cat] : onFileValues;
                  const selected = values.includes(opt);
                  return (
                    <Chip
                      key={opt}
                      label={opt}
                      selected={selected}
                      onClick={() =>
                        dispatch({
                          type: "SET_MEDICAL_DETAIL",
                          category: cat,
                          values: selected ? values.filter((v) => v !== opt) : [...values, opt],
                        })
                      }
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
      <PrimaryButton
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "medicalHistory" });
          onDone();
        }}
      >
        Save changes
      </PrimaryButton>
    </>
  );
}
