"use client";

import { ReactNode, useRef } from "react";
import { Ctx } from "../../ctx";
import { PEDI_MED_CATALOG } from "../../constants";
import { formatDigits } from "../../format";
import { BirthHistory } from "../../types";
import { ArrowRightIcon, InfoIcon } from "../Icons";
import { scrollToReadingPosition } from "../motion";
import { Button, InputField, OptionPill, Reveal, ScreenCopy, ScreenTitle, SearchClearInput } from "../ui";

const MEDS_SUGGESTION_COUNT = 5;

const DELIVERY_TYPES = ["Vaginal", "C-Section", "Unknown"];
const YES_NO_UNKNOWN = ["Yes", "No", "Unknown"];

export const BIRTH_SECTION_COUNT = 4;

// One-question-at-a-time, matching PediQuestionsScreen's pattern: each
// section (pregnancy, delivery, newborn, feeding) shows its own title
// and copy once, then walks through its fields one card at a time
// instead of stacking every field on one long scrolling page. `steps`
// is that section's field count — see `renderQuestion` below for what
// each (section, step) pair actually renders.
const SECTION_META = [
  {
    title: "Tell us about the pregnancy",
    copy: "This helps us provide the right care. You can skip any question if you'd rather not share today.",
    steps: 4,
  },
  { title: "Tell us about the delivery", copy: "Share what you know about your baby's delivery.", steps: 5 },
  {
    title: "Newborn status",
    copy: "Weight trend and hearing/metabolic screen results are relevant to today's visit.",
    steps: 5,
  },
  { title: "How is the baby feeding?", copy: "Tell us about your baby's feeding and daily habits.", steps: 5 },
];

// Left-aligned, content-sized pills — used for every single-select
// question (Yes/No, Yes/No/Unknown, delivery type, ...).
function PillOptionRow({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <OptionPill key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
      ))}
    </div>
  );
}

// Multi-line free text — used for the "tell us about the
// complications" follow-ups, the only places in this flow needing
// more than a single input line.
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      aria-label={placeholder}
      className="w-full resize-none rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] px-3.5 py-3 text-[15px] font-medium text-[var(--iv2-text-primary)] outline-none transition-colors focus:border-[var(--iv2-brand)] focus:outline-2 focus:outline-[var(--iv2-brand)] focus:-outline-offset-2 hover:border-[var(--iv2-text-muted)]"
    />
  );
}

// A short pick-list under the "List medications" search box — same
// pediatric catalog the Medications health-history screen searches,
// just a plain tap-to-fill suggestion here rather than that screen's
// full checkbox/dose/frequency flow, since this field is only a quick
// free-text note for the pregnancy question, not a structured med list.
function MedsSuggestions({ query, onPick }: { query: string; onPick: (name: string) => void }) {
  const q = query.trim();
  const matches = (q ? PEDI_MED_CATALOG.filter((n) => n.toLowerCase().includes(q.toLowerCase())) : PEDI_MED_CATALOG).slice(0, MEDS_SUGGESTION_COUNT);
  if (matches.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {matches.map((name) => (
        <OptionPill key={name} label={name} selected={name === query} onClick={() => onPick(name)} />
      ))}
    </div>
  );
}

// Small "ⓘ ..." note under a field — matches the reference's inline
// explainer for why a question is asked.
function FieldNote({ text }: { text: string }) {
  return (
    <div className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-[1.4] text-[var(--iv2-text-muted)]">
      <InfoIcon size={14} color="var(--iv2-text-muted)" />
      <span>{text}</span>
    </div>
  );
}

// Numeric input with a fixed suffix box ("weeks" / "per day" / "lb" /
// "oz") — InputField doesn't support a suffix, so this is its own
// small layout rather than extending that shared component.
function SuffixInput({
  value,
  onChange,
  placeholder,
  suffix,
  inputMode = "numeric",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div
      className="flex h-13 w-full min-w-0 overflow-hidden rounded-xl border border-[var(--iv2-border)] transition-colors focus-within:border-[var(--iv2-brand)] focus-within:shadow-[0_0_0_4px_#E3EDFB] hover:border-[var(--iv2-text-muted)]"
      style={{ height: 52 }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-label={placeholder}
        className="h-full min-w-0 flex-1 border-none bg-[var(--iv2-surface)] px-3.5 text-[17px] font-semibold text-[var(--iv2-text-primary)] outline-none"
      />
      <div className="flex shrink-0 items-center border-l border-[var(--iv2-border)] bg-[var(--iv2-surface-muted)] px-3.5 text-[15px] font-semibold text-[var(--iv2-text-muted)]">
        {suffix}
      </div>
    </div>
  );
}

function PerDayInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <SuffixInput value={value} onChange={onChange} placeholder={placeholder} suffix="per day" />;
}

