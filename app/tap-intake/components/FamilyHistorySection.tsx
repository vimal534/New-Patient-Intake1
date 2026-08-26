"use client";

import { useMemo } from "react";
import { useVisit } from "../state";
import { FAMILY_HISTORY_BANK } from "../questionBank";
import { ON_FILE_RECORD } from "../mockData";
import { Chip, ConfirmCard, PrimaryButton, QuestionBlock } from "./ui";

// Only the family-history items relevant to today's reason are ever shown —
// never the full generic questionnaire.
export function FamilyHistorySection({ onDone }: { onDone: () => void }) {
  const { state } = useVisit();
  const reason = state.concern.reason || "Something else";
  const applicable = useMemo(() => FAMILY_HISTORY_BANK.filter((f) => f.relevantFor.includes(reason)), [reason]);

  if (applicable.length === 0) {
    // Nothing relevant to ask — auto-skip is the whole point of "ask only
    // what's relevant," but we still record it as an explicit, visible step.
    return <AutoSkip onDone={onDone} />;
  }

  return state.patientType === "returning" ? (
    <ReturningFamilyHistory applicable={applicable} onDone={onDone} />
  ) : (
    <NewFamilyHistory applicable={applicable} onDone={onDone} />
  );
}

function AutoSkip({ onDone }: { onDone: () => void }) {
  const { dispatch } = useVisit();
  return (
    <>
      <div className="text-sm text-[var(--color-muted)]">Nothing in family history is flagged as relevant for today&apos;s concern.</div>
      <PrimaryButton
        onClick={() => {
          dispatch({ type: "CONFIRM_FAMILY_NO_CHANGE" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}

function NewFamilyHistory({
  applicable,
  onDone,
}: {
  applicable: { id: string; label: string }[];
  onDone: () => void;
}) {
  const { state, dispatch } = useVisit();
  const name = state.child.name || "your child";

  return (
    <>
      <QuestionBlock eyebrow="Family history" prompt={`Does anyone in ${name}'s immediate family have any of these?`}>
        <div className="flex flex-wrap gap-2">
          {applicable.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={state.familyHistory.selected.includes(item.id)}
              onClick={() => dispatch({ type: "TOGGLE_FAMILY_ITEM", id: item.id })}
            />
          ))}
        </div>
        <div className="mt-1 text-xs text-[var(--color-muted)]">Leave unselected if none apply.</div>
      </QuestionBlock>
      <PrimaryButton
        onClick={() => {
          dispatch({ type: "CONFIRM_FAMILY_NO_CHANGE" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}

function ReturningFamilyHistory({
  applicable,
  onDone,
}: {
  applicable: { id: string; label: string }[];
  onDone: () => void;
}) {
  const { state, dispatch } = useVisit();
  const name = state.child.name || "Ana";
  const onFile = ON_FILE_RECORD.familyHistory;
  const summary = onFile.map((f) => `${f.label} (${f.relative})`).join(", ") || "None on file";

  if (!state.familyHistory.reviewed) {
    return (
      <ConfirmCard
        title={`${name}'s family history`}
        summary={summary}
        onNoChange={() => {
          dispatch({ type: "CONFIRM_FAMILY_NO_CHANGE" });
          onDone();
        }}
        onChanged={() => dispatch({ type: "FLAG_FAMILY_CHANGED" })}
      />
    );
  }

  return (
    <>
      <QuestionBlock eyebrow="Update family history" prompt="Select any that now apply">
        <div className="flex flex-wrap gap-2">
          {applicable.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={state.familyHistory.selected.includes(item.id) || onFile.some((f) => f.id === item.id)}
              onClick={() => dispatch({ type: "TOGGLE_FAMILY_ITEM", id: item.id })}
            />
          ))}
        </div>
      </QuestionBlock>
      <PrimaryButton
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "familyHistory" });
          onDone();
        }}
      >
        Save changes
      </PrimaryButton>
    </>
  );
}
