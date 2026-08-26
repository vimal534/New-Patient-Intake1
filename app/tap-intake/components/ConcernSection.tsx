"use client";

import { useState } from "react";
import { useVisit } from "../state";
import { REASON_CHIPS } from "../questionBank";
import { structureFreeText, DEMO_CONCERN_TEXT } from "../mockData";
import { Chip, PrimaryButton, QuestionBlock } from "./ui";

export function ConcernSection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const { concern } = state;
  const [showFreeText, setShowFreeText] = useState(false);
  // AI extraction is a suggestion, not a fact — the guardian confirms it by
  // *not* removing a tag. Tracked locally (not in visitState) since it's
  // only needed to filter live re-extraction as they keep typing; the
  // confirmed result is what actually lands in concern.structuredSymptoms.
  const [removedTags, setRemovedTags] = useState<string[]>([]);

  function pickReason(reason: string) {
    dispatch({ type: "SET_CONCERN_REASON", reason, source: "tapped" });
    if (reason === "Something else") setShowFreeText(true);
  }

  function onFreeTextChange(text: string) {
    dispatch({ type: "SET_CONCERN_FREETEXT", text });
    const { tags, inferredReason } = structureFreeText(text);
    dispatch({ type: "SET_STRUCTURED_SYMPTOMS", tags: tags.filter((t) => !removedTags.includes(t)) });
    if (inferredReason && !concern.reason) {
      dispatch({ type: "SET_CONCERN_REASON", reason: inferredReason, source: "inferred" });
    }
  }

  function removeTag(tag: string) {
    const nextRemoved = [...removedTags, tag];
    setRemovedTags(nextRemoved);
    dispatch({ type: "SET_STRUCTURED_SYMPTOMS", tags: concern.structuredSymptoms.filter((t) => t !== tag) });
  }

  const canContinue = !!concern.reason;

  return (
    <>
      <QuestionBlock eyebrow="Reason for today's visit" prompt="What brings you in today?">
        <div className="flex flex-wrap gap-2">
          {REASON_CHIPS.map((r) => (
            <Chip key={r} label={r} selected={concern.reason === r} onClick={() => pickReason(r)} />
          ))}
        </div>
      </QuestionBlock>

      {concern.reason && concern.reasonSource === "inferred" ? (
        <div className="text-xs font-medium text-[var(--color-teal)]">✓ From what you told us — Change above if that&apos;s wrong</div>
      ) : null}

      {(showFreeText || concern.reason) && (
        <QuestionBlock eyebrow="Anything to add (optional)" prompt="Tell us a bit more in your own words">
          <div className="relative">
            <textarea
              value={concern.freeText}
              onChange={(e) => onFreeTextChange(e.target.value)}
              placeholder={`e.g. "${DEMO_CONCERN_TEXT}"`}
              rows={4}
              className="w-full rounded-2xl border border-[var(--color-line-strong)] bg-white p-4 pb-14 text-sm leading-relaxed outline-none focus:border-[var(--color-brand)]"
            />
            <button
              type="button"
              title="Tap to talk"
              aria-label="Tap to talk"
              onClick={() => onFreeTextChange(DEMO_CONCERN_TEXT)}
              className="absolute bottom-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-brand)]/10 active:scale-[0.95]"
            >
              <MicIcon />
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-muted)]">Prefer to talk? Tap the mic and just say it.</p>
          {concern.structuredSymptoms.length > 0 ? (
            <div className="mt-2">
              <div className="mb-1 text-xs font-semibold text-[var(--color-muted)]">
                We picked up — tap to remove anything that&apos;s wrong:
              </div>
              <div className="flex flex-wrap gap-2">
                {concern.structuredSymptoms.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTag(t)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--color-brand)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-brand)] active:scale-[0.97]"
                  >
                    {t}
                    <span aria-hidden className="text-[var(--color-brand)]/60">
                      ✕
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </QuestionBlock>
      )}

      <PrimaryButton
        disabled={!canContinue}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "concern" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" fill="var(--color-brand)" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M12 18v3.5" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 21.5h7" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