// Birth/discharge weight — two separate lb/oz inputs side by side
// instead of one combined free-text "6 lb 14 oz" line, so each unit
// gets its own numeric field with its own suffix.
function SplitWeightInput({
  lb,
  oz,
  onChangeLb,
  onChangeOz,
}: {
  lb: string;
  oz: string;
  onChangeLb: (v: string) => void;
  onChangeOz: (v: string) => void;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="min-w-0 flex-1">
        <SuffixInput value={lb} onChange={(v) => onChangeLb(formatDigits(v, 2))} placeholder="e.g. 6" suffix="lb" />
      </div>
      <div className="min-w-0 flex-1">
        <SuffixInput value={oz} onChange={(v) => onChangeOz(formatDigits(v, 2))} placeholder="e.g. 14" suffix="oz" />
      </div>
    </div>
  );
}

// Every Yes/No question across all 4 sections, combined into one
// "X of Y marked 'Yes'" review summary — free-text/measurement fields
// (gestational age, hospital, delivery type, weights, formula type,
// diaper counts) are left out since they aren't Yes/No answers.
function allReviewRows(birth: BirthHistory): { label: string; value: string }[] {
  return [
    { label: "Illness during pregnancy", value: birth.pregnancyIllness },
    { label: "Infections during pregnancy", value: birth.pregnancyInfections },
    { label: "Medications during pregnancy", value: birth.pregnancyMeds },
    { label: "Substance use during pregnancy", value: birth.pregnancySubstances },
    { label: "Complications during delivery", value: birth.deliveryComplications },
    { label: "Complications during hospitalization", value: birth.hospitalizationComplications },
    { label: "Jaundice at birth", value: birth.jaundice },
    { label: "Passed newborn hearing test", value: birth.hearingTest },
    { label: "Metabolic / heel-prick screen done", value: birth.heelPrick },
    { label: "Breastfeeding", value: birth.breastfeeding },
    { label: "Formula fed", value: birth.formulaFed },
  ];
}

// Single "Review your answers" bar for the whole flow, shown once
// every section's questions have been stepped through — replaces the
// old separate full-page review step. Every question's answer is
// always visible here (no expand/collapse) since it's the last thing
// on the screen before the footer's Continue, not a disclosure the
// patient needs to opt into. `onEdit` sends the patient back to
// Question 1 of the first section to revise anything — the answers
// already given stay put in `birth` state, so every question they
// step back through comes up pre-filled with what they said before,
// not blank.
function ReviewBar({ birth, onEdit }: { birth: BirthHistory; onEdit: () => void }) {
  const rows = allReviewRows(birth);
  const yes = rows.filter((r) => r.value === "Yes").length;

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--iv2-brand-tint)]">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-[15px] font-bold text-[var(--iv2-text-primary)]">Review your answers</div>
          <div className="mt-0.5 text-[13px] text-[var(--iv2-text-secondary)]">
            {yes} of {rows.length} marked &quot;Yes&quot;
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 cursor-pointer rounded-full border-none bg-[var(--iv2-surface)] px-3 py-1.5 text-[13px] font-bold text-[var(--iv2-brand)]"
        >
          Edit
        </button>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-[rgba(0,0,0,0.06)] px-4 pt-3 pb-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-[var(--iv2-text-secondary)]">{r.label}</span>
            <span className="font-semibold text-[var(--iv2-text-primary)]">{r.value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The question label above a step's control — plain bold text, no
// required asterisk or optional badge, matching PediQuestionsScreen's
// own question label exactly (the "you can skip any question" copy at
// the top of the pregnancy section already covers what those used to
// signal).
function QuestionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-4 text-[17px] font-bold text-[var(--iv2-text-primary)]">{children}</div>;
}

