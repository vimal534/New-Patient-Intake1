"use client";

import { ReactNode } from "react";
import { Ctx } from "../../ctx";
import { ACCOMPANYING_OPTIONS, HOME_LANGUAGE_OPTIONS } from "../../constants";
import { Eyebrow, OptionPill, ScreenTitle, SelectField } from "../ui";

const YES_NO = ["Yes", "No"];

// One bordered card per question — title, a muted "Select one" hint,
// then either a dropdown or a row of pills, matching the reference's
// per-question card layout instead of a bare stacked list.
function QuestionCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--iv2-border)] bg-white p-4">
      <div className="text-[15px] font-bold text-[var(--iv2-text-primary)]">{label}</div>
      <div className="mt-0.5 mb-3 text-sm text-[var(--iv2-text-muted)]">Select one</div>
      {children}
    </div>
  );
}

function PillRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => (
        <OptionPill key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
      ))}
    </div>
  );
}

// General Pediatric Questions — spec Part 2, item 9. Who's
// accompanying, home language, pool fenced, guns stored safely.
export function PediQuestionsScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>General pediatric questions</Eyebrow>
      <ScreenTitle className="mb-6 leading-[1.28]">A few questions about today</ScreenTitle>

      <div className="flex flex-col gap-3.5">
        <QuestionCard label="Who's accompanying the patient today?">
          <SelectField
            ariaLabel="Who's accompanying the patient today?"
            value={state.pediAccompanying}
            options={ACCOMPANYING_OPTIONS}
            placeholder="Select one"
            onChange={(v) => update({ pediAccompanying: v })}
          />
        </QuestionCard>
        <QuestionCard label="What language is spoken at home?">
          <SelectField
            ariaLabel="What language is spoken at home?"
            value={state.pediHomeLanguage}
            options={HOME_LANGUAGE_OPTIONS}
            placeholder="Select one"
            onChange={(v) => update({ pediHomeLanguage: v })}
          />
        </QuestionCard>
        <QuestionCard label="Is your pool fenced? (If applicable)">
          <PillRow options={[...YES_NO, "No pool"]} value={state.pediPoolFenced} onChange={(v) => update({ pediPoolFenced: v })} />
        </QuestionCard>
        <QuestionCard label="Are firearms in the home stored safely?">
          <PillRow options={[...YES_NO, "No firearms in home"]} value={state.pediGunsSafe} onChange={(v) => update({ pediGunsSafe: v })} />
        </QuestionCard>
      </div>
    </div>
  );
}
