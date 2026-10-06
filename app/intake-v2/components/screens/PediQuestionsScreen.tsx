"use client";

import { useRef } from "react";
import { Ctx } from "../../ctx";
import { ACCOMPANYING_OPTIONS, HOME_LANGUAGE_OPTIONS } from "../../constants";
import { ArrowRightIcon } from "../Icons";
import { scrollToReadingPosition } from "../motion";
import { Button, OptionPill, ScreenTitle } from "../ui";

const YES_NO = ["Yes", "No"];

type QuestionKey = "pediAccompanying" | "pediHomeLanguage" | "pediPoolFenced" | "pediGunsSafe";
const QUESTIONS: { key: QuestionKey; label: string; options: string[] }[] = [
  { key: "pediAccompanying", label: "Who's accompanying the patient today?", options: ACCOMPANYING_OPTIONS },
  { key: "pediHomeLanguage", label: "What language is spoken at home?", options: HOME_LANGUAGE_OPTIONS },
  { key: "pediPoolFenced", label: "Is your pool fenced? (If applicable)", options: [...YES_NO, "No pool"] },
  { key: "pediGunsSafe", label: "Are firearms in the home stored safely?", options: [...YES_NO, "No firearms in home"] },
];

function PillRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <OptionPill key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
      ))}
    </div>
  );
}

// General Pediatric Questions — spec Part 2, item 9. Who's
// accompanying, home language, pool fenced, guns stored safely.
// Progressive disclosure on one scrolling page: only the first
// question shows to start; answering the latest visible one reveals
// the next below it and eases the page down to it. How many are
// visible is derived from the answers (everything up to and including
// the first unanswered one) rather than stored, so changing an earlier
// answer never hides or re-hides a later one. The Continue button sits
// in its own bottom-pinned bar — same placement and styling as the
// shared Footer (see Footer.tsx) — and unlocks once all four are
// answered, handing off to the shared flow via ctx.next() (page.tsx's
// footerFor hides the shared footer for this key since this screen
// supplies its own).
export function PediQuestionsScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const firstUnanswered = QUESTIONS.findIndex((q) => state[q.key].trim().length === 0);
  const allAnswered = firstUnanswered === -1;
  const visibleCount = allAnswered ? QUESTIONS.length : firstUnanswered + 1;

  const answer = (index: number, key: QuestionKey, value: string) => {
    const wasLatest = index === firstUnanswered;
    update({ [key]: value });
    if (wasLatest && index < QUESTIONS.length - 1) {
      // Hold a beat so the picked pill's selected state is seen before
      // the page moves.
      window.setTimeout(() => {
        const next = refs.current[index + 1];
        if (next) scrollToReadingPosition(next);
      }, 300);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--iv2-surface)]">
      <div className="shrink-0 px-6 pt-5 pb-4">
        <ScreenTitle className="mb-0 leading-[1.28]">A few questions about today</ScreenTitle>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-2 pb-6">
        <div className="flex flex-col gap-8">
          {QUESTIONS.slice(0, visibleCount).map((q, i) => (
            <div
              key={q.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
            >
              <div className="mb-4 text-[17px] font-bold text-[var(--iv2-text-primary)]">{q.label}</div>
              <PillRow options={q.options} value={state[q.key]} onChange={(v) => answer(i, q.key, v)} />
            </div>
          ))}
        </div>
        {/* Runway below the newest question so the page can actually scroll
            it up to reading position — without it a short final question
            has nothing under it to scroll against and just sits at the
            bottom edge. Dropped once everything's answered. */}
        {allAnswered ? null : <div aria-hidden className="h-[55vh]" />}
      </div>

      <div className="border-t border-[var(--iv2-border-subtle)] bg-[var(--iv2-surface)] px-6 pt-3.5 pb-[30px]">
        <Button onClick={() => ctx.next()} disabled={!allAnswered} className="h-14 w-full">
          Continue
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