// One field's label + control (+ optional conditional follow-up) for
// a given (section, step) pair. `setBirth` patches just this
// section's slice of birth-history state.
function renderQuestion(sectionIdx: number, step: number, birth: BirthHistory, setBirth: (patch: Partial<BirthHistory>) => void): ReactNode {
  if (sectionIdx === 0) {
    if (step === 0) {
      return (
        <>
          <QuestionLabel>Any illness during pregnancy?</QuestionLabel>
          <PillOptionRow value={birth.pregnancyIllness} options={["Yes", "No"]} onChange={(v) => setBirth({ pregnancyIllness: v })} />
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <QuestionLabel>Any infections during pregnancy?</QuestionLabel>
          <PillOptionRow value={birth.pregnancyInfections} options={["Yes", "No"]} onChange={(v) => setBirth({ pregnancyInfections: v })} />
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <QuestionLabel>Any medications taken during pregnancy?</QuestionLabel>
          <PillOptionRow value={birth.pregnancyMeds} options={["Yes", "No"]} onChange={(v) => setBirth({ pregnancyMeds: v })} />
          {birth.pregnancyMeds === "Yes" ? (
            <Reveal className="mt-6">
              <div className="mb-3 text-[15px] font-bold text-[var(--iv2-text-primary)]">List medications</div>
              <SearchClearInput
                ariaLabel="List medications"
                value={birth.pregnancyMedsList}
                placeholder="Search medication name"
                onChange={(v) => setBirth({ pregnancyMedsList: v })}
              />
              <MedsSuggestions query={birth.pregnancyMedsList} onPick={(name) => setBirth({ pregnancyMedsList: name })} />
            </Reveal>
          ) : null}
        </>
      );
    }
    return (
      <>
        <QuestionLabel>Recreational drugs, alcohol or tobacco use during pregnancy?</QuestionLabel>
        <PillOptionRow value={birth.pregnancySubstances} options={["Yes", "No"]} onChange={(v) => setBirth({ pregnancySubstances: v })} />
      </>
    );
  }

  if (sectionIdx === 1) {
    if (step === 0) {
      return (
        <>
          <QuestionLabel>Gestational age at birth</QuestionLabel>
          <SuffixInput value={birth.deliveryGestationalAge} placeholder="e.g. 39" suffix="weeks" onChange={(v) => setBirth({ deliveryGestationalAge: v })} />
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <QuestionLabel>Hospital</QuestionLabel>
          <InputField ariaLabel="Hospital" value={birth.deliveryHospital} placeholder="Hospital name" onChange={(v) => setBirth({ deliveryHospital: v })} />
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <QuestionLabel>Delivery type</QuestionLabel>
          <PillOptionRow value={birth.deliveryType} options={DELIVERY_TYPES} onChange={(v) => setBirth({ deliveryType: v })} />
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <QuestionLabel>Complications during delivery</QuestionLabel>
          <PillOptionRow value={birth.deliveryComplications} options={YES_NO_UNKNOWN} onChange={(v) => setBirth({ deliveryComplications: v })} />
          {birth.deliveryComplications === "Yes" ? (
            <Reveal className="mt-6">
              <div className="mb-3 text-[15px] font-bold text-[var(--iv2-text-primary)]">Tell us about the complications</div>
              <Textarea
                value={birth.deliveryComplicationsDetails}
                placeholder="e.g. bleeding, infection, prolonged labor, etc."
                onChange={(v) => setBirth({ deliveryComplicationsDetails: v })}
              />
            </Reveal>
          ) : null}
        </>
      );
    }
    return (
      <>
        <QuestionLabel>Complications during hospitalization</QuestionLabel>
        <PillOptionRow
          value={birth.hospitalizationComplications}
          options={YES_NO_UNKNOWN}
          onChange={(v) => setBirth({ hospitalizationComplications: v })}
        />
        {birth.hospitalizationComplications === "Yes" ? (
          <Reveal className="mt-6">
            <div className="mb-3 text-[15px] font-bold text-[var(--iv2-text-primary)]">Tell us about the complications</div>
            <Textarea
              value={birth.hospitalizationComplicationsDetails}
              placeholder="e.g. NICU stay, feeding issues, etc."
              onChange={(v) => setBirth({ hospitalizationComplicationsDetails: v })}
            />
          </Reveal>
        ) : null}
      </>
    );
  }

  if (sectionIdx === 2) {
    if (step === 0) {
      return (
        <>
          <QuestionLabel>Birth weight</QuestionLabel>
          <SplitWeightInput
            lb={birth.birthWeightLb}
            oz={birth.birthWeightOz}
            onChangeLb={(v) => setBirth({ birthWeightLb: v })}
            onChangeOz={(v) => setBirth({ birthWeightOz: v })}
          />
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <QuestionLabel>Discharge weight</QuestionLabel>
          <SplitWeightInput
            lb={birth.dischargeWeightLb}
            oz={birth.dischargeWeightOz}
            onChangeLb={(v) => setBirth({ dischargeWeightLb: v })}
            onChangeOz={(v) => setBirth({ dischargeWeightOz: v })}
          />
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <QuestionLabel>Jaundice at birth?</QuestionLabel>
          <PillOptionRow value={birth.jaundice} options={["Yes", "No"]} onChange={(v) => setBirth({ jaundice: v })} />
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <QuestionLabel>Passed newborn hearing test?</QuestionLabel>
          <PillOptionRow value={birth.hearingTest} options={["Yes", "No"]} onChange={(v) => setBirth({ hearingTest: v })} />
        </>
      );
    }
    return (
      <>
        <QuestionLabel>Metabolic / heel-prick screen done?</QuestionLabel>
        <PillOptionRow value={birth.heelPrick} options={["Yes", "No"]} onChange={(v) => setBirth({ heelPrick: v })} />
      </>
    );
  }

  if (step === 0) {
    return (
      <>
        <QuestionLabel>Breastfeeding?</QuestionLabel>
        <PillOptionRow value={birth.breastfeeding} options={YES_NO_UNKNOWN} onChange={(v) => setBirth({ breastfeeding: v })} />
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <QuestionLabel>Formula fed?</QuestionLabel>
        <PillOptionRow value={birth.formulaFed} options={YES_NO_UNKNOWN} onChange={(v) => setBirth({ formulaFed: v })} />
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <QuestionLabel>Formula type</QuestionLabel>
        <InputField ariaLabel="Formula type" value={birth.formulaType} placeholder="e.g. Similac Advance" onChange={(v) => setBirth({ formulaType: v })} />
        <FieldNote text="This helps us understand your baby's nutrition." />
      </>
    );
  }
  if (step === 3) {
    return (
      <>
        <QuestionLabel>Wet diapers per day</QuestionLabel>
        <PerDayInput value={birth.wetDiapers} placeholder="e.g. 6" onChange={(v) => setBirth({ wetDiapers: v })} />
        <FieldNote text="This helps us know if your baby is well hydrated." />
      </>
    );
  }
  return (
    <>
      <QuestionLabel>Bowel movements per day</QuestionLabel>
      <PerDayInput value={birth.bowelMovements} placeholder="e.g. 2" onChange={(v) => setBirth({ bowelMovements: v })} />
      <FieldNote text="Let us know what's typical for your baby." />
    </>
  );
}

