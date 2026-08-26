"use client";

import { useMemo, useState } from "react";
import { useVisit } from "../state";
import { SYMPTOM_QUESTIONS_BY_TAG, FEVER_BASELINE_QUESTION, SymptomQuestion } from "../questionBank";
import { hasOnFileCondition } from "../mockData";
import { Chip, PrimaryButton } from "./ui";

// Adaptive, deterministic: the confirmed tag set from Today's Concern (the
// tapped/inferred reason plus anything else AI extracted and the guardian
// didn't remove) is the lookup key into the static question bank — never
// free-form model inference. Each tag contributes its own branch; branches
// are unioned and deduped by question id (so e.g. "duration" only ever
// asks once even when multiple tags would otherwise both include it), then
// a baseline fever check is appended unless a tag's own branch already
// covers fever. Questions reveal one-below-the-previous, inline — no
// separate screens, no repeated "Next" wizard chrome.
export function SymptomsSection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const childName = state.child.name || "your child";

  const tags = useMemo(() => {
    const all = [state.concern.reason, ...state.concern.structuredSymptoms].filter((t): t is string => !!t);
    return Array.from(new Set(all));
  }, [state.concern.reason, state.concern.structuredSymptoms]);

  // "Something else" with nothing else confirmed is the one case that maps
  // to no known tag — the escape hatch is a free-text follow-up instead of
  // a deterministic branch, per spec. The instant anything else is
  // confirmed alongside it, deterministic questions take back over.
  const isEscapeHatch = tags.length > 0 && tags.every((t) => t === "Something else");

  const questions = useMemo(() => {
    if (isEscapeHatch) return [];
    const hasCondition = (c: string) => (state.patientType === "returning" ? hasOnFileCondition(c) : false);
    const seen = new Set<string>();
    const collected: SymptomQuestion[] = [];
    for (const tag of tags) {
      const branch = SYMPTOM_QUESTIONS_BY_TAG[tag] ?? [];
      for (const q of branch) {
        if (seen.has(q.id)) continue;
        if (q.when && !q.when({ age: state.child.age, hasCondition })) continue;
        seen.add(q.id);
        collected.push(q);
      }
    }
    if (!seen.has("feverHeight")) collected.push(FEVER_BASELINE_QUESTION);
    return collected;
  }, [tags, isEscapeHatch, state.patientType, state.child.age]);

  if (isEscapeHatch) return <EscapeHatch onDone={onDone} />;

  const answeredCount = questions.filter((q) => state.symptomAnswers[q.id] !== undefined).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const activeQuestion = questions[answeredCount]; // first unanswered, if any

  return (
    <>
      {/* Answered items read as a captured summary — not a stack of
          question/answer boxes — so this feels like "we've got it," not
          another form. One vertical list, subtle dividers, no repeated
          question wording. */}
      {answeredCount > 0 ? (
        <div className="divide-y divide-[var(--color-line)]">
          {questions.slice(0, answeredCount).map((q) => {
            const answer = state.symptomAnswers[q.id];
            const answerText = Array.isArray(answer) ? answer.join(" · ") : answer;
            return (
              <div key={q.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {q.shortLabel}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--color-ink)]">{answerText}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      {activeQuestion ? (
        <SymptomRow
          key={activeQuestion.id}
          question={activeQuestion}
          name={childName}
          answer={state.symptomAnswers[activeQuestion.id]}
          onAnswer={(value) => dispatch({ type: "ANSWER_SYMPTOM", id: activeQuestion.id, value })}
        />
      ) : null}

      {allAnswered ? (
        <PrimaryButton
          onClick={() => {
            dispatch({ type: "MARK_SECTION_READY", key: "symptoms" });
            onDone();
          }}
        >
          Continue
        </PrimaryButton>
      ) : null}
    </>
  );
}

// The one place a generic AI-assisted free-text follow-up is acceptable —
// only reached when nothing confirmed in Today's Concern mapped to a known
// tag. The instant a real tag is confirmed, this never renders again.
function EscapeHatch({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const note = (state.symptomAnswers.escapeNote as string | undefined) ?? "";

  return (
    <>
      <div className="text-sm font-semibold text-[var(--color-ink)]">Tell us a bit more about what&apos;s going on</div>
      <textarea
        value={note}
        onChange={(e) => dispatch({ type: "ANSWER_SYMPTOM", id: "escapeNote", value: e.target.value })}
        rows={4}
        placeholder="Anything that would help Dr. Reyes understand what's going on"
        className="w-full rounded-2xl border border-[var(--color-line-strong)] bg-white p-4 text-sm leading-relaxed outline-none focus:border-[var(--color-brand)]"
      />
      <PrimaryButton
        disabled={note.trim().length === 0}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "symptoms" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}

function SymptomRow({
  question,
  name,
  answer,
  onAnswer,
}: {
  question: SymptomQuestion;
  name: string;
  answer: string | string[] | undefined;
  onAnswer: (v: string | string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(Array.isArray(answer) ? answer : []);

  if (question.multi) {
    return (
      <div>
        <div className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{question.prompt(name)}</div>
        <div className="mb-2 flex flex-wrap gap-2">
          {question.options.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={draft.includes(opt)}
              onClick={() => setDraft((d) => (d.includes(opt) ? d.filter((x) => x !== opt) : [...d, opt]))}
            />
          ))}
        </div>
        <PrimaryButton disabled={draft.length === 0} onClick={() => onAnswer(draft)}>
          Continue
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{question.prompt(name)}</div>
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => (
          <Chip key={opt} label={opt} selected={answer === opt} onClick={() => onAnswer(opt)} />
        ))}
      </div>
    </div>
  );
}
