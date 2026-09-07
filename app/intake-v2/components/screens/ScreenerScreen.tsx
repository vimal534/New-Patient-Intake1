"use client";

import { useRef } from "react";
import { Ctx } from "../../ctx";
import { SCREENERS } from "../../constants";

// Screen 11 — Required screening. All questions stack as their own
// cards on one scrolling page (was one question per screen with a
// silent full-screen swap on each answer) — picking an option now
// auto-scrolls to the next unanswered card instead, and only the very
// last answer actually leaves the screen (advances to Payment).
export function ScreenerScreen({ ctx }: { ctx: Ctx }) {
  const { state, update, next } = ctx;
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pick = (qIdx: number, label: string) => {
    const answers = [...state.screenerAnswers];
    answers[qIdx] = label;
    update({ screenerAnswers: answers });

    const nextCard = cardRefs.current[qIdx + 1];
    if (nextCard) {
      // Let the selected state paint first, then scroll — same beat as
      // the rest of the app's 180-240ms transitions.
      window.setTimeout(() => nextCard.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
    } else {
      window.setTimeout(next, 350);
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="mb-2.5 text-xs font-semibold tracking-[0.07em] text-[var(--iv2-brand)] uppercase">Required screening</div>
      <div className="mb-6 text-base leading-[1.55] text-[var(--iv2-text-secondary)]">
        Your care team has a few questions before your visit.
      </div>

      <div className="flex flex-col gap-4">
        {SCREENERS.map((screener, qIdx) => (
          <div
            key={screener.q}
            ref={(el) => {
              cardRefs.current[qIdx] = el;
            }}
            className="rounded-[20px] border border-[var(--iv2-border)] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <div className="mb-4 text-lg leading-[1.3] font-bold text-[var(--iv2-text-primary)]">{screener.q}</div>
            <div className="flex flex-col">
              {screener.opts.map((opt, optIdx) => {
                const selected = state.screenerAnswers[qIdx] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(qIdx, opt)}
                    className={`flex min-h-13 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-left ${
                      optIdx > 0 ? "mt-1" : ""
                    }`}
                    style={{ height: 52, backgroundColor: selected ? "var(--iv2-brand-surface)" : "transparent" }}
                  >
                    <span
                      className="text-base font-semibold"
                      style={{ color: selected ? "var(--iv2-brand)" : "var(--iv2-text-primary)" }}
                    >
                      {opt}
                    </span>
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ borderColor: selected ? "var(--iv2-brand)" : "var(--iv2-border-strong)" }}
                    >
                      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--iv2-brand)]" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