function QuestionView({
  sectionIdx,
  step,
  birth,
  setBirth,
}: {
  sectionIdx: number;
  step: number;
  birth: BirthHistory;
  setBirth: (patch: Partial<BirthHistory>) => void;
}) {
  return <>{renderQuestion(sectionIdx, step, birth, setBirth)}</>;
}

// Which questions gate the reveal of the ones after them. A tap-to-pick
// question (Yes/No, delivery type, ...) has a natural "answered"
// moment, so the next question stays hidden until it's answered; a
// free-text/number field has none, so it is `null` here and never
// holds anything back — it simply shows alongside its neighbours.
// One entry per step, in the same order `renderQuestion` renders them.
const GATES: (((b: BirthHistory) => boolean) | null)[][] = [
  [(b) => !!b.pregnancyIllness, (b) => !!b.pregnancyInfections, (b) => !!b.pregnancyMeds, (b) => !!b.pregnancySubstances],
  [null, null, (b) => !!b.deliveryType, (b) => !!b.deliveryComplications, (b) => !!b.hospitalizationComplications],
  [null, null, (b) => !!b.jaundice, (b) => !!b.hearingTest, (b) => !!b.heelPrick],
  [(b) => !!b.breastfeeding, (b) => !!b.formulaFed, null, null, null],
];

