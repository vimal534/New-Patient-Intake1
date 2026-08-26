"use client";

import { useVisit } from "../state";
import { Chip, PrimaryButton, QuestionBlock, TextField } from "./ui";

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

export function ChildDetailsSection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const { child } = state;
  const canContinue = child.name.trim().length > 0 && child.dob.trim().length > 0 && !!child.sex;

  return (
    <>
      <div className="grid gap-3">
        <TextField
          label="Child's first name"
          value={child.name}
          onChange={(v) => dispatch({ type: "SET_CHILD_FIELD", field: "name", value: v })}
          placeholder="e.g. Ana"
        />
        <TextField
          label="Date of birth"
          type="date"
          value={child.dob}
          onChange={(v) => {
            dispatch({ type: "SET_CHILD_FIELD", field: "dob", value: v });
            const age = ageFromDob(v);
            if (age !== null) dispatch({ type: "SET_CHILD_AGE", age });
          }}
        />
      </div>

      <QuestionBlock eyebrow="Sex" prompt="Sex assigned at birth (for growth charts & dosing)">
        <div className="flex flex-wrap gap-2">
          {["Female", "Male", "Prefer not to say"].map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={child.sex === opt}
              onClick={() => dispatch({ type: "SET_CHILD_FIELD", field: "sex", value: opt })}
            />
          ))}
        </div>
      </QuestionBlock>

      <PrimaryButton
        disabled={!canContinue}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "childDetails" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}
