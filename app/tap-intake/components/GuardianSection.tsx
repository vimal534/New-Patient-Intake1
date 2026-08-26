"use client";

import { useVisit } from "../state";
import { Chip, ConfirmCard, PrimaryButton, QuestionBlock, TextField } from "./ui";

const RELATIONSHIP_OPTIONS = ["Parent", "Legal guardian", "Grandparent", "Other"];

export function GuardianSection({ onDone }: { onDone: () => void }) {
  const { state } = useVisit();
  return state.patientType === "returning" ? (
    <ReturningGuardian onDone={onDone} />
  ) : (
    <NewGuardian onDone={onDone} />
  );
}

function NewGuardian({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const g = state.guardian;
  const canContinue = g.name.trim().length > 0 && !!g.relationship && g.phone.trim().length > 0;

  return (
    <>
      <div className="grid gap-3">
        <TextField label="Your name" value={g.name} onChange={(v) => dispatch({ type: "SET_GUARDIAN_FIELD", field: "name", value: v })} placeholder="e.g. Elena Marquez" />
        <TextField label="Phone" value={g.phone} onChange={(v) => dispatch({ type: "SET_GUARDIAN_FIELD", field: "phone", value: v })} placeholder="(512) 555-0148" />
        <TextField label="Email" value={g.email} onChange={(v) => dispatch({ type: "SET_GUARDIAN_FIELD", field: "email", value: v })} placeholder="you@example.com" />
      </div>

      <QuestionBlock eyebrow="Relationship to child" prompt="You are the child's...">
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={g.relationship === opt} onClick={() => dispatch({ type: "SET_GUARDIAN_RELATIONSHIP", value: opt })} />
          ))}
        </div>
      </QuestionBlock>

      <QuestionBlock eyebrow="Insurance" prompt="Are you the policyholder on the insurance plan?">
        <div className="flex flex-wrap gap-2">
          <Chip label="Yes" selected={g.isPolicyholder} onClick={() => dispatch({ type: "SET_GUARDIAN_POLICYHOLDER", value: true })} />
          <Chip label="No" selected={!g.isPolicyholder} onClick={() => dispatch({ type: "SET_GUARDIAN_POLICYHOLDER", value: false })} />
        </div>
      </QuestionBlock>

      <PrimaryButton
        disabled={!canContinue}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "guardian" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}

function ReturningGuardian({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const g = state.guardian;

  if (!g.reviewed) {
    return (
      <ConfirmCard
        title="Guardian on file"
        summary={`${g.name} · ${g.relationship} · ${g.phone}`}
        onNoChange={() => {
          dispatch({ type: "CONFIRM_GUARDIAN_NO_CHANGE" });
          onDone();
        }}
        onChanged={() => dispatch({ type: "FLAG_GUARDIAN_CHANGED" })}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3">
        <TextField label="Your name" value={g.name} onChange={(v) => dispatch({ type: "SET_GUARDIAN_FIELD", field: "name", value: v })} />
        <TextField label="Phone" value={g.phone} onChange={(v) => dispatch({ type: "SET_GUARDIAN_FIELD", field: "phone", value: v })} />
        <TextField label="Email" value={g.email} onChange={(v) => dispatch({ type: "SET_GUARDIAN_FIELD", field: "email", value: v })} />
      </div>
      <PrimaryButton
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "guardian" });
          onDone();
        }}
      >
        Save changes
      </PrimaryButton>
    </>
  );
}