// How many of a section's questions are showing: everything up to and
// including the first unanswered gating question (all of them once
// every gate is answered). Derived from the answers, not stored, so
// editing an earlier answer never hides a later question.
function visibleStepCount(sectionIdx: number, birth: BirthHistory): number {
  const gates = GATES[sectionIdx];
  const firstOpen = gates.findIndex((g) => g !== null && !g(birth));
  return firstOpen === -1 ? gates.length : firstOpen + 1;
}

// One section on one scrolling page. Only the first question shows to
// start; answering the latest gating question reveals what comes next
// and eases the page down to it (same behaviour as
// PediQuestionsScreen). The section's title and subtitle stay pinned
// above the scrolling questions, and the Next/Continue button sits in
// the bottom-pinned bar — always enabled, since every question here
// may be skipped. Remounted (so it starts fresh) whenever `sectionIdx`
// changes via the `key` at its call site. On the very last section,
// finishing hands off to the shared footer's "Continue" (see
// page.tsx's footerFor for `birthHistory`).
function SectionStepper({ ctx, sectionIdx }: { ctx: Ctx; sectionIdx: number }) {
  const { state, update } = ctx;
  const birth = state.birth;
  const listRef = useRef<HTMLDivElement | null>(null);
  const meta = SECTION_META[sectionIdx];
  const isLastSection = sectionIdx === BIRTH_SECTION_COUNT - 1;
  const visibleCount = visibleStepCount(sectionIdx, birth);

  const setBirth = (patch: Partial<BirthHistory>) => {
    const next = { ...birth, ...patch };
    update({ birth: next });
    if (visibleStepCount(sectionIdx, next) > visibleCount) {
      // Hold a beat so the picked pill's selected state is seen before
      // the page moves.
      window.setTimeout(() => {
        const target = listRef.current?.children[visibleCount];
        if (target instanceof HTMLElement) scrollToReadingPosition(target);
      }, 300);
    }
  };
  const advance = () => update({ birthSection: sectionIdx + 1 });

  return (
    <div className="flex h-full flex-col bg-[var(--iv2-surface)]">
      <div className="shrink-0 px-6 pt-5 pb-4">
        <ScreenTitle className="leading-[1.28]">{meta.title}</ScreenTitle>
        <ScreenCopy>{meta.copy}</ScreenCopy>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-2 pb-6">
        <div ref={listRef} className="flex flex-col gap-8">
          {Array.from({ length: visibleCount }, (_, i) => (
            <div key={i}>
              <QuestionView sectionIdx={sectionIdx} step={i} birth={birth} setBirth={setBirth} />
            </div>
          ))}
        </div>
        {/* Runway below the newest question so the page can actually
            scroll it up to reading position; dropped once everything
            in the section is showing. */}
        {visibleCount < meta.steps ? <div aria-hidden className="h-[55vh]" /> : null}
      </div>

      <div className="border-t border-[var(--iv2-border-subtle)] bg-[var(--iv2-surface)] px-6 pt-3.5 pb-[30px]">
        <Button onClick={advance} className="h-14 w-full">
          {isLastSection ? "Continue" : "Next"}
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}

// Birth & Prenatal History — spec Part 2, items 10-14. One question
// at a time within each of 4 sections (pregnancy, delivery, newborn,
// feeding — see SECTION_META), matching PediQuestionsScreen's
// progressive-disclosure pattern instead of a long stacked page.
// `state.birthSection` (the shared flow-state field, unrelated to
// this screen's own local per-section `step`) tracks which section is
// current; once it reaches BIRTH_SECTION_COUNT every section has been
// stepped through and the review summary replaces the question card,
// with the shared bottom footer's "Continue" taking over from there.
export function BirthHistoryFlowScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  if (state.birthSection < BIRTH_SECTION_COUNT) {
    return <SectionStepper key={state.birthSection} ctx={ctx} sectionIdx={state.birthSection} />;
  }

  return (
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle className="leading-[1.28]">Birth &amp; prenatal history</ScreenTitle>
      <ScreenCopy className="mb-6">Here&apos;s a summary of what you shared.</ScreenCopy>
      <ReviewBar birth={state.birth} onEdit={() => update({ birthSection: 0 })} />
    </div>
  );
}
